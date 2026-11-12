# Proposal

## Why

A validação atual bloqueia qualquer profissional que já tenha um atendimento no intervalo, mesmo quando o serviço é coletivo e possui capacidade para vários pacientes. Isso impede o agendamento de Pilates e outros grupos no mesmo horário, embora apenas o serviço individual deva exigir exclusividade do profissional.

## What Changes

- Permitir que o mesmo profissional atenda pacientes diferentes no mesmo intervalo quando o serviço não for `Atendimento individual`.
- Manter o conflito de profissional para `Atendimento individual`, preservando a regra de uma sessão exclusiva por profissional.
- Continuar aplicando capacidade do serviço, conflito do próprio paciente, disponibilidade semanal e demais validações existentes.
- Manter a renderização dos cartões simultâneos lado a lado e cobrir a regra com testes de domínio/API e interface.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `weekly-appointments`: altera a regra de criação para permitir reutilização do profissional em serviços coletivos, mantendo exclusividade para `Atendimento individual`.

## Impact

- API de criação de agendamentos: ajuste da validação de conflito por profissional.
- Frontend da agenda: mensagens e testes devem refletir que conflitos de profissional só bloqueiam o serviço individual; a API continua sendo a autoridade para capacidade e integridade.
- Testes de serviço, integração e agenda semanal.
