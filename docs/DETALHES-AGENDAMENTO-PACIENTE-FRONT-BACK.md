# Detalhes do agendamento do paciente — frontend e backend

## 1. Identificação da entrega

Este documento consolida as duas changes que implementam o primeiro incremento do detalhe do agendamento do paciente:

| Camada | Change OpenSpec | Branch |
| --- | --- | --- |
| Frontend | `adicionar-detalhes-do-agendamento-paciente` | `feat/detalhe-agendamento-paciente` |
| Backend | `implementar-transicoes-e-monitoramento-de-status-de-agendamento` | `feat/detalhe-agendamento-paciente` |

Data de referência: 19/11/2026.

Repositórios envolvidos:

- Frontend: `agendamento-smart-web/agendamentos-smart`
- Backend: `api-agendamento-smart-api/agendamento-smart-api`

O objetivo é permitir que a agenda abra um modal com os detalhes do paciente e do atendimento e que, neste primeiro incremento, sejam realizadas somente as transições de início e cancelamento. A ausência automática é responsabilidade da API.

## 2. Visão geral do fluxo

```text
Cartão da agenda semanal
        |
        | clique ou Enter/Espaço
        v
AppointmentsPage
        |
        | mantém appointment selecionado
        v
AppointmentDetailsDialog
        |
        | PATCH /api/appointments/{id}/status
        | { status: "ATENDENDO" | "CANCELADO" }
        v
AppointmentController
        |
        v
AppointmentService
        |-- valida clínica, unidade, status atual e prazo
        |-- usa lock pessimista para a transição manual
        |-- persiste status, updatedAt e version
        v
AppointmentResponse atualizado
        |
        v
Frontend atualiza o modal e invalida Appointment/LIST

Monitor periódico da API
        |
        | a cada 60 segundos por padrão
        v
AGENDADO com startsAt <= agora - 10 minutos
        |
        | update condicional
        v
FALTA
```

A regra central é:

| Status persistido | Rótulo no frontend | Ação manual neste incremento |
| --- | --- | --- |
| `AGENDADO` | Aguardando atendimento | Iniciar ou cancelar |
| `ATENDENDO` | Atendimento iniciado | Nenhuma reversão pelo modal |
| `CANCELADO` | Cancelado | Nenhuma nova ação |
| `FALTA` | Falta | Estado automático; nenhuma ação |
| `FINALIZADO` | Atendida | Visível, porém conclusão fora do escopo |
| `REAGENDADO` | Reagendado | Mantido no tipo do frontend para compatibilidade, sem fluxo novo nesta change |

## 3. Escopo e não escopo

### Entregue

- Seleção de um cartão da agenda semanal.
- Modal acessível “Detalhes do agendamento”.
- Dados do paciente disponíveis no contrato atual.
- Data, horário, duração, serviço e profissional.
- Status inicial `AGENDADO` exibido como “Aguardando atendimento”.
- Ação `Iniciar agendamento`, enviando `ATENDENDO`.
- Ação `Cancelar agendamento`, habilitada somente enquanto o status é `AGENDADO`.
- Persistência das transições na API.
- Atualização do modal com a resposta autoritativa da API.
- Invalidação da lista semanal após sucesso.
- Estado `FALTA` automático após dez minutos, com reconciliação em background e durante as leituras.
- Mensagens de erro de domínio e de rede.
- Campos futuros visíveis como `Em breve` e desabilitados.
- Layout responsivo do modal, com empilhamento em viewport estreita.

### Fora do escopo

- Concluir ou marcar manualmente como `Atendida`/`FINALIZADO`.
- Editar ou remarcar agendamento.
- Cadastro completo do paciente.
- Telefone, e-mail, data de nascimento, sala e observações persistidas.
- Notificações.
- Auditoria de eventos.
- Alteração de permissões globais.
- Timer local do frontend para decidir `FALTA`.

---

# Parte I — Frontend

## 4. Frontend: intenção da change

### 4.1 Problema anterior

Antes da change, a agenda apresentava o cartão resumido do atendimento, mas não havia uma ação para abrir os detalhes. O frontend também não tinha:

- tipo específico para comando de status;
- mutação `PATCH /api/appointments/{id}/status`;
- modal de detalhe;
- mapeamento visual completo dos estados;
- tratamento específico dos erros da transição;
- handlers MSW para sucesso, conflito e erro de rede do status.

### 4.2 Decisões da spec

- A seleção permanece local em `AppointmentsPage`.
- Não foi criada uma rota `/appointments/:id`.
- O modal reutiliza o objeto `Appointment` já retornado pela agenda.
- A API é a autoridade sobre transições e `FALTA`.
- Não há atualização otimista.
- Campos ausentes não são preenchidos por inferência.
- A ação de início não possui reversão no modal.

## 5. Frontend: arquivos novos e atualizados

### Arquivo novo

```text
src/features/appointments/components/appointment-details-dialog.tsx
```

### Arquivos atualizados

```text
src/@types/appointment.ts
src/features/appointments/api/appointments.ts
src/features/appointments/model/appointment-errors.ts
src/features/appointments/pages/appointments-page.tsx
src/features/appointments/README.md
src/features/appointments/__tests__/appointments-page.integration.test.tsx
src/features/appointments/__tests__/appointment-details-dialog.integration.test.tsx
src/test/builders/appointment.ts
src/test/server.ts
```

## 6. Frontend: tipos de status e contrato

### Antes — `src/@types/appointment.ts`

O tipo tinha um estado legado diferente do contrato da API:

```ts
export type AppointmentStatus =
  | 'AGENDADO'
  | 'FALTA'
  | 'REAGENDADO'
  | 'CANCELADO'
  | 'EMATENDIMENTO'
  | 'FINALIZADO'
```

Não existia um tipo que limitasse os comandos manuais.

### Agora

```ts
export type AppointmentStatus =
  | 'AGENDADO'
  | 'ATENDENDO'
  | 'FALTA'
  | 'REAGENDADO'
  | 'CANCELADO'
  | 'FINALIZADO'

export type AppointmentStatusCommand = 'ATENDENDO' | 'CANCELADO'

export interface AppointmentDetailsDialogProps {
  appointment: Appointment | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onStatusUpdated: (appointment: Appointment) => void
}
```

### Por que foi adicionado

- `ATENDENDO` alinha o frontend ao valor persistido e exposto pela API.
- `AppointmentStatusCommand` impede, em tempo de compilação, o envio de `FALTA` ou `FINALIZADO` como comando manual.
- `AppointmentDetailsDialogProps` formaliza a comunicação entre a página, o modal e a resposta confirmada da API.

## 7. Frontend: mutação HTTP

### Antes — `src/features/appointments/api/appointments.ts`

O adaptador tinha somente a criação e a consulta:

```ts
createAppointment: builder.mutation<Appointment, CreateAppointmentInput>({
  query: (data) => ({
    url: '/api/appointments',
    method: 'POST',
    data,
  }),
  invalidatesTags: [{ type: 'Appointment', id: 'LIST' }],
}),
getAppointments: builder.query<
  Appointment[],
  { unitId: string; from: string; to: string }
>({
  query: (params) => ({ url: '/api/appointments', params }),
  transformResponse: (response: unknown) =>
    (response as AppointmentsResponse).content,
  providesTags: [{ type: 'Appointment', id: 'LIST' }],
}),
```

