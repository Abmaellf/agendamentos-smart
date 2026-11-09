# Tasks

## 1. Contrato de resposta e transporte

- [x] 1.1 Atualizar os tipos de leitura de agendamento para representar `createdBy`, `patientId`, `pathology`, `appointmentDate`, `hours`, `variant` e `updatedAt`, mantendo `professional` anulável e separando o preço numérico da resposta do preço textual de criação; verificar com teste direcionado de integração e grade: 25 testes aprovados.
- [x] 1.2 Confirmar a transformação de `GET /api/appointments` para consumir exclusivamente `content`, preservando os três registros do payload de referência e os parâmetros `unitId`, `from` e `to`; verificado no teste de integração da agenda: 25 testes aprovados.

## 2. Fixtures e comportamento da tela

- [x] 2.1 Atualizar builders e handlers MSW da agenda com um fixture fiel aos três agendamentos fornecidos, incluindo `professional: null`, `America/Cuiaba`, preço `150.00`, `pathology: []`, horários e estados; verificado pelo fixture tipado e pelo teste de integração, sem alteração do payload de criação.
- [x] 2.2 Ajustar a apresentação somente onde necessário para renderizar o payload real sem erro, mantendo paciente, serviço, horário local, duração, preço e status identificáveis e sem exigir profissional; verificado no teste de integração da agenda: 25 testes aprovados.
- [ ] 2.3 Cobrir o envelope `content`, o profissional nulo, o cálculo local de `2026-11-09T12:30:00.000Z` para `04:30` em `America/Cuiaba`, os três dias retornados e a ausência de regressão no fluxo de criação; verificar com `npm run test -- src/features/appointments/__tests__/appointments-page.integration.test.tsx src/features/appointments/__tests__/weekly-grid.test.ts`.

## 3. Verificação da change

- [x] 3.1 Executar `npm run lint` e corrigir problemas introduzidos pelo alinhamento do contrato. Verificado: `npm run lint` aprovado.
- [x] 3.2 Executar `npm run build` e registrar separadamente qualquer falha preexistente fora desta change. Verificado: falhou somente nos três erros TypeScript preexistentes de `src/components/Card/CardDay/index.tsx` e `src/components/__tests__/legacy-calendar-components.test.tsx`.
- [x] 3.3 Executar `openspec validate alinhar-tela-agendamento-resposta-backend --strict` e confirmar que proposal, delta spec, design e tarefas permanecem coerentes. Verificado: change válida.

## Workflow follow-up

- Após a implementação, revisão e validação, arquivar a change somente quando as tarefas refletirem evidência real.
- Verificar a spec `weekly-appointments` promovida após o archive.
