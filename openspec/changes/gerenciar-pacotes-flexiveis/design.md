# Design

## Context

See `proposal.md` and the delta specs for the behavioral contract. O checkout
atual é uma SPA React e consome uma API externa: ele já consulta serviços,
unidades e sessão para a agenda manual, mas não contém pacote, calendário de
funcionamento, feriado, bloqueio ou persistência de backend. A change
`relacionar-usuarios-unidades-clinicas` ainda está em curso e define o escopo
de unidade para usuários; esta change deve depender de sua regra de autorização
no servidor, sem reproduzi-la no cliente.

## Goals / Non-Goals

**Goals:**

- Criar uma definição administrativa de pacote, pertencente a uma unidade e
  associada a um serviço da clínica.
- Disponibilizar uma área Serviços > Pacotes e contratos de API consistentes
  para o frontend e a API irmã.
- Preservar a definição após seu primeiro uso por agendamento de pacote.
- Exibir agora a entrada temporária de agendamento por pacote sem iniciar esse
  domínio antes da SPEC 02.

**Non-Goals:**

- Criar a contratação do pacote, data/hora inicial, ocorrências ou reservas.
- Selecionar profissional, configurar horário por dia ou resolver conflitos.
- Implementar horário de funcionamento, feriados, bloqueios ou disponibilidade.
- Excluir fisicamente pacotes, alterar a agenda manual ou substituir seu botão
  “Agendar”.

## Decisions

### Persistir uma definição de pacote e seus dias em estruturas próprias

A API deve criar `service_package` para a definição e
`service_package_weekday` para os dias semanais. A primeira referência
`tenant_id`, `unit_id`, `service_id`, nome, descrição anulável,
`total_sessions`, `total_price`, `active`, autoria e auditoria. A segunda usa
uma enumeração canônica `MONDAY` a `SUNDAY` e unicidade por
`(service_package_id, week_day)`.

O preço deve usar o tipo decimal/monetário adotado pela API, com escala de duas
casas; o contrato HTTP representa o decimal sem perda de precisão. A frequência
não recebe coluna editável: é a contagem dos dias retornados. Armazená-la seria
redundante e permitiria inconsistências.

Uma única coluna JSON de dias foi descartada: dificulta unicidade, filtros e
evoluções por dia. Criar outro cadastro de serviço foi descartado, pois a
agenda já expõe o catálogo `/api/services`.

### Aplicar escopo e regras de integridade no servidor

O servidor deriva a clínica da identidade autenticada, exige papel `ADMIN` e
confirma que `unitId` pertence à clínica antes de ler ou mutar um pacote. O
serviço referenciado deve pertencer à mesma clínica. O frontend somente restringe
a experiência visual; não é fonte de autorização nem de isolamento.

As validações de nome, sessões positivas, preço não negativo e dias únicos/não
vazios são executadas antes da persistência em transação. Erros usam o envelope
comum da API e códigos de domínio, no mínimo `PACKAGE_VALIDATION_ERROR`,
`PACKAGE_FORBIDDEN`, `PACKAGE_NOT_FOUND` e `PACKAGE_IMMUTABLE`.

Aceitar `tenantId` do payload ou resolver o escopo no navegador foi descartado,
pois permitiria troca de escopo pelo cliente.

### Congelar a definição após seu primeiro agendamento de pacote

Na SPEC 02, a relação que representar o agendamento de pacote deve referenciar
`service_package`. Antes de toda atualização de pacote, o servidor verifica a
existência dessa relação; se existir, recusa também a mudança de situação. Não
há versionamento automático nesta change, porque a regra de produto escolhida é
imutabilidade, e não criação de revisões.

A SPEC 02 deverá armazenar no seu próprio vínculo/contrato o snapshot de
serviço, quantidade, dias, preço e versão de exibição usados na contratação.
Essa redundância de histórico protege os agendamentos caso uma evolução futura
permita novas revisões. Atualizar o registro em cascata foi descartado porque
alteraria condições já contratadas.