### Agora

```ts
import type {
  Appointment,
  AppointmentSession,
  AppointmentStatusCommand,
  CreateAppointmentInput,
  PatientOption,
  ProfessionalOption,
  ServiceOption,
  UnitOption,
} from '@/@types/appointment'
```

```ts
updateAppointmentStatus: builder.mutation<
  Appointment,
  { id: string; status: AppointmentStatusCommand }
>({
  query: ({ id, status }) => ({
    url: `/api/appointments/${id}/status`,
    method: 'PATCH',
    data: { status },
  }),
  invalidatesTags: [{ type: 'Appointment', id: 'LIST' }],
}),
```

```ts
export const {
  useCreateAppointmentMutation,
  useUpdateAppointmentStatusMutation,
  useGetAppointmentPatientsQuery,
  useGetAppointmentSessionQuery,
  useGetAppointmentsQuery,
  useGetPatientsQuery,
  useGetProfessionalsQuery,
  useGetServicesQuery,
  useGetUnitsQuery,
} = appointmentsApi
```

### Por que foi adicionado

- A mutação centraliza a URL, o método e o payload.
- O payload enviado é exatamente `{ status }`.
- A resposta esperada é um `Appointment` atualizado.
- A invalidação de `Appointment/LIST` força a agenda semanal a buscar o estado persistido.
- O frontend não modifica a cor do cartão antes da confirmação da API.

## 8. Frontend: mensagens de erro

### Antes — `src/features/appointments/model/appointment-errors.ts`

O mapa cobria somente erros de criação:

```ts
const messages: Record<string, string> = {
  PATIENT_APPOINTMENT_CONFLICT:
    'O paciente já possui outro agendamento nesse horário.',
  PROFESSIONAL_APPOINTMENT_CONFLICT:
    'O profissional já possui outro agendamento nesse horário.',
  SERVICE_CAPACITY_EXCEEDED:
    'A capacidade do serviço está esgotada nesse horário.',
  APPOINTMENT_OVERRIDE_FORBIDDEN:
    'Somente administradores podem alterar duração ou preço padrão.',
  TENANT_RESOURCE_NOT_FOUND:
    'Cadastro não encontrado para a clínica da sessão.',
  PROFESSIONAL_UNAVAILABLE_DAY: 'O profissional está indisponível nesse dia.',
}
```

### Agora

```ts
const messages: Record<string, string> = {
  PATIENT_APPOINTMENT_CONFLICT:
    'O paciente já possui outro agendamento nesse horário.',
  PROFESSIONAL_APPOINTMENT_CONFLICT:
    'O profissional já possui outro agendamento nesse horário.',
  SERVICE_CAPACITY_EXCEEDED:
    'A capacidade do serviço está esgotada nesse horário.',
  APPOINTMENT_OVERRIDE_FORBIDDEN:
    'Somente administradores podem alterar duração ou preço padrão.',
  TENANT_RESOURCE_NOT_FOUND:
    'Cadastro não encontrado para a clínica da sessão.',
  PROFESSIONAL_UNAVAILABLE_DAY: 'O profissional está indisponível nesse dia.',
  APPOINTMENT_STATUS_TRANSITION_INVALID:
    'Este agendamento não permite essa mudança de status.',
  APPOINTMENT_NO_SHOW_DEADLINE:
    'O prazo expirou e o agendamento foi marcado como falta.',
}
```

```ts
export function appointmentStatusErrorMessage(error: unknown) {
  const data =
    typeof error === 'object' && error !== null && 'data' in error
      ? error.data
      : undefined
  const code =
    typeof data === 'object' && data !== null && 'code' in data
      ? (data as AppointmentApiError).code
      : undefined
  const apiMessage =
    typeof data === 'object' && data !== null && 'message' in data
      ? (data as AppointmentApiError).message
      : undefined

  if (code && messages[code]) return messages[code]
  if (apiMessage) return apiMessage

  return 'Não foi possível atualizar o status. Tente novamente.'
}
```

### Por que foi adicionado

O backend diferencia uma transição inválida de um prazo expirado. O frontend agora preserva esses códigos para que a mensagem apresentada seja útil. O fallback continua existindo para falhas de rede, respostas inesperadas ou problemas de infraestrutura.

## 9. Frontend: seleção na agenda

### Antes — `AppointmentsPage`

O cartão era apenas um elemento visual:

```tsx
<article
  key={positioned.appointment.id}
  data-status={positioned.appointment.status}
  data-testid={`appointment-${positioned.appointment.id}`}
  aria-label={`${patientFullName}, ${positioned.appointment.service.name}, ${positioned.localTime}, ${statusLabel}`}
  title={`${patientFullName} — ${positioned.appointment.service.name} — ${statusLabel}`}
  onMouseEnter={() => setHoveredHour(appointmentHour)}
  onMouseLeave={() => setHoveredHour(null)}
>
```

Não havia agendamento selecionado nem componente de detalhes montado pela página.

### Agora — estado e abertura

```tsx
import type { AppointmentStatus } from '@/@types/appointment'
import type { Appointment } from '@/@types/appointment'
import { AppointmentDetailsDialog } from '../components/appointment-details-dialog'
```

```tsx
const [selectedAppointment, setSelectedAppointment] =
  useState<Appointment | null>(null)
```

```tsx
function openAppointmentDetails(appointment: Appointment) {
  setSelectedAppointment(appointment)
}
```

```tsx
<article
  key={positioned.appointment.id}
  data-status={positioned.appointment.status}
  data-testid={`appointment-${positioned.appointment.id}`}
  aria-label={`${patientFullName}, ${positioned.appointment.service.name}, ${positioned.localTime}, ${statusLabel}`}
  title={`${patientFullName} — ${positioned.appointment.service.name} — ${statusLabel}`}
  role="button"
  tabIndex={0}
  onClick={() => openAppointmentDetails(positioned.appointment)}
  onKeyDown={(event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openAppointmentDetails(positioned.appointment)
    }
  }}
  onMouseEnter={() => setHoveredHour(appointmentHour)}
  onMouseLeave={() => setHoveredHour(null)}
>
```

```tsx
<AppointmentDetailsDialog
  appointment={selectedAppointment}
  open={selectedAppointment !== null}
  onOpenChange={(open) => {
    if (!open) setSelectedAppointment(null)
  }}
  onStatusUpdated={setSelectedAppointment}
/>
```

### Por que foi adicionado

- `role="button"`, `tabIndex` e `onKeyDown` tornam o cartão acionável por teclado.
- O mesmo objeto selecionado é entregue ao modal, evitando consultar ou exibir outro paciente.
- O modal fecha por botão, overlay ou `Escape` por meio do componente `Dialog`.
- `onStatusUpdated` mantém no modal a resposta autoritativa devolvida pela API.

