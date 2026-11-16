# Plano de correção do build da Vercel

Este documento mapeia as alterações necessárias para corrigir o build do commit `5a6aa52`.

O bloqueio ocorre no `tsc -b`, antes do bundle do Vite. Os avisos de dependências deprecated não são a causa da falha.

## Resultado esperado

Depois das alterações:

- `npm run build` deve concluir o TypeScript e o bundle Vite;
- os fixtures do calendário devem usar o contrato canônico `Appointment`;
- os status devem usar `AppointmentStatus`;
- `CardDay` não deve criar dados fictícios durante o render;
- os testes legados não devem quebrar em runtime por ausência de `patient`;
- o teste de pacotes deve continuar compatível com `ES2020`;
- os READMEs não devem documentar contratos antigos como se fossem atuais.

## Diagnóstico resumido

O build apresenta quatro diagnósticos, agrupados em três causas-raiz:

1. `CardDay` envia fixtures antigos para `CardPatient`, mas `CardPatient` exige `Appointment`.
2. O teste legado envia status textuais livres, mas o contrato atual exige `AppointmentStatus`.
3. O teste de pacotes usa `.at(-1)`, mas o projeto está configurado com `ES2020`.

Além da falha de compilação, os testes legados falham em runtime porque `CardPatient` acessa `appointment.patient.name`, enquanto os fixtures antigos possuem apenas `namePatient`.

---

## 1. Manter `Appointment` como contrato canônico

### Path

`src/@types/appointment.ts`

### Código atual

```ts
export interface Appointment {
  id: string
  tenantId: string
  unitId: string
  patient: AppointmentPatient
  service: AppointmentService
  professional: AppointmentProfessional | null
  startsAt: string
  durationMinutes: number
  price: number
  status: AppointmentStatus
  timeZone: string
  createdBy: string
  createdAt: string
  patientId: string
  pathology: string[]
  appointmentDate: string
  hours: string
  variant: string
  updatedAt: string
}
```

### Como deve ficar

O contrato deve permanecer canônico e obrigatório. Não transformar campos em opcionais, não trocar `AppointmentStatus` por `string` e não usar `any` para acomodar os fixtures antigos.

```ts
export interface Appointment {
  id: string
  tenantId: string
  unitId: string
  patient: AppointmentPatient
  service: AppointmentService
  professional: AppointmentProfessional | null
  startsAt: string
  durationMinutes: number
  price: number
  status: AppointmentStatus
  timeZone: string
  createdBy: string
  createdAt: string
  patientId: string
  pathology: string[]
  appointmentDate: string
  hours: string
  variant: string
  updatedAt: string
}
```

### Motivo

Esse tipo já é usado pela API, pela grade semanal e pela página ativa de agendamentos. Relaxá-lo esconderia incompatibilidades reais entre os fixtures legados e os dados retornados pela API.

---

## 2. Fazer `CardDay` receber agendamentos tipados

### Path

`src/components/Card/CardDay/index.tsx`

### Código atual

```tsx
export function CardDay(cardDay: CardDayProps) {
  const appointmentDate = new Date()
  const appointments = [
    {
      id: '889',
      namePatient: 'Abmael',
      pathology: ['Fisioterapia', 'Pilates'],
      date: appointmentDate,
      hours: '10:00',
      status: 'Ativo',
      image: 'local',
    },
    {
      id: '890',
      namePatient: 'Ana',
      pathology: ['Fisioterapia', 'Pilates'],
      date: appointmentDate,
      hours: '10:00',
      status: 'Ativo',
      image: 'local',
    },
  ]

  return (
    <Card>
      {appointments.map((appointment) => {
        const appointmentDay = format(appointment.date, 'dd/MM/yyyy', {
          locale: ptBR,
        })

        if (appointmentDay !== cardDay.date) return null

        return (
          <CardPatient
            key={appointment.id}
            appointment={appointment}
            isToDay={cardDay.isToday}
          />
        )
      })}
    </Card>
  )
}
```

