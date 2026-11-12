# Spec Delta

## ADDED Requirements

### Requirement: A agenda de usuário não administrador é limitada à unidade associada
Para uma sessão de usuário não administrador, as consultas de pacientes e de agendamentos MUST retornar somente registros pertencentes à `clinic_unit` associada àquele usuário. O servidor MUST aplicar essa restrição independentemente dos parâmetros enviados pelo cliente.

#### Scenario: Usuário não administrador consulta pacientes
- **WHEN** um usuário não administrador autenticado consultar os pacientes disponíveis para agendamento
- **THEN** a resposta MUST conter somente pacientes pertencentes à unidade clínica associada a ele

#### Scenario: Usuário não administrador consulta agenda semanal
- **WHEN** um usuário não administrador autenticado consultar os agendamentos de uma semana
- **THEN** a resposta MUST conter somente agendamentos de pacientes da unidade clínica associada a ele

#### Scenario: Tentativa de ampliar o escopo por parâmetro
- **WHEN** um usuário não administrador enviar na consulta de agenda ou pacientes um identificador de unidade diferente da sua unidade associada
- **THEN** o sistema MUST impedir a exposição de pacientes ou agendamentos da outra unidade

### Requirement: A agenda de administrador mantém o escopo das unidades da clínica
Para uma sessão de administrador, as consultas de agenda e pacientes MUST poder operar em qualquer `clinic_unit` pertencente à clínica do administrador, sem expor registros de outra clínica.

#### Scenario: Administrador consulta uma unidade da própria clínica
- **WHEN** um administrador autenticado consultar pacientes ou agendamentos de uma unidade pertencente à sua clínica
- **THEN** o sistema MUST retornar apenas os registros daquela unidade

#### Scenario: Administrador consulta unidade de outra clínica
- **WHEN** um administrador autenticado tentar consultar pacientes ou agendamentos de uma unidade que não pertence à sua clínica
- **THEN** o sistema MUST impedir a exposição dos registros solicitados
