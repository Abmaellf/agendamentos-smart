# Spec Delta

## ADDED Requirements

### Requirement: A unidade do BASIC é pré-selecionada e não editável

No diálogo de criação, uma sessão `BASIC` MUST usar a unidade `activeUnitId` da sessão como valor do campo Unidade e MUST impedir sua alteração. `ADMIN` MUST poder selecionar outra unidade retornada pela API da própria clínica.

#### Scenario: BASIC abre novo agendamento

- **WHEN** uma pessoa com sessão `BASIC` abrir o diálogo e o catálogo incluir sua unidade ativa
- **THEN** o campo Unidade MUST mostrar essa unidade já selecionada, permanecer desabilitado e o payload MUST usar o respectivo identificador

#### Scenario: ADMIN seleciona outra unidade

- **WHEN** uma pessoa com sessão `ADMIN` abrir o diálogo e selecionar outra unidade disponível
- **THEN** o campo Unidade MUST aceitar a seleção e a criação MUST enviar o identificador selecionado

#### Scenario: Unidade do BASIC não está disponível

- **WHEN** a sessão `BASIC` informar `activeUnitId` ausente no catálogo recebido ou o catálogo não retornar uma unidade autorizada
- **THEN** a interface MUST comunicar o problema, MUST impedir a criação e MUST não selecionar silenciosamente outra unidade

### Requirement: Catálogos respeitam o escopo retornado pela sessão

As telas MUST consumir os catálogos fornecidos pela API como fonte de dados autorizados. A interface MUST não ampliar, combinar ou substituir a lista de unidades, pacientes, profissionais ou usuários para contornar o papel da sessão.

#### Scenario: Catálogo BASIC já vem limitado

- **WHEN** uma sessão `BASIC` consultar os catálogos do agendamento
- **THEN** a interface MUST renderizar somente as opções recebidas e não MUST realizar chamada adicional por digitação ou por tentativa de selecionar outra unidade

#### Scenario: Catálogo ADMIN contém várias unidades

- **WHEN** uma sessão `ADMIN` receber mais de uma unidade da própria clínica
- **THEN** a interface MUST manter a seleção pesquisável e editável para essas opções
