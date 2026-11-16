# Implementação completa da branch `feat/criar-agendamento-com-pacote`

> Documento de rastreabilidade técnica atualizado em 14 de novembro de 2026.
>
> Este arquivo descreve o estado efetivamente implementado e presente no
> diretório de trabalho no momento da auditoria. Ele também distingue, de forma
> explícita, os pontos apenas planejados ou preparados para a SPEC 02. Não deve
> ser interpretado como confirmação de que toda a change OpenSpec foi concluída.
>
> **Nota de leitura:** as seções 1 a 10 preservam o histórico da implementação
> inicial. A seção 11 é a referência autoritativa para o estado atual da branch
> `feat/criar-agendamento-com-pacote` e corrige os pontos que evoluíram depois.

## 1. Escopo, origem e estado da branch

A implementação parte da solicitação de criar uma gestão flexível de pacotes de
serviços e de disponibilizar, ao lado do agendamento manual, o botão
**Agendamento de Pacotes**. As decisões registradas para esta etapa foram:

1. o botão novo deve existir agora, mas não pode criar agendamentos nem iniciar
   o fluxo da SPEC 02;
2. um pacote pertence obrigatoriamente a uma única unidade;
3. o pacote guarda o total de sessões, a combinação de dias da semana e o valor
   total; a seleção da primeira data e a geração automática dos atendimentos
   serão tratadas na SPEC 02;
4. o pacote não indica profissional;
5. depois que existir algum agendamento de pacote vinculado, a definição deverá
   ser imutável;
6. calendário de funcionamento, feriados e bloqueios ficam para uma
   especificação futura;
7. não existe exclusão física de pacotes. A ação prevista é ativar/desativar.
   A futura exclusão mencionada na solicitação refere-se ao botão manual antigo,
   somente depois de o fluxo novo estar consolidado.

No instante desta documentação, a branch local
`feat/criar-agendamento-com-pacote` aponta atualmente para o commit de merge
`3702ef0`. O histórico funcional principal vem do commit `d4cf285`, que adiciona
o cadastro inicial de pacotes; a evolução administrativa descrita neste
documento também possui alterações locais ainda não commitadas. Há trabalho em
dois repositórios coordenados:

| Repositório | Papel | Estado observado |
| --- | --- | --- |
| `agendamentos-smart` (este repositório) | Frontend React/RTK Query | Arquivos de rota, menu, topbar, adaptador de API e feature de pacotes alterados/adicionados |
| `../api-agendamento-smart-api/agendamento-smart-api` | API Spring Boot/Flyway | Migration, domínio, DTOs, repositório, serviço e controller de pacotes adicionados |

## 2. Planejamento OpenSpec criado

Antes da alteração de código, foi criada a change
`gerenciar-pacotes-flexiveis` em ambos os repositórios. Os artefatos existem e
foram validados com `openspec validate gerenciar-pacotes-flexiveis --strict`:

- Frontend:
  - `openspec/changes/gerenciar-pacotes-flexiveis/proposal.md`;
  - `openspec/changes/gerenciar-pacotes-flexiveis/design.md`;
  - `openspec/changes/gerenciar-pacotes-flexiveis/tasks.md`;
  - `openspec/changes/gerenciar-pacotes-flexiveis/specs/service-package-management/spec.md`;
  - `openspec/changes/gerenciar-pacotes-flexiveis/specs/application-shell-baseline/spec.md`.
- API irmã:
  - `openspec/changes/gerenciar-pacotes-flexiveis/proposal.md`;
  - `openspec/changes/gerenciar-pacotes-flexiveis/design.md`;
  - `openspec/changes/gerenciar-pacotes-flexiveis/tasks.md`;
  - `openspec/changes/gerenciar-pacotes-flexiveis/specs/service-package-management/spec.md`.

O estado atual das tarefas OpenSpec é: API `gerenciar-pacotes-flexiveis` com
9/9 tarefas concluídas; frontend com 19/20 tarefas concluídas. A única pendência
é a inspeção visual manual em viewport estreito, pois não havia navegador
disponível nesta sessão. Os testes automatizados, documentação e validações
estritas foram executados.

## 3. Passo a passo da implementação realizada

### Passo 1 — Criar o modelo persistente de pacote na API

Foi incluída a migration Flyway
`src/main/resources/db/migration/V012__create_service_packages.sql` no
repositório da API. Ela cria duas tabelas novas, sem alterar ou excluir dados
existentes.

#### `SERVICE_PACKAGE`

Armazena uma definição de pacote e contém:

- `id`: identificador UUID do pacote;
- `clinic_id`, `tenant_id` e `unit_id`: escopo institucional do pacote;
- `service_id`: serviço de catálogo associado;
- `created_by`: usuário administrador que criou a definição;
- `name` e `description`: identificação e explicação opcional;
- `total_sessions`: quantidade total de sessões, obrigatoriamente maior que
  zero;
- `total_price`: valor total decimal com duas casas, maior ou igual a zero;
- `active`: situação ativa/inativa, com padrão ativo;
- `created_at`, `updated_at` e `version`: auditoria e controle otimista de
  concorrência.

A tabela possui chaves estrangeiras para clínica, unidade, serviço e usuário.
As referências de unidade, serviço e criador usam a composição
`(clinic_id, id)`, impedindo que uma definição de uma clínica aponte para
entidades de outra. Também foram criados índices para consulta por
clínica/unidade, clínica/serviço e clínica/situação.

#### `SERVICE_PACKAGE_WEEK_DAY`

Armazena os dias semanais escolhidos para cada pacote. A chave primária composta
`(service_package_id, week_day)` impede o mesmo dia de ser gravado duas vezes
para um pacote. O `CHECK` do banco aceita somente:

`MONDAY`, `TUESDAY`, `WEDNESDAY`, `THURSDAY`, `FRIDAY`, `SATURDAY` e `SUNDAY`.

### Passo 2 — Criar entidades, enumeração, repositório e contratos da API

Foram adicionados os seguintes arquivos ao repositório da API:

| Arquivo | Responsabilidade |
| --- | --- |
| `model/servicepackage/PackageWeekDay.java` | Enumeração dos sete dias da semana |
| `model/servicepackage/ServicePackageDefinition.java` | Entidade JPA de `SERVICE_PACKAGE` e coleção de dias |
| `repository/ServicePackageRepository.java` | Busca por clínica e busca de um pacote dentro da clínica |
| `dtos/servicepackage/ServicePackageRequest.java` | Contrato validado para criar/editar |
| `dtos/servicepackage/ServicePackageStatusRequest.java` | Contrato para ativar/desativar |
| `dtos/servicepackage/ServicePackageResponse.java` | Resposta com dados catalográficos e frequência derivada |

O contrato de criação/edição exige nome, unidade, serviço, total positivo de
sessões, preço não negativo, ao menos um dia da semana e situação. A frequência
semanal não é enviada como dado independente: ela é calculada a partir do número
de dias selecionados. O valor monetário retorna como texto decimal, preservando
as duas casas sem conversão imprecisa para ponto flutuante.

### Passo 3 — Implementar regras de negócio, isolamento e imutabilidade

O arquivo `service/ServicePackageService.java` concentra as regras de domínio.
Ele executa as operações transacionais de criar, listar, consultar por id,
editar e mudar a situação.

Em cada operação, o serviço:

1. exige que o principal autenticado tenha papel `ADMIN`;
2. deriva a clínica a partir do usuário autenticado, em vez de receber a clínica
   do navegador;
3. consulta unidade e serviço por id **e** clínica, bloqueando referências fora
   do escopo autorizado;
4. remove espaços excedentes de nome e descrição, convertendo descrição vazia em
   `null`;
5. converte os dias para `LinkedHashSet` e rejeita dias repetidos com
   `PACKAGE_VALIDATION_ERROR`;
6. arredonda o preço para duas casas decimais com `HALF_UP`;
7. ordena os dias para montar a resposta e deriva `weeklyFrequency` pelo total
   de dias;
8. filtra a listagem por unidade, serviço, situação, total de sessões e trecho
   de nome quando esses parâmetros são informados.

Os erros de domínio preparados são:

| Código | Situação |
| --- | --- |
| `PACKAGE_VALIDATION_ERROR` | Dias repetidos no mesmo payload |
| `PACKAGE_FORBIDDEN` | Usuário inexistente ou sem papel `ADMIN` |
| `PACKAGE_NOT_FOUND` | Pacote, unidade ou serviço fora do escopo/autorização |
| `PACKAGE_IMMUTABLE` | Tentativa de editar ou alterar situação de pacote com uso em agendamento |

Também foi criado `service/ServicePackageUsageService.java` como ponto único de
integração com a SPEC 02. Neste momento ele retorna `false`, pois ainda não
existe a relação persistida entre agendamento e pacote. Portanto, a chamada de
proteção já está ligada em edição e ativação/desativação, mas a imutabilidade só
passará a ser efetiva quando a SPEC 02 implementar a consulta de uso real. Não
há criação de séries nem ocorrências de agendamento nesta etapa.

### Passo 4 — Expor a API administrativa de pacotes

Foi adicionado o controller
`controller/servicepackage/ServicePackageController.java`, sob a rota base
`/api/service-packages`. A classe possui `@PreAuthorize("hasRole('ADMIN')")`,
que protege todos os endpoints.

| Método e rota | Implementação atual |
| --- | --- |
| `POST /api/service-packages` | Cria uma definição e responde `201 Created` |
| `GET /api/service-packages` | Lista os pacotes da clínica em envelope `CatalogResponse`; aceita `unitId`, `serviceId`, `active`, `totalSessions` e `name` |
| `GET /api/service-packages/{id}` | Retorna um pacote autorizado |
| `PATCH /api/service-packages/{id}` | Edita um pacote que ainda seja mutável |
| `PATCH /api/service-packages/{id}/status` | Ativa ou desativa um pacote mutável |

Não foi criado endpoint `DELETE`, conforme a decisão de não haver exclusão
física. Nenhum endpoint aceita profissional, horário por dia, paciente, data
inicial ou criação automática de agenda.

### Passo 5 — Registrar a API no cache tipado do frontend

No frontend, `src/lib/base-api.ts` recebeu a tag RTK Query `ServicePackage`.
Depois foi criada a feature `src/features/packages/` com o adaptador
`api/packages.ts`.

O adaptador define os tipos canônicos:

- `PackageWeekDay` para os sete valores aceitos pela API;
- `ServicePackage`, incluindo unidade, serviço, total de sessões, preço, dias,
  frequência e situação;
- `ServicePackageInput`, usado na criação.

As operações RTK Query implementadas são:

| Hook/endpoint | Comportamento |
| --- | --- |
| `useGetServicePackagesQuery` | `GET /api/service-packages`, com parâmetros de filtro opcionais; aceita resposta em array ou no envelope com `content` |
| `useCreateServicePackageMutation` | `POST /api/service-packages`; invalida a tag `ServicePackage` |
| `useUpdateServicePackageStatusMutation` | `PATCH /api/service-packages/{id}/status`; invalida a mesma tag |

A página atual não chama o endpoint de edição detalhada, embora a API já o
exponha.

### Passo 6 — Criar a página de cadastro e listagem inicial

Foi adicionado `src/features/packages/pages/packages-page.tsx` e a rota
`/services/packages` em `src/Router.tsx`.

A página carrega a sessão, as unidades e os serviços já disponíveis pela feature
de agendamentos, além da lista de pacotes. O comportamento implementado é:

1. para usuários não administradores, mostra a mensagem de que somente
   administradores podem gerenciar pacotes;
2. para administradores, apresenta formulário de criação com nome, descrição,
   unidade, serviço, total de sessões, valor total e caixas para domingo a
   sábado;
3. calcula e mostra na própria legenda o número de dias marcados por semana;
4. exige no navegador nome, unidade, serviço, valor e ao menos um dia antes de
   enviar;
5. envia novos pacotes sempre ativos;
6. mostra notificações de sucesso ou erro e limpa o formulário após criação bem
   sucedida;
7. mostra estados de carregamento, erro de carregamento e lista vazia;
8. apresenta cada pacote com serviço, unidade, sessões, frequência, preço e
   dias;
9. oferece o botão para ativar/desativar cada item, sem uma ação de exclusão.

O servidor continua sendo a fonte definitiva das validações, permissão e
isolamento entre clínicas. A validação atual no cliente é apenas uma primeira
barreira de experiência de uso.

### Passo 7 — Integrar a entrada de navegação

