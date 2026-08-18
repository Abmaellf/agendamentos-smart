import { z } from 'zod'

const sessionProfileSchema = z.object({
  id: z.string().min(1),
  login: z.string().min(1),
  role: z.enum(['ADMIN', 'BASIC']),
  tenantId: z.string().min(1),
  activeUnitId: z.string().min(1),
})

export interface SessionProfile {
  user: {
    id: string
    login: string
    role: 'ADMIN' | 'BASIC'
    name?: string
  }
  tenantId: string
  activeUnitId: string
}

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
  }
}