## 10. Frontend: mapeamento visual de status

```tsx
const appointmentStatusLabels = {
  AGENDADO: 'Aguardando atendimento',
  FALTA: 'Falta',
  REAGENDADO: 'Aguardando atendimento',
  CANCELADO: 'Cancelado',
  ATENDENDO: 'Atendimento iniciado',
  FINALIZADO: 'Atendida',
} satisfies Record<AppointmentStatus, string>
```

O cartão e o modal usam o mesmo contrato canônico. O nome visual “Atendida” não habilita a conclusão: `FINALIZADO` é somente leitura neste incremento.

## 11. Frontend: código novo completo do modal

Arquivo: `src/features/appointments/components/appointment-details-dialog.tsx`.

```tsx
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import {
  ArrowRight,
  CalendarDays,
  Cake,
  Check,
  CircleAlert,
  Clock3,
  FileText,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Trash2,
  UserRound,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import type {
  AppointmentDetailsDialogProps,
  AppointmentStatus,
  AppointmentStatusCommand,
} from '@/@types/appointment'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useUpdateAppointmentStatusMutation } from '@/features/appointments/api/appointments'
import { appointmentStatusErrorMessage } from '@/features/appointments/model/appointment-errors'
import { cn } from '@/lib/utils'

const statusPresentation: Record<
  AppointmentStatus,
  { label: string; className: string }
> = {
  AGENDADO: {
    label: 'Aguardando atendimento',
    className: 'border-[#f6c343] bg-[#fff1b8] text-[#4b3a00]',
  },
  ATENDENDO: {
    label: 'Atendimento iniciado',
    className: 'border-[#0b9b63] bg-[#dff7eb] text-[#075e46]',
  },
  CANCELADO: {
    label: 'Cancelado',
    className: 'border-[#343438] bg-[#ececef] text-[#29292e]',
  },
  FALTA: {
    label: 'Falta',
    className: 'border-[#e11d48] bg-[#ffe4e8] text-[#9f1239]',
  },
  FINALIZADO: {
    label: 'Atendida',
    className: 'border-[#0b9b63] bg-[#dff7eb] text-[#075e46]',
  },
  REAGENDADO: {
    label: 'Reagendado',
    className: 'border-[#c7ced7] bg-[#f4f6f8] text-[#53657a]',
  },
}

function appointmentDateLabel(appointmentDate: string) {
  return format(parseISO(appointmentDate), "d 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  })
}

function durationLabel(durationMinutes: number) {
  if (durationMinutes % 60 === 0) {
    const hours = durationMinutes / 60
    return `${hours} ${hours === 1 ? 'hora' : 'horas'}`
  }
  return `${durationMinutes} minutos`
}

function DisabledFeature({
  icon: Icon,
  label,
}: {
  icon: typeof Phone
  label: string
}) {
  return (
    <button
      type="button"
      disabled
      title="Em breve"
      className="flex w-full items-center gap-3 rounded-lg border border-dashed border-[#d7e2dc] px-3 py-2 text-left text-sm text-[#7a8c82] disabled:cursor-not-allowed disabled:opacity-70"
    >
      <Icon aria-hidden="true" className="size-4 shrink-0 text-[#6aa287]" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="shrink-0 text-xs font-semibold">Em breve</span>
    </button>
  )
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays
  label: string
  value: string
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 border-r border-[#e2ebe6] pr-4 last:border-r-0">
      <Icon
        aria-hidden="true"
        className="mt-0.5 size-5 shrink-0 text-[#087b52]"
      />
      <div className="min-w-0">
        <dt className="text-xs font-semibold text-[#53657a]">{label}</dt>
        <dd className="mt-1 truncate text-sm font-bold text-[#17202a]">
          {value}
        </dd>
      </div>
    </div>
  )
}

export function AppointmentDetailsDialog({
  appointment,
  open,
  onOpenChange,
  onStatusUpdated,
}: AppointmentDetailsDialogProps) {
  const [updateStatus, { isLoading }] = useUpdateAppointmentStatusMutation()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    setErrorMessage(null)
  }, [appointment?.id])

  if (!appointment) return null

  const currentAppointment = appointment
  const presentation = statusPresentation[currentAppointment.status]
  const canChangeStatus = currentAppointment.status === 'AGENDADO'
  const patientInitials = currentAppointment.patient.name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  async function changeStatus(status: AppointmentStatusCommand) {
    if (!canChangeStatus || isLoading) return

    setErrorMessage(null)
    try {
      const updated = await updateStatus({
        id: currentAppointment.id,
        status,
      }).unwrap()
      onStatusUpdated(updated)
    } catch (error) {
      setErrorMessage(appointmentStatusErrorMessage(error))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border-[#dfe9e4] bg-white p-0 text-[#17202a] shadow-[0_24px_70px_rgb(19_48_36_/_30%)] sm:max-w-[min(66rem,calc(100vw-2rem))]"
      >
        <DialogHeader className="border-b border-[#e0e9e4] px-6 py-5 pr-16 text-left sm:px-8">
          <div className="flex items-center gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#087b52] text-white shadow-[0_8px_18px_rgb(2_177_96_/_22%)]">
              <CalendarDays aria-hidden="true" className="size-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-[#132238] sm:text-2xl">
                Detalhes do agendamento
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-[#718196]">
                Consulte o atendimento e atualize o status permitido.
              </DialogDescription>
            </div>
          </div>
          <DialogClose asChild disabled={isLoading}>
            <button
              type="button"
              aria-label="Fechar detalhes do agendamento"
              className="absolute top-5 right-6 rounded-lg p-2 text-[#075e46] transition-colors hover:bg-[#e9f8f2] focus-visible:ring-2 focus-visible:ring-[#087b52] focus-visible:outline-none disabled:opacity-50"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </DialogClose>
        </DialogHeader>

        <div className="grid min-w-0 grid-cols-1 gap-5 px-4 py-5 sm:px-6 sm:py-6 xl:grid-cols-[19rem_minmax(0,1fr)] xl:px-8">
          <section
            className="min-w-0 rounded-2xl border border-[#dcebe3] bg-[#f3faf7] p-5"
            aria-labelledby="patient-details-title"
          >
            <h2
              id="patient-details-title"
              className="text-lg font-bold text-[#075e46]"
            >
              Paciente
            </h2>
            <div className="mt-5 flex items-center gap-3">
              <div className="grid size-14 shrink-0 place-items-center rounded-full bg-[#d9f6e5] text-lg font-bold text-[#087b52]">
                {patientInitials}
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-lg font-bold text-[#17202a]">
                  {appointment.patient.name}
                </h3>
                <p className="break-words text-sm text-[#53657a]">
                  ID: {appointment.patient.id}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-2 border-t border-[#dcebe3] pt-4">
              <DisabledFeature icon={Phone} label="Telefone" />
              <DisabledFeature icon={Mail} label="E-mail" />
              <DisabledFeature icon={Cake} label="Data de nascimento" />
            </div>

            <Button
              type="button"
              variant="outline"
              disabled
              className="mt-4 w-full justify-between border-[#cfe5d9] bg-white text-[#075e46]"
              title="Em breve"
            >
              <span className="flex min-w-0 items-center gap-2 truncate">
                <UserRound aria-hidden="true" className="size-4" />
                Ver cadastro completo
              </span>
              <span className="text-xs">Em breve</span>
            </Button>
          </section>

          <section
            className="min-w-0"
            aria-labelledby="appointment-details-title"
          >
            <div className="rounded-2xl border border-[#dcebe3] bg-[#f7fbf9] p-5">
              <h2
                id="appointment-details-title"
                className="text-lg font-bold text-[#075e46]"
              >
                Atendimento
              </h2>
              <dl className="mt-4 grid min-w-0 grid-cols-1 gap-4 rounded-xl border border-[#e0e9e4] bg-white p-4 sm:grid-cols-2 xl:grid-cols-4">
                <DetailItem
                  icon={CalendarDays}
                  label="Data"
                  value={appointmentDateLabel(appointment.appointmentDate)}
                />
                <DetailItem
                  icon={Clock3}
                  label="Horário"
                  value={`${appointment.hours.slice(0, 5)} (${durationLabel(appointment.durationMinutes)})`}
                />
                <DetailItem
                  icon={FileText}
                  label="Serviço"
                  value={appointment.service.name}
                />
                <DetailItem icon={MapPin} label="Sala" value="Em breve" />
              </dl>
            </div>

            <div className="mt-5">
              <h2 className="text-base font-bold text-[#075e46]">
                Status do atendimento
              </h2>
              <div
                className="mt-3 flex flex-wrap gap-2"
                role="group"
                aria-label="Status do atendimento"
              >
                <span
                  className={cn(
                    'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold',
                    presentation.className,
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="size-3 rounded-full border-2 border-current"
                  />
                  {presentation.label}
                </span>
                {appointment.professional ? (
                  <span className="inline-flex items-center gap-2 rounded-lg border border-[#dcebe3] bg-white px-3 py-2 text-sm text-[#53657a]">
                    Profissional: {appointment.professional.name}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="mt-5 grid gap-2 border-t border-[#e0e9e4] pt-4">
              <DisabledFeature icon={FileText} label="Observações" />
              <DisabledFeature icon={MapPin} label="Sala de atendimento" />
            </div>

            {errorMessage ? (
              <div
                className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                role="alert"
              >
                <CircleAlert
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0"
                />
                <span>{errorMessage}</span>
              </div>
            ) : null}
          </section>
        </div>

        <DialogFooter className="border-t border-[#e0e9e4] px-4 py-4 sm:px-6 xl:flex-row xl:items-center xl:justify-between xl:px-8">
          <div className="flex w-full flex-wrap gap-2 xl:w-auto">
            <Button
              type="button"
              variant="destructive"
              disabled={!canChangeStatus || isLoading}
              onClick={() => void changeStatus('CANCELADO')}
              title={
                !canChangeStatus
                  ? 'Disponível somente enquanto aguarda atendimento'
                  : undefined
              }
            >
              <Trash2 aria-hidden="true" className="size-4" />
              Cancelar agendamento
            </Button>
            <Button type="button" variant="outline" disabled title="Em breve">
              <Pencil aria-hidden="true" className="size-4" />
              Editar agendamento
              <span className="text-xs">Em breve</span>
            </Button>
          </div>
          <div className="flex w-full flex-wrap gap-2 xl:w-auto">
            <Button type="button" variant="outline" disabled title="Em breve">
              <Check aria-hidden="true" className="size-4" />
              Atendida
              <span className="text-xs">Em breve</span>
            </Button>
            <Button
              type="button"
              disabled={!canChangeStatus || isLoading}
              onClick={() => void changeStatus('ATENDENDO')}
              className="bg-[#087b52] text-white hover:bg-[#075e46]"
            >
              <ArrowRight aria-hidden="true" className="size-4" />
              {isLoading ? 'Salvando...' : 'Iniciar agendamento'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

## 12. Frontend: regras de habilitação

O modal usa uma única regra:

```tsx
const canChangeStatus = currentAppointment.status === 'AGENDADO'
```

Consequências:

- `AGENDADO`: iniciar e cancelar habilitados.
- `ATENDENDO`: iniciar e cancelar desabilitados.
- `CANCELADO`: iniciar e cancelar desabilitados.
- `FALTA`: iniciar e cancelar desabilitados.
- `FINALIZADO`: iniciar e cancelar desabilitados.
- `REAGENDADO`: iniciar e cancelar desabilitados.

Essa regra visual não substitui a autorização do backend. A API repete as validações no servidor.

## 13. Frontend: responsividade

O modal foi ajustado para evitar a sobreposição observada na referência:

```tsx
className="w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] overflow-y-auto ... sm:max-w-[min(66rem,calc(100vw-2rem))]"
```

```tsx
className="grid min-w-0 grid-cols-1 gap-5 ... xl:grid-cols-[19rem_minmax(0,1fr)]"
```

```tsx
className="... grid-cols-1 ... sm:grid-cols-2 xl:grid-cols-4"
```

```tsx
className="... xl:flex-row xl:items-center xl:justify-between ..."
```

O significado é:

- até `xl`: painel do paciente e painel do atendimento ficam empilhados;
- a grade de detalhes passa de uma coluna para duas e somente depois quatro;
- o rodapé quebra os grupos de ações em telas menores;
- a altura máxima acompanha a viewport e o conteúdo rola dentro do modal;
- `min-w-0`, `truncate` e `break-words` evitam que ID, nomes e valores forcem sobreposição.

## 14. Frontend: testes e fixtures

### Testes de detalhe

Arquivo: `src/features/appointments/__tests__/appointment-details-dialog.integration.test.tsx`.

Os cenários cobertos são:

1. apresenta os dados do paciente e desabilita recursos fora do escopo;
2. fecha com botão e `Escape` sem alterar o agendamento;
3. inicia o atendimento e bloqueia o cancelamento depois da transição;
4. permite cancelar somente enquanto aguarda atendimento;
5. mantém o estado quando a API recusa a transição e exibe o erro de domínio;
6. não permite ações manuais quando o status é `FALTA`.

### Servidor MSW

O cenário recebeu estado para a mutação:

```ts
interface ApiScenario {
  // ... estado já existente
  statusUpdateDelayMs: number
  statusUpdateErrorCode: string | null
  statusUpdateNetworkError: boolean
  statusUpdateRequests: { id: string; status: string }[]
}
```

O handler novo é:

```ts
http.patch(
  'http://localhost:8080/api/appointments/:id/status',
  async ({ params, request }) => {
    const payload = (await request.json()) as { status?: string }
    const id = String(params.id)
    apiScenario.statusUpdateRequests.push({
      id,
      status: String(payload.status),
    })

    if (apiScenario.statusUpdateDelayMs > 0) {
      await delay(apiScenario.statusUpdateDelayMs)
    }

    if (apiScenario.statusUpdateNetworkError) {
      return HttpResponse.error()
    }

    if (apiScenario.statusUpdateErrorCode) {
      return HttpResponse.json(
        {
          code: apiScenario.statusUpdateErrorCode,
          message: 'Alteração de status recusada pelo domínio',
          fieldErrors: {},
        },
        {
          status:
            apiScenario.statusUpdateErrorCode === 'TENANT_RESOURCE_NOT_FOUND'
              ? 404
              : 409,
        },
      )
    }

    const index = apiScenario.appointments.findIndex(
      (appointment) => appointment.id === id,
    )
    if (index < 0) {
      return HttpResponse.json(
        {
          code: 'TENANT_RESOURCE_NOT_FOUND',
          message: 'Cadastro não encontrado',
        },
        { status: 404 },
      )
    }

    const updatedAppointment = {
      ...apiScenario.appointments[index],
      status:
        payload.status as (typeof apiScenario.appointments)[number]['status'],
      updatedAt: '2026-08-13T16:00:00.000Z',
    }
    apiScenario.appointments[index] = updatedAppointment
    return HttpResponse.json(updatedAppointment)
  },
),
```

O handler permite testar sucesso, erro de domínio, recurso inexistente, atraso e falha de rede sem depender de um backend real.

---

# Parte II — Backend

## 15. Backend: intenção da change

### 15.1 Problema anterior

A API criava e consultava agendamentos, mas não tinha um endpoint para iniciar/cancelar nem uma rotina para transformar um agendamento vencido em falta. O frontend não poderia persistir o ciclo de vida apenas com estado local.

### 15.2 Decisões da spec

- Manter `ATENDENDO` como valor público.
- Adicionar `FALTA` ao enum e à constraint do banco.
- Expor somente `ATENDENDO` e `CANCELADO` como comandos manuais.
- Reservar `FALTA` para o reconciliador automático.
- Exigir o estado atual `AGENDADO` para os comandos manuais.
- Carregar o registro por clínica com lock pessimista.
- Usar `Instant` e `Clock` UTC para o limite temporal.
- Reconciliar em background e também durante `GET` de lista/detalhe.
- Atualizar somente linhas ainda `AGENDADO` no bulk update.
- Registrar observabilidade sem dados de paciente, tokens ou IDs de appointment.

## 16. Backend: arquivos novos e atualizados

### Arquivos novos

```text
src/main/java/com/agendamento/smart/config/TimeConfiguration.java
src/main/java/com/agendamento/smart/controller/appointment/AppointmentNoShowDeadlineException.java
src/main/java/com/agendamento/smart/dtos/appointment/AppointmentStatusRequest.java
src/main/java/com/agendamento/smart/service/appointment/AppointmentStatusMonitor.java
src/main/resources/db/migration/V014__add_appointment_no_show_status.sql
```

### Arquivos atualizados

```text
src/main/java/com/agendamento/smart/AgendaSmartApplication.java
src/main/java/com/agendamento/smart/controller/appointment/AppointmentController.java
src/main/java/com/agendamento/smart/infra/security/SecurityConfiguration.java
src/main/java/com/agendamento/smart/model/appointment/AppointmentStatus.java
src/main/java/com/agendamento/smart/repository/AppointmentRepository.java
src/main/java/com/agendamento/smart/service/appointment/AppointmentService.java
src/main/resources/application.yaml
docs/API_APPOINTMENTS.md
```

## 17. Backend: enum persistido

### Antes — `AppointmentStatus.java`

```java
public enum AppointmentStatus {
    AGENDADO,
    ATENDENDO,
    CANCELADO,
    FINALIZADO
}
```

### Agora

```java
public enum AppointmentStatus {
    AGENDADO,
    ATENDENDO,
    CANCELADO,
    FALTA,
    FINALIZADO
}
```

### Por que foi adicionado

`FALTA` é um estado persistido, não apenas uma apresentação visual. Isso permite que o resultado sobreviva a recarregamento, reinício da API, múltiplas instâncias e fechamento do modal.

## 18. Backend: endpoint de status

### Antes — `AppointmentController.java`

O controller expunha somente criação, listagem e consulta por ID:

```java
@GetMapping("/{id}")
public ResponseEntity<AppointmentResponse> findById(
        @PathVariable UUID id,
        @AuthenticationPrincipal User user) {
    return ResponseEntity.ok(service.findById(id, user));
}
```

Não havia DTO, `PATCH` ou chamada de service para status.

### Agora

Imports adicionados:

```java
import com.agendamento.smart.dtos.appointment.AppointmentStatusRequest;
import org.springframework.web.bind.annotation.PatchMapping;
```

Endpoint adicionado:

```java
@PatchMapping("/{id}/status")
public ResponseEntity<AppointmentResponse> updateStatus(
        @PathVariable UUID id,
        @Valid @RequestBody AppointmentStatusRequest request,
        @AuthenticationPrincipal User user) {
    return ResponseEntity.ok(service.updateStatus(id, request.status(), user));
}
```

### Por que foi adicionado

- O endpoint não aceita atualização genérica do appointment.
- O corpo contém somente o status pretendido.
- O usuário e a clínica vêm da sessão autenticada.
- A autorização de tenant, unidade e ciclo de vida fica no service.
- O retorno reutiliza `AppointmentResponse`, mantendo o mesmo contrato da leitura.

## 19. Backend: DTO novo

Arquivo: `src/main/java/com/agendamento/smart/dtos/appointment/AppointmentStatusRequest.java`.

```java
package com.agendamento.smart.dtos.appointment;