`src/components/AppSidebar/index.tsx` foi alterado para transformar o item
**Serviços** em um `NavLink` disponível para `/services/packages`. Os itens
**Relatórios** e **Financeiro** permanecem indisponíveis, com o comportamento de
"Em breve" já existente.

O resultado implementado hoje é uma entrada direta **Serviços → página de
Pacotes**. A proposta OpenSpec previa um submenu visual “Pacotes” sob Serviços,
mas esse submenu expansível ainda não foi implementado; ele não deve ser
reportado como concluído.

### Passo 8 — Adicionar a ação temporária ao lado do agendamento manual

`src/components/AppTopbar/index.tsx` preserva o componente
`CreateAppointmentDialog` e o botão existente **Agendar** sem mudar seu fluxo.
Ao lado dele foi incluído um segundo botão de contorno com o texto
**Agendamento de Pacotes**.

Ao clicar no botão novo, o sistema mostra apenas a notificação:

> Agendamento de Pacotes estará disponível após a SPEC 02.

Não há navegação, chamada HTTP, gravação, seleção de paciente ou criação de
agendamento nessa ação. Os dois controles continuam dentro da região que exige
sessão e é exibida a partir do breakpoint `sm`, que já era o comportamento da
região de ações do topbar.

## 4. Fluxo técnico que já funciona

```text
Administrador autenticado
  → rota /services/packages
  → formulário de pacote
  → RTK Query: POST /api/service-packages
  → controller protegido por ADMIN
  → ServicePackageService deriva clínica do principal
  → valida unidade e serviço dentro da clínica
  → SERVICE_PACKAGE + SERVICE_PACKAGE_WEEK_DAY
  → resposta tipada e invalidação do cache ServicePackage
  → lista atualizada na página
```

Para ativação/desativação, o fluxo é igual, substituindo a criação por
`PATCH /api/service-packages/{id}/status`. A verificação de imutabilidade já é
chamada antes da mudança; sua fonte de dados será conectada quando existir
agendamento por pacote na SPEC 02.

## 5. Itens fora do escopo ou ainda pendentes

Os itens abaixo não foram removidos do planejamento; eles permanecem pendentes
e precisam ser tratados antes de considerar a change concluída.

| Tema | Estado real |
| --- | --- |
| Contratação de pacote por paciente | Não implementada; pertence à SPEC 02 |
| Data inicial, horário, profissional e geração de ocorrências | Não implementados; pertencem à SPEC 02 ou a specs futuras de disponibilidade |
| Calendário de funcionamento, feriados e bloqueios | Explicitamente fora do escopo atual |
| Imutabilidade após uso | Ponto de extensão criado, mas `ServicePackageUsageService` ainda não consulta agendamentos reais |
| Edição de pacote na interface | API exposta, porém página não possui tela/formulário de edição |
| Detalhe e filtros de listagem na interface | API aceita filtros e possui detalhe; a página atual apenas lista todos os itens |
| Submenu visual “Pacotes” sob “Serviços” | Ainda não implementado; há navegação direta |
| Validação Zod e exibição específica dos erros de domínio no frontend | Ainda não implementadas |
| Testes frontend e API específicos de pacotes | Ainda não adicionados/executados |
| READMEs de módulos solicitados pela change | Ainda não atualizados |
| Exclusão física de pacote | Não será implementada nesta especificação |
| Remover o botão manual “Agendar” | Não autorizado/implementado; depende da maturidade da SPEC 02 |

## 6. Verificações executadas e resultado

### OpenSpec

Os dois repositórios tiveram a change validada em modo estrito antes da
implementação de código:

```bash
openspec validate gerenciar-pacotes-flexiveis --strict
```

Resultado registrado: a change foi considerada válida nos dois repositórios.
Uma nova execução deve ser feita ao concluir tarefas, testes e documentação.

### Compilação da API

No repositório da API foi executado:

```bash
./mvnw -q -DskipTests compile
```

A primeira execução no sandbox não conseguiu gravar em `target/`, por restrição
do ambiente. A execução com permissão de escrita apropriada foi concluída sem
saída de erro, confirmando a compilação do código adicionado. A suíte Maven
completa e testes de integração PostgreSQL ainda não foram executados.

### Build e lint do frontend

Foram executados:

```bash
npm run build
npm run lint
```

Os comandos não apontaram erro nos novos arquivos de pacotes, mas não foram
concluídos por problemas preexistentes em arquivos não alterados por esta
implementação:

- `src/components/Card/CardDay/index.tsx`: fixtures de agendamento sem campos
  exigidos pelo tipo atual `Appointment`;
- `src/components/__tests__/app-sidebar.test.tsx`: imports `render` e
  `MemoryRouter` não utilizados;
- testes legados de calendário: fixtures incompatíveis com tipos/situação de
  agendamento atuais.

Essas falhas devem ser reavaliadas e documentadas novamente quando os testes
específicos da feature forem incluídos, mas não foram corrigidas nesta change
para não ampliar o escopo com refatorações legadas não solicitadas.

## 7. Arquivos alterados e adicionados

### Frontend

```text
src/Router.tsx                                      (alterado)
src/components/AppSidebar/index.tsx                 (alterado)
src/components/AppTopbar/index.tsx                  (alterado)
src/lib/base-api.ts                                 (alterado)
src/features/packages/api/packages.ts               (adicionado)
src/features/packages/pages/packages-page.tsx       (adicionado)
openspec/changes/gerenciar-pacotes-flexiveis/...    (adicionado)
docs/IMPLEMENTACAO-AGENDAMENTO-SMART-CUSTOMIZADO.md (adicionado)
```

### API irmã

```text
src/main/resources/db/migration/V012__create_service_packages.sql
src/main/java/com/agendamento/smart/model/servicepackage/PackageWeekDay.java
src/main/java/com/agendamento/smart/model/servicepackage/ServicePackageDefinition.java
src/main/java/com/agendamento/smart/repository/ServicePackageRepository.java
src/main/java/com/agendamento/smart/dtos/servicepackage/ServicePackageRequest.java
src/main/java/com/agendamento/smart/dtos/servicepackage/ServicePackageStatusRequest.java
src/main/java/com/agendamento/smart/dtos/servicepackage/ServicePackageResponse.java
src/main/java/com/agendamento/smart/service/ServicePackageUsageService.java
src/main/java/com/agendamento/smart/service/ServicePackageService.java
src/main/java/com/agendamento/smart/controller/servicepackage/ServicePackageController.java
openspec/changes/gerenciar-pacotes-flexiveis/...
```

## 8. Próxima sequência recomendada

1. adicionar testes de serviço, controller e integração da API, especialmente
   para papel `ADMIN`, usuário básico, duas clínicas, referências cruzadas,
   sete dias, dias duplicados, preço, filtros e situação;
2. substituir a implementação temporária de `ServicePackageUsageService` pela
   consulta real quando a SPEC 02 criar o vínculo pacote-agendamento;
3. completar a interface: filtros, detalhe, edição, mensagens específicas de
   erro, Zod e submenu visual em Serviços;
4. escrever os testes Vitest/MSW da página, topbar e menu, incluindo a garantia
   de que o botão novo não faz requisição nem navega;
5. atualizar os READMEs exigidos pela change e repetir build, lint, testes,
   `./mvnw clean verify` e validação OpenSpec estrita;
6. somente após todas as tarefas terem evidência real, atualizar os checkboxes
   de `tasks.md`, revisar a change e avaliar seu arquivamento.

## 9. Alterações comparativas — como era e como ficou

Esta seção foi incluída para deixar explícito o que mudou em relação ao commit
base `5f8b40b`. Ela não substitui as seções anteriores: detalha o mesmo trabalho
com a perspectiva de manutenção do código.

### 9.1 Frontend — arquivos alterados que já existiam

| Arquivo | Como era | Como ficou | Função da alteração |
| --- | --- | --- | --- |
| `src/Router.tsx` | Não importava `PackagesPage` e não tinha rota para pacotes dentro de `AppLayout`. | Importa `PackagesPage` e declara `<Route path="/services/packages" element={<PackagesPage />} />`. | Torna a página acessível na área autenticada da aplicação. |
| `src/components/AppSidebar/index.tsx` | O item Serviços tinha `availability: 'unavailable'`; era exibido como "Em breve" e não possuía rota. | O item recebeu `to: '/services/packages'` e `availability: 'available'`. | Converte Serviços em link navegável para a gestão inicial de pacotes. |
| `src/components/AppTopbar/index.tsx` | A região possuía somente `CreateAppointmentDialog` para o botão Agendar e usava `hidden sm:block`. | A região usa `hidden items-center gap-2 sm:flex`, mantém o diálogo manual e adiciona o botão temporário Agendamento de Pacotes com notificação. | Coloca as duas ações lado a lado, sem mudar a criação manual existente. |
| `src/lib/base-api.ts` | O `createApi` não conhecia a tag de cache de pacotes. | A lista `tagTypes` passa a incluir `ServicePackage`. | Permite que consultas de pacotes sejam invalidadas e recarregadas após mutações. |

#### Rota — antes e depois

Antes, o conjunto de rotas autenticadas terminava em Configurações:

```tsx
<Route path="/appointments" element={<AppointmentsPage />} />
<Route path="/paciente" element={<Patient />} />
<Route path="/doctor" element={<Doctor />} />
<Route path="/configuration" element={<Configuration />} />
```

Depois, a rota de Pacotes foi incluída no mesmo `AppLayout`:

```tsx
import { PackagesPage } from '@/features/packages/pages/packages-page'

// dentro de <Route element={<AppLayout />}>
<Route path="/services/packages" element={<PackagesPage />} />
```

`Router()` continua sendo apenas o declarador de rotas; não contém regra de
autorização. A página consulta a sessão e a API mantém a autorização definitiva.

#### Menu lateral — antes e depois

Antes, Serviços seguia o fluxo genérico de item indisponível:

```tsx
{
  label: 'Serviços',
  icon: CircleHelp,
  availability: 'unavailable',
}
```

Depois, tornou-se um item disponível do tipo `NavLink`:

```tsx
{
  label: 'Serviços',
  icon: CircleHelp,
  to: '/services/packages',
  availability: 'available',
}
```

O mecanismo já existente de `NavigationItems()` identifica `availability`.
Para itens disponíveis ele renderiza `NavLink`, aplica estilo ativo pela rota e
executa `onNavigate` (usado, por exemplo, para fechar o menu compacto). Para
indisponíveis ele continua renderizando um botão com aviso. Nenhuma regra de
Relatórios ou Financeiro foi modificada.

#### Topbar — antes e depois

Antes, o bloco de ações autenticadas era:

```tsx
{session ? (
  <div className="hidden sm:block">
    <CreateAppointmentDialog
      session={session}
      defaultDate={dateValue}
      triggerLabel="Agendar"
      triggerAriaLabel="Novo agendamento"
    />
  </div>
) : null}
```

Depois, o diálogo manual permanece idêntico e recebe um botão irmão:

```tsx
{session ? (
  <div className="hidden items-center gap-2 sm:flex">
    <CreateAppointmentDialog
      session={session}
      defaultDate={dateValue}
      triggerLabel="Agendar"
      triggerAriaLabel="Novo agendamento"
    />
    <Button
      type="button"
      variant="outline"
      onClick={() =>
        toast.info('Agendamento de Pacotes estará disponível após a SPEC 02.')
      }
    >
      Agendamento de Pacotes
    </Button>
  </div>
) : null}
```

Além da importação `toast` de `sonner`, a troca de `sm:block` por
`items-center gap-2 sm:flex` é necessária para os dois controles ficarem em
linha, centralizados verticalmente e separados por espaço. O `onClick` não
possui chamada à API, `navigate`, alteração de estado de domínio ou abertura de
modal: sua única responsabilidade é comunicar que a SPEC 02 é necessária.

#### Cache RTK Query — antes e depois

Antes, `baseApi` não podia oferecer/invalidate uma tag específica de pacote:

```tsx
tagTypes: [
  'Appointment',
  'Session',
  'Profile',
  'PatientCatalog',
  'UnitCatalog',
  'ServiceCatalog',
  'ProfessionalCatalog',
]
```

Depois:

```tsx
tagTypes: [
  'Appointment',
  'Session',
  'Profile',
  'PatientCatalog',
  'UnitCatalog',
  'ServiceCatalog',
  'ProfessionalCatalog',
  'ServicePackage',
]
```

Essa inclusão isolada não faz requisições. Ela habilita o adaptador de pacotes a
declarar que a listagem fornece a tag e que as mutações a invalidam, provocando
atualização da listagem observada pela página.

### 9.2 Arquivos novos — como era e como ficou