### Como deve ficar

O componente deve receber os agendamentos por props e não criar fixtures durante o render. Para manter a comparação temporal consistente, a data da coluna deve usar uma chave ISO (`yyyy-MM-dd`) e o fuso do próprio agendamento.

```tsx
import type { Appointment, CardDayProps } from '@/@types/appointment'

function appointmentLocalDateKey(appointment: Appointment) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: appointment.timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(appointment.startsAt))
}

export function CardDay({
  date,
  isToday,
  dayWeek,
  appointments,
}: CardDayProps) {
  return (
    <Card data-day-week={dayWeek} data-today={isToday}>
      {appointments.map((appointment) => {
        if (appointmentLocalDateKey(appointment) !== date) return null

        return (
          <CardPatient
            key={appointment.id}
            appointment={appointment}
            isToday={isToday}
          />
        )
      })}
    </Card>
  )
}
```

Na implementação real, manter apenas uma linha de importação. Como `format` e `ptBR` deixam de ser usados para filtrar os agendamentos, eles também devem ser removidos:

```tsx
// Remover:
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'

// Manter/adicionar:
import type { Appointment, CardDayProps } from '@/@types/appointment'
```

### Observações

- O código visual da `Card` deve manter as classes atuais; o trecho acima mostra apenas a mudança de contrato e de origem dos dados.
- `dayWeek` continua disponível como metadado, mesmo que não altere a apresentação.
- Como o CodeGraph encontrou apenas o teste legado como consumidor de `CardDay`, a migração pode ser feita sem alterar a agenda ativa de `src/features/appointments`.

---

## 3. Atualizar `CardDayProps`

### Path

`src/@types/appointment.ts`

### Código atual

```ts
export interface CardDayProps {
  date: string
  isToday: boolean
  dayWeek: number
}
```

### Como deve ficar

```ts
export interface CardDayProps {
  /** Chave de data local no formato yyyy-MM-dd. */
  date: string
  isToday: boolean
  dayWeek: number
  appointments: Appointment[]
}
```

### Motivo

O componente precisa receber dados reais ou fixtures de teste pelo contrato. A coleção não deve ficar escondida dentro do componente.

---

## 4. Corrigir o nome da prop de hoje

### Path

`src/components/Card/CardDay/index.tsx`

### Código atual

```tsx
<CardPatient
  key={appointment.id}
  appointment={appointment}
  isToDay={cardDay.isToday}
/>
```

### Como deve ficar

```tsx
<CardPatient key={appointment.id} appointment={appointment} isToday={isToday} />
```

### Outros locais que devem ser atualizados

### Path

`src/components/__tests__/legacy-calendar-components.test.tsx`

### Código atual

```tsx
render(<CardPatient appointment={appointment} isToDay />)
```

### Como deve ficar

```tsx
render(<CardPatient appointment={appointment} isToday />)
```

Essa alteração evita que o valor seja recebido como uma prop desconhecida e garante que `data-today` use o booleano correto.

---

## 5. Migrar o fixture do teste legado para `Appointment`

### Path

`src/components/__tests__/legacy-calendar-components.test.tsx`

### Código atual

```tsx
const appointment = {
  id: 'appointment-a',
  namePatient: 'Ana Paciente',
  pathology: ['Fisioterapia', 'Pilates'],
  date: new Date('2026-08-13T12:00:00-04:00'),
  hours: '10:00',
  status: 'Cancelado',
}
```

### Como deve ficar

