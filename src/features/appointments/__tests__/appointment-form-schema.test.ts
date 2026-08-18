import { describe, expect, it } from 'vitest'

import { validFormValues } from '@/test/builders/appointment'
import { loadSubject } from '@/test/load-subject'

interface ParseFailure {
  success: false
  error: {
    flatten(): { fieldErrors: Record<string, string[]> }
  }
}

interface AppointmentFormSchemaModule {
  appointmentFormSchema: {
    safeParse(value: unknown): { success: true; data: unknown } | ParseFailure
  }
  toCreateAppointmentInput(
    value: typeof validFormValues,
    context: { role: 'ADMIN' | 'BASIC'; timeZone: string },
  ): Record<string, unknown>
  validateAppointmentTiming(
    value: Pick<typeof validFormValues, 'date' | 'time'>,
    context: { now: Date; timeZone: string },
  ): { success: boolean; message?: string }
}

const subjectUrl = new URL(
  '../model/appointment-form-schema.ts',
  import.meta.url,
)

async function loadSchema() {
  return loadSubject<AppointmentFormSchemaModule>(subjectUrl)
}

describe('schema do agendamento manual', () => {
  it.each([
    'patientId',
    'unitId',
    'serviceId',
    'date',
    'time',
    'durationMinutes',
  ] as const)('WB-01 identifica %s como campo obrigatório', async (field) => {
    const { appointmentFormSchema } = await loadSchema()
    const invalidValues = { ...validFormValues, [field]: '' }

    const result = appointmentFormSchema.safeParse(invalidValues)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors[field]).toBeDefined()
    }
  })

  it('WB-02 aceita profissional ausente e o serializa como null', async () => {
    const { appointmentFormSchema, toCreateAppointmentInput } =
      await loadSchema()

    const result = appointmentFormSchema.safeParse({
      ...validFormValues,
      professionalId: null,
    })

    expect(result.success).toBe(true)
    expect(
      toCreateAppointmentInput(validFormValues, {
        role: 'ADMIN',
        timeZone: 'America/Cuiaba',
      }),
    ).toMatchObject({ professionalId: null })
  })

  it.each([
    ['durationMinutes', 0],
    ['durationMinutes', 481],
    ['price', '-1.00'],
    ['price', '10.999'],
    ['price', 'R$ 10,00'],
    ['time', '24:00'],
    ['time', '8h30'],
  ] as const)('WB-03 rejeita %s=%s', async (field, value) => {
    const { appointmentFormSchema } = await loadSchema()

    const result = appointmentFormSchema.safeParse({
      ...validFormValues,
      [field]: value,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors[field]).toBeDefined()
    }
  })

  it('WB-03 mantém preço como decimal textual no payload', async () => {
    const { toCreateAppointmentInput } = await loadSchema()

    const payload = toCreateAppointmentInput(
      { ...validFormValues, price: '150.10' },
      { role: 'ADMIN', timeZone: 'America/Cuiaba' },
    )

    expect(payload.price).toBe('150.10')
    expect(typeof payload.price).toBe('string')
  })

  it('WB-04 converte data e horário da unidade para um instante ISO', async () => {
    const { toCreateAppointmentInput } = await loadSchema()

    const payload = toCreateAppointmentInput(validFormValues, {
      role: 'ADMIN',
      timeZone: 'America/Cuiaba',
    })

    expect(payload.startsAt).toBe('2026-08-20T12:30:00.000Z')
    expect(payload).not.toHaveProperty('date')
    expect(payload).not.toHaveProperty('time')
  })

  it('WB-21 bloqueia horário passado para ADMIN e BASIC', async () => {
    const { validateAppointmentTiming } = await loadSchema()
    const context = {
      now: new Date('2026-08-13T15:00:00.000Z'),
      timeZone: 'America/Cuiaba',
    }

    const result = validateAppointmentTiming(
      { date: '2026-08-13', time: '10:00' },
      context,
    )

    expect(result).toEqual({
      success: false,
      message: 'Não é possível criar agendamento em data ou horário passado.',
    })
  })
})
