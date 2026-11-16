import { describe, expect, it } from 'vitest'

import {
  packageFormSchema,
  toServicePackageInput,
  type PackageFormValues,
} from './package-form-schema'

const validForm = {
  name: 'Fisioterapia dez sessões',
  description: '  Sessões de reabilitação  ',
  unitId: 'unit-1',
  serviceId: 'service-1',
  totalSessions: '10',
  totalPrice: '400.00',
  weekDays: ['MONDAY', 'WEDNESDAY'],
} satisfies PackageFormValues

describe('packageFormSchema', () => {
  it.each([
    ['um dia', ['SUNDAY']],
    [
      'sete dias',
      [
        'SUNDAY',
        'MONDAY',
        'TUESDAY',
        'WEDNESDAY',
        'THURSDAY',
        'FRIDAY',
        'SATURDAY',
      ],
    ],
  ])(
    'aceita configuração com %s de atendimento semanal',
    (_label, weekDays) => {
      expect(
        packageFormSchema.safeParse({ ...validForm, weekDays }).success,
      ).toBe(true)
    },
  )

  it('converte os valores do formulário no contrato decimal da API', () => {
    expect(toServicePackageInput(validForm, true)).toEqual({
      ...validForm,
      description: 'Sessões de reabilitação',
      totalSessions: 10,
      active: true,
    })
  })

  it.each([
    [{ ...validForm, totalSessions: '0' }, 'totalSessions'],
    [{ ...validForm, totalPrice: '400' }, 'totalPrice'],
    [{ ...validForm, weekDays: [] }, 'weekDays'],
    [{ ...validForm, weekDays: ['MONDAY', 'MONDAY'] }, 'weekDays'],
  ])('rejeita configuração inválida no campo %s', (value, field) => {
    const parsed = packageFormSchema.safeParse(value)

    expect(parsed.success).toBe(false)
    if (!parsed.success) {
      expect(
        parsed.error.flatten().fieldErrors[field as keyof typeof value],
      ).toBeTruthy()
    }
  })
})