import com.agendamento.smart.model.appointment.AppointmentStatus;
import jakarta.validation.constraints.NotNull;

public record AppointmentStatusRequest(@NotNull AppointmentStatus status) {
}
```

O enum permite que Jackson reconheça os valores públicos, mas a regra de negócio do service restringe os comandos efetivos a `ATENDENDO` e `CANCELADO`. Assim, enviar `FALTA` diretamente não se torna uma forma manual de burlar o monitor.

## 20. Backend: repository, lock e reconciliação

### Antes — `AppointmentRepository.java`

O repository tinha busca simples por ID e clínica:

```java
Optional<Appointment> findByIdAndClinicId(UUID id, UUID clinicId);

Optional<Appointment> findByClinicIdAndIdempotencyKey(
        UUID clinicId, String idempotencyKey);

List<Appointment> findAllByClinicIdAndStartsAtIsNotNull(UUID clinicId);
```

Não havia lock pessimista nem atualização condicional de faltas.

### Agora — busca com lock

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("""
        select appointment
        from Appointment appointment
        where appointment.id = :id
          and appointment.clinic.id = :clinicId
        """)
Optional<Appointment> findByIdAndClinicIdForUpdate(
        @Param("id") UUID id,
        @Param("clinicId") UUID clinicId);
```

