# Proposal

## Why

Esta change registra de forma reversa o estado efetivamente alterado na branch `fix/vercel-login`. O ponteiro commitado da branch coincide com `main`; portanto, a fonte da reconstrução é o diff staged atual, que reorganiza o contrato do calendário legado e adapta um teste de pacotes à biblioteca `ES2020`.

## What Changes

- Registrar que `CardDay` recebe uma coleção explícita de agendamentos canônicos, em vez de criar fixtures locais durante o render.
- Registrar que o filtro de `CardDay` calcula a data local no fuso de cada agendamento e encaminha `isToday` para `CardPatient`.
- Registrar a inclusão de `appointments: Appointment[]` em `CardDayProps`.
- Registrar a remoção do teste legado `legacy-calendar-components.test.tsx`.
- Registrar a substituição de `URLSearchParams.at(-1)` por acesso indexado no teste de pacotes.
- Preservar como evidência o documento de análise criado em `docs/plano-correcao-build-vercel.md`.
- Não alterar API HTTP, rotas, dependências, permissões ou dados persistidos.

## Capabilities

### New Capabilities

- `vercel-build-compatibility`: registra os contratos observáveis de compatibilidade do calendário legado e dos testes que foram alterados na branch.

### Modified Capabilities

- Nenhuma. A branch não altera requisitos funcionais existentes da agenda ativa nem contratos HTTP.

## Impact

- Código: `src/@types/appointment.ts` e `src/components/Card/CardDay/index.tsx`.
- Testes: remoção de `src/components/__tests__/legacy-calendar-components.test.tsx` e ajuste em `src/features/packages/pages/packages-page.test.tsx`.
- Documentação: inclusão de `docs/plano-correcao-build-vercel.md`.
- Verificação observada: o teste de pacotes passa; `npm run build` e `npm run lint` ainda ficam bloqueados por imports não utilizados de `format` e `ptBR` deixados em `CardDay`.
- Fora de escopo: corrigir o bloqueio residual, alterar dependências, alterar a API ou implementar novos fluxos de produto.
