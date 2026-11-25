import { addDays, format } from 'date-fns'

import type { Appointment } from '@/@types/appointment'

export const WEEK_GRID_START_HOUR = 7
export const WEEK_GRID_END_HOUR = 20
export const WEEK_GRID_HOUR_MINUTES = 60
export const WEEK_GRID_START_MINUTES = WEEK_GRID_START_HOUR * 60
export const WEEK_GRID_END_MINUTES = WEEK_GRID_END_HOUR * 60
export const APPOINTMENT_CARD_MIN_WIDTH_PX = 96
export const APPOINTMENT_CARD_GAP_PX = 4
export const APPOINTMENT_CARD_ROW_GAP_PX = 4
export const APPOINTMENT_CARD_MIN_HEIGHT_PX = 48

export interface PositionedAppointment {
  appointment: Appointment
  dateKey: string
  localTime: string
  startMinutes: number
  endMinutes: number
  topMinutes: number
  heightMinutes: number
  lane: number
  laneCount: number
  overlapGroup: number
  overlapGroupIndex: number
  overlapGroupSize: number
  overlapGroupStartMinutes: number
  overlapGroupEndMinutes: number
}

export interface VisualPositionedAppointment extends PositionedAppointment {
  visualRow: number
  visualColumn: number
  visualRowCount: number
  visualColumnCount: number
  visualTopPx: number
  visualHeightPx: number
}

export interface WeeklyGridDay {
  key: string
  date: Date
  appointments: PositionedAppointment[]
}

type PositionedInterval = Omit<
  PositionedAppointment,
  | 'laneCount'
  | 'overlapGroup'
  | 'overlapGroupIndex'
  | 'overlapGroupSize'
  | 'overlapGroupStartMinutes'
  | 'overlapGroupEndMinutes'
>

interface ZonedDateParts {
  year: string
  month: string
  day: string
  hour: string
  minute: string
}

function zonedDateParts(instant: string, timeZone: string): ZonedDateParts {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(instant))

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  )

  return {
    year: values.year ?? '0000',
    month: values.month ?? '01',
    day: values.day ?? '01',
    hour: values.hour ?? '00',
    minute: values.minute ?? '00',
  }
}

export function appointmentLocalDateKey(appointment: Appointment) {
  const parts = zonedDateParts(appointment.startsAt, appointment.timeZone)
  return `${parts.year}-${parts.month}-${parts.day}`
}

export function appointmentLocalTime(appointment: Appointment) {
  const parts = zonedDateParts(appointment.startsAt, appointment.timeZone)
  return `${parts.hour}:${parts.minute}`
}

function compareAppointments(first: Appointment, second: Appointment) {
  const firstParts = zonedDateParts(first.startsAt, first.timeZone)
  const secondParts = zonedDateParts(second.startsAt, second.timeZone)
  const firstMinutes = Number(firstParts.hour) * 60 + Number(firstParts.minute)
  const secondMinutes =
    Number(secondParts.hour) * 60 + Number(secondParts.minute)

  return (
    firstMinutes - secondMinutes ||
    second.durationMinutes - first.durationMinutes ||
    first.id.localeCompare(second.id)
  )
}

function maxConcurrent(intervals: PositionedInterval[]) {
  const events = intervals.flatMap((interval) => [
    { minute: interval.startMinutes, delta: 1 },
    { minute: interval.endMinutes, delta: -1 },
  ])

  events.sort(
    (first, second) => first.minute - second.minute || first.delta - second.delta,
  )

  let active = 0
  let maximum = 0

  for (const event of events) {
    active += event.delta
    maximum = Math.max(maximum, active)
  }

  return Math.max(maximum, 1)
}

function overlapGroups(intervals: PositionedInterval[]) {
  const groups: PositionedInterval[][] = []
  let group: PositionedInterval[] = []
  let latestEndMinute = -Infinity

  for (const interval of intervals) {
    if (group.length > 0 && interval.startMinutes >= latestEndMinute) {
      groups.push(group)
      group = []
      latestEndMinute = -Infinity
    }

    group.push(interval)
    latestEndMinute = Math.max(latestEndMinute, interval.endMinutes)
  }

  if (group.length > 0) groups.push(group)

  return groups
}

