import type { PatientListItem } from '@/@types/patient'

export interface TestPatientListItem extends PatientListItem {
    tenantId: string
}

export const patientListItems: TestPatientListItem[] = [
    {
        id: 'patient-a',
        code: 1,
        name: 'Ana Paciente',
        clinicId: 'tenant-a',
        tenantId: 'tenant-a',
        unitIds: ['unit-a'],
        createdAt: '2025-10-21T12:00:00.000Z',
        status: 'ATIVO',
        principalService: { id: 'service-pilates', name: 'Pilates' },
    },
    {
        id: 'patient-b',
        code: 2,
        name: 'Bia Paciente',
        clinicId: 'tenant-a',
        tenantId: 'tenant-a',
        unitIds: ['unit-a'],
        createdAt: '2025-10-21T12:00:00.000Z',
        status: 'ATIVO',
        principalService: { id: 'service-fisio', name: 'Fisioterapia' },
    },
    {
        id: 'patient-c',
        code: 3,
        name: 'Carla Mendes',
        clinicId: 'tenant-a',
        tenantId: 'tenant-a',
        unitIds: ['unit-a'],
        createdAt: '2025-10-21T12:00:00.000Z',
        status: 'ATIVO',
        principalService: null,
    },
    {
        id: 'patient-d',
        code: 4,
        name: 'Diego Lima',
        clinicId: 'tenant-a',
        tenantId: 'tenant-a',
        unitIds: ['unit-a'],
        createdAt: '2025-10-21T12:00:00.000Z',
        status: 'EM_ATENDIMENTO',
        principalService: null,
    },
    {
        id: 'patient-e',
        code: 5,
        name: 'Elisa Ferreira',
        clinicId: 'tenant-a',
        tenantId: 'tenant-a',
        unitIds: ['unit-a'],
        createdAt: '2025-10-21T12:00:00.000Z',
        status: null,
        principalService: null,
    },
]

export const createdPatient: TestPatientListItem = {
    id: 'patient-created',
    code: 6,
    name: 'Beatriz Souza',
    clinicId: 'tenant-a',
    tenantId: 'tenant-a',
    unitIds: ['unit-a'],
    createdAt: '2026-11-17T12:00:00.000Z',
    status: null,
    principalService: null,
}
