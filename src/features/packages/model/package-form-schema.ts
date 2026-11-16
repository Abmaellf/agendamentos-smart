import { z } from 'zod'

import type { PackageWeekDay, ServicePackageInput } from '../api/packages'

const pricePattern = /^(?:0|[1-9]\d*)(?:\.\d{2})$/

export const packageWeekDays = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
] as const satisfies readonly PackageWeekDay[]

export const packageFormSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome do pacote.'),
  description: z.string(),
  unitId: z.string().trim().min(1, 'Selecione uma unidade.'),
  serviceId: z.string().trim().min(1, 'Selecione um serviço.'),
  totalSessions: z.coerce
    .number()
    .int('Informe um número inteiro.')
    .min(1, 'Informe ao menos uma sessão.'),
  totalPrice: z
    .string()
    .regex(pricePattern, 'Informe o valor no formato 0.00.'),
  weekDays: z
    .array(z.enum(packageWeekDays))
    .min(1, 'Selecione ao menos um dia.')
    .refine(
      (days) => new Set(days).size === days.length,
      'Os dias da semana não podem se repetir.',
    ),
})

export type PackageFormValues = z.input<typeof packageFormSchema>

export function toServicePackageInput(
  value: PackageFormValues,
  active: boolean,
): ServicePackageInput {
  const parsed = packageFormSchema.parse(value)
  return {
    ...parsed,
    description: parsed.description.trim() || undefined,
    active,
  }
}
