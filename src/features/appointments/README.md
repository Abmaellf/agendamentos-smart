# Feature `appointments`

## Objetivo

Concentrar a entidade `Appointment` e todo o fluxo de consulta, criação e
apresentação da agenda semanal. A feature é o único módulo de agendamentos do
front-end.

## Convenção de nomenclatura

- `Appointment`: singular para uma entidade ou registro individual;
- `appointments`: plural para a feature, coleções, queries e caminhos de rota;
- `AppointmentsPage`: página que apresenta uma coleção de agendamentos;
- `createAppointment`: comando que cria um registro;
- `getAppointments` e `useAppointments`: operações que retornam uma coleção.

O termo `scheduling` não deve ser usado em nomes internos. A string
`/api/scheduling` permanece somente no adaptador HTTP, nos mocks e nos
documentos de contrato porque ainda é o endpoint publicado pelo backend.

## Estrutura

```text
appointments/
├── api/          # chamadas HTTP tipadas
├── components/   # componentes específicos da feature
├── hooks/         # queries e cache remoto
├── model/         # tipos, schemas e mensagens de domínio
├── pages/         # composição da rota /appointments
└── __tests__/     # testes unitários e de integração
```

## Fluxo principal

`/appointments` → `AppointmentsPage` → `useAppointments` →
`getAppointments` → API.

A página seleciona o intervalo semanal, apresenta carregamento, erro e estado
vazio, distribui os registros nos cinco dias úteis e abre
`CreateAppointmentDialog`. Após a criação, o cache `appointments` é invalidado e
a semana visível é consultada novamente.

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