O lock serializa a disputa entre o clique de início/cancelamento e o monitor automático.

### Agora — contagem e bulk update

```java
long countByStatusAndStartsAtLessThanEqual(
        AppointmentStatus status,
        Instant cutoff);

long countByClinicIdAndStatusAndStartsAtLessThanEqual(
        UUID clinicId,
        AppointmentStatus status,
        Instant cutoff);
```

```java
@Modifying
@Query("""
        update Appointment appointment
           set appointment.status = :targetStatus,
               appointment.updatedAt = CURRENT_TIMESTAMP,
               appointment.version = appointment.version + 1
         where appointment.status = :currentStatus
           and appointment.startsAt <= :cutoff
        """)
int markOverdueAsNoShow(
        @Param("currentStatus") AppointmentStatus currentStatus,
        @Param("targetStatus") AppointmentStatus targetStatus,
        @Param("cutoff") Instant cutoff);
```

```java
@Modifying
@Query("""
        update Appointment appointment
           set appointment.status = :targetStatus,
               appointment.updatedAt = CURRENT_TIMESTAMP,
               appointment.version = appointment.version + 1
         where appointment.clinic.id = :clinicId
           and appointment.status = :currentStatus
           and appointment.startsAt <= :cutoff
        """)
int markClinicOverdueAsNoShow(
        @Param("clinicId") UUID clinicId,
        @Param("currentStatus") AppointmentStatus currentStatus,
        @Param("targetStatus") AppointmentStatus targetStatus,
        @Param("cutoff") Instant cutoff);
```

