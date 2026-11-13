import type { AppointmentRole } from './appointment'

export interface SessionProfile {
  user: {
    id: string
    login: string
    role: AppointmentRole
    name?: string
  }
  tenantId: string
  activeUnitId: string
  clinicName?: string
  unitName?: string
}
