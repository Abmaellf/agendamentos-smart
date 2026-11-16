# Proposal

## Why

A definição administrativa de pacote prevista na SPEC 01 não resolve a
contratação de um paciente nem cria os atendimentos correspondentes. A clínica
precisa transformar um pacote ativo em uma contratação rastreável, calcular
exatamente as sessões futuras e confirmá-las pela mesma agenda que já protege
paciente, profissional e capacidade.

## What Changes

- Criar a capability de contratação e agendamento automático por pacote, com
  seleção de pacote, paciente, unidade, data mínima inicial e prévia completa
  antes da confirmação.
- Usar os dias configurados no pacote como sugestão inicial, mas permitir que a
  pessoa autorizada os altere para aquela contratação. A alteração não modifica
  a definição administrativa do pacote: a contratação preserva o conjunto de
  dias efetivamente confirmado e sua frequência derivada.
- Introduzir uma contratação de pacote por paciente, com snapshot imutável das
  condições comerciais e calendário efetivo, e associar opcionalmente os
  agendamentos individuais já existentes a essa contratação. **BREAKING**: a
  API externa ganhará contratos, persistência e relações novas para contratação
  e prévia de pacote; o contrato atual de agendamento manual permanece válido.
- Calcular somente datas futuras que coincidam com os dias efetivos escolhidos,
  a partir da data mínima informada, sem deslocar automaticamente a sessão para
  outro dia de semana não selecionado e sem criar sessões extras na última
  semana. A validação de feriados, funcionamento e bloqueios de calendário fica
  explicitamente reservada para uma especificação futura.
- Reutilizar a validação e a criação de agendamentos existente para verificar a
  prévia e confirmar todas as sessões em uma única operação transacional,
  protegida contra duplicidade por chave de idempotência. Conflitos em datas
  válidas impedem a confirmação total; não haverá confirmação parcial.
- Substituir o botão temporário “Agendamento de Pacotes” por uma entrada no
  fluxo real, mantendo “Agendar” e seus contratos de agendamento manual sem
  alteração.
- Reutilizar o mesmo fluxo e os mesmos controles do agendamento manual para
  paciente, unidade, serviço, data e horário. O horário informado será aplicado
  às sessões calculadas e a criação continuará usando as regras existentes de
  duração, preço, profissional opcional, conflitos e capacidade. Esta change
  não inventa horário nem profissional; a validação de calendário, feriados e
  bloqueios será tratada em uma especificação futura.

## Capabilities

### New Capabilities

- `package-appointment-contracts`: permite simular, confirmar e consultar a
  contratação de um pacote por paciente, com programação automática, snapshot,
  rastreabilidade das sessões e preservação dos agendamentos convencionais.

### Modified Capabilities

- `application-shell-baseline`: substitui a ação temporária “Agendamento de
  Pacotes” do topbar por uma entrada acessível para o fluxo de contratação, sem
  remover a ação manual “Agendar”.

## Impact

- Dados e API irmã: dependência da SPEC 01 entregue; nova contratação de pacote,
  snapshot de pacote/dias efetivos, vínculo opcional em `Appointment`, contratos
  de consulta elegível, prévia, confirmação idempotente e detalhamento; migration
  e testes de concorrência serão necessários no repositório da API.
- Agenda existente: a criação em lote deve reutilizar as regras de
  `AppointmentService` para clínica, unidade, paciente, serviço, profissional,
  duração, preço, conflitos, capacidade e bloqueio transacional. O endpoint
  manual `POST /api/appointments` e seus atendimentos sem pacote continuam
  compatíveis.
- Calendário e horários: o código observado não possui feriados, horário de
  funcionamento de unidade ou bloqueios operacionais. Nesta change, o horário
  vem do controle já usado no agendamento manual e a geração considera apenas
  os dias efetivos e a data mínima; validações de calendário/feriados/bloqueios
  ficam para uma especificação futura e não bloquearão a confirmação agora.
- Frontend: nova feature de contratação por pacote, rota/diálogo disparado pelo
  topbar, etapas de seleção, edição dos dias somente para a contratação, prévia,
  confirmação e consulta de contratação; o adaptador RTK Query e testes devem
  coordenar com a API externa.
- Permissões e isolamento: o servidor continua sendo a fonte de autorização;
  todos os recursos devem derivar clínica e unidade da sessão e rejeitar pacote,
  paciente ou contratação fora do escopo.
