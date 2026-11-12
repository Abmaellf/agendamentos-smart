import { addDays, format, startOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import {
  CalendarDays,
  CalendarRange,
  CircleAlert,
  List,
  LoaderCircle,
} from 'lucide-react'
import { useMemo } from 'react'
import { Helmet } from 'react-helmet-async'

import type { AppointmentStatus } from '@/@types/appointment'
import { useAppShellDate } from '@/_layout/app-shell-context'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  useGetAppointmentSessionQuery,
  useGetAppointmentsQuery,
} from '@/features/appointments/api/appointments'
import { cn } from '@/lib/utils'

import {
  buildWeeklyAppointmentGrid,
  WEEK_GRID_END_HOUR,
  WEEK_GRID_END_MINUTES,
  WEEK_GRID_START_HOUR,
  WEEK_GRID_START_MINUTES,
} from '../model/weekly-grid'

const feedbackPanelClassName =
  'mx-4 mt-3 mb-2 rounded-[0.35rem] border-brand/10 bg-white bg-[linear-gradient(135deg,#fff_0%,#f4faf7_100%)] px-4 py-3 text-[#4f4d4a]'

const appointmentStatusClassNames = {
  AGENDADO: 'bg-appointment-yellow text-black',
  FALTA: 'bg-appointment-red text-white',
  REAGENDADO: 'bg-appointment-yellow text-black',
  CANCELADO: 'bg-appointment-graphite text-white',
  EMATENDIMENTO: 'bg-appointment-green text-white',
  FINALIZADO: 'bg-appointment-green text-white',
} satisfies Record<AppointmentStatus, string>

const HOUR_HEIGHT_PX = 64
const MINUTE_HEIGHT_PX = HOUR_HEIGHT_PX / 60

const appointmentStatusLabels = {
  AGENDADO: 'Aguardando atendimento',
  FALTA: 'Falta',
  REAGENDADO: 'Aguardando atendimento',
  CANCELADO: 'Cancelado',
  EMATENDIMENTO: 'Atendida',
  FINALIZADO: 'Atendida',
} satisfies Record<AppointmentStatus, string>

const legendItems = [
  {
    label: 'Aguardando atendimento',
    description: 'Paciente agendado',
    colorClassName: 'bg-appointment-yellow',
  },
  {
    label: 'Atendida',
    description: 'Atendimento realizado',
    colorClassName: 'bg-appointment-green',
  },
  {
    label: 'Cancelado',
    description: 'Agendamento cancelado',
    colorClassName: 'bg-appointment-graphite',
  },
  {
    label: 'Falta',
    description: 'Paciente não compareceu',
    colorClassName: 'bg-appointment-red',
  },
] as const

function currency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value))
}

function capitalize(value: string) {
  return value.charAt(0).toLocaleUpperCase('pt-BR') + value.slice(1)
}

function dayName(date: Date) {
  const weekDay = format(date, 'EEEE', { locale: ptBR }).replace('-feira', '')
  return capitalize(weekDay)
}

function dayDateLabel(date: Date) {
  return `${format(date, 'd')} de ${capitalize(format(date, 'MMMM', { locale: ptBR }))}`
}

