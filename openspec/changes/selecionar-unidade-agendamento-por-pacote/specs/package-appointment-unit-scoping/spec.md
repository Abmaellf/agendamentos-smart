# Spec Delta

## Purpose

Define como o agendamento por pacote determina a unidade operacional e mantém
pacientes, pacotes, prévia e confirmação dentro do escopo dessa unidade.

## ADDED Requirements

### Requirement: A unidade efetiva respeita o papel da sessão
O sistema MUST permitir que `ADMIN` escolha uma unidade autorizada da própria
clínica e MUST usar `activeUnitId` da sessão para usuário `BASIC`.

#### Scenario: Administrador escolhe uma unidade autorizada
- **WHEN** um `ADMIN` abrir o agendamento por pacote
- **THEN** o sistema MUST apresentar um campo de unidade com as unidades da sua clínica e usar a unidade selecionada como contexto do fluxo

#### Scenario: Usuário básico usa a unidade da sessão
- **WHEN** um usuário `BASIC` abrir o agendamento por pacote com `activeUnitId` válido
- **THEN** o sistema MUST usar essa unidade, MUST apresentá-la como não editável e MUST impedir a escolha de outra unidade

#### Scenario: Usuário básico não possui unidade disponível
- **WHEN** a unidade indicada por `activeUnitId` não estiver disponível no escopo autorizado
- **THEN** o sistema MUST impedir a prévia e a confirmação e MUST informar que a unidade da sessão não está disponível

### Requirement: Pacientes são listados somente na unidade efetiva
O sistema MUST carregar e listar pacientes pertencentes à unidade efetiva e MUST
impedir a seleção de paciente antes de essa unidade estar definida.

#### Scenario: Administrador define a unidade antes do paciente
- **WHEN** um `ADMIN` selecionar uma unidade no fluxo de pacote
- **THEN** o sistema MUST consultar o catálogo de pacientes filtrado por essa unidade e habilitar somente os pacientes retornados para ela

#### Scenario: Unidade ainda não selecionada
- **WHEN** um `ADMIN` abrir o fluxo sem definir uma unidade
- **THEN** o sistema MUST não consultar pacientes e MUST manter o campo de paciente indisponível

#### Scenario: Administrador troca a unidade
- **WHEN** um `ADMIN` trocar a unidade após selecionar um paciente ou gerar uma prévia
- **THEN** o sistema MUST limpar o paciente selecionado, descartar a prévia e recarregar os pacientes da nova unidade

### Requirement: Pacotes elegíveis correspondem à unidade efetiva
O sistema MUST listar ou aceitar para contratação somente pacotes ativos compatíveis
com a unidade efetiva e MUST manter o pacote coerente com o paciente escolhido.

#### Scenario: Pacotes da unidade selecionada
- **WHEN** a unidade efetiva for definida
- **THEN** o sistema MUST disponibilizar somente pacotes ativos dessa unidade para a contratação

#### Scenario: Pacote de outra unidade
- **WHEN** uma solicitação tentar usar um pacote pertencente a outra unidade
- **THEN** o sistema MUST recusar a operação sem gerar prévia ou agendamento

### Requirement: A unidade é preservada na prévia e na confirmação
A prévia e a confirmação MUST transportar a unidade efetiva, ou outro contexto
contratual equivalente, e o servidor MUST validar sua compatibilidade com a
clínica, o paciente, o pacote e a sessão autenticada.

#### Scenario: Prévia com unidade compatível
- **WHEN** a pessoa enviar paciente, pacote e unidade efetiva compatíveis
- **THEN** o sistema MUST gerar a prévia identificando a unidade usada no cálculo

#### Scenario: Tentativa de ampliar o escopo
- **WHEN** a pessoa enviar uma unidade, paciente ou pacote fora do escopo autorizado
- **THEN** o servidor MUST rejeitar a prévia ou confirmação sem criar contratação ou agendamento e sem expor dados não autorizados

### Requirement: Catálogo vazio bloqueia o fluxo com feedback
O sistema MUST comunicar quando não houver pacientes para a unidade efetiva e
MUST impedir a confirmação enquanto não existir paciente válido selecionado.

#### Scenario: Unidade sem pacientes
- **WHEN** o catálogo filtrado da unidade efetiva retornar vazio
- **THEN** o sistema MUST informar que não há pacientes disponíveis para essa unidade e MUST manter a ação de confirmação indisponível

