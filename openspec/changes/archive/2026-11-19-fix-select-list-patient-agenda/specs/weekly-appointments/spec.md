# Spec Delta

## MODIFIED Requirements

### Requirement: Criação manual carrega catálogos necessários

O diálogo de criação MUST carregar unidades e serviços antes do envio, MUST carregar pacientes somente depois que existir uma unidade válida selecionada e MUST buscar profissionais filtrados pelo serviço selecionado, mantendo o profissional opcional.

#### Scenario: Serviço selecionado

- **WHEN** a pessoa selecionar um serviço
- **THEN** o formulário MUST preencher duração e preço padrão e consultar os profissionais daquele serviço

#### Scenario: Catálogos carregados antes da interação

- **WHEN** o diálogo for aberto
- **THEN** unidades e serviços MUST estar disponíveis para seleção após o carregamento, o campo Paciente MUST permanecer bloqueado até a unidade ser definida e profissionais MUST permanecer condicionados ao serviço selecionado

## ADDED Requirements

### Requirement: O catálogo de pacientes respeita a unidade selecionada

O catálogo do campo Paciente MUST conter somente pacientes vinculados à unidade atualmente selecionada, e a API MUST aplicar essa restrição por clínica, unidade e identidade autenticada.

#### Scenario: ADMIN abre o diálogo sem unidade selecionada

- **WHEN** uma pessoa `ADMIN` abrir o diálogo de novo agendamento
- **THEN** o campo Unidade MUST estar disponível antes do campo Paciente, o campo Paciente MUST estar desabilitado e o sistema MUST não consultar o catálogo de pacientes sem uma unidade válida

#### Scenario: ADMIN seleciona uma unidade

- **WHEN** uma pessoa `ADMIN` selecionar uma unidade autorizada
- **THEN** o sistema MUST consultar o catálogo informando a unidade selecionada e o campo Paciente MUST apresentar somente pacientes vinculados a essa unidade

#### Scenario: Paciente recém-cadastrado na unidade selecionada

- **WHEN** um paciente for criado com a unidade selecionada entre seus `unitIds` e o catálogo de pacientes for consultado novamente
- **THEN** o paciente MUST estar disponível no campo Paciente para o agendamento naquela unidade

#### Scenario: Paciente cadastrado em outra unidade

- **WHEN** um paciente não possuir vínculo com a unidade selecionada
- **THEN** o paciente MUST não ser apresentado nem poder ser escolhido para o agendamento

#### Scenario: ADMIN troca a unidade

- **WHEN** uma pessoa `ADMIN` trocar a unidade depois de carregar ou selecionar um paciente
- **THEN** o formulário MUST limpar o paciente selecionado, invalidar o catálogo anterior e consultar somente os pacientes vinculados à nova unidade

### Requirement: A seleção de paciente permanece consistente com a unidade

O formulário MUST impedir o envio enquanto a unidade estiver ausente, o paciente estiver indisponível para ela ou o catálogo dependente estiver carregando ou em erro; a validação definitiva MUST permanecer no servidor.

#### Scenario: Unidade alterada após paciente selecionado

- **WHEN** a unidade for alterada após a seleção de um paciente
- **THEN** o botão de criação MUST permanecer indisponível até que um paciente válido da nova unidade seja selecionado

#### Scenario: Catálogo dependente vazio ou indisponível

- **WHEN** a consulta de pacientes da unidade selecionada retornar vazio ou falhar
- **THEN** o diálogo MUST informar o estado correspondente, MUST não oferecer paciente de outra unidade e MUST impedir a criação até que exista uma opção válida ou uma nova tentativa bem-sucedida

#### Scenario: Sessão BASIC

- **WHEN** uma pessoa `BASIC` abrir o diálogo com `activeUnitId` válido
- **THEN** o sistema MUST usar essa unidade como contexto do catálogo de pacientes, manter o campo Unidade sem edição e apresentar somente pacientes daquela unidade

#### Scenario: API rejeita combinação inconsistente

- **WHEN** a API rejeitar a criação porque o paciente não pertence à unidade enviada
- **THEN** o diálogo MUST permanecer aberto, apresentar a mensagem de erro disponível e não confirmar o agendamento
