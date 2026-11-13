# Implementação da branch `feat/agendamento-smart-customizado`

> Documento de rastreabilidade técnica criado em 13 de novembro de 2026.
>
> Este arquivo descreve o estado efetivamente implementado e presente no
> diretório de trabalho no momento da auditoria. Ele também distingue, de forma
> explícita, os pontos apenas planejados ou preparados para a SPEC 02. Não deve
> ser interpretado como confirmação de que toda a change OpenSpec foi concluída.

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
`feat/agendamento-smart-customizado` aponta para o mesmo commit de `main`
(`5f8b40b`). Assim, **não há commits próprios da branch para comparar**; o que
foi implementado está em alterações locais ainda não commitadas. Há trabalho em
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

As listas de tarefas das duas changes ainda estão sem marcação de conclusão.
Isso é intencional e correto neste estado: há código inicial funcional, mas os
testes de integração, a documentação modular, a página completa de edição e as
verificações finais exigidas pela change ainda não foram realizados.

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
