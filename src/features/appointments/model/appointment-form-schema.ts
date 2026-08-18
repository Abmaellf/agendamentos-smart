import { z } from 'zod'

import type { AppointmentRole, CreateAppointmentInput } from './appointment'

const requiredId = (message: string) => z.string().trim().min(1, message)
const datePattern = /^\d{4}-\d{2}-\d{2}$/
const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/
const pricePattern = /^(?:0|[1-9]\d*)(?:\.\d{2})$/

export const appointmentFormSchema = z.object({
  patientId: requiredId('Selecione um paciente.'),
  unitId: requiredId('Selecione uma unidade.'),
  serviceId: requiredId('Selecione um serviço.'),
  professionalId: z.string().trim().min(1).nullable().optional(),
  date: z.string().regex(datePattern, 'Informe uma data válida.'),
  time: z.string().regex(timePattern, 'Informe um horário válido.'),
  durationMinutes: z.preprocess(
    (value) => (value === '' ? undefined : Number(value)),
    z
      .number({ message: 'Informe a duração.' })
      .int('Informe a duração em minutos inteiros.')
      .min(1, 'A duração mínima é de 1 minuto.')
      .max(480, 'A duração máxima é de 480 minutos.'),
  ),
  price: z.string().regex(pricePattern, 'Informe o preço no formato 0.00.'),
})

export type AppointmentFormValues = z.input<typeof appointmentFormSchema>

function partsInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)

  return Object.fromEntries(parts.map((part) => [part.type, part.value]))
}

export function zonedDateTimeToDate(
  date: string,
  time: string,
  timeZone: string,
) {
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  const targetAsUtc = Date.UTC(year, month - 1, day, hour, minute)
  let candidate = targetAsUtc

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = partsInTimeZone(new Date(candidate), timeZone)
    const representedAsUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    )
    candidate -= representedAsUtc - targetAsUtc
  }

  return new Date(candidate)
}

export function toCreateAppointmentInput(
  value: AppointmentFormValues,
  context: { role: AppointmentRole; timeZone: string },
): CreateAppointmentInput {
  const parsed = appointmentFormSchema.parse(value)

  return {
    patientId: parsed.patientId,
    unitId: parsed.unitId,
    serviceId: parsed.serviceId,
    professionalId: parsed.professionalId || null,
    startsAt: zonedDateTimeToDate(
      parsed.date,
      parsed.time,
      context.timeZone,
    ).toISOString(),
    durationMinutes: parsed.durationMinutes,
    price: parsed.price,
  }
}

export function validateAppointmentTiming(
  value: Pick<AppointmentFormValues, 'date' | 'time'>,
  context: { now: Date; timeZone: string },
) {
  if (
    typeof value.date !== 'string' ||
    typeof value.time !== 'string' ||
    !datePattern.test(value.date) ||
    !timePattern.test(value.time)
  ) {
    return { success: false, message: 'Informe uma data e horário válidos.' }
  }

  const startsAt = zonedDateTimeToDate(value.date, value.time, context.timeZone)

  if (startsAt.getTime() < context.now.getTime()) {
    return {
      success: false,
      message: 'Não é possível criar agendamento em data ou horário passado.',
    }
  }

  return { success: true }
}
