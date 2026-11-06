# Migração de TanStack React Query para RTK Query

> **Status: implementado.** A change
> `migrar-react-query-para-rtk-query` substituiu todos os consumidores remotos
> anteriores por endpoints e hooks do RTK Query, sem alterar contratos HTTP ou
> comportamento de interface previsto.

## Escopo entregue

As dez operações remotas migradas mantêm URLs, verbos, parâmetros, payloads,
cookies, mensagens e navegação existentes.

| Operação | Consumidor RTK Query |
| --- | --- |
| `GET /auth/me` (sessão) | `useGetAppointmentSessionQuery` em `AppointmentsPage` |
| `GET /api/appointments` | `useGetAppointmentsQuery` em `AppointmentsPage` |
| Catálogos de pacientes, unidades, serviços e profissionais | hooks gerados em `CreateAppointmentDialog` |
| `POST /api/appointments` | `useCreateAppointmentMutation` |
| `GET auth/me` (perfil) | `useGetProfileQuery` em `AccountMenu` |
| `POST /auth/login` | `useSignInMutation` em `SignIn` |
| `POST /patient/save` | `useRegisterPatientMutation` em `AddPatientModal` |

Não foram incluídas mudanças de contrato com o backend, autorização,
persistência de estado, optimistic updates ou regras novas de negócio.

## Arquitetura implementada

`src/lib/axios.ts` continua sendo a única instância Axios e preserva
`VITE_API_URL` e `withCredentials`. `src/lib/axios-base-query.ts` a adapta para
o RTK Query, devolvendo os dados da resposta ou erros serializáveis no formato
`{ status, data }`.

`src/lib/base-api.ts` declara uma `baseApi` única. Cada domínio injeta nela seus
endpoints; `src/lib/store.ts` registra reducer e middleware. O bootstrap em
`App.tsx` usa o `Provider` do React Redux com essa store.

```tsx
<Provider store={store}>
  <Router />
</Provider>
```

As tags são `Session`, `Profile`, os quatro catálogos e `Appointment`. A agenda
fornece `Appointment/LIST`; a criação a invalida, e uma agenda visível é
consultada novamente automaticamente. Não existe tag `service-capacity`, pois
não há consulta correspondente no código.

## Comportamento preservado

- A agenda só consulta semanas após a sessão existir; a interface conserva
  carregamento, erro, nova tentativa e troca de semana.
- Os catálogos só são consultados quando o diálogo está aberto. Profissionais
  também dependem de um serviço selecionado, usando `skip`.
- `contentOf` continua aceitando resposta direta em coleção e `{ content }`.
- A criação usa `unwrap()`; o normalizador transforma os códigos de conflito,
  recurso não encontrado e falha de rede nas mesmas mensagens de domínio.
- Login e cadastro de paciente conservam payloads e ações de sucesso; perfil
  continua sendo uma consulta independente.

## Testes e MSW

`renderWithProviders` cria uma store por renderização. As stores registradas
têm o cache da `baseApi` limpo em `afterEach`, evitando cache entre casos. Os
handlers MSW de agenda usam `/api/appointments`, o mesmo caminho executado pelo
cliente.

Há cobertura para o adaptador Axios, formatos de coleção, criação que
reconsulta a agenda, `skip` de catálogos, erros de domínio e consumidores de
perfil, login e cadastro de paciente.

## Limpeza realizada

O cliente e o provider anteriores foram removidos, assim como
`src/lib/react-query.ts` e a dependência `@tanstack/react-query`. A verificação
de remoção é:

```sh
rg -n "@tanstack/react-query|QueryClient|useQuery|useMutation" src
```

O comando não deve retornar usos da biblioteca removida.

## Verificação final

No encerramento da change são executados `npm run lint`, os testes Vitest
afetados, `npm run build` e
`openspec validate migrar-react-query-para-rtk-query --strict`. Falhas legadas
que não pertencem à migração são registradas na própria change.
