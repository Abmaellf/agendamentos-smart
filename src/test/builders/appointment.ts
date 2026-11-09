export type TestRole = 'ADMIN' | 'BASIC'

export interface TestSession {
  user: {
    id: string
    name: string
    role: TestRole
  }
  tenantId: string
  activeUnitId: string
}

export interface TestAppointment {
  id: string
  tenantId: string
  unitId: string
  patient: { id: string; name: string }
  service: { id: string; name: string }
  professional: { id: string; name: string } | null
  startsAt: string
  timeZone: string
  durationMinutes: number
  price: number
  status:
    | 'AGENDADO'
    | 'FALTA'
    | 'REAGENDADO'
    | 'CANCELADO'
    | 'EMATENDIMENTO'
    | 'FINALIZADO'
  createdBy: string
  createdAt: string
  patientId: string
  pathology: string[]
  appointmentDate: string
  hours: string
  variant: string
  updatedAt: string
}

export const adminSession: TestSession = {
  user: { id: 'user-admin', name: 'Alice Admin', role: 'ADMIN' },
  tenantId: 'tenant-a',
  activeUnitId: 'unit-a',
}

export const basicSession: TestSession = {
  user: { id: 'user-basic', name: 'Bruno Basic', role: 'BASIC' },
  tenantId: 'tenant-a',
  activeUnitId: 'unit-a',
}

export const patients = [
  { id: 'patient-a', name: 'Ana Paciente', tenantId: 'tenant-a' },
  { id: 'patient-b', name: 'Bia Paciente', tenantId: 'tenant-a' },
]

export const units = [
  {
    id: 'unit-a',
    name: 'Unidade Centro',
    tenantId: 'tenant-a',
    timeZone: 'America/Cuiaba',
  },
]

export const services = [
  {
    id: 'service-pilates',
    name: 'Pilates',
    tenantId: 'tenant-a',
    durationMinutes: 60,
    price: '150.00',
    capacity: 3,
  },
  {
    id: 'service-fisio',
    name: 'Fisioterapia',
    tenantId: 'tenant-a',
    durationMinutes: 45,
    price: '120.00',
    capacity: 1,
  },
]

export const professionals = [
  {
    id: 'professional-a',
    name: 'Carla Profissional',
    tenantId: 'tenant-a',
    serviceIds: ['service-pilates'],
    availableWeekDays: [1, 2, 3, 4, 5],
  },
  {
    id: 'professional-b',
    name: 'Diego Profissional',
    tenantId: 'tenant-a',
    serviceIds: ['service-fisio'],
    availableWeekDays: [1, 3, 5],
  },
]

export const validFormValues = {
  patientId: 'patient-a',
  unitId: 'unit-a',
  serviceId: 'service-pilates',
  professionalId: null,
  date: '2026-08-20',
  time: '08:30',
  durationMinutes: 60,
  price: '150.00',
}

export const createdAppointment: TestAppointment = {
  id: 'appointment-created',
  tenantId: 'tenant-a',
  unitId: 'unit-a',
  patient: { id: 'patient-a', name: 'Ana Paciente' },
  service: { id: 'service-pilates', name: 'Pilates' },
  professional: null,
  startsAt: '2026-08-20T12:30:00.000Z',
  timeZone: 'America/Cuiaba',
  durationMinutes: 60,
  price: 150,
  status: 'AGENDADO',
  createdBy: 'user-admin',
  createdAt: '2026-08-13T15:00:00.000Z',
  patientId: 'patient-a',
  pathology: [],
  appointmentDate: '2026-08-20T08:30:00',
  hours: '08:30:00',
  variant: 'primary',
  updatedAt: '2026-08-13T15:00:00.000Z',
}

export const backendAppointmentFixtures: TestAppointment[] = [
  {
    id: '50000000-0000-4000-8000-000000000001',
    tenantId: '70000000-0000-4000-8000-000000000001',
    unitId: '60000000-0000-4000-8000-000000000001',
    patient: {
      id: '20000000-0000-4000-8000-000000000001',
      name: 'Ana Oliveira',
    },
    service: {
      id: '40000000-0000-4000-8000-000000000003',
      name: 'Turma de reabilitação',
    },
    professional: null,
    startsAt: '2026-11-09T12:30:00.000Z',
    timeZone: 'America/Cuiaba',
    durationMinutes: 60,
    price: 150,
    status: 'AGENDADO',
    createdBy: '10000000-0000-4000-8000-000000000001',
    createdAt: '2026-11-08T16:14:23.683549Z',
    patientId: '20000000-0000-4000-8000-000000000001',
    pathology: [],
    appointmentDate: '2026-11-09T04:30:00',
    hours: '04:30:00',
    variant: 'primary',
    updatedAt: '2026-11-08T16:14:23.683549Z',
  },
  {
    id: '50000000-0000-4000-8000-000000000003',
    tenantId: '70000000-0000-4000-8000-000000000001',
    unitId: '60000000-0000-4000-8000-000000000001',
    patient: {
      id: '20000000-0000-4000-8000-000000000003',
      name: 'Carla Mendes',
    },
    service: {
      id: '40000000-0000-4000-8000-000000000001',
      name: 'Pilates',
    },
    professional: {
      id: '30000000-0000-4000-8000-000000000002',
      name: 'Diego Profissional',
    },
    startsAt: '2026-11-11T14:00:00.000Z',
    timeZone: 'America/Cuiaba',
    durationMinutes: 60,
    price: 150,
    status: 'AGENDADO',
    createdBy: '10000000-0000-4000-8000-000000000001',
    createdAt: '2026-11-08T16:14:23.683549Z',
    patientId: '20000000-0000-4000-8000-000000000003',
    pathology: [],
    appointmentDate: '2026-11-11T06:00:00',
    hours: '06:00:00',
    variant: 'primary',
    updatedAt: '2026-11-08T16:14:23.683549Z',
  },
  {
    id: '50000000-0000-4000-8000-000000000005',
    tenantId: '70000000-0000-4000-8000-000000000001',
    unitId: '60000000-0000-4000-8000-000000000001',
    patient: {
      id: '20000000-0000-4000-8000-000000000001',
      name: 'Ana Oliveira',
    },
    service: {
      id: '40000000-0000-4000-8000-000000000003',
      name: 'Turma de reabilitação',
    },
    professional: null,
    startsAt: '2026-11-13T20:00:00.000Z',
    timeZone: 'America/Cuiaba',
    durationMinutes: 60,
    price: 150,
    status: 'AGENDADO',
    createdBy: '10000000-0000-4000-8000-000000000001',
    createdAt: '2026-11-08T16:14:23.683549Z',
    patientId: '20000000-0000-4000-8000-000000000001',
    pathology: [],
    appointmentDate: '2026-11-13T12:00:00',
    hours: '12:00:00',
    variant: 'primary',
    updatedAt: '2026-11-08T16:14:23.683549Z',
  },
]
