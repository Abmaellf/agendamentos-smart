import { api } from '@/lib/axios'

import { parseSessionProfile } from '../../session/model/session'
import type {
  Appointment,
  AppointmentSession,
  CreateAppointmentInput,
  PatientOption,
  ProfessionalOption,
  ServiceOption,
  UnitOption,
} from '../model/appointment'

interface ContentResponse<T> {
  content: T[]
}

function contentOf<T>(value: ContentResponse<T> | T[]) {
  return Array.isArray(value) ? value : value.content
}

export async function getAppointmentSession(): Promise<AppointmentSession> {
  const { data } = await api.get('/auth/me')
  return parseSessionProfile(data)
}

export async function getPatients() {
  const { data } = await api.get<
    ContentResponse<PatientOption> | PatientOption[]
  >('/api/patients')
  return contentOf(data)
}

export async function getUnits() {
  const { data } = await api.get<ContentResponse<UnitOption> | UnitOption[]>(
    '/api/units',
  )
  return contentOf(data)
}

export async function getServices() {
  const { data } = await api.get<
    ContentResponse<ServiceOption> | ServiceOption[]
  >('/api/services')
  return contentOf(data)
}

export async function getProfessionals(serviceId: string) {
  const { data } = await api.get<
    ContentResponse<ProfessionalOption> | ProfessionalOption[]
  >('/api/professionals', { params: { serviceId } })
  return contentOf(data)
}

export async function createAppointment(input: CreateAppointmentInput) {
  const { data } = await api.post<Appointment>('/api/scheduling', input)
  return data
}

export async function getAppointments(params: {
  unitId: string
  from: string
  to: string
}) {
  const { data } = await api.get<ContentResponse<Appointment> | Appointment[]>(
    '/api/scheduling',
    { params },
  )
  return contentOf(data)
}