Os arquivos abaixo não existiam na base. Portanto, o estado anterior era
“sem implementação” e o estado posterior é a criação integral descrita neste
documento.

| Área | Arquivo novo | Função introduzida |
| --- | --- | --- |
| Frontend | `src/features/packages/api/packages.ts` | Tipos e endpoints RTK Query de lista, criação e mudança de situação |
| Frontend | `src/features/packages/pages/packages-page.tsx` | Formulário inicial, listagem, aviso de acesso e ativação/desativação |
| API | `V012__create_service_packages.sql` | Persistência de pacote e dias semanais com integridade no banco |
| API | `PackageWeekDay.java` | Vocabulário fechado dos sete dias válidos |
| API | `ServicePackageDefinition.java` | Mapeamento JPA e auditoria da definição |
| API | `ServicePackageRepository.java` | Consultas orientadas por clínica |
| API | DTOs `ServicePackage*` | Contratos de entrada, alteração de situação e resposta |
| API | `ServicePackageUsageService.java` | Fronteira temporária para a futura verificação de uso |
| API | `ServicePackageService.java` | Regras de autorização, escopo, validação, busca, edição e situação |
| API | `ServicePackageController.java` | Rotas HTTP administrativas sob `/api/service-packages` |

## 10. Código comentado por componente, serviço e método

Os trechos deste capítulo reproduzem a lógica relevante que está no diretório de
trabalho. Os comentários em português foram adicionados ao documento para
explicar o comportamento; eles não foram inseridos nos arquivos-fonte apenas
para fins de documentação.

### 10.1 Migration Flyway — estrutura e garantias no banco

```sql
CREATE TABLE SERVICE_PACKAGE (
    id UUID NOT NULL,
    clinic_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    unit_id UUID NOT NULL,
    service_id UUID NOT NULL,
    created_by UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(2000) NULL,
    total_sessions INT NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP(6) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT pk_service_package PRIMARY KEY (id),
    CONSTRAINT uk_service_package_clinic_id UNIQUE (clinic_id, id),
    CONSTRAINT fk_service_package_unit_tenant
      FOREIGN KEY (clinic_id, unit_id)
      REFERENCES CLINIC_UNIT (clinic_id, id),
    CONSTRAINT fk_service_package_service_tenant
      FOREIGN KEY (clinic_id, service_id)
      REFERENCES SERVICE_OFFERING (clinic_id, id),
    CONSTRAINT chk_service_package_sessions CHECK (total_sessions > 0),
    CONSTRAINT chk_service_package_price CHECK (total_price >= 0)
);

CREATE TABLE SERVICE_PACKAGE_WEEK_DAY (
    service_package_id UUID NOT NULL,
    week_day VARCHAR(16) NOT NULL,
    CONSTRAINT pk_service_package_week_day
      PRIMARY KEY (service_package_id, week_day),
    CONSTRAINT fk_service_package_week_day_package
      FOREIGN KEY (service_package_id) REFERENCES SERVICE_PACKAGE (id),
    CONSTRAINT chk_service_package_week_day CHECK (
      week_day IN ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY',
                   'FRIDAY', 'SATURDAY', 'SUNDAY')
    )
);
```

Funcionalidade linha a linha relevante:

- `DECIMAL(10, 2)` preserva a precisão monetária no banco; não usa `float`;
- as FKs compostas por `clinic_id` evitam associação cruzada entre clínicas no
  nível persistente;
- `CHECK` de sessões e preço protege inclusive chamadas que não vierem pelo
  frontend;
- a PK de `SERVICE_PACKAGE_WEEK_DAY` torna o par pacote/dia único;
- `version` é o campo de controle otimista usado pela entidade JPA;
- os três índices adicionais da migration aceleram as consultas de escopo por
  unidade, serviço e situação;
- a migration também possui FKs para `CLINIC` e `USERS` (criador), ambas com
  `ON UPDATE RESTRICT ON DELETE RESTRICT`, preservando a integridade histórica.

### 10.2 Modelo de domínio da API

#### Enum `PackageWeekDay`

```java
public enum PackageWeekDay {
    MONDAY, TUESDAY, WEDNESDAY, THURSDAY,
    FRIDAY, SATURDAY, SUNDAY
}
```

O enum impede que a aplicação use textos livres como `segunda`, `Seg` ou valores
inválidos. O JPA grava o nome da enumeração como `VARCHAR` e a migration limita
o mesmo conjunto no banco.

#### Entidade `ServicePackageDefinition`

```java
@Entity
@Table(name = "SERVICE_PACKAGE")
@Getter @Setter @NoArgsConstructor
public class ServicePackageDefinition {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "clinic_id")
    private Clinic clinic;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "unit_id")
    private ClinicUnit unit;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "service_id")
    private ServiceOffering service;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(nullable = false) private String name;
    @Column(length = 2000) private String description;
    @Column(name = "total_sessions", nullable = false) private Integer totalSessions;
    @Column(name = "total_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalPrice;
    @Column(nullable = false) private boolean active = true;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
      name = "SERVICE_PACKAGE_WEEK_DAY",
      joinColumns = @JoinColumn(name = "service_package_id")
    )
    @Enumerated(EnumType.STRING)
    @Column(name = "week_day", nullable = false)
    private Set<PackageWeekDay> weekDays = new LinkedHashSet<>();

    @CreationTimestamp @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    @UpdateTimestamp @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
    @Version private Long version;
}
```

Não há métodos de negócio escritos manualmente nessa classe: Lombok gera os
getters e setters. A responsabilidade da entidade é representar e persistir o
estado; as regras ficam no serviço. `LAZY` evita carregar relações de clínica,
unidade, serviço e usuário sem necessidade. Os dias são `EAGER` porque a
resposta de todo pacote sempre precisa deles para exibir frequência e agenda
semanal.

### 10.3 Contratos e repositório da API

#### DTO de criação/edição

```java
public record ServicePackageRequest(
    @NotBlank String name,
    String description,
    @NotNull UUID unitId,
    @NotNull UUID serviceId,
    @NotNull @Positive Integer totalSessions,
    @NotNull @DecimalMin(value = "0.00") BigDecimal totalPrice,
    @NotEmpty List<PackageWeekDay> weekDays,
    @NotNull Boolean active
) {}
```

`@Valid` no controller ativa essas validações antes de chamar o serviço. Em
particular, a lista não pode ser vazia, mas a anotação não detecta duplicidade;
essa regra complementar está no método `apply` do serviço.

#### DTO de situação e resposta

```java
public record ServicePackageStatusRequest(@NotNull Boolean active) {}

public record ServicePackageResponse(
    UUID id, UUID unitId, String unitName,
    UUID serviceId, String serviceName,
    String name, String description,
    Integer totalSessions, String totalPrice,
    List<PackageWeekDay> weekDays, Integer weeklyFrequency,
    boolean active, UUID createdBy, Instant createdAt, Instant updatedAt
) {}
```

O contrato de situação é propositalmente mínimo: impede que uma requisição de
ativação altere, por engano, valor, dias ou serviço. A resposta inclui nomes de
unidade e serviço para a tela não precisar fazer uma busca adicional. O preço é
texto decimal já formatado pelo serviço e `weeklyFrequency` é derivada, não um
campo gravado separadamente.

#### Repositório

```java
public interface ServicePackageRepository
        extends JpaRepository<ServicePackageDefinition, UUID> {

    List<ServicePackageDefinition> findAllByClinicIdOrderByNameAsc(UUID clinicId);
    Optional<ServicePackageDefinition> findByIdAndClinicId(UUID id, UUID clinicId);
}
```

`findAllByClinicIdOrderByNameAsc` limita a origem da listagem à clínica da
sessão e ordena pelo nome. `findByIdAndClinicId` é usado antes de detalhe,
edição e situação; ele evita usar um `findById` isolado, que poderia revelar ou
alterar um pacote de outra clínica.

### 10.4 Serviço `ServicePackageUsageService`

```java
@Service
public class ServicePackageUsageService {
    /** A SPEC 02 substituirá esta fronteira por consulta ao vínculo de agendamento de pacote. */
    public boolean hasPackageAppointments(UUID servicePackageId) {
        return false;
    }
}
```

| Método | O que faz agora | Como será utilizado depois |
| --- | --- | --- |
| `hasPackageAppointments(UUID servicePackageId)` | Sempre retorna `false`; portanto, não bloqueia a edição nesta etapa. | A SPEC 02 deve consultar o vínculo real pacote-agendamento e retornar `true` após o primeiro uso, para que o serviço recuse mudanças. |

O método recebe o id mesmo ainda não o usando, pois essa é a assinatura que será
preservada quando a consulta real for adicionada. Isso evita espalhar a regra de
imutabilidade pelos controllers ou pela interface.

### 10.5 Serviço `ServicePackageService` — métodos e responsabilidade

Este é o serviço principal da feature. Sua injeção de dependências é:

```java
private final ServicePackageRepository packageRepository;
private final UnitRepository unitRepository;
private final ServiceOfferingRepository serviceRepository;
private final ServicePackageUsageService usageService;
```

| Método | Código/decisão central | Funcionalidade e efeito |
| --- | --- | --- |
| `create` | `requireAdmin(user)`; cria entidade; define clínica e criador; chama `apply`; `saveAndFlush`. | Cria o pacote no escopo do usuário autenticado; não aceita clínica ou criador enviados pelo navegador. |
| `findAll` | Parte de `findAllByClinicIdOrderByNameAsc(user.getClinic().getId())` e aplica filtros opcionais em stream. | Lista somente a clínica da sessão e filtra unidade, serviço, ativo, sessões e nome. |
| `findById` | `return toResponse(findDefinition(user, id))`. | Busca um pacote somente se pertencer à clínica atual. |
| `update` | Localiza, chama `requireMutable`, aplica dados e salva. | Edita tudo que o request permite, mas recusa se houver uso real futuro. |
| `updateStatus` | Localiza, chama `requireMutable`, altera apenas `active`. | Ativa/desativa sem exclusão física e sem trocar demais campos. |
| `apply` | Converte dias em `LinkedHashSet`, valida tamanho, busca unidade/serviço no escopo, normaliza e aplica campos. | Centraliza as regras comuns de criação e edição. |
| `findDefinition` | `findByIdAndClinicId(id, user.getClinic().getId())`. | Garante isolamento multi-clínica antes de qualquer leitura/mudança individual. |
| `requireMutable` | Consulta `usageService.hasPackageAppointments`. | É a barreira de imutabilidade preparada para a SPEC 02. |
| `requireAdmin` | Verifica `user == null` e `UserRole.ADMIN`. | Mantém a proteção no domínio mesmo com `@PreAuthorize` no controller. |
| `packageNotFound` | Cria `DomainException` 404. | Evita distinguir, para o cliente, pacote inexistente de referência fora de escopo. |
| `normalizeDescription` | Retorna `null` para vazio e `trim()` para texto. | Evita gravar descrições compostas apenas por espaços. |
| `toResponse` | Ordena dias, normaliza preço com duas casas e calcula `days.size()`. | Converte entidade para contrato estável e mostra frequência derivada. |

#### `create`, `update` e `updateStatus`

```java
@Transactional
public ServicePackageResponse create(User user, ServicePackageRequest request) {
    requireAdmin(user);
    ServicePackageDefinition definition = new ServicePackageDefinition();
    definition.setClinic(user.getClinic());
    definition.setCreatedBy(user);
    apply(definition, user, request);
    return toResponse(packageRepository.saveAndFlush(definition));
}

@Transactional
public ServicePackageResponse update(User user, UUID id, ServicePackageRequest request) {
    requireAdmin(user);
    ServicePackageDefinition definition = findDefinition(user, id);
    requireMutable(definition);
    apply(definition, user, request);
    return toResponse(packageRepository.saveAndFlush(definition));
}

@Transactional
public ServicePackageResponse updateStatus(User user, UUID id, boolean active) {
    requireAdmin(user);
    ServicePackageDefinition definition = findDefinition(user, id);
    requireMutable(definition);
    definition.setActive(active);
    return toResponse(packageRepository.saveAndFlush(definition));
}
```

Os três métodos estão em transação de escrita. `saveAndFlush` força a
sincronização antes de a resposta ser montada; se uma restrição de banco falhar,
a transação não deve permanecer parcialmente gravada.

#### Listagem e busca individual

