import { z } from 'zod'

import type { SessionProfile } from '@/@types/session'

const sessionProfileSchema = z.object({
  id: z.string().min(1),
  login: z.string().min(1),
  role: z.enum(['ADMIN', 'BASIC']),
  tenantId: z.string().min(1),
  activeUnitId: z.string().min(1),
  clinicName: z.string().min(1).optional(),
  unitName: z.string().min(1).optional(),
})

export function parseSessionProfile(value: unknown): SessionProfile {
  const parsed = sessionProfileSchema.parse(value)
  const name =
    typeof value === 'object' && value !== null && 'name' in value
      ? String(value.name)
      : undefined

  return {
    user: {
      id: parsed.id,
      login: parsed.login,
      role: parsed.role,
      ...(name ? { name } : {}),
    },
    tenantId: parsed.tenantId,
    activeUnitId: parsed.activeUnitId,
    ...(parsed.clinicName ? { clinicName: parsed.clinicName } : {}),
    ...(parsed.unitName ? { unitName: parsed.unitName } : {}),
  }
}
