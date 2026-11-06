# Spec Delta

## Purpose

Registra a superfície legada de pacientes observada no checkout, deixando explícito que ela ainda não constitui um módulo de gestão completo.

## ADDED Requirements

### Requirement: A tela carrega e lista pacientes legados

A rota `/paciente` MUST solicitar a lista em `GET patient/list` ao iniciar e renderizar as entradas retornadas na tabela de pacientes disponível.

#### Scenario: Listagem inicial

- **WHEN** a tela de pacientes for montada e a API responder com conteúdo
- **THEN** a tabela MUST apresentar uma linha para cada item retornado

### Requirement: O filtro atual recarrega a fonte de pacientes

O formulário de filtro legado MUST aceitar o texto informado e disparar uma nova consulta da lista, sem prometer filtragem remota ou local enquanto não houver contrato correspondente.

#### Scenario: Filtro submetido

- **WHEN** a pessoa submeter o filtro por nome
- **THEN** a interface MUST solicitar novamente a lista de pacientes disponível

### Requirement: O checkout contém fluxos legados distintos de criação

O código atual MUST manter identificáveis os dois fluxos existentes: um pelo contexto em `POST patients` e outro pelo modal compartilhado em `POST /patient/save`; eles não devem ser tratados como contrato unificado.

#### Scenario: Planejamento de mudança no cadastro

- **WHEN** uma change tocar a criação de pacientes
- **THEN** ela MUST escolher explicitamente o contrato alvo e cobrir os dois fluxos legados afetados ou remover um deles de forma planejada

### Requirement: Ações de gestão não são declaradas como entregues

Os controles visíveis de detalhe, edição e desativação MUST ser tratados como interface sem operação de domínio até que uma change especifique e implemente seus contratos.

#### Scenario: Avaliação da tela de pacientes

- **WHEN** a capacidade de pacientes for inventariada
- **THEN** os controles sem callback de domínio MUST ser registrados como não implementados