### Por que foi adicionado

- `where status = AGENDADO` garante que o monitor não reverta `ATENDENDO`, `CANCELADO` ou `FINALIZADO`.
- `startsAt <= cutoff` implementa exatamente o limite de dez minutos.
- `version = version + 1` mantém o controle otimista da entidade consistente.
- A operação é idempotente: a segunda execução não encontra mais uma linha `AGENDADO` já convertida.
- O índice `(status, starts_at)` reduz o custo de localizar candidatos.

## 21. Backend: service antes e depois

### Antes

O service usava diretamente o relógio do sistema na criação:

```java
if (!request.startsAt().isAfter(Instant.now())) {
    throw new DomainException(
            "APPOINTMENT_IN_THE_PAST",
            "Não é possível criar agendamento no passado.",
            HttpStatus.UNPROCESSABLE_ENTITY);
}
```

As leituras eram somente leitura:

```java
@Transactional(readOnly = true)
public AppointmentResponse findById(UUID id, User user) {
    // busca e validações
    return toResponse(appointment);
}

@Transactional(readOnly = true)
public List<AppointmentResponse> findAll(...) {
    // busca da lista
}
```

Não existia `updateStatus`, cutoff, reconciliação ou exceção de prazo.

### Agora — relógio e prazo

```java
private static final Duration NO_SHOW_GRACE_PERIOD = Duration.ofMinutes(10);

private final Clock clock;
```

```java
if (!request.startsAt().isAfter(clock.instant())) {
    throw new DomainException(
            "APPOINTMENT_IN_THE_PAST",
            "Não é possível criar agendamento no passado.",
            HttpStatus.UNPROCESSABLE_ENTITY);
}
```

O `Clock` foi injetado para que o limite seja determinístico em testes e consistente no processo.

### Agora — leitura reconciliada

```java
@Transactional
public AppointmentResponse findById(UUID id, User user) {
    Appointment appointment = appointmentRepository
            .findByIdAndClinicId(id, user.getClinic().getId())
            .orElseThrow(DomainException::tenantResourceNotFound);
    requireUserUnit(user, appointment.getUnit().getId());
    requireClinicReadable(appointment.getClinic());
    requireUnitReadable(appointment.getUnit());
    markAsNoShowIfOverdue(appointment, clock.instant());
    return toResponse(appointment);
}
```

```java
@Transactional
public List<AppointmentResponse> findAll(
        User user,
        UUID unitId,
        Instant from,
        Instant to) {
    UUID clinicId = user.getClinic().getId();
    Clinic clinic = clinicRepository.findById(clinicId)
            .orElseThrow(DomainException::tenantResourceNotFound);
    requireClinicReadable(clinic);
    requireValidRange(from, to);
    reconcileOverdueAppointments(clinicId, clock.instant());

    // seleção original da lista por unidade/papel permanece aqui
    // ...
}
```

A reconciliação durante a leitura reduz a janela em que a agenda poderia mostrar `AGENDADO` depois do prazo, mesmo se o scheduler ainda não tivesse executado.

### Agora — transição manual completa

```java
@Transactional(noRollbackFor = AppointmentNoShowDeadlineException.class)
public AppointmentResponse updateStatus(
        UUID id,
        AppointmentStatus requestedStatus,
        User user) {
    if (requestedStatus != AppointmentStatus.ATENDENDO
            && requestedStatus != AppointmentStatus.CANCELADO) {
        throw invalidStatusTransition();
    }

    Appointment appointment = appointmentRepository
            .findByIdAndClinicIdForUpdate(id, user.getClinic().getId())
            .orElseThrow(DomainException::tenantResourceNotFound);
    requireUserUnit(user, appointment.getUnit().getId());
    requireClinicReadable(appointment.getClinic());
    requireUnitReadable(appointment.getUnit());

    if (appointment.getStatus() != AppointmentStatus.AGENDADO) {
        throw invalidStatusTransition();
    }
    if (isNoShowDue(appointment, clock.instant())) {
        appointment.setStatus(AppointmentStatus.FALTA);
        appointmentRepository.saveAndFlush(appointment);
        throw new AppointmentNoShowDeadlineException();
    }

    appointment.setStatus(requestedStatus);
    return toResponse(appointmentRepository.saveAndFlush(appointment));
}
```

### Agora — métodos de reconciliação e erros

```java
@Transactional
public int reconcileOverdueAppointments(Instant now) {
    Instant cutoff = noShowCutoff(now);
    return appointmentRepository.markOverdueAsNoShow(
            AppointmentStatus.AGENDADO,
            AppointmentStatus.FALTA,
            cutoff);
}

@Transactional
public int reconcileOverdueAppointments(UUID clinicId, Instant now) {
    Instant cutoff = noShowCutoff(now);
    return appointmentRepository.markClinicOverdueAsNoShow(
            clinicId,
            AppointmentStatus.AGENDADO,
            AppointmentStatus.FALTA,
            cutoff);
}

@Transactional(readOnly = true)
public long countOverdueAppointments(Instant now) {
    return appointmentRepository.countByStatusAndStartsAtLessThanEqual(
            AppointmentStatus.AGENDADO,
            noShowCutoff(now));
}

private void markAsNoShowIfOverdue(Appointment appointment, Instant now) {
    if (isNoShowDue(appointment, now)) {
        appointment.setStatus(AppointmentStatus.FALTA);
        appointmentRepository.saveAndFlush(appointment);
    }
}

private boolean isNoShowDue(Appointment appointment, Instant now) {
    return appointment.getStatus() == AppointmentStatus.AGENDADO
            && appointment.getStartsAt() != null
            && !appointment.getStartsAt()
                    .plus(NO_SHOW_GRACE_PERIOD)
                    .isAfter(now);
}

private Instant noShowCutoff(Instant now) {
    return now.minus(NO_SHOW_GRACE_PERIOD);
}

private DomainException invalidStatusTransition() {
    return new DomainException(
            "APPOINTMENT_STATUS_TRANSITION_INVALID",
            "O agendamento não pode assumir o status solicitado.",
            HttpStatus.CONFLICT);
}
```

