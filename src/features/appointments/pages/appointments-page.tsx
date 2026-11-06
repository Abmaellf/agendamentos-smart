import { addDays, format, startOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import {
  CircleAlert,
  LoaderCircle,
} from 'lucide-react'
import { useMemo } from 'react'
import { Helmet } from 'react-helmet-async'

import type { Appointment, AppointmentStatus } from '@/@types/appointment'
import { useAppShellDate } from '@/_layout/app-shell-context'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  useGetAppointmentSessionQuery,
  useGetAppointmentsQuery,
} from '@/features/appointments/api/appointments'
import { cn } from '@/lib/utils'

const feedbackPanelClassName =
  'mx-4 mt-3 mb-2 rounded-[0.35rem] border-brand/10 bg-white bg-[linear-gradient(135deg,#fff_0%,#f4faf7_100%)] px-4 py-3 text-[#4f4d4a]'

const appointmentStatusClassNames = {
  AGENDADO:
    'bg-appointment-scheduled bg-[linear-gradient(135deg,var(--appointment-scheduled)_0%,var(--appointment-scheduled-strong)_100%)]',
  FALTA:
    'bg-appointment-missed bg-[linear-gradient(135deg,var(--appointment-missed)_0%,var(--appointment-missed-strong)_100%)]',
  REAGENDADO:
    'bg-appointment-rescheduled bg-[linear-gradient(135deg,var(--appointment-rescheduled)_0%,var(--appointment-rescheduled-strong)_100%)]',
  CANCELADO:
    'bg-appointment-canceled bg-[linear-gradient(135deg,var(--appointment-canceled)_0%,var(--appointment-canceled-strong)_100%)]',
  EMATENDIMENTO:
    'bg-appointment-in-progress bg-[linear-gradient(135deg,var(--appointment-in-progress-highlight)_0%,var(--appointment-in-progress-strong)_100%)]',
  FINALIZADO:
    'bg-appointment-completed bg-[linear-gradient(135deg,var(--appointment-completed)_0%,var(--appointment-completed-strong)_100%)]',
} satisfies Record<AppointmentStatus, string>

function localDateParts(instant: string, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(instant))
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  )
  return `${values.year}-${values.month}-${values.day}`
}

function localTime(appointment: Appointment) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: appointment.timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(appointment.startsAt))
}

function currency(value: string) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value))
}

function capitalize(value: string) {
  return value.charAt(0).toLocaleUpperCase('pt-BR') + value.slice(1)
}

function dayLabel(date: Date) {
  const weekDay = format(date, 'EEEE', { locale: ptBR }).replace('-feira', '')
  return `${capitalize(weekDay)} - ${format(date, 'd')}`
}

