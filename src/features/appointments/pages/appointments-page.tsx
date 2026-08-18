import { useQuery } from '@tanstack/react-query'
import { addDays, format, startOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'

import { Button } from '@/components/ui/button'
import { getAppointmentSession } from '@/features/appointments/api/appointments'
import { CreateAppointmentDialog } from '@/features/appointments/components/create-appointment-dialog'
import { useAppointments } from '@/features/appointments/hooks/use-appointments'
import type { Appointment } from '@/features/appointments/model/appointment'

import {
  AppointmentCard,
  AppointmentDetails,
  AppointmentList,
  AppointmentTime,
  AppointmentsGrid,
  AppointmentsHeader,
  AppointmentsPageContainer,
  CurrentDate,
  DatePickerControl,
  DateNavigationButton,
  DayColumn,
  DayTitle,
  EmptyState,
  FeedbackPanel,
  HeaderAction,
  HeaderDate,
  HeaderDateInput,
  ScreenReaderDetails,
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

function capitalize(value: string) {
  return value.charAt(0).toLocaleUpperCase('pt-BR') + value.slice(1)
}

function headerDate(date: Date) {
  const day = format(date, 'dd')
  const month = capitalize(format(date, 'MMMM', { locale: ptBR }))
  const year = format(date, 'yyyy')
  return `${day} de ${month} de ${year}`
}

function dayLabel(date: Date) {
  const weekDay = format(date, 'EEEE', { locale: ptBR }).replace('-feira', '')
  return `${capitalize(weekDay)} - ${format(date, 'd')}`
}

function initialSelectedDate() {
  const today = new Date()
  if (today.getDay() === 6) return addDays(today, 2)
  if (today.getDay() === 0) return addDays(today, 1)
  return today
}

export function AppointmentsPage() {
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate)
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
          <CurrentDate aria-label="Navegação da agenda semanal">
            <DateNavigationButton
              type="button"
              aria-label="Semana anterior"
              onClick={() => setSelectedDate((date) => addDays(date, -7))}
            >
              <ChevronLeft aria-hidden="true" />
            </DateNavigationButton>
            <DatePickerControl>
              <HeaderDateInput
                id="appointments-date"
                type="date"
                aria-label="Selecionar data da agenda"
                value={format(selectedDate, 'yyyy-MM-dd')}
                onClick={(event) => event.currentTarget.showPicker?.()}
                onChange={(event) => {
                  const nextDate = new Date(`${event.target.value}T12:00:00`)
                  if (!Number.isNaN(nextDate.getTime())) {
                    setSelectedDate(nextDate)
                  }
                }}
              />
              <HeaderDate dateTime={format(selectedDate, 'yyyy-MM-dd')}>
                {headerDate(selectedDate)}
              </HeaderDate>
            </DatePickerControl>
            <DateNavigationButton
              type="button"
              aria-label="Próxima semana"
              onClick={() => setSelectedDate((date) => addDays(date, 7))}
            >
              <ChevronRight aria-hidden="true" />
            </DateNavigationButton>
          </CurrentDate>
          {session ? (
            <HeaderAction>
              <CreateAppointmentDialog
                key={format(selectedDate, 'yyyy-MM-dd')}
                session={session}
                defaultDate={format(selectedDate, 'yyyy-MM-dd')}
                triggerLabel="Agendar"
                triggerAriaLabel="Novo agendamento"
              />
            </HeaderAction>
          ) : null}
        </AppointmentsHeader>

        {loading ? (
          <FeedbackPanel role="status">Carregando agenda...</FeedbackPanel>
        ) : null}

        {failed ? (
          <FeedbackPanel role="alert">
            <p>Não foi possível carregar a agenda.</p>
            <Button type="button" onClick={retry}>
              Tentar novamente
            </Button>
          </FeedbackPanel>
        ) : null}

        {!loading && !failed && appointments.length === 0 ? (
          <EmptyState>Nenhum agendamento nesta semana.</EmptyState>
        ) : null}

        {!loading && !failed ? (
          <AppointmentsGrid>
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
                <DayColumn key={day.key} $selected={isSelected}>
                  <DayTitle>{day.label}</DayTitle>
                  <AppointmentList>
                    {appointmentsOfDay.map((appointment) => (
                      <AppointmentCard
                        key={appointment.id}
                        $status={appointment.status}
                        data-testid={`appointment-${appointment.id}`}
                      >
                        <AppointmentTime
                          dateTime={appointment.startsAt}
                          aria-label={`Horário: ${localTime(appointment)}`}
                        >
                          {localTime(appointment)}
                        </AppointmentTime>
                        <AppointmentDetails>
                          <strong>{appointment.patient.name}</strong>
                          <span>{appointment.service.name}</span>
                          <ScreenReaderDetails>
                            {appointment.status}
                          </ScreenReaderDetails>
                          <ScreenReaderDetails>
                            {appointment.durationMinutes} min
                          </ScreenReaderDetails>
                          <ScreenReaderDetails>
                            {currency(appointment.price)}
                          </ScreenReaderDetails>
                        </AppointmentDetails>
                      </AppointmentCard>
                    ))}
                  </AppointmentList>
                </DayColumn>
              )
            })}
          </AppointmentsGrid>
        ) : null}
      </AppointmentsPageContainer>
    </>
  )
}