```java
@Transactional(readOnly = true)
public List<ServicePackageResponse> findAll(
        User user, UUID unitId, UUID serviceId, Boolean active,
        Integer totalSessions, String name) {
    requireAdmin(user);
    Stream<ServicePackageDefinition> packages = packageRepository
        .findAllByClinicIdOrderByNameAsc(user.getClinic().getId()).stream();
    if (unitId != null) packages = packages.filter(item -> item.getUnit().getId().equals(unitId));
    if (serviceId != null) packages = packages.filter(item -> item.getService().getId().equals(serviceId));
    if (active != null) packages = packages.filter(item -> item.isActive() == active);
    if (totalSessions != null) packages = packages.filter(item -> item.getTotalSessions().equals(totalSessions));
    if (name != null && !name.isBlank()) {
        String normalized = name.trim().toLowerCase();
        packages = packages.filter(item -> item.getName().toLowerCase().contains(normalized));
    }
    return packages.map(this::toResponse).toList();
}

@Transactional(readOnly = true)
public ServicePackageResponse findById(User user, UUID id) {
    requireAdmin(user);
    return toResponse(findDefinition(user, id));
}
```

O filtro de nome é por ocorrência, sem diferenciar maiúsculas/minúsculas. Nesta
primeira versão os filtros são aplicados depois de a consulta por clínica trazer
os itens; uma evolução de desempenho poderá transformá-los em consulta dinâmica
quando houver volume que justifique isso. Essa evolução não foi feita aqui para
não mudar prematuramente o contrato nem introduzir especificação adicional.

#### Aplicação de dados e funções de proteção

```java
private void apply(ServicePackageDefinition definition, User user,
                   ServicePackageRequest request) {
    LinkedHashSet<PackageWeekDay> days = new LinkedHashSet<>(request.weekDays());
    if (days.size() != request.weekDays().size()) {
        throw new DomainException("PACKAGE_VALIDATION_ERROR",
            "Os dias da semana não podem se repetir.", HttpStatus.BAD_REQUEST);
    }

    UUID clinicId = user.getClinic().getId();
    ClinicUnit unit = unitRepository.findByIdAndClinicId(request.unitId(), clinicId)
        .orElseThrow(this::packageNotFound);
    ServiceOffering service = serviceRepository.findByIdAndClinicId(request.serviceId(), clinicId)
        .orElseThrow(this::packageNotFound);

    definition.setTenantId(unit.getTenantId());
    definition.setUnit(unit);
    definition.setService(service);
    definition.setName(request.name().trim());
    definition.setDescription(normalizeDescription(request.description()));
    definition.setTotalSessions(request.totalSessions());
    definition.setTotalPrice(request.totalPrice().setScale(2, RoundingMode.HALF_UP));
    definition.setWeekDays(days);
    definition.setActive(request.active());
}

private ServicePackageDefinition findDefinition(User user, UUID id) {
    return packageRepository.findByIdAndClinicId(id, user.getClinic().getId())
        .orElseThrow(this::packageNotFound);
}

private void requireMutable(ServicePackageDefinition definition) {
    if (usageService.hasPackageAppointments(definition.getId())) {
        throw new DomainException("PACKAGE_IMMUTABLE",
            "O pacote possui agendamentos vinculados e não pode ser alterado.",
            HttpStatus.CONFLICT);
    }
}
```

`LinkedHashSet` preserva a ordem de inserção durante a aplicação, mas a resposta
faz uma ordenação explícita pelo enum. `tenantId` vem da unidade validada; não é
aceito como dado de entrada. A proteção `requireMutable` é aplicada tanto na
edição total quanto na mudança de situação, seguindo a decisão de que um pacote
usado não muda nem é desativado.

#### Conversão para resposta e erros auxiliares

```java
private void requireAdmin(User user) {
    if (user == null || user.getRole() != UserRole.ADMIN) {
        throw new DomainException("PACKAGE_FORBIDDEN",
            "Somente administradores podem gerenciar pacotes.", HttpStatus.FORBIDDEN);
    }
}

private DomainException packageNotFound() {
    return new DomainException("PACKAGE_NOT_FOUND",
        "Pacote, unidade ou serviço não encontrado no escopo autorizado.",
        HttpStatus.NOT_FOUND);
}

private String normalizeDescription(String value) {
    return value == null || value.isBlank() ? null : value.trim();
}

private ServicePackageResponse toResponse(ServicePackageDefinition definition) {
    List<PackageWeekDay> days = definition.getWeekDays().stream().sorted().toList();
    return new ServicePackageResponse(
        definition.getId(), definition.getUnit().getId(), definition.getUnit().getName(),
        definition.getService().getId(), definition.getService().getName(),
        definition.getName(), definition.getDescription(), definition.getTotalSessions(),
        definition.getTotalPrice().setScale(2, RoundingMode.HALF_UP).toPlainString(),
        days, days.size(), definition.isActive(), definition.getCreatedBy().getId(),
        definition.getCreatedAt(), definition.getUpdatedAt()
    );
}
```

`requireAdmin` complementa a proteção declarativa do Spring no controller: se o
serviço vier a ser chamado por outro ponto no futuro, ele mantém a mesma regra.
`packageNotFound` usa uma mensagem única para não expor qual elemento do escopo
falhou. `toResponse` converte o preço em texto com duas casas e deriva a
frequência exatamente da lista efetivamente persistida.

### 10.6 Controller `ServicePackageController` — endpoint por endpoint

```java
@RestController
@RequestMapping("/api/service-packages")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ServicePackageController {
    private final ServicePackageService service;

    @PostMapping
    public ResponseEntity<ServicePackageResponse> create(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ServicePackageRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(user, request));
    }

    @GetMapping
    public CatalogResponse<ServicePackageResponse> findAll(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) UUID unitId,
            @RequestParam(required = false) UUID serviceId,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) Integer totalSessions,
            @RequestParam(required = false) String name) {
        return new CatalogResponse<>(
            service.findAll(user, unitId, serviceId, active, totalSessions, name)
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ServicePackageResponse> findById(
            @AuthenticationPrincipal User user, @PathVariable UUID id) {
        return ResponseEntity.ok(service.findById(user, id));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ServicePackageResponse> update(
            @AuthenticationPrincipal User user, @PathVariable UUID id,
            @Valid @RequestBody ServicePackageRequest request) {
        return ResponseEntity.ok(service.update(user, id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ServicePackageResponse> updateStatus(
            @AuthenticationPrincipal User user, @PathVariable UUID id,
            @Valid @RequestBody ServicePackageStatusRequest request) {
        return ResponseEntity.ok(service.updateStatus(user, id, request.active()));
    }
}
```

| Método HTTP / método Java | Papel | Detalhe de funcionamento |
| --- | --- | --- |
| `POST` / `create` | Criar | Valida o corpo, injeta o usuário autenticado e retorna `201`. |
| `GET` / `findAll` | Listar | Lê filtros opcionais e embrulha a coleção em `CatalogResponse`, que o frontend normaliza. |
| `GET /{id}` / `findById` | Detalhar | Delega a busca com proteção de clínica. |
| `PATCH /{id}` / `update` | Editar | Valida o corpo inteiro e delega a regra de imutabilidade ao serviço. |
| `PATCH /{id}/status` / `updateStatus` | Ativar/desativar | Aceita somente `active`, evitando atualizações acidentais de dados da definição. |

`@AuthenticationPrincipal` não aceita um usuário informado pelo cliente; usa o
principal que passou pela autenticação. `@PreAuthorize` exige `ADMIN` antes da
execução e o serviço repete essa proteção no domínio. Não há mapeamento `DELETE`.

### 10.7 Adaptador RTK Query `packagesApi`

```tsx
export type PackageWeekDay =
  | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY'
  | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'

export interface ServicePackage {
  id: string
  unitId: string
  unitName: string
  serviceId: string
  serviceName: string
  name: string
  description: string | null
  totalSessions: number
  totalPrice: string
  weekDays: PackageWeekDay[]
  weeklyFrequency: number
  active: boolean
}

function contentOf(value: unknown): ServicePackage[] {
  if (Array.isArray(value)) return value as ServicePackage[]
  return (value as { content?: ServicePackage[] }).content ?? []
}

export const packagesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getServicePackages: builder.query<ServicePackage[], QueryParams | void>({
      query: (params) => ({ url: '/api/service-packages', params }),
      transformResponse: contentOf,
      providesTags: ['ServicePackage'],
    }),
    createServicePackage: builder.mutation<ServicePackage, ServicePackageInput>({
      query: (data) => ({ url: '/api/service-packages', method: 'POST', data }),
      invalidatesTags: ['ServicePackage'],
    }),
    updateServicePackageStatus: builder.mutation<ServicePackage, StatusInput>({
      query: ({ id, active }) => ({
        url: `/api/service-packages/${id}/status`, method: 'PATCH', data: { active },
      }),
      invalidatesTags: ['ServicePackage'],
    }),
  }),
})
```

No arquivo-fonte, `QueryParams` é o tipo literal
`Record<string, string | boolean | number | undefined>` e `StatusInput` é
`{ id: string; active: boolean }`; os aliases foram usados somente neste trecho
para mantê-lo legível. A implementação real exporta estes hooks:

```tsx
export const {
  useGetServicePackagesQuery,
  useCreateServicePackageMutation,
  useUpdateServicePackageStatusMutation,
} = packagesApi
```

| Elemento/método | Funcionalidade |
| --- | --- |
| `contentOf` | Aceita tanto uma lista direta quanto `{ content: [...] }`; se a resposta não tiver `content`, devolve lista vazia. Isso compatibiliza a página com o `CatalogResponse` atual. |
| `getServicePackages` | Consulta a coleção e fornece a tag de cache. Os parâmetros são opcionais para suportar os filtros já previstos pela API, ainda não expostos na página. |
| `createServicePackage` | Envia a definição nova; ao terminar, invalida a lista de pacotes. |
| `updateServicePackageStatus` | Altera só a situação; também invalida a lista. |

### 10.8 Página `PackagesPage` — estado e métodos

#### Estado, carregamento de dados e alternância de dia

```tsx
const weekDays: Array<[PackageWeekDay, string]> = [
  ['SUNDAY', 'Domingo'], ['MONDAY', 'Segunda'], ['TUESDAY', 'Terça'],
  ['WEDNESDAY', 'Quarta'], ['THURSDAY', 'Quinta'], ['FRIDAY', 'Sexta'],
  ['SATURDAY', 'Sábado'],
]

export function PackagesPage() {
  const session = useGetAppointmentSessionQuery().data
  const packages = useGetServicePackagesQuery()
  const units = useGetUnitsQuery()
  const services = useGetServicesQuery()
  const [createPackage, createState] = useCreateServicePackageMutation()
  const [changeStatus] = useUpdateServicePackageStatusMutation()
  const [form, setForm] = useState({
    name: '', description: '', unitId: '', serviceId: '',
    totalSessions: '10', totalPrice: '', weekDays: [] as PackageWeekDay[],
  })
  const isAdmin = session?.user.role === 'ADMIN'

  function toggleDay(day: PackageWeekDay) {
    setForm((current) => ({
      ...current,
      weekDays: current.weekDays.includes(day)
        ? current.weekDays.filter((value) => value !== day)
        : [...current.weekDays, day],
    }))
  }
```

| Método/estado | Funcionalidade |
| --- | --- |
| `weekDays` | Mapeia o valor técnico aceito pela API para o rótulo em português. O formulário mostra de domingo a sábado, como definido no requisito. |
| `useGetAppointmentSessionQuery` | Obtém a sessão usada para a mensagem de acesso; não é a autorização definitiva. |
| `useGetUnitsQuery` e `useGetServicesQuery` | Reutilizam os catálogos existentes para preencher os `selects`; não criam unidade ou serviço. |
| `useGetServicePackagesQuery` | Carrega a listagem que será atualizada pelas invalidações RTK Query. |
| `form` | Mantém os valores em edição. Sessões inicia em `'10'` como conveniência visual e é convertida na submissão. |
| `toggleDay` | Se o dia já existe, remove-o; se não existe, acrescenta-o. Por isso a UI não envia duplicidade a partir dos checkboxes. A API ainda valida duplicidade para proteger outros clientes. |

#### Método `submit`

```tsx
async function submit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault()
  if (!form.name.trim() || !form.unitId || !form.serviceId ||
      !form.totalPrice || form.weekDays.length === 0) {
    toast.error('Preencha os campos obrigatórios e selecione ao menos um dia.')
    return
  }

  try {
    await createPackage({
      ...form,
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      totalSessions: Number(form.totalSessions),
      active: true,
    }).unwrap()
    toast.success('Pacote criado com sucesso.')
    setForm({
      name: '', description: '', unitId: '', serviceId: '',
      totalSessions: '10', totalPrice: '', weekDays: [],
    })
  } catch {
    toast.error('Não foi possível salvar o pacote. Revise os dados e tente novamente.')
  }
}
```

