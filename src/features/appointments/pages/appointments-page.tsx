import { addDays, format, startOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import {
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  CircleAlert,
  List,
  LoaderCircle,
  Plus,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Helmet } from 'react-helmet-async'

import type { AppointmentStatus } from '@/@types/appointment'
import type { Appointment } from '@/@types/appointment'
import { useAppShellDate } from '@/_layout/app-shell-context'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  useGetUnitsQuery,
  useGetAppointmentSessionQuery,
  useGetAppointmentsQuery,
  useStartCurrentHourMutation,
} from '@/features/appointments/api/appointments'
import { cn } from '@/lib/utils'

import { AppointmentDetailsDialog } from '../components/appointment-details-dialog'
import { startCurrentHourErrorMessage } from '../model/appointment-errors'
import { getCurrentHourContext } from '../model/current-hour'

import {
  buildVisualAppointmentLayout,
  buildWeeklyAppointmentGrid,
  WEEK_GRID_END_HOUR,
  WEEK_GRID_END_MINUTES,
  WEEK_GRID_START_HOUR,
} from '../model/weekly-grid'

const feedbackPanelClassName =
  'mx-4 mt-3 mb-2 rounded-[0.35rem] border-brand/10 bg-white bg-[linear-gradient(135deg,#fff_0%,#f4faf7_100%)] px-4 py-3 text-[#4f4d4a]'

const appointmentStatusClassNames = {
  AGENDADO: 'bg-appointment-yellow text-black',
  FALTA: 'bg-appointment-red text-white',
  REAGENDADO: 'bg-appointment-yellow text-black',
  CANCELADO: 'bg-appointment-graphite text-white',
  ATENDENDO: 'bg-appointment-green text-white',
  FINALIZADO: 'bg-appointment-green text-white',
} satisfies Record<AppointmentStatus, string>

const HOUR_HEIGHT_PX = 64
const MINUTE_HEIGHT_PX = HOUR_HEIGHT_PX / 60

