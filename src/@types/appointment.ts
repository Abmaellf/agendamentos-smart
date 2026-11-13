export type AppointmentRole = 'ADMIN' | 'BASIC'

export interface AppointmentSession {
  user: {
    id: string
    name?: string
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

export interface AppointmentPatient {
  id: string
  name: string
}

export interface AppointmentService {
  id: string
  name: string
}

export interface AppointmentProfessional {
  id: string
  name: string
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
  | 'EMATENDIMENTO'
  | 'FINALIZADO'

export interface Appointment {
  id: string
  tenantId: string
  unitId: string
  patient: AppointmentPatient
  service: AppointmentService
  professional: AppointmentProfessional | null
  startsAt: string
  durationMinutes: number
  price: number
  status: AppointmentStatus
  timeZone: string
  createdBy: string
  createdAt: string
  patientId: string
  pathology: string[]
  appointmentDate: string
  hours: string
  variant: string
  updatedAt: string
}

export interface AppointmentApiError {
  code?: string
  message?: string
  fieldErrors?: Record<string, string[]>
}

export interface CardDayProps {
  date: string
  isToday: boolean
  dayWeek: number
}

export interface CardPatientProps {
  appointment: Appointment
  isToday: boolean
}

export interface StatusPresentation {
  label: string
  className: string
}

export interface CreateAppointmentDialogProps {
  session: AppointmentSession
  defaultDate?: string
  triggerLabel?: string
  triggerAriaLabel?: string
}

export interface AppointmentFormState {
  patientId: string
  unitId: string
  serviceId: string
  professionalId: string
  date: string
  time: string
  durationMinutes: number | string
  price: string
}