function placeAppointments(appointments: Appointment[]) {
  const intervals = appointments
    .map((appointment) => {
      const parts = zonedDateParts(appointment.startsAt, appointment.timeZone)
      const startMinutes = Number(parts.hour) * 60 + Number(parts.minute)
      const endMinutes = startMinutes + Math.max(appointment.durationMinutes, 1)
      const visibleStartMinutes = Math.max(startMinutes, WEEK_GRID_START_MINUTES)

      return {
        appointment,
        dateKey: `${parts.year}-${parts.month}-${parts.day}`,
        localTime: `${parts.hour}:${parts.minute}`,
        startMinutes,
        endMinutes,
        topMinutes: Math.max(startMinutes - WEEK_GRID_START_MINUTES, 0),
        heightMinutes: Math.max(endMinutes - visibleStartMinutes, 1),
      }
    })
    .sort((first, second) => compareAppointments(first.appointment, second.appointment))

  const laneEnds: number[] = []
  const withLanes = intervals.map((interval) => {
    let lane = laneEnds.findIndex((endMinute) => endMinute <= interval.startMinutes)

    if (lane === -1) {
      lane = laneEnds.length
    }

    laneEnds[lane] = interval.endMinutes
    return { ...interval, lane }
  })

  return overlapGroups(withLanes).flatMap((group, overlapGroup) => {
    const laneCount = maxConcurrent(group)
    const overlapGroupStartMinutes = Math.min(
      ...group.map((interval) => interval.startMinutes),
    )
    const overlapGroupEndMinutes = Math.max(
      ...group.map((interval) => interval.endMinutes),
    )

    return group.map((interval, overlapGroupIndex) => ({
      ...interval,
      laneCount,
      overlapGroup,
      overlapGroupIndex,
      overlapGroupSize: group.length,
      overlapGroupStartMinutes,
      overlapGroupEndMinutes,
    }))
  })
}

export function appointmentCardsPerRow(columnWidthPx: number) {
  return Math.max(
    1,
    Math.floor(
      (Math.max(columnWidthPx, APPOINTMENT_CARD_MIN_WIDTH_PX) +
        APPOINTMENT_CARD_GAP_PX) /
        (APPOINTMENT_CARD_MIN_WIDTH_PX + APPOINTMENT_CARD_GAP_PX),
    ),
  )
}

export function buildVisualAppointmentLayout(
  day: WeeklyGridDay,
  columnWidthPx: number,
  minuteHeightPx: number,
): VisualPositionedAppointment[] {
  const cardsPerRow = appointmentCardsPerRow(columnWidthPx)
  const groups = new Map<number, PositionedAppointment[]>()

  day.appointments.forEach((appointment) => {
    const group = groups.get(appointment.overlapGroup) ?? []
    group.push(appointment)
    groups.set(appointment.overlapGroup, group)
  })

  let occupiedUntilPx = 0

  return Array.from(groups.values()).flatMap((group) => {
    const groupTopPx =
      Math.max(group[0]?.overlapGroupStartMinutes ?? WEEK_GRID_START_MINUTES, WEEK_GRID_START_MINUTES) -
      WEEK_GRID_START_MINUTES
    const rowCount = Math.ceil(group.length / cardsPerRow)
    const rowHeightPx = Math.max(
      APPOINTMENT_CARD_MIN_HEIGHT_PX,
      ...group.map((appointment) => appointment.heightMinutes * minuteHeightPx),
    )
    const temporalHeightPx =
      ((group[0]?.overlapGroupEndMinutes ?? WEEK_GRID_START_MINUTES) -
        (group[0]?.overlapGroupStartMinutes ?? WEEK_GRID_START_MINUTES)) *
      minuteHeightPx
    const groupHeightPx = Math.max(
      temporalHeightPx,
      rowCount * rowHeightPx + (rowCount - 1) * APPOINTMENT_CARD_ROW_GAP_PX,
    )
    const visualTopPx = Math.max(
      groupTopPx * minuteHeightPx,
      occupiedUntilPx,
    )

    occupiedUntilPx = visualTopPx + groupHeightPx

    return group.map((appointment) => {
      const visualRow = Math.floor(appointment.overlapGroupIndex / cardsPerRow)
      const visualColumn = appointment.overlapGroupIndex % cardsPerRow

      return {
        ...appointment,
        visualRow,
        visualColumn,
        visualRowCount: rowCount,
        visualColumnCount: Math.min(cardsPerRow, group.length),
        visualTopPx:
          visualTopPx +
          visualRow * (rowHeightPx + APPOINTMENT_CARD_ROW_GAP_PX),
        visualHeightPx: Math.max(
          appointment.heightMinutes * minuteHeightPx,
          APPOINTMENT_CARD_MIN_HEIGHT_PX,
        ),
      }
    })
  })
}

export function buildWeeklyAppointmentGrid(
  appointments: Appointment[],
  weekStart: Date,
): WeeklyGridDay[] {
  return Array.from({ length: 5 }, (_, index) => {
    const date = addDays(weekStart, index)
    const key = format(date, 'yyyy-MM-dd')

    return {
      key,
      date,
      appointments: placeAppointments(
        appointments.filter(
          (appointment) => appointmentLocalDateKey(appointment) === key,
        ),
      ),
    }
  })
}