```tsx
import type { Appointment } from '@/@types/appointment'

const appointment: Appointment = {
  id: 'appointment-a',
  tenantId: 'tenant-test',
  unitId: 'unit-test',
  patient: {
    id: 'patient-a',
    name: 'Ana Paciente',
  },
  service: {
    id: 'service-fisio',
    name: 'Fisioterapia',
  },
  professional: null,
  startsAt: '2026-08-13T16:00:00.000Z',
  durationMinutes: 60,
  price: 120,
  status: 'CANCELADO',
  timeZone: 'America/Cuiaba',
  createdBy: 'user-test',
  createdAt: '2026-08-01T12:00:00.000Z',
  patientId: 'patient-a',
  pathology: ['Fisioterapia', 'Pilates'],
  appointmentDate: '2026-08-13T12:00:00',
  hours: '12:00:00',
  variant: 'primary',
  updatedAt: '2026-08-01T12:00:00.000Z',
}
```

### Motivo

O componente acessa `appointment.patient.name`, `appointment.startsAt` e `appointment.status`. Portanto, o fixture precisa ter a mesma estrutura do objeto que a API entrega.

---

## 6. Atualizar o teste de `CardDay`

### Path

`src/components/__tests__/legacy-calendar-components.test.tsx`

### Código atual

```tsx
it('filtra e apresenta os fixtures do dia informado', () => {
  render(
    <CardDay date={format(new Date(), 'dd/MM/yyyy')} isToday dayWeek={4} />,
  )

  expect(screen.getByText('Abmael')).toBeVisible()
  expect(screen.getByText('Ana')).toBeVisible()
})
```

### Como deve ficar

```tsx
const today = new Date()

const cardDayAppointments: Appointment[] = [
  {
    ...appointment,
    id: 'appointment-abmael',
    patient: { id: 'patient-abmael', name: 'Abmael' },
    startsAt: today.toISOString(),
    appointmentDate: today.toISOString(),
    hours: '10:00:00',
    status: 'AGENDADO',
  },
  {
    ...appointment,
    id: 'appointment-ana',
    patient: { id: 'patient-ana', name: 'Ana' },
    startsAt: today.toISOString(),
    appointmentDate: today.toISOString(),
    hours: '10:00:00',
    status: 'AGENDADO',
  },
]

it('filtra e apresenta os agendamentos do dia informado', () => {
  render(
    <CardDay
      date={format(today, 'yyyy-MM-dd')}
      isToday
      dayWeek={4}
      appointments={cardDayAppointments}
    />,
  )

  expect(screen.getByText('Abmael')).toBeVisible()
  expect(screen.getByText('Ana')).toBeVisible()
})
```

### Motivo

O teste deixa de depender de dados internos do componente e passa a verificar o comportamento real do contrato: uma lista de `Appointment` é filtrada pela data local.

---

## 7. Alinhar o conteúdo visual de `CardPatient`

### Path

`src/components/Card/CardPatient/cardPatient.tsx`

### Código atual

```tsx
<div className="flex w-full flex-col items-center justify-end">
  <h2>{appointment.patient.name}</h2>
  {/* <h3>{appointment.patient.pathology.join(', ')}</h3> */}
  <h3>{appointment.status}</h3>
</div>
```

### Como deve ficar

```tsx
<div className="flex w-full flex-col items-center justify-end">
  <h2>{appointment.patient.name}</h2>
  <h3>{appointment.service.name}</h3>
  <p>{presentation.label}</p>
</div>
```

### Motivo

O contrato atual identifica o atendimento por paciente, serviço e estado. A patologia é um dado legado e não deve substituir o serviço exibido no cartão.

### Path

`src/components/__tests__/legacy-calendar-components.test.tsx`

### Código atual

```tsx
expect(screen.getByText('Fisioterapia, Pilates')).toBeVisible()
```

### Como deve ficar

```tsx
expect(screen.getByText('Fisioterapia')).toBeVisible()
```

Também atualizar as consultas por nome acessível para aceitar o status anunciado no `aria-label`:

```tsx
const card = screen.getByRole('article', {
  name: /Agendamento de Ana Paciente/i,
})
```

---

## 8. Atualizar os cenários de status

### Path

`src/components/__tests__/legacy-calendar-components.test.tsx`

### Código atual

