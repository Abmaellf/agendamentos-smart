# Proposal

## Why

A aplicação usa TanStack Query em dez operações remotas distribuídas entre a agenda e módulos legados, com um `QueryClient` global e outro específico para testes. A migração para RTK Query unifica o cache remoto com uma API tipada e tags de invalidação, preservando os contratos HTTP e os comportamentos atuais das telas.

## What Changes

- Adicionar Redux Toolkit e React Redux para prover RTK Query à aplicação.
- Criar uma API RTK Query baseada na instância Axios existente, mantendo `VITE_API_URL`, cookies, métodos, URLs, parâmetros e payloads atuais.
- Migrar todas as consultas e mutações que importam `@tanstack/react-query`: sessão, agenda semanal, catálogos de agendamento, criação de agendamento, perfil, login e cadastro de paciente.
- Substituir o `QueryClientProvider`, o `QueryClient` de testes e as invalidações por provider, store, hooks gerados e tags do RTK Query.
- Remover TanStack Query e seus arquivos residuais somente após a verificação de que não há importações restantes.
- Documentar o plano de implementação e os exemplos de conversão em `docs/Migracao-React-Query-para-RTK-Query.md`.

## Capabilities

### New Capabilities

Nenhuma. Esta mudança não introduz comportamento de produto novo.

### Modified Capabilities

Nenhuma. Consultas, mutações, rotas, contratos HTTP, dados exibidos e regras de permissão devem permanecer inalterados.

Esta change declara `skip_specs: true` porque se trata de uma refatoração interna sem mudança de requisito observável.

## Impact

- Código afetado: `src/App.tsx`, `src/lib/react-query.ts`, chamadas em `src/features/appointments/`, `src/components/account-menu.tsx`, `src/components/AddPatientModal.tsx`, `src/page/auth/sign-in.tsx` e `src/test/render.tsx`.
- Testes afetados: integração da agenda e do diálogo de criação, que atualmente usam `QueryClientProvider`; os handlers MSW também precisam espelhar o caminho plural `/api/appointments` que o código já chama.
- Dependências: adição de `@reduxjs/toolkit` e `react-redux`; remoção de `@tanstack/react-query` ao final da migração.
- API externa: sem mudança intencional de URLs, verbos, parâmetros, cookies ou payloads.
