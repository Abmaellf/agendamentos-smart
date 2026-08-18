import { useQuery } from '@tanstack/react-query'
import { addDays, format, startOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'

import { Button } from '@/components/ui/button'
import { getAppointmentSession } from '@/features/appointments/api/appointments'
import { CreateAppointmentDialog } from '@/features/appointments/components/create-appointment-dialog'
import { useAppointments } from '@/features/appointments/hooks/use-appointments'
import type { Appointment } from '@/features/appointments/model/appointment'

import {
  AppointmentCard,
  AppointmentsGrid,
  AppointmentsHeader,
  AppointmentsPageContainer,
  CurrentDate,
  DayColumn,
  DayTitle,
  EmptyState,
  SpaceHeader,
  Title,
} from './appointments-page.styles'

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

export function AppointmentsPage() {
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
  const weekEnd = addDays(weekStart, 7)

  const days = useMemo(
    () =>
      Array.from({ length: 5 }, (_, index) => {
        const date = addDays(weekStart, index)
        return {
          key: format(date, 'yyyy-MM-dd'),
          label: format(date, "EEEE, dd 'de' MMMM", { locale: ptBR }),
        }
      }),
    [weekStart],
  )

  const sessionQuery = useQuery({
    queryKey: ['appointment-session'],
    queryFn: getAppointmentSession,
  })
  const session = sessionQuery.data
  const appointmentsQuery = useAppointments(
    {
      unitId: session?.activeUnitId ?? '',
      from: weekStart.toISOString(),
      to: weekEnd.toISOString(),
    },
    Boolean(session),
  )

  const loading = sessionQuery.isPending || appointmentsQuery.isPending
  const failed = sessionQuery.isError || appointmentsQuery.isError
  const appointments = appointmentsQuery.data ?? []

  function retry() {
    void sessionQuery.refetch()
    if (session) void appointmentsQuery.refetch()
  }

  return (
    <>
      <SpaceHeader />
      <AppointmentsPageContainer>
        <Helmet title="Agendamentos" />
        <AppointmentsHeader>
          <Title>Agendamentos</Title>
          <CurrentDate>
            <label htmlFor="appointments-date">Selecione a data</label>
            <input
              id="appointments-date"
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={(event) => {
                const nextDate = new Date(`${event.target.value}T12:00:00`)
                if (!Number.isNaN(nextDate.getTime())) setSelectedDate(nextDate)
              }}
            />
          </CurrentDate>
          {session ? (
            <CreateAppointmentDialog
              session={session}
              defaultDate={format(selectedDate, 'yyyy-MM-dd')}
            />
          ) : null}
        </AppointmentsHeader>

        {loading ? <p role="status">Carregando agenda...</p> : null}

        {failed ? (
          <div role="alert">
            <p>Não foi possível carregar a agenda.</p>
            <Button type="button" onClick={retry}>
              Tentar novamente
            </Button>
          </div>
        ) : null}

        {!loading && !failed && appointments.length === 0 ? (
          <EmptyState>Nenhum agendamento nesta semana.</EmptyState>
        ) : null}

        {!loading && !failed && appointments.length > 0 ? (
          <AppointmentsGrid>
            {days.map((day) => {
              const appointmentsOfDay = appointments.filter(
                (appointment) =>
                  localDateParts(appointment.startsAt, appointment.timeZone) ===
                  day.key,
              )

              return (
                <DayColumn key={day.key}>
                  <DayTitle>{day.label}</DayTitle>
                  {appointmentsOfDay.map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      data-testid={`appointment-${appointment.id}`}
                    >
                      <strong>{appointment.patient.name}</strong>
                      <span>{localTime(appointment)}</span>
                      <span>{appointment.service.name}</span>
                      <span>{appointment.status}</span>
                      <span>{appointment.durationMinutes} min</span>
                      <span>{currency(appointment.price)}</span>
                    </AppointmentCard>
                  ))}
                </DayColumn>
              )
            })}
          </AppointmentsGrid>
        ) : null}
      </AppointmentsPageContainer>
    </>
  )
}