```tsx
it.each([
  ['Agendar', 'bg-white'],
  ['Agendado', 'bg-[#8d8d99]'],
  ['Concluido', 'bg-brand'],
  ['Cancelado', 'bg-[#121214]'],
  ['Falta', 'bg-appointment-missed'],
  ['Em atendimento', 'bg-appointment-rescheduled'],
  ['Reagendado', 'border-[#8d8d99]'],
  ['Ativo', 'bg-white'],
])('preserva o token visual do status legado %s', (status, token) => {
  render(
    <CardPatient appointment={{ ...appointment, status }} isToDay={false} />,
  )
})
```

### Como deve ficar

```tsx
it.each([
  ['AGENDADO', 'bg-[#8d8d99]'],
  ['FALTA', 'bg-appointment-rescheduled'],
  ['REAGENDADO', 'bg-[#121214]'],
  ['CANCELADO', 'bg-[#121214]'],
  ['EMATENDIMENTO', 'bg-brand'],
  ['FINALIZADO', 'bg-brand'],
] as const)('preserva o token visual do status %s', (status, token) => {
  render(
    <CardPatient appointment={{ ...appointment, status }} isToday={false} />,
  )

  const card = screen.getByRole('article', {
    name: 'Agendamento de Ana Paciente: ...',
  })

  expect(card).toHaveAttribute('data-status', status)
  expect(card).toHaveClass(token)
})
```

### Ajuste necessário no teste de acessibilidade

Como o componente anuncia o rótulo apresentado no `aria-label`, o nome esperado deve incluir o label canônico efetivamente configurado em `statusPresentation`.

Exemplo:

```tsx
const card = screen.getByRole('article', {
  name: /Agendamento de Ana Paciente: Cancelado/i,
})
```

### Importante

Os tokens acima refletem o mapa atualmente presente em `CardPatient`. Se a intenção for alinhar esse componente à paleta oficial de `weekly-appointments`, o mapa visual também deve ser atualizado para:

```tsx
const statusPresentation = {
  AGENDADO: {
    label: 'Aguardando atendimento',
    className: 'bg-appointment-yellow text-black',
  },
  FALTA: {
    label: 'Falta',
    className: 'bg-appointment-red text-white',
  },
  REAGENDADO: {
    label: 'Aguardando atendimento',
    className: 'bg-appointment-yellow text-black',
  },
  CANCELADO: {
    label: 'Cancelado',
    className: 'bg-appointment-graphite text-white',
  },
  EMATENDIMENTO: {
    label: 'Atendida',
    className: 'bg-appointment-green text-white',
  },
  FINALIZADO: {
    label: 'Atendida',
    className: 'bg-appointment-green text-white',
  },
} satisfies Record<AppointmentStatus, StatusPresentation>
```

Nesse segundo caso, os tokens esperados pelo teste devem ser alterados para os tokens oficiais da agenda.

---

## 9. Corrigir o uso de `.at(-1)`

### Path

`src/features/packages/pages/packages-page.test.tsx`

### Código atual

```tsx
await waitFor(() => expect(queries.at(-1)?.get('name')).toBe('fisioterapia'))
```

### Como deve ficar

```tsx
await waitFor(() =>
  expect(queries[queries.length - 1]?.get('name')).toBe('fisioterapia'),
)
```

### Motivo

O projeto usa `target` e `lib` `ES2020`. Essa alteração resolve o único uso de `.at` sem mudar o target global, o bundle ou a compatibilidade dos navegadores.

---

## 10. Manter o TypeScript em ES2020

### Path

`tsconfig.app.json`

### Código atual

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"]
  }
}
```

### Como deve ficar

Nenhuma alteração é necessária:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"]
  }
}
```

Não alterar `tsconfig.node.json` para resolver um erro originado nos arquivos incluídos por `tsconfig.app.json`.

---

## 11. Atualizar a documentação dos componentes legados

### Paths

- `src/components/Card/README.md`
- `src/components/Card/CardDay/README.md`
- `src/components/Card/CardPatient/README.md`

