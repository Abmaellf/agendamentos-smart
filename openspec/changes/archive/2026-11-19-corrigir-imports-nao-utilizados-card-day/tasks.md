# Tasks

## 1. Corrigir os imports do `CardDay`

- [x] 1.1 Remover `format` e `ptBR` de `src/components/Card/CardDay/index.tsx`, preservando `Intl.DateTimeFormat`, `Appointment`, `CardDayProps`, `Card` e `cn`; verificar com `npm run build`. Evidência: build Vite concluído com exit code 0.
- [x] 1.2 Executar `npm run lint` e confirmar que não restam erros `no-unused-vars`; registrar o resultado na tarefa. Evidência: ESLint concluído com exit code 0.

## 2. Verificação integrada

- [x] 2.1 Executar o teste direcionado `npm run test -- src/features/packages/pages/packages-page.test.tsx --reporter=dot` e confirmar aprovação. Evidência: 1 arquivo e 4 testes aprovados.
- [x] 2.2 Confirmar que `git diff --check` não aponta problemas de whitespace e que a alteração permanece limitada ao import morto. Evidência: diff limpo e somente as três linhas dos imports/bloco em branco removidas de `CardDay`.

## Workflow follow-up

- Validar a change com `openspec validate corrigir-imports-nao-utilizados-card-day --strict`.
- Arquivar a change após todas as tarefas e verificações passarem.
