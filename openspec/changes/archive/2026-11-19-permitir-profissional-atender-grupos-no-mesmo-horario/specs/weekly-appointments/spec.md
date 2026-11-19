# Spec Delta

## MODIFIED Requirements

### Requirement: Criação envia contrato mínimo e atualiza a agenda

A criação MUST enviar paciente, unidade, serviço, profissional opcional, instante ISO, duração e preço, sem `tenantId`, estado, autoria ou data de criação. Após sucesso, MUST fechar o diálogo e invalidar a agenda. A criação MUST rejeitar sobreposição para o mesmo profissional quando o serviço solicitado for `Atendimento individual`. Para qualquer outro serviço, a criação MUST permitir que o mesmo profissional atenda pacientes diferentes no mesmo intervalo, desde que o paciente não tenha conflito, o serviço tenha capacidade disponível, o profissional ofereça o serviço e esteja disponível no dia.

#### Scenario: Criação bem-sucedida

- **WHEN** a API aceitar um agendamento válido
- **THEN** a interface MUST confirmar o sucesso, limpar/fechar o diálogo e refazer a consulta da agenda

#### Scenario: Conflito ou falha de criação

- **WHEN** a API recusar a criação ou ocorrer falha de rede
- **THEN** o diálogo MUST permanecer aberto e apresentar orientação associada ao erro quando disponível

#### Scenario: Profissional atende dois pacientes em serviço coletivo

- **WHEN** dois pacientes distintos forem agendados no mesmo intervalo, para o mesmo serviço coletivo e com o mesmo profissional
- **THEN** a API MUST aceitar o segundo agendamento enquanto a capacidade do serviço não estiver esgotada

#### Scenario: Profissional exclusivo em atendimento individual

- **WHEN** um segundo paciente for agendado no mesmo intervalo para `Atendimento individual` e o mesmo profissional
- **THEN** a API MUST rejeitar a criação com `PROFESSIONAL_APPOINTMENT_CONFLICT`

#### Scenario: Capacidade coletiva esgotada

- **WHEN** um novo paciente for agendado em serviço coletivo e a quantidade de agendamentos sobrepostos atingir a capacidade configurada
- **THEN** a API MUST rejeitar a criação com `SERVICE_CAPACITY_EXCEEDED`, mesmo que o profissional seja o mesmo

#### Scenario: Conflito do próprio paciente permanece bloqueante

- **WHEN** o paciente já possuir outro agendamento sobreposto
- **THEN** a API MUST rejeitar a criação com `PATIENT_APPOINTMENT_CONFLICT`, independentemente do tipo de serviço