### Expor recursos HTTP de pacote sem endpoint de exclusão

A proposta contratual para a API é:

| Operação | Método e recurso | Dados principais |
| --- | --- | --- |
| Criar | `POST /api/service-packages` | nome, descrição, `unitId`, `serviceId`, `totalSessions`, `totalPrice`, `weekDays`, `active` |
| Listar | `GET /api/service-packages` | filtros `unitId`, `serviceId`, `active`, `totalSessions`, `name`, paginação/ordenação conforme o padrão da API |
| Detalhar | `GET /api/service-packages/{id}` | definição completa e frequência derivada |
| Atualizar | `PATCH /api/service-packages/{id}` | campos mutáveis enquanto não houver agendamento vinculado |
| Situação | `PATCH /api/service-packages/{id}/status` | `active`, sujeito à mesma imutabilidade |

Não haverá `DELETE`. Respostas apresentam preço decimal, dias ordenados de
forma estável, frequência derivada e auditoria necessária à tela. A API pode
ajustar nomes de recursos ao seu padrão real, mas qualquer ajuste deve manter
este conjunto semântico e ser refletido no adaptador tipado do frontend.

### Separar a feature frontend de pacotes e integrar a navegação existente

O frontend adicionará `src/features/packages/` com adaptador RTK Query,
contratos, schemas, componentes, página, testes e README. A rota proposta é
`/services/packages`; o item Serviços passa a expor Pacotes como submenu.
Listagem, filtros, formulário e detalhe usam estados explícitos de carregamento,
vazio, erro e autorização.

O topbar mantém “Agendar” intacto e inclui “Agendamento de Pacotes” ao lado.
Até a SPEC 02, a ativação do novo botão apenas informa que a ação depende dela;
não consulta API, não navega e não cria dados. Um botão removido ou uma segunda
instância do diálogo manual foram descartados para não dar a impressão de que o
agendamento automático já existe.

### Adiar o calendário operacional a uma capability própria

Os dias de pacote podem incluir qualquer dia de domingo a sábado. Não serão
validados nesta change contra funcionamento, feriado, bloqueio ou disponibilidade,
porque nenhuma dessas fontes existe no checkout ou no contrato observado. A SPEC
02 dependerá de uma futura capability de calendário para verificar cada
ocorrência antes de criá-la.

## Risks / Trade-offs

- [A API irmã e suas convenções de migration não estão neste checkout] → alinhar
  entidades, nomes e migration com o repositório da API antes da implementação;
  não inferir controllers ou repositórios inexistentes.
- [A change de escopo por unidade ainda não foi concluída] → implementar e
  verificar primeiro a autorização de unidade no servidor ou coordenar a
  entrega; nunca confiar apenas no filtro da tela.
- [Não há calendário operacional] → permitir a definição comercial dos dias,
  mas adiar a validação de disponibilidade e a criação de ocorrências.
- [A imutabilidade impede correções de pacotes usados] → tornar o erro claro e
  planejar uma change futura de revisão somente se a regra de produto mudar.
- [O botão temporário pode sugerir fluxo pronto] → informar explicitamente a
  dependência da SPEC 02 e garantir ausência de chamada HTTP ao acioná-lo.

## Migration Plan

1. Criar as tabelas de pacote e dias no backend irmão, com chaves estrangeiras,
   índice de escopo por clínica/unidade e unicidade de dia; não há dados legados
   a migrar.
2. Entregar autorização e endpoints da API, com testes de tenant, unidade e
   papel antes do frontend consumidor.
3. Entregar feature, rota, submenu e botão temporário no frontend, apontando
   apenas para contratos validados.
4. Validar os fluxos administrativos e a ausência de regressão do agendamento
   manual. A SPEC 02 só pode adicionar o vínculo de uso depois que o contrato
   de pacote estiver disponível.

Rollback: desativar a rota e o cliente antes de retirar endpoints. Não apagar
registros de pacote já criados; manter a migração e desativar os pacotes caso
uma reversão de aplicação seja necessária.
