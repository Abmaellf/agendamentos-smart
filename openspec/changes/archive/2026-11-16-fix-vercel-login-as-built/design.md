# Design

## Context

Esta é uma especificação retrospectiva da alteração staged na branch `fix/vercel-login`. O commit da branch é igual ao de `main`; as diferenças analisadas estão no working tree staged. A agenda ativa usa `src/features/appointments`, enquanto `CardDay` pertence ao caminho legado e não possui consumidor produtivo identificado pelo CodeGraph.

## Goals / Non-Goals

**Goals:**

- Registrar o comportamento efetivamente introduzido no `CardDay`.
- Registrar a remoção do teste legado e a adaptação do teste de pacotes.
- Preservar a distinção entre alteração observada e correção ainda pendente.

**Non-Goals:**

- Não corrigir o código staged nesta change.
- Não alterar a agenda ativa, API HTTP, rotas, dependências ou autorização.
- Não afirmar que o build da Vercel está resolvido enquanto os imports não utilizados permanecerem.

## Decisions

### Usar o diff staged como fonte da spec reversa

Como `fix/vercel-login` e `main` apontam para o mesmo commit, a comparação commit-a-commit não contém alterações. O diff staged é a única evidência atual das alterações solicitadas.

### Receber `Appointment[]` no cartão diário

O `CardDay` passou a receber dados por props e calcula a data local com o fuso do registro. Isso elimina os fixtures locais antigos e alinha a entrada ao contrato compartilhado já utilizado pela agenda.

### Manter `ES2020` e trocar `.at(-1)` por índice

O teste de pacotes foi adaptado localmente. Alterar o target global para `ES2022` seria uma mudança de compatibilidade maior e não faz parte do diff observado.

### Remover o teste legado

O arquivo `legacy-calendar-components.test.tsx` foi removido no diff staged. A spec registra a remoção, mas não transforma a ausência do teste em evidência de que o comportamento visual legado continua coberto.

## Risks / Trade-offs

- **[Build bloqueado]** `format` e `ptBR` continuam importados em `CardDay` embora não sejam usados → remover esses imports antes de considerar o build resolvido.
- **[Cobertura reduzida]** a remoção do teste legado elimina a cobertura de `WeekDatesLEGACY`, `CardPatient` e `CardDay` → criar uma nova cobertura canônica se esses componentes voltarem a ser mantidos.
- **[Branch sem commit próprio]** a alteração pode não estar preservada no histórico da branch → criar commit ou registrar o diff staged antes de descartá-lo, conforme o fluxo de versionamento do responsável.

## Migration Plan

Não há migração de dados nem deploy associado. A change será arquivada como registro as-built do diff staged. A correção dos imports não utilizados permanece explicitamente fora desta solicitação.
