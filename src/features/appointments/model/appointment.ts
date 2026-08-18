export type AppointmentRole = 'ADMIN' | 'BASIC'

export interface AppointmentSession {
  user: {
    id: string
    name?: string
    login?: string
    role: AppointmentRole
  }
  tenantId: string
  activeUnitId: string
}

export interface PatientOption {
  id: string
  name: string
  tenantId: string
}

export interface UnitOption {
  id: string
  name: string
  tenantId: string
  timeZone: string
}

export interface ServiceOption {
  id: string
  name: string
  tenantId: string
  durationMinutes: number
  price: string
  capacity: number
}

export interface ProfessionalOption {
  id: string
  name: string
  tenantId: string
  serviceIds: string[]
  availableWeekDays: number[]
}

export interface CreateAppointmentInput {
  patientId: string
  unitId: string
  serviceId: string
  professionalId: string | null
  startsAt: string
  durationMinutes: number
  price: string
}

export type AppointmentStatus =
  | 'AGENDADO'
  | 'FALTA'
  | 'REAGENDADO'
  | 'CANCELADO'
  | 'ATENDENDO'
  | 'FINALIZADO'

export interface Appointment {
  id: string
  tenantId: string
  unitId: string
  patient: { id: string; name: string }
  service: { id: string; name: string }
  professional: { id: string; name: string } | null
  startsAt: string
  timeZone: string
  durationMinutes: number
  price: string
  status: AppointmentStatus
  createdBy: string
  createdAt: string
}

export interface AppointmentApiError {
  code?: string
  message?: string
  fieldErrors?: Record<string, string[]>
}
