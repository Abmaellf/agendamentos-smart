# Feature `appointments`

## Objetivo

Concentrar a entidade `Appointment` e todo o fluxo de consulta, criação e
apresentação da agenda semanal. A feature é o único módulo de agendamentos do
front-end.

## Convenção de nomenclatura

- `Appointment`: singular para uma entidade ou registro individual;
- `appointments`: plural para a feature, coleções, queries e caminhos de rota;
- `AppointmentsPage`: página que apresenta uma coleção de agendamentos;
- `createAppointment`: mutação que cria um registro;
- `useGetAppointmentsQuery`: consulta RTK Query que retorna uma coleção.

O caminho externo de agenda é `/api/appointments` para consulta e criação.

## Estrutura

```text
appointments/
├── api/          # chamadas HTTP tipadas
├── components/   # componentes específicos da feature
├── model/         # schemas, transformações e mensagens de domínio
├── pages/         # composição da rota /appointments
└── __tests__/     # testes unitários e de integração
```

Os contratos TypeScript compartilhados da feature ficam em
`src/@types/appointment.ts`.

## Fluxo principal

`/appointments` → `AppointmentsPage` → hooks RTK Query → endpoints injetados
em `baseApi` → `axiosBaseQuery` → API.

A página seleciona o intervalo semanal, apresenta carregamento, erro e estado
vazio, distribui os registros nos cinco dias úteis e abre
`CreateAppointmentDialog`. A consulta de agenda só inicia após a sessão. O
diálogo usa `skip` enquanto fechado e a mutação de criação invalida
`Appointment/LIST`, fazendo a semana visível ser consultada novamente.

## Regras do domínio

- Cada agendamento pertence a um paciente, uma unidade e um serviço.
- Profissional é opcional na criação.
- Duração e preço ficam registrados como valores históricos.
- Usuário `BASIC` usa os padrões do serviço; `ADMIN` pode sobrescrevê-los.
- Conflitos de paciente/profissional e capacidade são validados pelo backend e
  apresentados pelo formulário.
- Data e horário são normalizados conforme o fuso IANA da unidade.

Estados além de `AGENDADO`, recorrência, remarcação e cancelamento fazem parte
da especificação do MVP, mas ainda não estão implementados integralmente neste
módulo.
