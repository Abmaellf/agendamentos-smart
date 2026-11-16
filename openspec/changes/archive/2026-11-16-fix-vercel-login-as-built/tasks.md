# Tasks

## 1. Inventário reverso da branch

- [x] 1.1 Comparar `fix/vercel-login` com `main` e registrar que ambos apontam para `5a6aa52`; verificar com `git diff main...HEAD` e `git status --short --branch`.
- [x] 1.2 Catalogar o diff staged em cinco caminhos, distinguindo código, teste removido e documentação; verificar com `git diff --cached --name-status`.

## 2. Contrato do calendário legado

- [x] 2.1 Registrar a inclusão de `appointments: Appointment[]` em `CardDayProps`; verificar com a leitura de `src/@types/appointment.ts` e do diff staged.
- [x] 2.2 Registrar o filtro de data local por fuso e a passagem de `isToday` em `CardDay`; verificar com a leitura de `src/components/Card/CardDay/index.tsx`.
- [x] 2.3 Registrar a remoção de `legacy-calendar-components.test.tsx` sem tratá-la como evidência de cobertura; verificar com `git diff --cached --name-status`.

## 3. Compatibilidade do teste de pacotes

- [x] 3.1 Registrar a troca de `.at(-1)` por acesso indexado compatível com `ES2020`; verificar com `src/features/packages/pages/packages-page.test.tsx`.
- [x] 3.2 Executar o teste direcionado de pacotes e registrar a evidência real; evidência: `1` arquivo aprovado e `4` testes aprovados.

## 4. Documentação e validação da retrospectiva

- [x] 4.1 Registrar `docs/plano-correcao-build-vercel.md` como artefato documental da branch; verificar com `git diff --cached --name-status`.
- [x] 4.2 Executar build e lint e registrar os bloqueios residuais, sem declarar sucesso indevido; evidência: `npm run build` e `npm run lint` falham por `TS6133`/`no-unused-vars` nos imports `format` e `ptBR` de `CardDay`.
- [x] 4.3 Validar esta change com `openspec validate fix-vercel-login-as-built --strict` antes do arquivamento.

## Workflow follow-up

- Arquivar a change após a validação estrita.
- Manter o bloqueio de build documentado até que os imports não utilizados sejam removidos em uma alteração própria.