Passo a passo do método:

1. impede o comportamento padrão de recarregar a página;
2. verifica os campos mínimos de experiência de uso e interrompe se faltarem;
3. remove espaços do nome e converte descrição vazia em `undefined`;
4. converte a quantidade de sessões, que é texto no input, para `number`;
5. força `active: true` na criação inicial;
6. executa a mutation e usa `.unwrap()` para que falhas HTTP caiam no `catch`;
7. notifica sucesso e restaura o formulário inicial; em falha, preserva os
   dados digitados e exibe aviso genérico.

O método ainda não usa Zod nem interpreta cada código de domínio individualmente;
essas lacunas seguem registradas como pendentes na seção 5.

#### Renderização e mudança de situação

```tsx
if (session && !isAdmin) {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Pacotes</h1>
      <p className="mt-3">Somente administradores podem gerenciar pacotes.</p>
    </main>
  )
}

// estados de consulta
{packages.isLoading ? <p role="status">Carregando pacotes...</p> : null}
{packages.isError ? <p role="alert">Não foi possível carregar os pacotes.</p> : null}
{packages.data?.length === 0 ? <p>Nenhum pacote cadastrado.</p> : null}

// em cada cartão da lista
<Button
  className="mt-3"
  variant="outline"
  onClick={() => changeStatus({ id: item.id, active: !item.active })}
>
  {item.active ? 'Desativar' : 'Ativar'}
</Button>
```

O retorno antecipado é uma mensagem de interface para usuários autenticados não
administradores. Caso a sessão ainda esteja carregando, a página não realiza
esse retorno; a API continua protegida. A listagem possui marcadores ARIA para
carga e erro. O botão de situação inverte o valor corrente e delega o `PATCH`
para RTK Query. Nesta versão ele não possui `try/catch` próprio nem estado de
carregamento por cartão; por isso um erro dessa mutation ainda não gera mensagem
específica na página.

### 10.9 Integração entre frontend e API: contrato prático

Exemplo representativo de criação enviado pelo frontend (ids meramente
ilustrativos):

```json
{
  "name": "Fisioterapia 10 sessões",
  "description": "Atendimento duas vezes por semana",
  "unitId": "11111111-1111-1111-1111-111111111111",
  "serviceId": "22222222-2222-2222-2222-222222222222",
  "totalSessions": 10,
  "totalPrice": "400.00",
  "weekDays": ["MONDAY", "WEDNESDAY"],
  "active": true
}
```

No Java, o Jackson recebe `totalPrice` como `BigDecimal`, o serviço normaliza-o
para duas casas e a resposta devolve o preço como texto. Uma resposta típica
contém, além desses campos, `id`, nomes de unidade/serviço, `weeklyFrequency`,
autor e datas de auditoria. O frontend usa `weeklyFrequency` retornada para
mostrar, por exemplo, “2 por semana”; ele não tenta recalculá-la usando outro
critério.

### 10.10 Leitura de manutenção: limites intencionais do código atual

Para evitar interpretações incorretas de código preparado, estes pontos merecem
atenção durante manutenção:

1. `ServicePackageUsageService` retornar `false` não significa que a regra de
   imutabilidade foi descartada; significa que ainda não existe a tabela/relação
   de agendamento por pacote. Alterar esse retorno para uma consulta real é
   trabalho obrigatório da SPEC 02.
2. A presença de `PATCH /api/service-packages/{id}` não significa que a edição
   já foi disponibilizada no frontend. Hoje a tela só cria e muda situação.
3. A página renderiza a lista sem passar parâmetros; os filtros de API existem,
   mas a interface para operá-los ainda não foi criada.
4. O item Serviços é link direto. Não existe estado, componente ou acessibilidade
   de submenu expansível ainda.
5. O botão Agendamento de Pacotes não inicia o fluxo de contratação e não deve
   ser conectado a uma rota provisória que crie agenda parcial. A única ação
   autorizada no código atual é a notificação informativa.
6. Horários, disponibilidade de unidade, feriados, bloqueios e profissional não
   aparecem no schema, DTO, formulário ou endpoint por decisão de escopo, não
   por omissão acidental.
7. O documento descreve código local não commitado. Antes de revisão, merge ou
   deploy, é necessário concluir os testes e registrar evidências nas tarefas
   OpenSpec, como indicado na seção 8.

---

# 11. Versão definitiva da branch `feat/criar-agendamento-com-pacote`

As seções anteriores registram a evolução inicial da branch
`feat/agendamento-smart-customizado`. Esta seção é a referência final para o
estado atual de `feat/criar-agendamento-com-pacote`. Ela descreve exatamente o
que foi alterado depois do commit-base `3702ef0` e usa o formato solicitado:
**onde era assim, agora é assim**, seguido do código e da finalidade.

## 11.1 Estado de referência e escopo

Antes desta atualização, a branch já possuía o cadastro inicial de pacotes
(commit funcional `d4cf285`): migration, controller, serviço de domínio, rota,
formulário básico e botão informativo. A versão atual aperfeiçoa o cadastro
administrativo para suportar a operação completa prevista na SPEC 01:

- consultar e filtrar pacotes por nome, unidade, serviço, situação e sessões;
- abrir um pacote existente para edição;
- validar os campos no frontend com Zod;
- preservar os dados digitados quando a API rejeitar a mutation;
- ativar e desativar sem exclusão física;
- manter a frequência semanal derivada dos dias, sem campo independente;
- exibir Serviços → Pacotes como submenu navegável;
- documentar API, modelo, repositório, serviço, controller, DTOs e migration;
- verificar a integração real com PostgreSQL descartável.

Ficam deliberadamente fora desta branch: contratação por paciente, data inicial,
seleção de horários, profissional, feriados, bloqueios, geração de séries e
ocorrências. Esses itens pertencem à SPEC 02 ou a futuras especificações de
calendário.

## 11.2 Passo 1 — Organização OpenSpec

### Onde era assim

Existia apenas a intenção de cadastrar pacotes, sem um contrato formal que
separasse a configuração administrativa do agendamento automático.

### Agora é assim

Foram mantidas as changes OpenSpec coordenadas:

```text
Frontend:
openspec/changes/gerenciar-pacotes-flexiveis/
├── proposal.md
├── design.md
├── tasks.md
└── specs/
    ├── application-shell-baseline/spec.md
    └── service-package-management/spec.md

API:
openspec/changes/gerenciar-pacotes-flexiveis/
├── proposal.md
├── design.md
├── tasks.md
└── specs/service-package-management/spec.md
```

O contrato da API foi validado com:

```bash
openspec validate gerenciar-pacotes-flexiveis --strict
```

Resultado: change válida nos dois repositórios. A API concluiu 9/9 tarefas. O
frontend concluiu 19/20; resta somente a revisão visual manual em viewport
estreito, pois o ambiente desta execução não disponibilizou navegador.

## 11.3 Passo 2 — Migration e integridade do banco

### Onde era assim

Não existiam tabelas para definir pacotes, seus dias, preço ou auditoria. O
agendamento manual não podia distinguir uma configuração comercial de uma
ocorrência individual.

### Agora é assim

`V012__create_service_packages.sql` cria duas estruturas:

```sql
CREATE TABLE SERVICE_PACKAGE (
    id UUID NOT NULL,
    clinic_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    unit_id UUID NOT NULL,
    service_id UUID NOT NULL,
    created_by UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(2000),
    total_sessions INT NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP(6) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT pk_service_package PRIMARY KEY (id),
    CONSTRAINT uk_service_package_clinic_id UNIQUE (clinic_id, id),
    CONSTRAINT fk_service_package_clinic
      FOREIGN KEY (clinic_id) REFERENCES CLINIC (id),
    CONSTRAINT fk_service_package_unit_tenant
      FOREIGN KEY (clinic_id, unit_id)
      REFERENCES CLINIC_UNIT (clinic_id, id),
    CONSTRAINT fk_service_package_service_tenant
      FOREIGN KEY (clinic_id, service_id)
      REFERENCES SERVICE_OFFERING (clinic_id, id),
    CONSTRAINT fk_service_package_created_by_tenant
      FOREIGN KEY (clinic_id, created_by)
      REFERENCES USERS (clinic_id, id),
    CONSTRAINT chk_service_package_sessions CHECK (total_sessions > 0),
    CONSTRAINT chk_service_package_price CHECK (total_price >= 0)
);

CREATE TABLE SERVICE_PACKAGE_WEEK_DAY (
    service_package_id UUID NOT NULL,
    week_day VARCHAR(16) NOT NULL,
    CONSTRAINT pk_service_package_week_day
      PRIMARY KEY (service_package_id, week_day),
    CONSTRAINT fk_service_package_week_day_package
      FOREIGN KEY (service_package_id)
      REFERENCES SERVICE_PACKAGE (id),
    CONSTRAINT chk_service_package_week_day CHECK (
      week_day IN (
        'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY',
        'FRIDAY', 'SATURDAY', 'SUNDAY'
      )
    )
);

CREATE INDEX idx_service_package_clinic_unit
    ON SERVICE_PACKAGE (clinic_id, unit_id);
CREATE INDEX idx_service_package_clinic_service
    ON SERVICE_PACKAGE (clinic_id, service_id);
CREATE INDEX idx_service_package_clinic_active
    ON SERVICE_PACKAGE (clinic_id, active);
```

### Funcionalidade resultante

1. `DECIMAL(10,2)` preserva o valor monetário sem `float`.
2. As FKs compostas impedem uma unidade ou serviço de outra clínica.
3. Os `CHECK` rejeitam zero sessões, sessões negativas e preço negativo mesmo
   que a chamada não venha do frontend.
4. A chave `(service_package_id, week_day)` impede o mesmo dia duas vezes.
5. `active` permite desativação sem apagar histórico.
6. `version`, `created_at` e `updated_at` permitem auditoria e controle de
   atualização.

A classe `ServicePackageControllerIntegrationTest` confirmou a migration em
PostgreSQL 18 descartável. O teste também tentou inserir diretamente um dia já
existente e recebeu `DataIntegrityViolationException`, comprovando a restrição
física do banco.

## 11.4 Passo 3 — Entidades, DTOs e repositório da API

### Onde era assim

O catálogo tinha serviço e unidade, mas não havia uma entidade de pacote nem um
contrato que retornasse frequência semanal.

### Agora é assim

Arquivos adicionados:

```text
src/main/java/com/agendamento/smart/model/servicepackage/
├── PackageWeekDay.java
└── ServicePackageDefinition.java

src/main/java/com/agendamento/smart/dtos/servicepackage/
├── ServicePackageRequest.java
├── ServicePackageStatusRequest.java
└── ServicePackageResponse.java

src/main/java/com/agendamento/smart/repository/
└── ServicePackageRepository.java
```

Enum dos dias:

```java
public enum PackageWeekDay {
    MONDAY, TUESDAY, WEDNESDAY, THURSDAY,
    FRIDAY, SATURDAY, SUNDAY
}
```

Contrato recebido pela API:

```java
public record ServicePackageRequest(
        @NotBlank String name,
        String description,
        @NotNull UUID unitId,
        @NotNull UUID serviceId,
        @NotNull @Positive Integer totalSessions,
        @NotNull @DecimalMin(value = "0.00") BigDecimal totalPrice,
        @NotEmpty List<PackageWeekDay> weekDays,
        @NotNull Boolean active) {}
```

O contrato não recebe `weeklyFrequency`: ela é sempre `weekDays.size()`.

Mapeamento JPA principal:

```java
@Entity
@Table(name = "SERVICE_PACKAGE")
public class ServicePackageDefinition {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "clinic_id")
    private Clinic clinic;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "unit_id")
    private ClinicUnit unit;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "service_id")
    private ServiceOffering service;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
        name = "SERVICE_PACKAGE_WEEK_DAY",
        joinColumns = @JoinColumn(name = "service_package_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "week_day", nullable = false)
    private Set<PackageWeekDay> weekDays = new LinkedHashSet<>();
}
```

Consulta escopada:

```java
public interface ServicePackageRepository
        extends JpaRepository<ServicePackageDefinition, UUID> {
    List<ServicePackageDefinition> findAllByClinicIdOrderByNameAsc(UUID clinicId);

    Optional<ServicePackageDefinition> findByIdAndClinicId(
            UUID id, UUID clinicId);
}
```

O repositório não oferece `delete`, preservando a decisão de ativar/desativar.

