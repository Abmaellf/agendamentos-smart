import type { Appointment } from '@/@types/appointment'
import { createdAppointment } from '@/test/builders/appointment'
import { describe, expect, it } from 'vitest'

import {
  appointmentLocalDateKey,
  appointmentLocalTime,
  buildWeeklyAppointmentGrid,
} from '../model/weekly-grid'

const baseAppointment = createdAppointment as unknown as Appointment

function makeAppointment(overrides: Partial<Appointment> = {}) {
  return { ...baseAppointment, ...overrides }
}

describe('modelo da grade horária semanal', () => {
  it('converte o horário normal e os minutos intermediários no fuso do agendamento', () => {
    const appointment = makeAppointment({
      startsAt: '2026-08-13T15:30:00.000Z',
      durationMinutes: 45,
    })

    const [day] = buildWeeklyAppointmentGrid(
      [appointment],
      new Date('2026-08-10T12:00:00-04:00'),
    ).filter((item) => item.appointments.length > 0)
    const positioned = day?.appointments[0]

    expect(appointmentLocalDateKey(appointment)).toBe('2026-08-13')
    expect(appointmentLocalTime(appointment)).toBe('11:30')
    expect(positioned).toMatchObject({
      startMinutes: 690,
      endMinutes: 735,
      topMinutes: 270,
      heightMinutes: 45,
    })
  })

  it('mantém a data local na virada de dia e em fuso diferente do navegador', () => {
    const appointment = makeAppointment({
      startsAt: '2026-08-14T06:30:00.000Z',
      timeZone: 'America/Los_Angeles',
    })

    expect(appointmentLocalDateKey(appointment)).toBe('2026-08-13')
    expect(appointmentLocalTime(appointment)).toBe('23:30')
  })

  it('distribui dois, três e cinco agendamentos simultâneos em faixas estáveis', () => {
    const appointments = [
      makeAppointment({
        id: 'appointment-a',
        startsAt: '2026-08-13T14:00:00.000Z',
        durationMinutes: 60,
      }),
      makeAppointment({
        id: 'appointment-b',
        startsAt: '2026-08-13T14:30:00.000Z',
        durationMinutes: 60,
      }),
      makeAppointment({
        id: 'appointment-c',
        startsAt: '2026-08-13T14:45:00.000Z',
        durationMinutes: 30,
      }),
      makeAppointment({
        id: 'appointment-d',
        startsAt: '2026-08-13T14:45:00.000Z',
        durationMinutes: 15,
      }),
      makeAppointment({
        id: 'appointment-e',
        startsAt: '2026-08-13T14:45:00.000Z',
        durationMinutes: 30,
      }),
      makeAppointment({
        id: 'appointment-adjacent',
        startsAt: '2026-08-13T15:30:00.000Z',
        durationMinutes: 30,
      }),
    ]

    const [day] = buildWeeklyAppointmentGrid(
      appointments,
      new Date('2026-08-10T12:00:00-04:00'),
    ).filter((item) => item.appointments.length > 0)

    expect(day?.appointments.map((item) => [item.appointment.id, item.lane])).toEqual([
      ['appointment-a', 0],
      ['appointment-b', 1],
      ['appointment-c', 2],
      ['appointment-e', 3],
      ['appointment-d', 4],
      ['appointment-adjacent', 0],
    ])
    expect(day?.appointments.slice(0, 5).every((item) => item.laneCount === 5)).toBe(
      true,
    )
    expect(day?.appointments[5]).toMatchObject({ lane: 0, laneCount: 1 })
  })
})