const appointmentStatusLabels = {
  AGENDADO: 'Aguardando atendimento',
  FALTA: 'Falta',
  REAGENDADO: 'Aguardando atendimento',
  CANCELADO: 'Cancelado',
  ATENDENDO: 'Atendimento iniciado',
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

function firstName(value: string) {
  return value.trim().split(/\s+/)[0] ?? value.trim()
}

const DEFAULT_DAY_COLUMN_WIDTH_PX = 320

export function AppointmentsPage() {
  const { selectedDate } = useAppShellDate()
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
  const weekEnd = addDays(weekStart, 7)

  const sessionQuery = useGetAppointmentSessionQuery()
  const session = sessionQuery.data
  const unitsQuery = useGetUnitsQuery(undefined, { skip: !session })
  const activeUnit = unitsQuery.data?.find(
    (unit) => unit.id === session?.activeUnitId,
  )
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
  const firstDayColumnRef = useRef<HTMLElement | null>(null)
  const [dayColumnWidth, setDayColumnWidth] = useState(
    DEFAULT_DAY_COLUMN_WIDTH_PX,
  )
  const [hoveredHour, setHoveredHour] = useState<number | null>(null)
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null)
  const [clockNow, setClockNow] = useState(() => new Date())
  const [expandedHourKey, setExpandedHourKey] = useState<string | null>(null)
  const [actionFeedback, setActionFeedback] = useState<{
    tone: 'success' | 'error'
    message: string
  } | null>(null)
  const [startCurrentHour, startCurrentHourState] =
    useStartCurrentHourMutation()
  const actionToggleRef = useRef<HTMLButtonElement | null>(null)
  const actionContainerRef = useRef<HTMLDivElement | null>(null)
  const actionContextRef = useRef<string | null>(null)

  const currentHour = useMemo(() => {
    if (!activeUnit?.timeZone) return null
    try {
      return getCurrentHourContext(clockNow, activeUnit.timeZone)
    } catch {
      return null
    }
  }, [activeUnit?.timeZone, clockNow])

  useEffect(() => {
    const updateClock = () => setClockNow(new Date())
    const interval = window.setInterval(updateClock, 15_000)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') updateClock()
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  const currentHourKey = currentHour
    ? `${currentHour.dateKey}-${currentHour.hour}`
    : null

  useEffect(() => {
    setExpandedHourKey(null)
  }, [currentHourKey, selectedDate])

  useEffect(() => {
    if (!expandedHourKey) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      setExpandedHourKey(null)
      actionToggleRef.current?.focus()
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!actionContainerRef.current?.contains(event.target as Node)) {
        setExpandedHourKey(null)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [expandedHourKey])

  useEffect(() => {
    const element = firstDayColumnRef.current
    if (!element) return

    const measure = () => {
      const width = element.getBoundingClientRect().width
      if (width > 0) setDayColumnWidth(Math.round(width))
    }

    measure()
    if (typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(measure)
    observer.observe(element)

    return () => observer.disconnect()
  }, [weeklyGrid.length])

  const baseVisualWeeklyGrid = useMemo(
    () =>
      weeklyGrid.map((day) => ({
        ...day,
        appointments: buildVisualAppointmentLayout(
          day,
          dayColumnWidth,
          MINUTE_HEIGHT_PX,
        ),
      })),
    [dayColumnWidth, weeklyGrid],
  )
  const selectedDayKey = format(selectedDate, 'yyyy-MM-dd')
  actionContextRef.current = session && currentHour
    ? `${session.activeUnitId}-${selectedDayKey}-${currentHourKey}`
    : null
  const todayKey = format(new Date(), 'yyyy-MM-dd')
  const hourLabels = Array.from(
    { length: WEEK_GRID_END_HOUR - WEEK_GRID_START_HOUR },
    (_, index) => WEEK_GRID_START_HOUR + index,
  )
  const visualHourRows = useMemo(() => {
    const heights = new Map(hourLabels.map((hour) => [hour, HOUR_HEIGHT_PX]))

    baseVisualWeeklyGrid.forEach((day) => {
      const groups = new Map<number, typeof day.appointments>()

      day.appointments.forEach((appointment) => {
        const group = groups.get(appointment.overlapGroup) ?? []
        group.push(appointment)
        groups.set(appointment.overlapGroup, group)
      })

      groups.forEach((group) => {
        const groupStartMinutes = group[0]?.overlapGroupStartMinutes
        if (
          groupStartMinutes === undefined ||
          groupStartMinutes < WEEK_GRID_START_HOUR * 60 ||
          groupStartMinutes >= WEEK_GRID_END_HOUR * 60 ||
          group[0]?.visualRowCount === 1
        ) {
          return
        }

        const hour = Math.floor(groupStartMinutes / 60)
        const requiredHeight = Math.max(
          ...group.map(
            (appointment) =>
              appointment.visualTopPx +
              appointment.visualHeightPx -
              (hour - WEEK_GRID_START_HOUR) * HOUR_HEIGHT_PX,
          ),
        )
        heights.set(
          hour,
          Math.max(heights.get(hour) ?? HOUR_HEIGHT_PX, requiredHeight),
        )
      })
    })

    let topPx = 0
    return hourLabels.map((hour) => {
      const row = { hour, topPx, heightPx: heights.get(hour) ?? HOUR_HEIGHT_PX }
      topPx += row.heightPx
      return row
    })
  }, [baseVisualWeeklyGrid, hourLabels])
  const gridHeightPx = visualHourRows.reduce(
    (total, row) => total + row.heightPx,
    0,
  )

  const visualWeeklyGrid = useMemo(
    () =>
      baseVisualWeeklyGrid.map((day) => ({
        ...day,
        appointments: day.appointments.map((appointment) => {
          const groupStartMinutes = appointment.overlapGroupStartMinutes
          const hour = Math.floor(groupStartMinutes / 60)
          const row = visualHourRows.find((item) => item.hour === hour)
          const baseGroupTopPx =
            (groupStartMinutes - WEEK_GRID_START_HOUR * 60) * MINUTE_HEIGHT_PX
          const expandedGroupTopPx = row
            ? row.topPx + (groupStartMinutes - hour * 60) * MINUTE_HEIGHT_PX
            : baseGroupTopPx

          return {
            ...appointment,
            visualTopPx:
              expandedGroupTopPx + appointment.visualTopPx - baseGroupTopPx,
          }
        }),
      })),
    [baseVisualWeeklyGrid, visualHourRows],
  )
  const maxAppointmentEndPx = visualWeeklyGrid
    .flatMap((day) => day.appointments)
    .reduce(
      (latest, appointment) =>
        Math.max(latest, appointment.visualTopPx + appointment.visualHeightPx),
      (WEEK_GRID_END_MINUTES - WEEK_GRID_START_HOUR * 60) * MINUTE_HEIGHT_PX,
    )
  const matrixHeight = Math.max(
    gridHeightPx,
    maxAppointmentEndPx,
  )

  function retry() {
    void sessionQuery.refetch()
    if (session) void appointmentsQuery.refetch()
  }

  function openAppointmentDetails(appointment: Appointment) {
    setSelectedAppointment(appointment)
  }

  async function startAllInCurrentHour() {
    if (!session || !currentHour || !activeUnit || startCurrentHourState.isLoading) {
      return
    }

    const requestContext = actionContextRef.current
    setActionFeedback(null)

    try {
      const result = await startCurrentHour({
        unitId: session.activeUnitId,
        hourStart: currentHour.hourStart,
      }).unwrap()
      if (actionContextRef.current !== requestContext) return
      setExpandedHourKey(null)
      try {
        await appointmentsQuery.refetch().unwrap()
        setActionFeedback({
          tone: 'success',
          message:
            result.updatedCount > 0
              ? `${result.updatedCount} atendimento${result.updatedCount === 1 ? '' : 's'} iniciado${result.updatedCount === 1 ? '' : 's'}${result.skippedCount > 0 ? `; ${result.skippedCount} agendamento${result.skippedCount === 1 ? '' : 's'} não alterado${result.skippedCount === 1 ? '' : 's'}` : ''}.`
              : 'Nenhum agendamento foi iniciado.',
        })
      } catch {
        setActionFeedback({
          tone: 'error',
          message:
            'Atendimentos iniciados; não foi possível atualizar a agenda.',
        })
      }
    } catch (error) {
      if (actionContextRef.current !== requestContext) return
      setExpandedHourKey(null)
      setActionFeedback({ tone: 'error', message: startCurrentHourErrorMessage(error) })
    }
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

        {actionFeedback ? (
          <Alert
            role="status"
            className={cn(
              feedbackPanelClassName,
              actionFeedback.tone === 'success'
                ? 'border-[#b7e8d0] bg-[#f0fcf6]'
                : 'border-destructive/20',
            )}
          >
            {actionFeedback.tone === 'success' ? (
              <CheckCircle2 aria-hidden="true" className="text-brand" />
            ) : (
              <CircleAlert aria-hidden="true" className="text-destructive" />
            )}
            <AlertTitle>{actionFeedback.message}</AlertTitle>
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
                  <div
                    className="border-r border-[#dfe9ef]"
                    aria-hidden="true"
                  />
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
                    className="relative border-r border-[#dfe9ef] bg-[#f8fbfd] text-right text-xs font-semibold text-[#53657a]"
                    style={{ minHeight: `${matrixHeight}px` }}
                  >
                    {visualHourRows.map((row) => (
                      <div
                        key={row.hour}
                        data-hour={row.hour}
                        data-row-top={row.topPx}
                        data-row-height={row.heightPx}
                        data-hovered={hoveredHour === row.hour}
                        tabIndex={0}
                        onMouseEnter={() => setHoveredHour(row.hour)}
                        onMouseLeave={() => setHoveredHour(null)}
                        onFocus={() => setHoveredHour(row.hour)}
                        onBlur={() => setHoveredHour(null)}
                        className={cn(
                          'relative border-b border-[#dfe9ef] pr-2 outline-none transition-colors',
                          hoveredHour === row.hour && 'bg-[#dff7eb]',
                        )}
                        style={{ height: `${row.heightPx}px` }}
                      >
                        <time
                          className={cn(
                            'relative -top-2 inline-block bg-[#f8fbfd] pl-1',
                            hoveredHour === row.hour &&
                              'rounded-sm bg-[#dff7eb] text-[#075e46]',
                          )}
                        >
                          {String(row.hour).padStart(2, '0')}:00
                        </time>
                      </div>
                    ))}
                    <div
                      data-hour={WEEK_GRID_END_HOUR}
                      data-terminal="true"
                      className="pointer-events-none absolute inset-x-0 h-0"
                      style={{ top: `${gridHeightPx}px` }}
                    >
                      <time className="relative -top-2 inline-block bg-[#f8fbfd] pl-1">
                        {String(WEEK_GRID_END_HOUR).padStart(2, '0')}:00
                      </time>
                    </div>
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
                    >
                      {visualHourRows.map((row) => (
                        <div
                          key={row.hour}
                          className="absolute inset-x-0 border-b border-[#dfe9ef]"
                          style={{ top: `${row.topPx + row.heightPx - 1}px` }}
                        />
                      ))}
                    </div>

                    {visualWeeklyGrid.map((day, dayIndex) => {
                      const isSelected = day.key === selectedDayKey
                      const currentRow = currentHour
                        ? visualHourRows.find(
                            (row) => row.hour === currentHour.hour,
                          )
                        : undefined
                      const isCurrentHourDay =
                        currentHour?.dateKey === day.key && currentRow !== undefined
                      const eligibleCount = isCurrentHourDay
                        ? day.appointments.filter(
                            (appointment) =>
                              Math.floor(appointment.startMinutes / 60) ===
                                currentHour?.hour &&
                              (appointment.appointment.status === 'AGENDADO' ||
                                appointment.appointment.status === 'FALTA'),
                          ).length
                        : 0
                      const actionKey = isCurrentHourDay
                        ? `${day.key}-${currentHour?.hour}`
                        : null
                      const hasNextDay = dayIndex < visualWeeklyGrid.length - 1
                      const actionAnchor = hasNextDay
                        ? 'next-day-divider'
                        : 'current-day-edge'

                      return (
                        <section
                          key={day.key}
                          ref={dayIndex === 0 ? firstDayColumnRef : undefined}
                          role="region"
                          aria-label={`${dayName(day.date)} - ${format(day.date, 'd')}`}
                          data-testid={`appointments-day-${day.key}`}
                          data-selected={isSelected}
                          className={cn(
                            'relative min-w-0 border-r border-[#dfe9ef] last:border-r-0',
                            isSelected && 'bg-[#f4fcf8]/70',
                          )}
                        >
                          {hourLabels.map((hour) =>
                            (() => {
                              const row = visualHourRows.find(
                                (item) => item.hour === hour,
                              )

                              return (
                                <div
                                  key={hour}
                                  data-hour={hour}
                                  data-row-top={row?.topPx}
                                  data-row-height={row?.heightPx}
                                  data-hovered={hoveredHour === hour}
                                  aria-hidden="true"
                                  onMouseEnter={() => setHoveredHour(hour)}
                                  onMouseLeave={() => setHoveredHour(null)}
                                  className={cn(
                                    'pointer-events-auto absolute inset-x-0 z-0 border-b border-transparent transition-colors',
                                    hoveredHour === hour && 'bg-[#dff7eb]/70',
                                  )}
                                  style={{
                                    top: `${row?.topPx ?? (hour - WEEK_GRID_START_HOUR) * HOUR_HEIGHT_PX}px`,
                                    height: `${row?.heightPx ?? HOUR_HEIGHT_PX}px`,
                                  }}
                                />
                              )
                            })(),
                          )}

                          {isCurrentHourDay && currentRow && currentHour ? (
                            <div
                              ref={actionContainerRef}
                              data-testid="start-current-hour-container"
                              data-action-anchor={actionAnchor}
                              className="absolute right-0 z-[4]"
                              style={{
                                top: `${Math.max(currentRow.topPx + 6, 4)}px`,
                                transform: hasNextDay
                                  ? 'translateX(50%)'
                                  : undefined,
                              }}
                            >
                              {expandedHourKey === actionKey ? (
                                <Button
                                  type="button"
                                  data-testid="start-current-hour-action"
                                  disabled={
                                    eligibleCount === 0 ||
                                    startCurrentHourState.isLoading
                                  }
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    void startAllInCurrentHour()
                                  }}
                                  className="absolute right-1/2 bottom-[calc(100%+0.5rem)] h-10 translate-x-1/2 whitespace-nowrap rounded-full bg-[#078f58] px-4 text-sm font-bold text-white shadow-[0_8px_18px_rgb(4_92_57_/_28%)] hover:bg-[#057949] focus-visible:ring-[#078f58]"
                                  aria-label={`Iniciar todos os agendamentos de ${currentHour.hour}:00 nesta unidade`}
                                >
                                  {startCurrentHourState.isLoading
                                    ? 'Iniciando...'
                                    : 'Iniciar todos'}
                                </Button>
                              ) : null}
                              <Button
                                type="button"
                                data-testid="start-current-hour-toggle"
                                data-button-color="#6F3CFF"
                                data-button-size="53px"
                                ref={actionToggleRef}
                                aria-label={`Ações da hora ${String(currentHour.hour).padStart(2, '0')}:00`}
                                aria-expanded={expandedHourKey === actionKey}
                                onClick={(event) => {
                                  event.stopPropagation()
                                  setExpandedHourKey((current) =>
                                    current === actionKey ? null : actionKey,
                                  )
                                }}
                                className="size-[53px] rounded-full bg-[#6F3CFF]/80 p-0 text-white shadow-[0_10px_22px_rgb(111_60_255_/_24%)] hover:bg-[#6F3CFF]/90 focus-visible:ring-[#6F3CFF]"
                              >
                                <Plus aria-hidden="true" className="size-7" />
                              </Button>
                              {eligibleCount === 0 ? (
                                <span className="sr-only">
                                  Nenhum agendamento para iniciar nesta faixa
                                </span>
                              ) : null}
                            </div>
                          ) : null}

                          {day.appointments.map((positioned) => {
                            const statusLabel =
                              appointmentStatusLabels[
                                positioned.appointment.status
                              ]
                            const patientFullName =
                              positioned.appointment.patient.name
                            const appointmentHour = Math.min(
                              Math.max(
                                Math.floor(positioned.startMinutes / 60),
                                WEEK_GRID_START_HOUR,
                              ),
                              WEEK_GRID_END_HOUR,
                            )

                            return (
                              <article
                                key={positioned.appointment.id}
                                data-status={positioned.appointment.status}
                                data-testid={`appointment-${positioned.appointment.id}`}
                                data-top-minutes={positioned.topMinutes}
                                data-height-minutes={positioned.heightMinutes}
                                data-lane={positioned.lane}
                                data-lane-count={positioned.laneCount}
                                data-visual-row={positioned.visualRow}
                                data-visual-column={positioned.visualColumn}
                                data-visual-row-count={
                                  positioned.visualRowCount
                                }
                                data-visual-column-count={
                                  positioned.visualColumnCount
                                }
                                data-hover-hour={appointmentHour}
                                data-density={
                                  positioned.laneCount > 2
                                    ? 'compact'
                                    : 'regular'
                                }
                                aria-label={`${patientFullName}, ${positioned.appointment.service.name}, ${positioned.localTime}, ${statusLabel}`}
                                title={`${patientFullName} — ${positioned.appointment.service.name} — ${statusLabel}`}
                                role="button"
                                tabIndex={0}
                                onClick={() =>
                                  openAppointmentDetails(positioned.appointment)
                                }
                                onKeyDown={(event) => {
                                  if (
                                    event.key === 'Enter' ||
                                    event.key === ' '
                                  ) {
                                    event.preventDefault()
                                    openAppointmentDetails(
                                      positioned.appointment,
                                    )
                                  }
                                }}
                                onMouseEnter={() =>
                                  setHoveredHour(appointmentHour)
                                }
                                onMouseLeave={() => setHoveredHour(null)}
                                className={cn(
                                  'absolute z-[2] flex min-w-0 flex-col justify-center gap-0.5 overflow-hidden rounded-[0.35rem] border border-white/80 leading-tight shadow-[0_4px_10px_rgb(32_32_36_/_16%)] transition-[transform,box-shadow,filter] duration-[160ms] hover:z-[3] hover:-translate-y-0.5 hover:saturate-[1.04] hover:shadow-[0_8px_16px_rgb(32_32_36_/_22%)]',
                                  positioned.laneCount > 2
                                    ? 'px-1 py-1 text-xs'
                                    : 'px-2 py-1.5 text-sm',
                                  appointmentStatusClassNames[
                                    positioned.appointment.status
                                  ],
                                )}
                                style={{
                                  top: `${positioned.visualTopPx}px`,
                                  height: `${positioned.visualHeightPx}px`,
                                  left: `calc(${positioned.visualColumn * (100 / Math.max(positioned.visualColumnCount, 1))}% + 0.25rem)`,
                                  width: `calc(${100 / Math.max(positioned.visualColumnCount, 1)}% - 0.5rem)`,
                                }}
                              >
                                <time
                                  dateTime={positioned.appointment.startsAt}
                                  className="sr-only"
                                >
                                  {positioned.localTime}
                                </time>
                                <strong className="truncate text-[0.9rem] font-bold">
                                  {firstName(patientFullName)}
                                </strong>
                                <span className="truncate">
                                  {positioned.appointment.service.name}
                                </span>
                                <span className="sr-only">{statusLabel}</span>
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
      <AppointmentDetailsDialog
        appointment={selectedAppointment}
        open={selectedAppointment !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedAppointment(null)
        }}
        onStatusUpdated={setSelectedAppointment}
      />
    </>
  )
}