### Matriz de resposta do service

| Condição | Resultado |
| --- | --- |
| `AGENDADO` + `ATENDENDO` antes do limite | persiste `ATENDENDO`, HTTP 200 |
| `AGENDADO` + `CANCELADO` antes do limite | persiste `CANCELADO`, HTTP 200 |
| status atual diferente de `AGENDADO` | `APPOINTMENT_STATUS_TRANSITION_INVALID`, HTTP 409 |
| comando solicitado `FALTA` | `APPOINTMENT_STATUS_TRANSITION_INVALID`, HTTP 409 |
| `AGENDADO` após `startsAt + 10 min` | persiste `FALTA`, lança `APPOINTMENT_NO_SHOW_DEADLINE`, HTTP 409 |
| outro tenant | `TENANT_RESOURCE_NOT_FOUND`, HTTP 404 |
| usuário não administrador em outra unidade | `TENANT_RESOURCE_NOT_FOUND`, HTTP 404 |

## 22. Backend: exceção de prazo

Arquivo novo: `AppointmentNoShowDeadlineException.java`.

```java
package com.agendamento.smart.controller.appointment;

import com.agendamento.smart.controller.exception.DomainException;
import org.springframework.http.HttpStatus;

public class AppointmentNoShowDeadlineException extends DomainException {

    public AppointmentNoShowDeadlineException() {
        super(
                "APPOINTMENT_NO_SHOW_DEADLINE",
                "O prazo para iniciar ou cancelar o agendamento expirou; o status foi alterado para falta.",
                HttpStatus.CONFLICT);
    }
}
```

Ela existe para separar o conflito de prazo do conflito de ciclo de vida. O `noRollbackFor` garante que `FALTA` permaneça persistido antes da resposta HTTP 409.

## 23. Backend: monitor automático

Arquivo novo: `AppointmentStatusMonitor.java`.

```java
package com.agendamento.smart.service.appointment;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Instant;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(
        name = "appointments.status-monitor.enabled",
        havingValue = "true",
        matchIfMissing = true)
public class AppointmentStatusMonitor {

    private static final Logger log =
            LoggerFactory.getLogger(AppointmentStatusMonitor.class);

    private final AppointmentService appointmentService;
    private final Clock clock;

    @Scheduled(
            fixedDelayString = "${appointments.status-monitor.fixed-delay-ms:60000}",
            initialDelayString = "${appointments.status-monitor.initial-delay-ms:10000}")
    public void reconcileOverdueAppointments() {
        String runId = UUID.randomUUID().toString();
        Instant startedAt = clock.instant();
        long startedNanos = System.nanoTime();

        try {
            long candidates =
                    appointmentService.countOverdueAppointments(startedAt);
            int updated =
                    appointmentService.reconcileOverdueAppointments(startedAt);
            log.info(
                    "appointment_status_monitor runId={} startedAt={} durationMs={} candidates={} updated={}",
                    runId,
                    startedAt,
                    (System.nanoTime() - startedNanos) / 1_000_000,
                    candidates,
                    updated);
        } catch (Exception exception) {
            log.error(
                    "appointment_status_monitor runId={} startedAt={} durationMs={} errorType={}",
                    runId,
                    startedAt,
                    (System.nanoTime() - startedNanos) / 1_000_000,
                    exception.getClass().getSimpleName());
        }
    }
}
```

### Como o monitor funciona

1. O scheduler inicia após `initial-delay-ms`.
2. Obtém um `Instant` UTC do `Clock` injetado.
3. Calcula `cutoff = agora - 10 minutos`.
4. Conta candidatos ainda `AGENDADO` com `startsAt <= cutoff`.
5. Executa atualização condicional para `FALTA`.
6. Incrementa `version` e atualiza `updatedAt`.
7. Registra `candidates`, `updated`, duração e `runId`.
8. Em falha, registra somente o tipo da exceção e permite que a próxima rodada tente novamente.

### SQL observado no log

O SQL informado no diagnóstico:

```sql
update APPOINTMENT
set status=?, updated_at=localtimestamp, version=(version+1)
where clinic_id=?
  and status=?
  and starts_at<=?
```

é a tradução Hibernate da atualização condicional do monitor por clínica. Ele não é o `PATCH` manual e não contém o ID do appointment clicado.

## 24. Backend: habilitação do scheduler

### Antes — `AgendaSmartApplication.java`

```java
@SpringBootApplication
@EnableJpaAuditing
public class AgendaSmartApplication {
```

### Agora

```java
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableJpaAuditing
@EnableScheduling
public class AgendaSmartApplication {
```

Sem `@EnableScheduling`, o método anotado com `@Scheduled` não seria executado.

## 25. Backend: Clock configurável para teste

Arquivo novo: `TimeConfiguration.java`.

```java
package com.agendamento.smart.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

@Configuration
public class TimeConfiguration {

    @Bean
    public Clock appointmentClock() {
        return Clock.systemUTC();
    }
}
```

O `Clock` em bean permite substituir o relógio por `Clock.fixed(...)` nos testes de fronteira, sem alterar a lógica de produção.

## 26. Backend: configuração operacional

### Antes — `application.yaml`

Não havia configuração específica para o monitor de status.

### Agora

```yaml
appointments:
  status-monitor:
    enabled: ${APPOINTMENTS_STATUS_MONITOR_ENABLED:true}
    fixed-delay-ms: ${APPOINTMENTS_STATUS_MONITOR_FIXED_DELAY_MS:60000}
    initial-delay-ms: ${APPOINTMENTS_STATUS_MONITOR_INITIAL_DELAY_MS:10000}
```

Valores padrão:

- monitor habilitado;
- primeira execução após 10 segundos;
- intervalo de 60 segundos entre execuções.

Para um ambiente controlado, as propriedades podem ser substituídas por variáveis de ambiente sem recompilar a API.

## 27. Backend: migration do banco

Arquivo novo: `V014__add_appointment_no_show_status.sql`.

```sql
ALTER TABLE APPOINTMENT
    DROP CONSTRAINT chk_appointment_status;

ALTER TABLE APPOINTMENT
    ADD CONSTRAINT chk_appointment_status
        CHECK (status IN ('AGENDADO', 'ATENDENDO', 'CANCELADO', 'FALTA', 'FINALIZADO'));

CREATE INDEX idx_appointment_status_start
    ON APPOINTMENT (status, starts_at);
```

A migration não converte registros históricos. Ela apenas permite que o novo estado seja armazenado e cria o índice usado pelo monitor.

## 28. Backend: CORS e o erro `403` do DevTools

### Código anterior

```java
config.setAllowedMethods(List.of(
        "GET", "POST", "PUT", "DELETE", "OPTIONS"));
```

### Código atual na branch

```java
config.setAllowedMethods(List.of(
        "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
```

### Evidência do erro

O DevTools mostrou:

