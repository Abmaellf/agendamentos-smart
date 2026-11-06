# Tasks

## 1. Infraestrutura do RTK Query

- [x] 1.1 Adicionar `@reduxjs/toolkit` e `react-redux`, criar a store, a `baseApi` e o `axiosBaseQuery` tipado que reutiliza `src/lib/axios.ts`; verificar com `npm ls @reduxjs/toolkit react-redux` e teste unitário do adapter para sucesso e falha.
- [x] 1.2 Trocar `QueryClientProvider` pelo `Provider` da store no bootstrap, registrando reducer e middleware da API; verificar que `npm run build` não reporta provider ou tipo ausente.

## 2. Endpoints e cache remoto

- [x] 2.1 Implementar endpoints RTK Query para sessão, agenda, catálogos e criação de agendamento, preservando URLs, parâmetros, DTOs, `contentOf` e `parseSessionProfile`; verificar com testes MSW de resposta em coleção e em `{ content }`.
- [x] 2.2 Modelar as tags de sessão, perfil, catálogos e `Appointment/LIST`, e fazer a criação invalidar a lista de agenda; verificar em teste que uma criação bem-sucedida executa nova consulta da agenda.
- [x] 2.3 Implementar endpoints RTK Query para perfil, login e cadastro de paciente sem mudar seus verbos, payloads ou tratamento de sucesso; verificar com testes dos consumidores ou testes de endpoint dedicados.
- [x] 2.4 Normalizar o erro retornado por `unwrap()` para a mensagem de domínio de agendamento; verificar os códigos de conflito, recurso não encontrado e a falha de rede no diálogo.

## 3. Consumidores de interface

- [x] 3.1 Migrar `AppointmentsPage` e remover/substituir `useAppointments`, mantendo a consulta da semana condicionada à sessão, loading, erro e `refetch`; verificar o teste de integração da página para semana vazia, troca de semana, falha e nova tentativa.
- [x] 3.2 Migrar `CreateAppointmentDialog` para hooks gerados e `skip`, mantendo o carregamento de catálogos ao abrir, profissionais por serviço, bloqueio durante envio e limpeza após sucesso; verificar o teste do diálogo, inclusive nenhuma requisição de catálogo enquanto fechado.
- [x] 3.3 Migrar `AccountMenu`, `SignIn` e `AddPatientModal`, mantendo as mensagens, navegação e payloads; verificar os testes novos ou atualizados de cada consumidor.

## 4. Testes, limpeza e documentação

- [x] 4.1 Substituir o `QueryClient` no helper de teste por store RTK Query isolada e resetar o cache entre casos; alinhar os handlers MSW ao caminho `/api/appointments`; verificar os testes de agenda sem requests não interceptadas.
- [x] 4.2 Remover `src/lib/react-query.ts`, imports de TanStack e a dependência `@tanstack/react-query` somente depois de `rg -n "@tanstack/react-query|QueryClient|useQuery|useMutation" src` não retornar usos da biblioteca; verificar `npm install` e o lockfile atualizados.
- [x] 4.3 Atualizar `src/README.md`, `src/lib/README.md`, `src/features/appointments/README.md`, `docs/Arquitetura do Sistema.md` e `docs/Migracao-React-Query-para-RTK-Query.md`; verificar que cada texto descreve RTK Query como estado implementado apenas após a conclusão.

## 5. Verificação integrada

- [x] 5.1 Executar `npm run lint`, os testes Vitest afetados e `npm run build`; registrar na change os comandos aprovados, falhas preexistentes e quaisquer bloqueios reais.
- [x] 5.2 Executar `openspec validate migrar-react-query-para-rtk-query --strict` após atualizar as tarefas com evidências reais; verificar que a validação é aprovada antes de solicitar revisão para implementação/arquivamento.

## Workflow follow-up

- Arquivar a change somente após a implementação, documentação, validações e revisão de escopo estarem concluídas.

## Evidências de validação

- `npm ls @reduxjs/toolkit react-redux --depth=0` confirmou `@reduxjs/toolkit@2.14.0` e `react-redux@9.3.1`.
- `npm install` terminou sem alterações pendentes; `npm ls @tanstack/react-query --depth=0` não encontrou a dependência removida.
- `rg -n "@tanstack/react-query|QueryClient|useQuery|useMutation" src` não retornou usos da biblioteca removida.
- `npm run lint` foi aprovado.
- Os seis arquivos Vitest afetados foram aprovados: 48 testes, cobrindo adapter Axios, endpoints, consumidores, diálogo e agenda.
- `npm test` mantém falha preexistente em 10 testes de `src/components/__tests__/legacy-calendar-components.test.tsx`: os fixtures legados não satisfazem o contrato atual de `Appointment` e `CardPatient` acessa propriedades ausentes.
- `npm run build` permanece bloqueado por três erros preexistentes, todos no calendário legado: `src/components/Card/CardDay/index.tsx:52` e `src/components/__tests__/legacy-calendar-components.test.tsx:28,50` usam fixtures incompatíveis com `Appointment`/`AppointmentStatus`. Não há erro de provider ou tipo relacionado ao RTK Query.
- CodeGraph está atualizado; o impacto de `baseApi` cobre bootstrap, endpoints de perfil/login/paciente/agendamentos, consumidores e helpers de teste.