## 11.5 Passo 4 — Serviço de domínio e regras de negócio

### Onde era assim

As operações de pacote eram apenas uma camada inicial de cadastro. Não havia
edição, filtro, detalhe, validação de uso ou normalização completa.

### Agora é assim

`ServicePackageService` concentra criação, consulta, detalhe, edição e situação:

```java
@Transactional
public ServicePackageResponse create(
        User user, ServicePackageRequest request) {
    requireAdmin(user);
    ServicePackageDefinition definition = new ServicePackageDefinition();
    definition.setClinic(user.getClinic());
    definition.setCreatedBy(user);
    apply(definition, user, request);
    return toResponse(packageRepository.saveAndFlush(definition));
}

@Transactional(readOnly = true)
public List<ServicePackageResponse> findAll(
        User user, UUID unitId, UUID serviceId, Boolean active,
        Integer totalSessions, String name) {
    requireAdmin(user);
    Stream<ServicePackageDefinition> packages = packageRepository
        .findAllByClinicIdOrderByNameAsc(user.getClinic().getId())
        .stream();

    if (unitId != null)
        packages = packages.filter(item -> item.getUnit().getId().equals(unitId));
    if (serviceId != null)
        packages = packages.filter(item -> item.getService().getId().equals(serviceId));
    if (active != null)
        packages = packages.filter(item -> item.isActive() == active);
    if (totalSessions != null)
        packages = packages.filter(item ->
            item.getTotalSessions().equals(totalSessions));
    if (name != null && !name.isBlank()) {
        String normalized = name.trim().toLowerCase();
        packages = packages.filter(item ->
            item.getName().toLowerCase().contains(normalized));
    }
    return packages.map(this::toResponse).toList();
}
```

Aplicação e validação do payload:

```java
private void apply(
        ServicePackageDefinition definition,
        User user,
        ServicePackageRequest request) {
    LinkedHashSet<PackageWeekDay> days =
        new LinkedHashSet<>(request.weekDays());

    if (days.size() != request.weekDays().size()) {
        throw new DomainException(
            "PACKAGE_VALIDATION_ERROR",
            "Os dias da semana não podem se repetir.",
            HttpStatus.BAD_REQUEST);
    }

    UUID clinicId = user.getClinic().getId();
    ClinicUnit unit = unitRepository
        .findByIdAndClinicId(request.unitId(), clinicId)
        .orElseThrow(this::packageNotFound);
    ServiceOffering service = serviceRepository
        .findByIdAndClinicId(request.serviceId(), clinicId)
        .orElseThrow(this::packageNotFound);

    definition.setTenantId(unit.getTenantId());
    definition.setUnit(unit);
    definition.setService(service);
    definition.setName(request.name().trim());
    definition.setDescription(normalizeDescription(request.description()));
    definition.setTotalSessions(request.totalSessions());
    definition.setTotalPrice(
        request.totalPrice().setScale(2, RoundingMode.HALF_UP));
    definition.setWeekDays(days);
    definition.setActive(request.active());
}
```

Imutabilidade preparada para a SPEC 02:

```java
private void requireMutable(ServicePackageDefinition definition) {
    if (usageService.hasPackageAppointments(definition.getId())) {
        throw new DomainException(
            "PACKAGE_IMMUTABLE",
            "O pacote possui agendamentos vinculados e não pode ser alterado.",
            HttpStatus.CONFLICT);
    }
}
```

`ServicePackageUsageService` ainda retorna `false`, pois a relação pacote–
agendamento será criada somente na SPEC 02. O teste unitário
`ServicePackageServiceTest` simula essa relação como existente e confirma que
`PATCH` de situação lança `PACKAGE_IMMUTABLE` sem chamar `saveAndFlush`.

Resposta e frequência:

```java
private ServicePackageResponse toResponse(
        ServicePackageDefinition definition) {
    List<PackageWeekDay> days = definition.getWeekDays()
        .stream()
        .sorted()
        .toList();

    return new ServicePackageResponse(
        definition.getId(),
        definition.getUnit().getId(),
        definition.getUnit().getName(),
        definition.getService().getId(),
        definition.getService().getName(),
        definition.getName(),
        definition.getDescription(),
        definition.getTotalSessions(),
        definition.getTotalPrice()
            .setScale(2, RoundingMode.HALF_UP)
            .toPlainString(),
        days,
        days.size(),
        definition.isActive(),
        definition.getCreatedBy().getId(),
        definition.getCreatedAt(),
        definition.getUpdatedAt());
}
```

## 11.6 Passo 5 — Controller HTTP

### Onde era assim

Não existia uma API administrativa completa para detalhe, edição e mudança de
situação de pacotes.

### Agora é assim

```java
@RestController
@RequestMapping("/api/service-packages")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ServicePackageController {
    private final ServicePackageService service;

    @PostMapping
    public ResponseEntity<ServicePackageResponse> create(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ServicePackageRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(service.create(user, request));
    }

    @GetMapping
    public CatalogResponse<ServicePackageResponse> findAll(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) UUID unitId,
            @RequestParam(required = false) UUID serviceId,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) Integer totalSessions,
            @RequestParam(required = false) String name) {
        return new CatalogResponse<>(service.findAll(
            user, unitId, serviceId, active, totalSessions, name));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ServicePackageResponse> findById(
            @AuthenticationPrincipal User user, @PathVariable UUID id) {
        return ResponseEntity.ok(service.findById(user, id));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ServicePackageResponse> update(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @Valid @RequestBody ServicePackageRequest request) {
        return ResponseEntity.ok(service.update(user, id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ServicePackageResponse> updateStatus(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @Valid @RequestBody ServicePackageStatusRequest request) {
        return ResponseEntity.ok(
            service.updateStatus(user, id, request.active()));
    }
}
```

### Contrato disponível

| Método | Rota | Resultado |
| --- | --- | --- |
| `POST` | `/api/service-packages` | Cria e retorna `201` |
| `GET` | `/api/service-packages` | Lista com filtros e envelope `content` |
| `GET` | `/api/service-packages/{id}` | Detalha dentro da clínica autorizada |
| `PATCH` | `/api/service-packages/{id}` | Edita antes do primeiro uso |
| `PATCH` | `/api/service-packages/{id}/status` | Ativa/desativa sem remover |
| `DELETE` | — | Não existe por decisão de negócio |

O controller exige `ROLE_ADMIN`; o serviço repete a verificação para evitar que
uma chamada interna contorne a regra. A clínica nunca vem de um campo enviado
pelo navegador: é derivada de `@AuthenticationPrincipal`.

## 11.7 Passo 6 — API RTK Query no frontend

### Onde era assim

O adaptador inicial só listava, criava e alterava situação. Não havia consulta
de detalhe, edição, filtros tipados ou invalidação por id.

### Agora é assim

Tipos e filtros atuais:

```ts
export interface ServicePackageFilters {
  unitId?: string
  serviceId?: string
  active?: boolean
  totalSessions?: number
  name?: string
}

export interface ServicePackageInput {
  name: string
  description?: string
  unitId: string
  serviceId: string
  totalSessions: number
  totalPrice: string
  weekDays: PackageWeekDay[]
  active: boolean
}
```

Endpoints atuais:

```ts
getServicePackages: builder.query<
  ServicePackage[], ServicePackageFilters | void
>({
  query: (params) => ({ url: '/api/service-packages', params }),
  transformResponse: contentOf,
  providesTags: ['ServicePackage'],
})

getServicePackage: builder.query<ServicePackage, string>({
  query: (id) => ({ url: `/api/service-packages/${id}` }),
  providesTags: (_result, _error, id) => [
    { type: 'ServicePackage', id },
  ],
})

updateServicePackage: builder.mutation<
  ServicePackage, { id: string; data: ServicePackageInput }
>({
  query: ({ id, data }) => ({
    url: `/api/service-packages/${id}`,
    method: 'PATCH',
    data,
  }),
  invalidatesTags: (_result, _error, { id }) => [
    'ServicePackage',
    { type: 'ServicePackage', id },
  ],
})
```

O cache invalida tanto a lista quanto o detalhe por id. `contentOf` aceita a
resposta atual `{ content: [...] }` e também array direto, reduzindo o acoplamento
da interface ao wrapper de catálogo.

## 11.8 Passo 7 — Schema Zod e transformação do formulário

### Onde era assim

A validação do formulário era feita manualmente dentro de `submit`, sem
mensagens por campo, sem validação de decimal e sem proteção contra duplicidade
caso outro componente montasse o payload.

### Agora é assim

`src/features/packages/model/package-form-schema.ts` centraliza a regra:

```ts
const pricePattern = /^(?:0|[1-9]\d*)(?:\.\d{2})$/

export const packageWeekDays = [
  'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY',
  'THURSDAY', 'FRIDAY', 'SATURDAY',
] as const satisfies readonly PackageWeekDay[]

export const packageFormSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome do pacote.'),
  description: z.string(),
  unitId: z.string().trim().min(1, 'Selecione uma unidade.'),
  serviceId: z.string().trim().min(1, 'Selecione um serviço.'),
  totalSessions: z.coerce.number()
    .int('Informe um número inteiro.')
    .min(1, 'Informe ao menos uma sessão.'),
  totalPrice: z.string()
    .regex(pricePattern, 'Informe o valor no formato 0.00.'),
  weekDays: z.array(z.enum(packageWeekDays))
    .min(1, 'Selecione ao menos um dia.')
    .refine(
      (days) => new Set(days).size === days.length,
      'Os dias da semana não podem se repetir.',
    ),
})
```

Conversão para o contrato HTTP:

```ts
export function toServicePackageInput(
  value: PackageFormValues,
  active: boolean,
): ServicePackageInput {
  const parsed = packageFormSchema.parse(value)
  return {
    ...parsed,
    description: parsed.description.trim() || undefined,
    active,
  }
}
```

Assim, a tela mantém sessões como texto para o `<input>`, mas envia número para
a API; mantém preço como string decimal para não perder precisão; e remove
descrição vazia antes de enviar.

## 11.9 Passo 8 — Página atual: filtros, detalhe e edição

### Onde era assim

A página apenas criava novos pacotes e listava todos os registros. Não tinha
filtros, carregamento de detalhe, edição, botão de cancelar edição nem mensagens
de validação por campo.

### Agora é assim

Consultas e estados principais:

```tsx
const sessionQuery = useGetAppointmentSessionQuery()
const units = useGetUnitsQuery()
const services = useGetServicesQuery()
const isAdmin = sessionQuery.data?.user.role === 'ADMIN'

const [filters, setFilters] = useState<ServicePackageFilters>({})
const [filterDraft, setFilterDraft] =
  useState<ServicePackageFilters>({})

const packages = useGetServicePackagesQuery(filters, {
  skip: sessionQuery.isLoading || !isAdmin,
})

const [editingId, setEditingId] = useState<string | null>(null)
const detailQuery = useGetServicePackageQuery(editingId ?? '', {
  skip: !editingId,
})
```

O `skip` impede que usuário básico ou sessão ainda não resolvida consulte a
coleção administrativa. Ao clicar em **Editar**, `editingId` habilita o detalhe;
quando `detailQuery.data` chega, `formFromPackage` popula o formulário e troca o
título para **Editar pacote**.

Filtros disponíveis na tela:

```tsx
<Input
  value={filterDraft.name ?? ''}
  onChange={(event) => setFilterDraft({
    ...filterDraft,
    name: event.target.value || undefined,
  })}
/>

<select
  value={filterDraft.active === undefined
    ? '' : String(filterDraft.active)}
  onChange={(event) => setFilterDraft({
    ...filterDraft,
    active: event.target.value === ''
      ? undefined
      : event.target.value === 'true',
  })}
>
  <option value="">Todas</option>
  <option value="true">Ativos</option>
  <option value="false">Inativos</option>
</select>
```

Há filtros equivalentes para unidade, serviço e total de sessões. **Filtrar**
move `filterDraft` para `filters`; **Limpar filtros** restaura ambos para `{}`.

Submissão atual:

```tsx
const parsed = packageFormSchema.safeParse(form)

if (!parsed.success) {
  const errors = parsed.error.flatten().fieldErrors
  setFieldErrors(Object.fromEntries(
    Object.entries(errors).map(([field, messages]) => [
      field,
      messages?.[0] ?? 'Revise este campo.',
    ]),
  ))
  return
}

try {
  const active = detailQuery.data?.active ?? true
  const data = toServicePackageInput(parsed.data, active)

  if (editingId) {
    await updatePackage({ id: editingId, data }).unwrap()
    toast.success('Pacote atualizado com sucesso.')
  } else {
    await createPackage(data).unwrap()
    toast.success('Pacote criado com sucesso.')
  }
  resetForm()
} catch (error) {
  toast.error(messageFrom(error))
}
```