export function AppointmentsPage() {
  const { selectedDate } = useAppShellDate()
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
  const weekEnd = addDays(weekStart, 7)

  const days = useMemo(
    () =>
      Array.from({ length: 5 }, (_, index) => {
        const date = addDays(weekStart, index)
        return {
          key: format(date, 'yyyy-MM-dd'),
          label: dayLabel(date),
        }
      }),
    [weekStart],
  )

  const sessionQuery = useGetAppointmentSessionQuery()
  const session = sessionQuery.data
  const appointmentsQuery = useGetAppointmentsQuery(
    {
      unitId: session?.activeUnitId ?? '',
      from: weekStart.toISOString(),
      to: weekEnd.toISOString(),
    },
    { skip: !session },
  )

  const loading = sessionQuery.isLoading || appointmentsQuery.isLoading
  const failed = sessionQuery.isError || appointmentsQuery.isError
  const appointments = appointmentsQuery.data ?? []

  function retry() {
    void sessionQuery.refetch()
    if (session) void appointmentsQuery.refetch()
  }

  return (
    <>
      <main className="bg-agenda-surface flex min-h-[calc(100vh-5rem)] flex-col gap-1 bg-[linear-gradient(135deg,var(--agenda-surface-strong)_0%,#303236_100%)] pb-4">
        <Helmet title="Agendamentos" />
        <header className="flex items-center justify-between gap-4 bg-white px-[clamp(1rem,5vw,6.25rem)] py-5 text-[#20382d] shadow-[0_2px_5px_rgb(0_0_0_/_12%)] max-[720px]:px-4">
          <div>
            <h1 className="text-[clamp(1.35rem,2vw,1.8rem)] font-bold tracking-tight">
              Agendamentos
            </h1>
            <p className="mt-1 text-sm text-[#71877b]">
              Visualize e gerencie os atendimentos da semana.
            </p>
          </div>
        </header>

        {loading ? (
          <Alert role="status" className={feedbackPanelClassName}>
            <LoaderCircle
              aria-hidden="true"
              className="text-brand animate-spin"
            />
            <AlertTitle>Carregando agenda...</AlertTitle>
          </Alert>
        ) : null}

        {failed ? (
          <Alert className={feedbackPanelClassName}>
            <CircleAlert aria-hidden="true" className="text-destructive" />
            <AlertTitle>Não foi possível carregar a agenda.</AlertTitle>
            <AlertDescription>
              <Button type="button" className="mt-2" onClick={retry}>
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        {!loading && !failed && appointments.length === 0 ? (
          <Card className={`${feedbackPanelClassName} gap-0 shadow-none`}>
            <CardContent className="p-0 text-center">
              Nenhum agendamento nesta semana.
            </CardContent>
          </Card>
        ) : null}

        {!loading && !failed ? (
          <div className="bg-agenda-surface grid min-h-[clamp(26rem,58vh,34rem)] snap-x snap-proximity grid-cols-[repeat(5,minmax(12rem,1fr))] gap-1 overflow-x-auto bg-[linear-gradient(135deg,var(--agenda-surface-strong)_0%,#303236_100%)]">
            {days.map((day) => {
              const appointmentsOfDay = appointments
                .filter(
                  (appointment) =>
                    localDateParts(
                      appointment.startsAt,
                      appointment.timeZone,
                    ) === day.key,
                )
                .sort((first, second) =>
                  first.startsAt.localeCompare(second.startsAt),
                )
              const isSelected = day.key === format(selectedDate, 'yyyy-MM-dd')

              return (
                <section
                  key={day.key}
                  aria-labelledby={`appointments-day-${day.key}`}
                  data-selected={isSelected}
                  className={cn(
                    'flex min-w-0 snap-start flex-col items-center rounded-b-[0.85rem] px-[clamp(0.5rem,1vw,1rem)] pt-3 pb-5 shadow-[inset_0_1px_0_rgb(255_255_255_/_45%)]',
                    isSelected
                      ? 'bg-[#92999b] bg-[linear-gradient(160deg,#a6aeb0_0%,#92999b_48%,#858d8f_100%)]'
                      : 'bg-white bg-[linear-gradient(180deg,#fff_0%,#fbfcfc_65%,#f1f5f3_100%)]',
                  )}
                >
                  <h2
                    id={`appointments-day-${day.key}`}
                    className="relative min-h-[3.25rem] w-full overflow-hidden border border-[#4f4d4a]/[0.08] bg-white bg-[linear-gradient(135deg,#fff_0%,#f4f7f5_100%)] px-3 py-[0.55rem] text-center text-[clamp(1.15rem,2vw,1.65rem)] leading-[1.35] font-bold text-[#6f7374] capitalize shadow-[0_5px_12px_rgb(33_35_36_/_14%)] after:absolute after:right-[18%] after:bottom-0 after:left-[18%] after:h-0.5 after:rounded-full after:bg-[linear-gradient(90deg,transparent,var(--brand),transparent)] after:opacity-55 after:content-['']"
                  >
                    {day.label}
                  </h2>
                  <div className="mt-7 flex w-full flex-col gap-[0.4rem]">
                    {appointmentsOfDay.map((appointment) => (
                      <article key={appointment.id}>
                        <Card
                          data-status={appointment.status}
                          data-testid={`appointment-${appointment.id}`}
                          className={cn(
                            "relative isolate grid min-h-22 w-full grid-cols-[40%_60%] gap-0 overflow-hidden rounded-[0.35rem] border border-white/70 py-0 text-sm text-white shadow-[0_8px_18px_rgb(32_32_36_/_16%),inset_0_1px_0_rgb(255_255_255_/_18%)] transition-[transform,box-shadow,filter] duration-[160ms] after:pointer-events-none after:absolute after:-top-12 after:-right-10 after:-z-10 after:size-28 after:rounded-full after:bg-[radial-gradient(circle,rgb(255_255_255_/_14%),transparent_68%)] after:content-[''] hover:z-[1] hover:-translate-y-0.5 hover:saturate-[1.04] hover:shadow-[0_11px_22px_rgb(32_32_36_/_22%),inset_0_1px_0_rgb(255_255_255_/_22%)]",
                            appointmentStatusClassNames[appointment.status],
                          )}
                        >
                          <time
                            dateTime={appointment.startsAt}
                            aria-label={`Horário: ${localTime(appointment)}`}
                            className="grid place-items-center border-r border-white/90 bg-black/[0.04] px-2 py-3 text-base font-bold"
                          >
                            {localTime(appointment)}
                          </time>
                          <CardContent className="flex min-w-0 flex-col justify-center gap-[0.15rem] px-3 py-[0.65rem]">
                            <strong className="truncate text-[0.9rem]">
                              {appointment.patient.name}
                            </strong>
                            <span className="truncate">
                              {appointment.service.name}
                            </span>
                            <span className="sr-only">
                              {appointment.status}
                            </span>
                            <span className="sr-only">
                              {appointment.durationMinutes} min
                            </span>
                            <span className="sr-only">
                              {currency(appointment.price)}
                            </span>
                          </CardContent>
                        </Card>
                      </article>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        ) : null}
      </main>
    </>
  )
}