### Código/documentação atual

```md
CardDay: recebe dia/data, filtra a coleção local e renderiza atendimentos do dia.

CardDay monta dois objetos de agendamento em memória.

CardPatient documenta status como `Agendado`, `Concluido`, `Cancelado`, `Falta`,
`Em atendimento`, `Reagendado` e `Ativo`.
```

### Como deve ficar

```md
CardDay recebe uma coleção de `Appointment` por props, filtra os registros pela
data local e pelo fuso do agendamento e renderiza um `CardPatient` por registro.

O componente não cria fixtures nem consulta a API durante o render.

CardPatient recebe `Appointment` e usa exclusivamente os seis estados canônicos:
`AGENDADO`, `FALTA`, `REAGENDADO`, `CANCELADO`, `EMATENDIMENTO` e `FINALIZADO`.
```

Também registrar que a agenda ativa está em `src/features/appointments` e que os componentes em `src/components/Card` permanecem legados até uma eventual migração formal.

---

## 12. Não alterar dependências para resolver este build

### Path

`package.json`

### Mensagens do build

```text
npm warn deprecated har-validator@5.1.5
npm warn deprecated uuid@3.4.0
npm warn deprecated uuid@8.3.2
npm warn deprecated @faker-js/faker@5.5.3
```

### Como deve ficar

Nenhuma alteração de dependência deve ser feita nesta correção. Essas mensagens são avisos durante a instalação; o comando `npm install` conclui e o bloqueio real vem do TypeScript.

Uma atualização de dependências deve ser uma change separada, com avaliação de compatibilidade e testes próprios.

---

## 13. Atualizar o OpenSpec antes de implementar

### Path

`openspec/changes/<change-id>/`

### Estado atual

Não existe uma change específica para corrigir esses fixtures, o contrato legado e o teste de compilação de pacotes.

### Como deve ficar

Criar uma change própria antes de editar código, por exemplo:

```text
openspec/changes/corrigir-build-contratos-legados/
├── proposal.md
├── tasks.md
└── design.md             # opcional, se a decisão de migração do CardDay exigir
```

Como a correção não introduz requisito de negócio novo, pode ser registrada como mudança interna com `skip_specs: true`, conforme o `AGENTS.md`.

As tarefas devem cobrir:

```md
- [ ] Migrar `CardDay` para receber `Appointment[]`.
- [ ] Corrigir `isToDay` para `isToday`.
- [ ] Migrar fixtures e status dos testes legados.
- [ ] Substituir `.at(-1)` no teste de pacotes.
- [ ] Atualizar READMEs afetados.
- [ ] Executar build, lint e testes direcionados.
- [ ] Executar `openspec validate <change-id> --strict`.
```

---

## 14. Sequência recomendada de implementação

1. Criar e preencher a change OpenSpec.
2. Alterar `CardDayProps` para receber `appointments`.
3. Remover os fixtures hardcoded de `CardDay`.
4. Corrigir `isToDay` para `isToday` em componente e testes.
5. Migrar o fixture principal do teste para `Appointment`.
6. Migrar os cenários de status para `AppointmentStatus`.
7. Substituir `.at(-1)` pelo acesso compatível com `ES2020`.
8. Atualizar os READMEs.
9. Validar a change OpenSpec.

---

## 15. Verificação final

Executar na raiz do projeto:

```bash
npm run build
npm run lint
npm run test -- src/components/__tests__/legacy-calendar-components.test.tsx src/features/packages/pages/packages-page.test.tsx --reporter=dot
openspec validate <change-id> --strict
```

Resultado esperado:

- build sem `TS2740`, `TS2322` e `TS2550`;
- lint aprovado;
- teste de pacotes aprovado;
- teste legado sem erro de `appointment.patient.name`;
- nenhum fixture com `namePatient`, `date`, `image` ou status textual livre sendo enviado para `CardPatient`;
- nenhuma alteração de dependência ou API realizada como efeito colateral.
