# Proposal

## Why

O escopo de unidade já faz parte da sessão, mas a experiência do frontend ainda trata o catálogo de unidades como uma lista editável para qualquer papel. Em uma sessão `BASIC` — correspondente ao papel `USER` na API — isso permite selecionar uma unidade diferente da associada ao usuário e cria uma expectativa incompatível com a autorização do servidor.

## What Changes

- Pré-selecionar a unidade `activeUnitId` da sessão ao abrir o diálogo de novo agendamento para `BASIC`.
- Tornar o campo Unidade somente leitura/desabilitado para `BASIC`; o campo continua pesquisável e editável para `ADMIN`.
- Consumir catálogos já escopados pela API, sem filtrar dados de autorização somente no cliente.
- Manter os identificadores enviados e a validação server-side; a interface deve comunicar carregamento, ausência de unidade autorizada e erro sem inventar uma opção.
- Cobrir as telas e hooks de busca do frontend que usam unidades, pacientes, profissionais e usuários, garantindo que o papel não receba controles de escopo que não pode exercer.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `weekly-appointments`: a seleção de unidade no agendamento respeita o papel e a unidade ativa da sessão.
- `access-session-baseline`: o contexto de sessão fornece a unidade usada para inicializar controles dependentes de escopo.

## Impact

- Frontend: `CreateAppointmentDialog`, modelo/parser de sessão, consultas de catálogos e testes de integração da agenda.
- Contrato consumido: respostas de catálogos devem representar somente os recursos que a identidade autenticada pode consultar; `USER`/`BASIC` não pode ampliar o escopo por parâmetro ou interação da UI.
- A autorização definitiva permanece na API; desabilitar o controle no navegador não substitui as validações de criação, leitura e tenant.
- Fora de escopo: criar seletor de unidade para `BASIC`, permitir múltiplos vínculos de unidade no modelo atual, alterar regras de duração/preço ou refatorar features não relacionadas.
