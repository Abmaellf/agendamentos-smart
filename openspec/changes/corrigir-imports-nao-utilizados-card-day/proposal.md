# Proposal

## Why

O commit `67d5921` corrigiu o contrato de entrada do `CardDay`, mas deixou dois imports da implementação anterior. Com `noUnusedLocals` e a regra equivalente do ESLint ativos, esses imports fazem o build da Vercel falhar antes do Vite.

## What Changes

- Remover os imports não utilizados de `format` e `ptBR` em `src/components/Card/CardDay/index.tsx`.
- Preservar o filtro baseado em `Intl.DateTimeFormat`, o contrato `Appointment[]` e a prop `isToday` já implementados.
- Verificar build, lint e o teste direcionado de pacotes.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

Nenhuma. Trata-se de uma correção interna de compilação e lint, sem mudança de comportamento de negócio.

## Impact

- Código: um arquivo em `src/components/Card/CardDay/index.tsx`.
- API, rotas, dependências e dados: sem alteração.
- Verificação: `npm run build`, `npm run lint` e teste direcionado do pacote.
- O gate `skip_specs: true` é usado porque não há requisito comportamental novo.
