# Spec Delta

## Purpose

Registrar os contratos de entrada e verificação observados na correção de compatibilidade da branch `fix/vercel-login`, mantendo o calendário legado separado da agenda ativa e os testes compatíveis com o target `ES2020`.

## ADDED Requirements

### Requirement: O cartão diário recebe agendamentos canônicos

O cartão diário MUST receber uma coleção explícita de agendamentos no contrato canônico `Appointment` e MUST renderizar somente os registros pertencentes à data consultada.

#### Scenario: Agendamentos da data local

- **WHEN** a coleção contiver agendamentos cuja data local, calculada no fuso de cada registro, for igual à data consultada
- **THEN** o cartão diário MUST renderizar um `CardPatient` para cada registro correspondente

#### Scenario: Agendamento fora da data consultada

- **WHEN** um agendamento tiver data local diferente da data consultada
- **THEN** o cartão diário MUST omitir esse registro

### Requirement: O estado de hoje é encaminhado ao cartão de atendimento

O cartão diário MUST encaminhar o estado booleano `isToday` a cada cartão de atendimento renderizado, sem usar uma prop alternativa para representar o mesmo estado.

#### Scenario: Coluna do dia atual

- **WHEN** o cartão diário receber `isToday` como verdadeiro
- **THEN** cada cartão de atendimento renderizado MUST receber `isToday` como verdadeiro

#### Scenario: Coluna de outro dia

- **WHEN** o cartão diário receber `isToday` como falso
- **THEN** cada cartão de atendimento renderizado MUST receber `isToday` como falso

### Requirement: O teste de filtros de pacotes é compatível com ES2020

O teste de filtros de pacotes MUST consultar o último item da coleção de requisições sem depender de `Array.prototype.at`.

#### Scenario: Última requisição de filtro

- **WHEN** o filtro for enviado e a coleção de requisições contiver uma ou mais entradas
- **THEN** o teste MUST validar o parâmetro `name` da última entrada usando acesso compatível com `ES2020`