export function AppointmentsPage() {
  const { selectedDate } = useAppShellDate()
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
  const weekEnd = addDays(weekStart, 7)

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
  const weeklyGrid = useMemo(
    () => buildWeeklyAppointmentGrid(appointments, weekStart),
    [appointments, weekStart],
  )
  const selectedDayKey = format(selectedDate, 'yyyy-MM-dd')
  const todayKey = format(new Date(), 'yyyy-MM-dd')
  const hourLabels = Array.from(
    { length: WEEK_GRID_END_HOUR - WEEK_GRID_START_HOUR + 1 },
    (_, index) => WEEK_GRID_START_HOUR + index,
  )
  const maxAppointmentEndMinutes = weeklyGrid
    .flatMap((day) => day.appointments)
    .reduce(
      (latest, appointment) => Math.max(latest, appointment.endMinutes),
      WEEK_GRID_END_MINUTES,
    )
  const matrixHeight = Math.max(
    hourLabels.length * HOUR_HEIGHT_PX,
    (maxAppointmentEndMinutes - WEEK_GRID_START_MINUTES) * MINUTE_HEIGHT_PX,
  )

  function retry() {
    void sessionQuery.refetch()
    if (session) void appointmentsQuery.refetch()
  }

  return (
    <>
      <main className="flex min-h-[calc(100vh-5rem)] flex-col gap-1 bg-[#f4f8fa] pb-6">
        <Helmet title="Agendamentos" />
        <header
          data-testid="appointments-header"
          className="flex flex-wrap items-center justify-between gap-5 bg-white px-[clamp(1rem,5vw,6.25rem)] py-5 text-[#20382d] shadow-[0_2px_5px_rgb(0_0_0_/_12%)] max-[720px]:flex-col max-[720px]:items-start max-[720px]:px-4"
        >
          <div className="flex min-w-0 items-center gap-5">
            <div
              aria-hidden="true"
              className="grid size-16 shrink-0 place-items-center rounded-xl bg-brand shadow-[0_8px_18px_rgb(2_177_96_/_22%)]"
            >
              <CalendarDays className="size-8 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-[clamp(1.35rem,2vw,1.8rem)] font-bold tracking-tight">
                Agendamentos
              </h1>
              <p className="mt-1 text-sm text-[#71877b]">
                Visualize e gerencie os atendimentos da semana.
              </p>
            </div>
          </div>

          <div
            role="group"
            aria-label="Visualização da agenda"
            data-testid="appointments-view-menu"
            className="ml-auto flex shrink-0 items-center gap-1 rounded-[0.8rem] border border-[#e0e9e4] bg-white p-1 shadow-[0_4px_12px_rgb(32_56_45_/_8%)] max-[720px]:ml-0 max-[720px]:w-full"
          >
            <Button
              type="button"
              aria-pressed="true"
              data-state="active"
              data-view="week"
              className="h-12 flex-1 rounded-[0.6rem] bg-brand px-5 text-base text-white shadow-[0_5px_12px_rgb(2_177_96_/_22%)] hover:bg-brand-hover focus-visible:ring-brand max-[720px]:px-3"
            >
              <CalendarRange aria-hidden="true" className="size-5" />
              Semana
            </Button>
            <Button
              type="button"
              aria-pressed="false"
              aria-disabled="true"
              data-view="day"
              className="h-12 flex-1 rounded-[0.6rem] border border-transparent bg-white px-5 text-base text-[#20382d] hover:border-[#dce9e2] hover:bg-brand-muted focus-visible:ring-brand max-[720px]:px-3"
            >
              <CalendarDays aria-hidden="true" className="size-5" />
              Dia
            </Button>
            <Button
              type="button"
              aria-pressed="false"
              aria-disabled="true"
              data-view="list"
              className="h-12 flex-1 rounded-[0.6rem] border border-transparent bg-white px-5 text-base text-[#20382d] hover:border-[#dce9e2] hover:bg-brand-muted focus-visible:ring-brand max-[720px]:px-3"
            >
              <List aria-hidden="true" className="size-5" />
              Lista
            </Button>
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
          <section
            aria-label="Agenda semanal"
            data-testid="weekly-appointments"
            className="mx-4 mt-3 overflow-hidden rounded-2xl border border-[#dfe9ef] bg-white shadow-[0_8px_24px_rgb(40_72_91_/_8%)]"
          >
            <div
              data-testid="weekly-appointments-scroll"
              className="overflow-x-auto"
            >
              <div className="min-w-[70rem]">
                <div className="grid grid-cols-[4.75rem_repeat(5,minmax(13rem,1fr))] border-b border-[#dfe9ef] bg-[#f8fbfd]">
                  <div className="border-r border-[#dfe9ef]" aria-hidden="true" />
                  {weeklyGrid.map((day) => {
                    const isSelected = day.key === selectedDayKey
                    const isToday = day.key === todayKey

                    return (
                      <div
                        key={day.key}
                        role="columnheader"
                        data-testid={`appointments-day-header-${day.key}`}
                        data-selected={isSelected}
                        className={cn(
                          'relative flex min-h-[5.5rem] items-center justify-between gap-2 border-r border-[#dfe9ef] px-4 py-3 last:border-r-0',
                          isSelected &&
                            'bg-[#e9f8f2] shadow-[inset_0_3px_0_#069b6d]',
                        )}
                      >
                        <div className="min-w-0 text-center">
                          <h2
                            id={`appointments-day-${day.key}`}
                            className={cn(
                              'text-lg leading-tight font-bold text-[#17202a]',
                              isSelected && 'text-[#075e46]',
                            )}
                          >
                            {dayName(day.date)}
                          </h2>
                          <p className="mt-1 text-sm font-semibold text-[#53657a]">
                            {dayDateLabel(day.date)}
                          </p>
                          {isToday ? (
                            <span className="mt-1 inline-flex rounded-full bg-[#069b6d] px-2.5 py-0.5 text-xs font-bold text-white">
                              Hoje
                            </span>
                          ) : null}
                        </div>
                        <CalendarDays
                          aria-label="Calendário"
                          className={cn(
                            'size-6 shrink-0 text-[#069b6d]',
                            isSelected && 'text-[#057c59]',
                          )}
                        />
                      </div>
                    )
                  })}
                </div>

                <div className="grid grid-cols-[4.75rem_repeat(5,minmax(13rem,1fr))]">
                  <div
                    data-testid="weekly-appointments-time-ruler"
                    aria-label="Régua de horários da agenda"
                    className="border-r border-[#dfe9ef] bg-[#f8fbfd] text-right text-xs font-semibold text-[#53657a]"
                  >
                    {hourLabels.map((hour) => (
                      <div
                        key={hour}
                        className="relative border-b border-[#dfe9ef] pr-2"
                        style={{ height: `${HOUR_HEIGHT_PX}px` }}
                      >
                        <time className="relative -top-2 inline-block bg-[#f8fbfd] pl-1">
                          {String(hour).padStart(2, '0')}:00
                        </time>
                      </div>
                    ))}
                  </div>

                  <div
                    data-testid="weekly-appointments-matrix"
                    role="grid"
                    aria-label="Matriz horária de agendamentos"
                    className="relative col-span-5 grid grid-cols-5 overflow-visible"
                    style={{ minHeight: `${matrixHeight}px` }}
                  >
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 z-0"
                      style={{
                        backgroundImage:
                          'linear-gradient(to bottom, rgb(223 233 239 / 80%) 1px, transparent 1px)',
                        backgroundSize: `100% ${HOUR_HEIGHT_PX}px`,
                      }}
                    />

                    {weeklyGrid.map((day) => {
                      const isSelected = day.key === selectedDayKey

                      return (
                        <section
                          key={day.key}
                          role="region"
                          aria-label={`${dayName(day.date)} - ${format(day.date, 'd')}`}
                          data-testid={`appointments-day-${day.key}`}
                          data-selected={isSelected}
                          className={cn(
                            'relative min-w-0 border-r border-[#dfe9ef] last:border-r-0',
                            isSelected && 'bg-[#f4fcf8]/70',
                          )}
                        >
                          {day.appointments.map((positioned) => {
                            const laneWidth = 100 / positioned.laneCount
                            const statusLabel =
                              appointmentStatusLabels[positioned.appointment.status]

                            return (
                              <article
                                key={positioned.appointment.id}
                                data-status={positioned.appointment.status}
                                data-testid={`appointment-${positioned.appointment.id}`}
                                data-top-minutes={positioned.topMinutes}
                                data-height-minutes={positioned.heightMinutes}
                                data-lane={positioned.lane}
                                data-lane-count={positioned.laneCount}
                                data-density={
                                  positioned.laneCount > 2 ? 'compact' : 'regular'
                                }
                                aria-label={`${positioned.appointment.patient.name}, ${positioned.appointment.service.name}, ${positioned.localTime}, ${statusLabel}`}
                                title={`${positioned.appointment.patient.name} — ${positioned.appointment.service.name} — ${statusLabel}`}
                                className={cn(
                                  'absolute z-[1] flex min-w-0 flex-col justify-center gap-0.5 overflow-auto rounded-[0.35rem] border border-white/80 leading-tight shadow-[0_4px_10px_rgb(32_32_36_/_16%)] transition-[transform,box-shadow,filter] duration-[160ms] hover:z-[2] hover:-translate-y-0.5 hover:saturate-[1.04] hover:shadow-[0_8px_16px_rgb(32_32_36_/_22%)]',
                                  positioned.laneCount > 2
                                    ? 'px-1 py-1 text-xs'
                                    : 'px-2 py-1.5 text-sm',
                                  appointmentStatusClassNames[
                                    positioned.appointment.status
                                  ],
                                )}
                                style={{
                                  top: `${positioned.topMinutes * MINUTE_HEIGHT_PX}px`,
                                  height: `${Math.max(
                                    positioned.heightMinutes * MINUTE_HEIGHT_PX,
                                    48,
                                  )}px`,
                                  left: `calc(${positioned.lane * laneWidth}% + 0.25rem)`,
                                  width: `calc(${laneWidth}% - 0.5rem)`,
                                }}
                              >
                                <time
                                  dateTime={positioned.appointment.startsAt}
                                  className="sr-only"
                                >
                                  {positioned.localTime}
                                </time>
                                <strong className="break-words text-[0.9rem] font-bold">
                                  {positioned.appointment.patient.name}
                                </strong>
                                <span className="break-words">
                                  {positioned.appointment.service.name}
                                </span>
                                <span className="sr-only">
                                  {statusLabel}
                                </span>
                                <span className="sr-only">
                                  {positioned.appointment.status}
                                </span>
                                <span className="sr-only">
                                  {positioned.appointment.durationMinutes} min
                                </span>
                                <span className="sr-only">
                                  {currency(positioned.appointment.price)}
                                </span>
                              </article>
                            )
                          })}
                        </section>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            <aside
              aria-label="Legenda dos estados da agenda"
              data-testid="appointments-legend"
              className="border-t border-[#dfe9ef] bg-white px-6 py-5"
            >
              <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {legendItems.map((item) => (
                  <li key={item.label} className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className={cn(
                        'size-11 shrink-0 rounded-lg shadow-inner',
                        item.colorClassName,
                      )}
                    />
                    <span className="min-w-0">
                      <strong className="block text-sm font-bold text-[#20382d]">
                        {item.label}
                      </strong>
                      <span className="block text-sm text-[#718196]">
                        {item.description}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </aside>
          </section>
        ) : null}
      </main>
    </>
  )
}