```text
Request URL: http://localhost:8080/api/appointments/245413bf-d9b8-4321-839b-4bae92af682c/status
Request Method: OPTIONS
Status Code: 403 Forbidden
Access-Control-Allow-Origin: http://localhost:3000
```

O navegador enviou preflight porque o frontend chama:

```text
PATCH /api/appointments/{id}/status
```

Como a API em execução não anunciava `PATCH` em `Access-Control-Allow-Methods`, o preflight foi rejeitado. O `PATCH` real não chegou ao `AppointmentController`.

### Consequência

O erro genérico exibido no modal não era um conflito de status nem o prazo de dez minutos. Era uma falha de infraestrutura de CORS anterior à regra de negócio.

### Atenção ao processo em execução

A branch atual já possui `PATCH` na lista de métodos permitidos, mas o DevTools ainda mostrou a resposta antiga. Isso indica que o processo/contêiner da API provavelmente estava executando uma compilação anterior. Depois de aplicar a alteração, é necessário recompilar e reiniciar a API para que a configuração atual seja carregada.

O teste esperado após reiniciar é:

```text
OPTIONS /api/appointments/{id}/status -> 200/204
PATCH   /api/appointments/{id}/status -> 200, 409 ou 404 conforme o domínio
```

O `GET /api/appointments` com `403` é independente do preflight do `PATCH`. Para esse caso, deve-se verificar nos Request Headers se o cookie HTTP-only `jwt` está sendo enviado e se a sessão ainda é válida. A regra de segurança da listagem exige `ROLE_ADMIN` ou `ROLE_USER`.

## 29. Contrato HTTP do backend

### Requisição

```http
PATCH /api/appointments/{id}/status
Content-Type: application/json
Cookie: jwt=<cookie-http-only>
```

```json
{
  "status": "ATENDENDO"
}
```

### Sucesso

```text
HTTP 200 OK
```

Corpo: `AppointmentResponse` com o status persistido.

### Erros de domínio

```json
{
  "code": "APPOINTMENT_STATUS_TRANSITION_INVALID",
  "message": "O agendamento não pode assumir o status solicitado.",
  "fieldErrors": {}
}
```

```json
{
  "code": "APPOINTMENT_NO_SHOW_DEADLINE",
  "message": "O prazo para iniciar ou cancelar o agendamento expirou; o status foi alterado para falta.",
  "fieldErrors": {}
}
```

## 30. Concorrência e idempotência

### Início manual contra monitor

```text
Comando manual obtém lock primeiro
  -> status ainda é AGENDADO
  -> dentro do prazo
  -> persiste ATENDENDO
  -> monitor não encontra AGENDADO

Monitor atualiza primeiro
  -> persiste FALTA
  -> comando manual obtém o registro
  -> status já não é AGENDADO
  -> retorna conflito
```

### Duas execuções do monitor

O `UPDATE` contém `status = AGENDADO`. A primeira execução transforma em `FALTA`; a segunda não atualiza novamente o mesmo registro. O resultado final permanece `FALTA`.

## 31. Testes do backend

### Cenários HTTP/transacionais

Arquivo: `src/test/java/com/agendamento/smart/controller/appointment/AppointmentReadStatusIntegrationTest.java`.

Foram adicionados cenários para:

- iniciar um appointment e rejeitar uma segunda transição;
- cancelar enquanto o appointment está aguardando;
- impedir acesso de outra clínica;
- marcar um appointment vencido como `FALTA` e rejeitar início tardio;
- rejeitar `FALTA` como comando manual;
- executar duas rodadas concorrentes do monitor;
- registrar log operacional sem o ID do appointment;
- validar exatamente o limite de dez minutos.

### Testes do monitor

Arquivo: `src/test/java/com/agendamento/smart/service/appointment/AppointmentStatusMonitorTest.java`.

Cobertura:

- rodada bem-sucedida com contadores operacionais;
- falha registrada por tipo e possibilidade de nova rodada.

### Clock controlado

O teste importa uma configuração com relógio fixo:

```java
@TestConfiguration(proxyBeanMethods = false)
static class FixedClockConfiguration {

    @Bean
    @Primary
    Clock appointmentTestClock() {
        return Clock.fixed(TEST_NOW, ZoneOffset.UTC);
    }
}
```

Isso permite testar o instante imediatamente anterior ao limite, exatamente no limite e depois do limite sem depender do relógio real.

## 32. Verificações registradas

### Frontend

Registrado na change frontend:

- testes direcionados da feature de appointments: aprovados;
- `npm run lint`: aprovado;
- `npm run build`: aprovado na validação da change;
- `openspec validate adicionar-detalhes-do-agendamento-paciente --strict`: aprovado.

Os testes cobrem abertura, fechamento, dados indisponíveis, transições, erros, `FALTA` e não regressão do fluxo de criação.

### Backend

Registrado na change backend:

- PostgreSQL descartável e suíte direcionada de appointments/monitor: aprovados;
- `openspec validate implementar-transicoes-e-monitoramento-de-status-de-agendamento --strict`: registrado como aprovado;
- `./mvnw clean verify`: pendente por falha preexistente em `ClinicStructureEndToEndIntegrationTest.runsTwoClinicWorkflowWithInitialTeamLinksAndIsolatedAppointmentSearches`, que espera HTTP 200 no cadastro de paciente enquanto o endpoint atual responde HTTP 201.

Essa falha de `ClinicStructureEndToEndIntegrationTest` não pertence ao fluxo de status do appointment.

## 33. Checklist de integração local

1. Confirmar que a API está na branch `feat/detalhe-agendamento-paciente`.
2. Recompilar/reiniciar a API após a inclusão de `PATCH` no CORS.
3. Confirmar no DevTools que o preflight `OPTIONS` retorna sucesso.
4. Confirmar que o `PATCH` real aparece no Network.
5. Confirmar que o payload é `{"status":"ATENDENDO"}` ou `{"status":"CANCELADO"}`.
6. Confirmar que a resposta de sucesso retorna o `AppointmentResponse` atualizado.
7. Confirmar que o `GET /api/appointments` recebe o cookie `jwt` e não retorna `403` por sessão ausente/expirada.
8. Confirmar que o monitor registra uma linha `appointment_status_monitor` por rodada.
9. Confirmar que nenhum log contém paciente, token ou appointment ID.
10. Confirmar que um agendamento vencido aparece como `FALTA` após a leitura, mesmo sem aguardar o próximo ciclo do scheduler.

## 34. Estado final e limitações conhecidas

- A mudança de status está implementada no contrato e no código das duas camadas.
- O bloqueio observado no DevTools é de CORS e ocorre antes do domínio.
- A configuração atual da branch já inclui `PATCH`; o processo em execução precisa ser atualizado.
- O `GET` com `403` deve ser diagnosticado separadamente verificando cookie/sessão e autoridade.
- `FALTA` não deve ser enviado pelo frontend como comando manual.
- O backend continua sendo a fonte definitiva para status, prazo, tenant e unidade.
- Os recursos marcados `Em breve` não fazem chamadas HTTP e não alteram o appointment.
- O documento descreve a implementação atual e não transforma os recursos fora do escopo em funcionalidades entregues.