Diferenças importantes em relação à primeira versão:

1. `safeParse` não lança exceção; transforma erros em `fieldErrors` exibidos
   abaixo de cada campo.
2. O modo edição preserva a situação atual do pacote e envia `PATCH`.
3. O modo criação envia `active: true`.
4. O `catch` exibe a mensagem da API quando disponível e não limpa os campos,
   permitindo correção/reenvio.
5. O reset só ocorre depois de uma resposta bem-sucedida.

## 11.10 Passo 9 — Situação, histórico e ausência de exclusão

### Onde era assim

A primeira versão tinha apenas uma chamada simples de situação, sem estado de
carregamento compartilhado nem tratamento visual de erro.

### Agora é assim

```tsx
async function toggleStatus(item: ServicePackage) {
  try {
    await changeStatus({
      id: item.id,
      active: !item.active,
    }).unwrap()
    toast.success(item.active
      ? 'Pacote desativado.'
      : 'Pacote ativado.')
  } catch (error) {
    toast.error(messageFrom(error))
  }
}
```

O cartão apresenta **Ativo** ou **Inativo** e alterna o texto do botão entre
**Desativar** e **Ativar**. A mutation invalida a lista, mantendo pacotes
inativos consultáveis no histórico administrativo. Não existe botão **Excluir**
nem endpoint `DELETE`.

Se a SPEC 02 conectar um pacote a agendamentos, a API recusará essa mutation
com `PACKAGE_IMMUTABLE`. A interface já possui o tratamento genérico para o
retorno; a decisão definitiva continua no backend.

## 11.11 Passo 10 — Navegação lateral: antes e depois

### Onde era assim

Serviços era um item indisponível:

```tsx
{
  label: 'Serviços',
  icon: CircleHelp,
  availability: 'unavailable',
}
```

### Agora é assim

Serviços possui submenu com rota real:

```tsx
{
  label: 'Serviços',
  icon: CircleHelp,
  children: [
    { label: 'Pacotes', to: '/services/packages' },
  ],
}
```

O renderer identifica `children`, desenha o cabeçalho de Serviços e cria um
`NavLink` filho. Quando a sidebar está recolhida, o item filho exibe `P`, mantém
`aria-label="Serviços: Pacotes"` e preserva foco e tooltip. Quando está em modo
compacto, `onNavigate` fecha o painel após a navegação.

Relatórios e Financeiro continuam assim:

```tsx
{
  label: 'Relatórios',
  icon: ChartNoAxesCombined,
  availability: 'unavailable',
}
```

Portanto, não foram transformados em rotas fictícias.

## 11.12 Passo 11 — Botão temporário do topbar

### Onde era assim

```tsx
{session ? (
  <div className="hidden sm:block">
    <CreateAppointmentDialog
      session={session}
      defaultDate={dateValue}
      triggerLabel="Agendar"
      triggerAriaLabel="Novo agendamento"
    />
  </div>
) : null}
```

### Agora é assim

```tsx
{session ? (
  <div className="hidden items-center gap-2 sm:flex">
    <CreateAppointmentDialog
      session={session}
      defaultDate={dateValue}
      triggerLabel="Agendar"
      triggerAriaLabel="Novo agendamento"
    />
    <Button
      type="button"
      variant="outline"
      onClick={() => toast.info(
        'Agendamento de Pacotes estará disponível após a SPEC 02.',
      )}
    >
      Agendamento de Pacotes
    </Button>
  </div>
) : null}
```

O que permaneceu igual: o botão **Agendar**, o diálogo manual, os campos do
agendamento manual e a chamada `/api/appointments`. O que foi adicionado: um
botão visualmente irmão, com espaçamento `gap-2`, que só dispara uma notificação
informativa. Ele não navega, não chama HTTP, não altera paciente, não cria
agendamento e não remove o botão manual.

## 11.13 Passo 12 — Testes adicionados

### Frontend

Arquivos novos/alterados:

```text
src/features/packages/model/package-form-schema.test.ts
src/features/packages/pages/packages-page.test.tsx
src/components/__tests__/app-topbar.test.tsx
src/components/__tests__/app-sidebar.test.tsx
```

Os 24 cenários focalizados validam:

- payload decimal e conversão de sessões;
- configuração com um e sete dias;
- dias vazios e repetidos;
- sessões inválidas e preço fora do padrão `0.00`;
- carregamento da página, lista, filtros e envelope `content`;
- mensagens de validação antes da criação;
- bloqueio da página para papel `BASIC`;
- ativação/desativação mantendo o cartão no histórico;
- submenu Pacotes em sidebar desktop/compacta;
- botão temporário do topbar sem abrir o diálogo manual.

Exemplo do teste de filtro:

```tsx
server.use(
  http.get('http://localhost:8080/api/service-packages', ({ request }) => {
    queries.push(new URL(request.url).searchParams)
    return HttpResponse.json({ content: [servicePackage] })
  }),
)

await user.type(
  screen.getAllByRole('textbox', { name: 'Nome' })[0],
  'fisioterapia',
)
await user.click(screen.getByRole('button', { name: 'Filtrar' }))

await waitFor(() =>
  expect(queries.at(-1)?.get('name')).toBe('fisioterapia'),
)
```

### API

```text
src/test/java/com/agendamento/smart/controller/servicepackage/
└── ServicePackageControllerIntegrationTest.java

src/test/java/com/agendamento/smart/service/
└── ServicePackageServiceTest.java
```

Os testes da API confirmam criação, filtros, preço, frequência, edição,
ativação, dias duplicados, usuário básico, isolamento entre duas clínicas,
constraint física no PostgreSQL e imutabilidade simulada após vínculo de uso.

## 11.14 Passo 13 — Documentação modular adicionada

Foram adicionados ou atualizados READMEs para que a implementação não fique
dependente somente deste documento:

```text
API:
src/main/java/com/agendamento/smart/model/servicepackage/README.md
src/main/java/com/agendamento/smart/dtos/servicepackage/README.md
src/main/java/com/agendamento/smart/controller/servicepackage/README.md
src/main/java/com/agendamento/smart/repository/README.md
src/main/java/com/agendamento/smart/service/README.md
src/main/resources/db/migration/README.md

Frontend:
src/features/packages/README.md
src/features/appointments/README.md
src/components/AppSidebar/README.md
```

Esses arquivos registram endpoints, responsabilidade de cada camada, situação
da SPEC 02, ausência de exclusão e a fonte de verdade do isolamento.

## 11.15 Passo 14 — Verificações executadas

### Frontend

```bash
npm run lint
npm test -- --run \
  src/features/packages/pages/packages-page.test.tsx \
  src/features/packages/model/package-form-schema.test.ts \
  src/components/__tests__/app-topbar.test.tsx \
  src/components/__tests__/app-sidebar.test.tsx
npm run build
```

Resultados:

- lint: aprovado;
- testes focalizados: 24 aprovados;
- build: a checagem TypeScript encontra somente três erros preexistentes nas
  fixtures legadas de `CardDay` e `legacy-calendar-components.test.tsx`, que
  não pertencem a esta branch nem foram alteradas;
- não foi detectado erro de tipo nos arquivos da feature `packages`.

### API

```bash
./mvnw clean verify
```

Resultado: aprovado com PostgreSQL 18 via Testcontainers, migration V012
aplicada e testes de integração/unitários concluídos sem falhas. Permanece
apenas o warning preexistente do MapStruct sobre `UserMapper.clinicUnit`.

### OpenSpec

```bash
openspec validate gerenciar-pacotes-flexiveis --strict
```

Resultado: change válida no frontend e na API.

## 11.16 Resumo final “antes → agora”

| Área | Antes | Agora |
| --- | --- | --- |
| Persistência | Nenhum pacote persistido | `SERVICE_PACKAGE` + `SERVICE_PACKAGE_WEEK_DAY` |
| Frequência | Não existia | Derivada de `weekDays.size()` |
| API | Cadastro/listagem inicial | CRUD administrativo sem `DELETE`, filtros e status |
| Segurança | Regra não consolidada | `ADMIN` + clínica derivada da sessão + FKs compostas |
| Frontend | Formulário básico | Filtros, detalhe, edição, Zod, erros por campo e status |
| Menu | Serviços indisponível | Serviços → Pacotes navegável |
| Topbar | Somente Agendar | Agendar preservado + Agendamento de Pacotes informativo |
| Testes | Sem cobertura específica | 24 testes frontend + suíte API com PostgreSQL |
| Documentação | Documento histórico inicial | Documento atualizado + READMEs modulares |
| Automação | Não existia | Continua reservada para SPEC 02 |

## 11.17 Limites que não devem ser confundidos com bugs

1. Pacote ainda não contrata paciente.
2. Pacote ainda não recebe data inicial nem horário.
3. Pacote não indica profissional.
4. A API ainda não consulta vínculo real de agendamento, porque a entidade da
   SPEC 02 ainda não existe; a proteção está preparada e testada por mock.
5. Feriados, funcionamento da unidade e bloqueios não fazem parte da SPEC 01.
6. Pacotes inativos permanecem consultáveis administrativamente, mas a seleção
   para contratação futura será responsabilidade da SPEC 02.
7. A ação “Agendamento de Pacotes” não deve ser transformada em fluxo parcial:
   sua implementação definitiva depende da contratação e geração automática
   especificadas na change `agendamento-automatico-por-pacotes`.

---

# 12. Atualização da branch `feat/criar-agendamento-com-pacote`

As seções anteriores preservam o histórico da SPEC 01. Esta seção registra o
estado implementado posteriormente na branch, no formato “onde era assim → agora
é assim”, incluindo frontend, API, banco, contratos e verificações.

## 12.1 Resultado funcional

O botão `Agendamento de Pacotes`, que antes somente mostrava uma mensagem, agora
abre um fluxo de contratação. O usuário seleciona paciente e pacote, informa
data inicial e horário, ajusta os dias da semana, gera uma prévia e confirma a
criação dos agendamentos individuais.

Nesta versão, a data inicial e os dias efetivos são suficientes para calcular as
sessões. Feriados, funcionamento da unidade e bloqueios de calendário não
bloqueiam a confirmação e foram registrados para uma próxima SPEC.

## 12.2 Topbar: antes e depois

### Onde era assim

```tsx
<Button
  type="button"
  variant="outline"
  onClick={() =>
    toast.info(
      'Agendamento de Pacotes estará disponível após a SPEC 02.',
    )
  }
>
  Agendamento de Pacotes
</Button>
```

O botão não abria tela, não consultava a API e não alterava o estado da agenda.

### Agora é assim

```tsx
<CreateAppointmentDialog
  session={session}
  defaultDate={dateValue}
  triggerLabel="Agendar"
  triggerAriaLabel="Novo agendamento"
/>

<PackageAppointmentDialog
  session={session}
  defaultDate={dateValue}
/>
```

O botão manual continua usando `CreateAppointmentDialog`. O botão novo usa
`PackageAppointmentDialog`, mantendo os dois fluxos separados.

Arquivo alterado:

```text
src/components/AppTopbar/index.tsx
```

Importação acrescentada:

```tsx
import { PackageAppointmentDialog } from
  '@/features/packages/components/package-appointment-dialog'
```

`defaultDate={dateValue}` reutiliza a mesma data atualmente exibida no cabeçalho
da agenda.

## 12.3 Novo diálogo de contratação

Arquivo:

```text
src/features/packages/components/package-appointment-dialog.tsx
```

### Estado do formulário

```tsx
const [open, setOpen] = useState(false)
const [patientId, setPatientId] = useState('')
const [packageId, setPackageId] = useState('')
const [startDate, setStartDate] = useState(defaultDate ?? '')
const [time, setTime] = useState('')
const [professionalId, setProfessionalId] = useState('')
const [effectiveWeekDays, setEffectiveWeekDays] =
  useState<PackageWeekDay[]>([])
```

| Campo | Função |
| --- | --- |
| `patientId` | Paciente que receberá as sessões. |
| `packageId` | Pacote administrativo selecionado. |
| `startDate` | Data mínima para procurar a primeira sessão. |
| `time` | Horário manual aplicado às sessões. |
| `professionalId` | Profissional opcional da contratação. |
| `effectiveWeekDays` | Dias usados somente no contrato atual. |

### Catálogos

