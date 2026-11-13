# Tipos compartilhados

## Objetivo do módulo

Centralizar contratos TypeScript compartilhados por domínio sem transformar a
pasta em um depósito de tipos internos de implementação.

## Contratos existentes

- `appointment.ts`: contratos de domínio, transporte e composição da agenda;
- `patient.ts`: entidade, entradas, contexto legado e props de pacientes;
- `auth.ts`: entradas/saídas de autenticação e valores do formulário de login;
- `profile.ts`: resposta compartilhada de perfil;
- `session.ts`: sessão normalizada consumida pela agenda;
- `user.ts`: entrada do cadastro de usuário ainda não conectado à interface;
- `components.ts`: contratos visuais transversais, como navegação e tema;
- `ui.ts`: propriedades derivadas dos componentes-base.

## Dependências

Os arquivos são importados explicitamente com o alias `@/@types`; não há
declarações globais implícitas. `session.ts` reutiliza o papel canônico da
agenda em `appointment.ts`. Tipos de infraestrutura e fixtures de teste ficam
próximos aos seus consumidores quando não representam contrato de domínio.

## Regras

- Entidades da clínica carregam `tenantId`; entidades operacionais por unidade
  também carregam `unitId` quando o contrato exigir.
- Papéis da clínica usam a união canônica `ADMIN`/`BASIC`; o usuário master da
  plataforma não deve ser confundido com esse papel.
- Respostas de perfil e sessão não modelam senha. Senha só pertence a entradas
  de autenticação quando é necessária para o comando.
- Preço, data/hora e duração precisam de representações inequívocas; datas
  trocadas com a API devem carregar fuso/offset.
- Contratos compartilhados devem ser exportados daqui e importados com
  `import type`.
- Tipos triviais usados uma única vez, tipos derivados de schemas e estruturas
de infraestrutura podem permanecer locais.

## Mapa da auditoria

| Contrato | Local canônico | Evidência/decisão |
| --- | --- | --- |
| `CreatePatient*`, `PatientContext*`, `PaginationProps` | `patient.ts` | Usados pela API, contexto, página e componentes de pacientes |
| `Appointment*` e props da agenda | `appointment.ts` | Usados por API, grade, diálogo e cartões de agendamento |
| `SessionProfile` | `session.ts` | Parser de sessão é consumido pela API de agendamentos |
| `GetProfileResponse` | `profile.ts` | API Axios e endpoint RTK Query compartilham a resposta de perfil |
| `SignInBody`, `SignInResponse`, `SignInFormValues` | `auth.ts` | Mutation e tela de login usam o mesmo contrato de entrada/saída |
| `RegisterUserBody` | `user.ts` | Entrada do adaptador de cadastro, ainda sem consumidor de tela |
| `AxiosBaseQueryArgs/Error` | `src/lib/axios-base-query.ts` | Estruturas privadas de infraestrutura, sem consumidor de domínio |
| envelopes internos de `appointments/api` | `features/appointments/api` | Usados somente para normalizar respostas daquele adaptador |
| tipos de `src/test` e schemas | consumidor local | Fixtures, módulos de teste e inferência não são contratos compartilhados |

## Lacunas

Paciente ainda possui contratos legados de API/contexto que serão consolidados
em changes funcionais posteriores, sem alterar endpoints nesta refatoração.
Contratos futuros de `Tenant`, `Unit`, `Professional`, `Service`,
`AppointmentSeries` e `AppointmentEvent` devem ser adicionados quando seus
fluxos forem implementados, não como placeholders desta change.
