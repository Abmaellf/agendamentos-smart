# Proposal

## Why

A resposta real de `GET /api/appointments` retorna uma coleção em `content` com o registro completo do agendamento, mas o contrato tipado usado pela tela não representa integralmente esse payload e nomeia a autoria de forma diferente (`createdByUserId` versus `createdBy`). Isso deixa a tela vulnerável a divergências de tipo, fixtures incompatíveis e perda de dados retornados pelo backend.

## What Changes

- Alinhar o contrato de leitura da agenda semanal ao envelope `{ content: [...] }` e aos campos observados no retorno informado.
- Representar no modelo do agendamento os objetos aninhados `patient`, `service` e `professional`, incluindo `professional: null`, e os campos de auditoria, tempo, preço, status e metadados retornados.
- Definir que a tela use `startsAt` e `timeZone` como fonte para posicionamento e horário local, mantendo `durationMinutes`, `patient.name`, `service.name` e `status` na apresentação dos cartões.
- Cobrir com testes o payload de referência, inclusive profissional nulo, preço numérico/formatado, `pathology` vazio e os campos derivados auxiliares sem quebrar a grade semanal.
- Manter a consulta por `unitId`, `from` e `to`, a paginação/envelope de leitura e os estados de carregamento, erro, vazio e dados.

Fora de escopo: alterar o endpoint, os parâmetros HTTP, o contrato mínimo de criação, regras de autorização/tenant, estados de negócio, cálculo de fuso, layout visual da agenda ou implementar as visualizações “Dia” e “Lista”.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `weekly-appointments`: explicita o contrato de leitura do retorno de agendamentos e a preservação dos campos necessários à renderização da agenda.

## Impact

- Código potencialmente afetado: `src/@types/appointment.ts`, `src/features/appointments/api/appointments.ts`, `src/features/appointments/pages/appointments-page.tsx`, builders/handlers MSW e testes da feature.
- O contrato HTTP de consulta é documentado com os campos efetivamente retornados, sem alteração da URL ou dos parâmetros.
- A criação manual permanece com seu payload mínimo e não deve passar a enviar campos somente de resposta.
- Não há migração de dados, alteração de permissões ou nova dependência prevista.