```tsx
const patients = useGetPatientsQuery(undefined, { skip: !open })
const packages = useGetServicePackagesQuery(
  { active: true },
  { skip: !open },
)
const professionals = useGetProfessionalsQuery(
  selectedPackage?.serviceId ?? '',
  { skip: !open || !selectedPackage },
)
```

Os pacotes ativos são filtrados visualmente para BASIC:

```tsx
const availablePackages = packages.data?.filter(
  (item) =>
    session.user.role === 'ADMIN' ||
    item.unitId === session.activeUnitId,
) ?? []
```

O filtro não substitui a autorização do backend.

### Dias pré-preenchidos e editáveis

```tsx
function choosePackage(id: string) {
  const item = availablePackages.find((value) => value.id === id)
  setPackageId(id)
  setEffectiveWeekDays(item?.weekDays ?? [])
}
```

Antes, os dias só podiam ser definidos pelo administrador. Agora são uma
configuração padrão que pode ser ajustada durante a contratação sem executar
`PATCH /api/service-packages`.

### Prévia

```tsx
async function simulate() {
  if (
    !packageId ||
    !patientId ||
    !startDate ||
    !time ||
    effectiveWeekDays.length === 0
  ) return

  await preview({
    packageId,
    patientId,
    startDate,
    time,
    professionalId: professionalId || null,
    effectiveWeekDays,
  }).unwrap()
}
```

A prévia mostra quantidade, primeira data, última data e cada sessão. Ela não
cria reserva nem reduz capacidade.

### Confirmação

```tsx
await confirm({
  data: {
    packageId,
    patientId,
    startDate,
    time,
    professionalId: professionalId || null,
    effectiveWeekDays,
  },
  fingerprint: previewState.data.fingerprint,
}).unwrap()
```

Após sucesso, o diálogo fecha, uma mensagem é apresentada e a tag de appointments
é invalidada para atualizar a agenda.

## 12.4 Adaptador RTK Query

Arquivo novo:

```text
src/features/packages/api/package-appointments.ts
```

### Onde era assim

`packages.ts` possuía somente o CRUD administrativo:

```text
GET    /api/service-packages
GET    /api/service-packages/{id}
POST   /api/service-packages
PATCH  /api/service-packages/{id}
PATCH  /api/service-packages/{id}/status
```

### Agora é assim

```ts
export interface PackageAppointmentInput {
  packageId: string
  patientId: string
  startDate: string
  time: string
  professionalId?: string | null
  effectiveWeekDays: PackageWeekDay[]
}

previewPackageAppointment: builder.mutation({
  query: (data) => ({
    url: '/api/package-appointments/preview',
    method: 'POST',
    data,
  }),
})

confirmPackageAppointment: builder.mutation({
  query: ({ data, fingerprint }) => ({
    url: '/api/package-appointments/confirm',
    method: 'POST',
    data,
    headers: {
      'Idempotency-Key': crypto.randomUUID(),
      'X-Preview-Fingerprint': fingerprint,
    },
  }),
  invalidatesTags: [{ type: 'Appointment', id: 'LIST' }],
})
```

## 12.5 Payloads e respostas

Payload enviado:

```json
{
  "packageId": "package-uuid",
  "patientId": "patient-uuid",
  "startDate": "2026-11-16",
  "time": "14:00",
  "professionalId": null,
  "effectiveWeekDays": ["MONDAY", "WEDNESDAY"]
}
```

A resposta de prévia possui fingerprint e sessões calculadas:

```json
{
  "packageId": "package-uuid",
  "patientId": "patient-uuid",
  "unitId": "unit-uuid",
  "totalPrice": "400.00",
  "firstDate": "2026-11-16",
  "lastDate": "2026-12-16",
  "fingerprint": "sha256...",
  "sessions": [
    {
      "sequence": 1,
      "date": "2026-11-16",
      "time": "14:00",
      "startsAt": "2026-11-16T18:00:00Z"
    }
  ]
}
```

## 12.6 API: nova contratação

Change coordenada:

```text
api-agendamento-smart-api/agendamento-smart-api/
└── openspec/changes/agendamento-automatico-por-pacotes/
    ├── proposal.md
    ├── design.md
    ├── tasks.md
    └── specs/package-appointment-contracts/spec.md
```

### Onde era assim

O backend possuía somente a definição administrativa
`ServicePackageDefinition` e o método manual `AppointmentService.create`, que
criava uma sessão por requisição.

### Agora é assim

Foi criada a entidade:

```text
src/main/java/com/agendamento/smart/model/packageappointment/
PackageAppointmentContract.java
```

Ela guarda o snapshot da contratação:

```java
@Entity
@Table(name = "PACKAGE_CONTRACT")
public class PackageAppointmentContract {
    private UUID id;
    private Clinic clinic;
    private ServicePackageDefinition packageDefinition;
    private Patient patient;
    private ClinicUnit unit;
    private ServiceOffering service;
    private Integer totalSessions;
    private BigDecimal totalPrice;
    private LocalDate requestedStartDate;
    private LocalTime appointmentTime;
    private LocalDate effectiveFirstDate;
    private LocalDate effectiveLastDate;
    private String idempotencyKey;
    private Set<PackageWeekDay> effectiveWeekDays;
}
```

O modelo passou a ser:

```text
SERVICE_PACKAGE
      ↓ definição administrativa
PACKAGE_CONTRACT
      ↓ snapshot por paciente
APPOINTMENT (vários registros)
```

### Repository

Arquivo:

```text
src/main/java/com/agendamento/smart/repository/
PackageAppointmentContractRepository.java
```

Métodos:

```java
findByClinicIdAndIdempotencyKey(UUID clinicId, String idempotencyKey)
findByIdAndClinicId(UUID id, UUID clinicId)
```

O primeiro evita duplicidade da contratação. O segundo impede consulta entre
clínicas.

### Vínculo em Appointment

Antes, todos os appointments eram independentes. Agora existe vínculo opcional:

```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "package_contract_id")
private PackageAppointmentContract packageContract;
```

Agendamentos manuais continuam com valor `null`.

## 12.7 Migration V013

Arquivo novo:

```text
src/main/resources/db/migration/V013__create_package_appointment_contracts.sql
```

Criação da contratação:

```sql
CREATE TABLE PACKAGE_CONTRACT (
    id UUID NOT NULL,
    clinic_id UUID NOT NULL,
    package_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    unit_id UUID NOT NULL,
    service_id UUID NOT NULL,
    total_sessions INT NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    requested_start_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    effective_first_date DATE NOT NULL,
    effective_last_date DATE NOT NULL,
    idempotency_key VARCHAR(120) NOT NULL,
    created_by UUID NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (clinic_id, idempotency_key)
);
```

Dias efetivos:

```sql
CREATE TABLE PACKAGE_CONTRACT_WEEK_DAY (
    contract_id UUID NOT NULL,
    week_day VARCHAR(16) NOT NULL,
    PRIMARY KEY (contract_id, week_day)
);
```

Vínculo não obrigatório para dados legados:

```sql
ALTER TABLE APPOINTMENT
  ADD COLUMN package_contract_id UUID NULL;

ALTER TABLE APPOINTMENT
  ADD CONSTRAINT fk_appointment_package_contract
  FOREIGN KEY (package_contract_id)
  REFERENCES PACKAGE_CONTRACT (id);
```

## 12.8 Serviço e algoritmo da API

Arquivo:

```text
src/main/java/com/agendamento/smart/service/packageappointment/
PackageAppointmentService.java
```

### Geração de datas

Antes, não havia cálculo de lote. Agora o backend percorre o calendário somente
para encontrar os dias da semana escolhidos:

```java
LocalDate date = request.startDate();

while (result.size() < definition.getTotalSessions()) {
    if (days.contains(date.getDayOfWeek())) {
        ZonedDateTime start = ZonedDateTime.of(
            date,
            request.time(),
            zone);

        result.add(new PackageAppointmentSession(
            result.size() + 1,
            date,
            request.time(),
            start.toInstant()));
    }
    date = date.plusDays(1);
}
```

Não há substituição de dia. Se segunda e quarta foram escolhidas, terça não é
usada apenas para completar a frequência.

### Horário e regras existentes

O horário informado é reutilizado em cada `ZonedDateTime`. A confirmação chama
o mesmo `AppointmentService.create` usado no agendamento manual:

```java
appointmentService.create(
    new AppointmentRequest(
        request.patientId(),
        definition.getUnit().getId(),
        definition.getService().getId(),
        request.professionalId(),
        session.startsAt(),
        definition.getService().getDurationMinutes(),
        price),
    user,
    key + "-" + sequence);
```

Assim permanecem centralizadas as regras de unidade, paciente, serviço,
duração, preço, profissional opcional, conflitos e capacidade.

### Prévia e confirmação

```java
@Transactional(readOnly = true)
public PackageAppointmentPreviewResponse preview(
        PackageAppointmentRequest request,
        User user) {
    ServicePackageDefinition definition =
        findPackage(request.packageId(), user);
    validatePatient(request.patientId(), definition);
    return response(definition, request, sessions(definition, request));
}
```

Na confirmação, a chave é verificada antes da criação:

```java
var existing = contractRepository
    .findByClinicIdAndIdempotencyKey(clinicId, key);

if (existing.isPresent()) {
    return existingContract(existing.get());
}
```

O contrato e os appointments são criados dentro da transação do serviço.

## 12.9 Controllers e endpoints

Arquivo:

```text
src/main/java/com/agendamento/smart/controller/packageappointment/
PackageAppointmentController.java
```

Endpoints implementados:

```http
POST /api/package-appointments/preview
POST /api/package-appointments/confirm
GET  /api/package-appointments/{id}
```

O endpoint de confirmação recebe:

```http
Idempotency-Key: <chave-da-operacao>
X-Preview-Fingerprint: <fingerprint-da-previa>
```

Não houve alteração no contrato de `POST /api/appointments`.

## 12.10 Passo a passo do usuário

1. O usuário abre uma tela interna autenticada.
2. O topbar exibe `Agendar` e `Agendamento de Pacotes`.
3. Ao clicar no novo botão, o diálogo carrega catálogos.
4. O usuário seleciona paciente e pacote ativo.
5. Os dias do pacote aparecem marcados.
6. O usuário pode alterar os dias para aquela contratação.
7. O usuário informa data inicial e horário.
8. O frontend chama a prévia.
9. A API calcula exatamente a quantidade do pacote.
10. A tela lista as sessões sem reservar.
11. O usuário confirma.
12. A API grava o snapshot e os appointments.
13. A agenda é invalidada e recarregada.

## 12.11 O que ficou fora desta branch

Não foram inferidos nem implementados:

- fonte de feriados;
- calendário de funcionamento da unidade;
- bloqueios operacionais;
- reposição de sessão;
- regras financeiras de cancelamento;
- devolução ou consumo de sessões;
- alteração futura de profissional por sessão;
- integração PostgreSQL específica da migration V013;
- correção das fixtures legadas do build frontend.

Esses pontos devem ser tratados em mudanças próprias.

## 12.12 Verificações executadas

### API

```bash
./mvnw -q -DskipTests compile
openspec validate agendamento-automatico-por-pacotes --strict
```

Resultado: compilação aprovada e change válida.

### Frontend

```bash
npx vitest run src/components/__tests__/app-topbar.test.tsx \
  --passWithNoTests
```

Resultado:

```text
Test Files  1 passed
Tests       7 passed
```

O teste antigo que esperava o toast da SPEC 02 passou a verificar a abertura do
diálogo real. O build geral ainda registra erros preexistentes nas fixtures
legadas de `Appointment` e no uso de `URLSearchParams.at()` em teste antigo.

## 12.13 Comparativo final

| Área | Onde era assim | Agora é assim |
| --- | --- | --- |
| Botão | Toast “disponível após SPEC 02” | Abre contratação |
| Paciente | Não participava | Selecionado no diálogo |
| Pacote | Só cadastro administrativo | Selecionado para contratação |
| Data | Inexistente | Data mínima obrigatória |
| Horário | Inexistente | Horário manual reutilizado |
| Dias | Fixos no cadastro | Padrão editável por contratação |
| Profissional | Não indicado no pacote | Opcional na contratação |
| Prévia | Inexistente | Lista sessões sem persistência |
| Confirmação | Inexistente | Idempotente e transacional |
| Persistência | `SERVICE_PACKAGE` | `PACKAGE_CONTRACT` + `APPOINTMENT` |
| Feriados | Não modelados | Não bloqueiam nesta SPEC |
| Manual | Fluxo existente | Preservado sem alteração de contrato |
