import { delay, http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

import type { PatientListItem } from '@/@types/patient'

import {
  adminSession,
  createdAppointment,
  professionals,
  services,
  units,
  type TestAppointment,
  type TestSession,
} from './builders/appointment'
import {
  createdPatient,
  patientListItems,
  type TestPatientListItem,
} from './builders/patient'

type CatalogName = 'patients' | 'units' | 'services' | 'professionals'

interface ApiScenario {
  session: TestSession
  catalogs: Record<CatalogName, unknown[]>
  catalogDelayMs: number
  catalogErrors: Partial<Record<CatalogName, number>>
  createDelayMs: number
  createErrorCode: string | null
  createNetworkError: boolean
  appointmentDelayMs: number
  appointmentErrorStatus: number | null
  createdAppointment: TestAppointment
  appointments: TestAppointment[]
  createRequests: Record<string, unknown>[]
  professionalQueries: string[]
  appointmentQueries: URLSearchParams[]
  catalogRequests: Record<CatalogName, number>
  collectionResponse: 'content' | 'array'
  patientCreateDelayMs: number
  patientCreateErrorCode: string | null
  patientCreateNetworkError: boolean
  patientCreateRequests: Record<string, unknown>[]
  patientQueries: URLSearchParams[]
  createdPatient: TestPatientListItem
}

function initialScenario(): ApiScenario {
  return {
    session: adminSession,
    catalogs: {
      patients: [...patientListItems],
      units: [...units],
      services: [...services],
      professionals: [...professionals],
    },
    catalogDelayMs: 0,
    catalogErrors: {},
    createDelayMs: 0,
    createErrorCode: null,
    createNetworkError: false,
    appointmentDelayMs: 0,
    appointmentErrorStatus: null,
    createdAppointment,
    appointments: [],
    createRequests: [],
    professionalQueries: [],
    appointmentQueries: [],
    catalogRequests: {
      patients: 0,
      units: 0,
      services: 0,
      professionals: 0,
    },
    collectionResponse: 'content',
    patientCreateDelayMs: 0,
    patientCreateErrorCode: null,
    patientCreateNetworkError: false,
    patientCreateRequests: [],
    patientQueries: [],
    createdPatient,
  }
}

export const apiScenario = initialScenario()

export function resetApiScenario() {
  Object.assign(apiScenario, initialScenario())
}

async function catalogResponse(name: CatalogName, content?: unknown[]) {
  apiScenario.catalogRequests[name] += 1

  if (apiScenario.catalogDelayMs > 0) {
    await delay(apiScenario.catalogDelayMs)
  }

  const errorStatus = apiScenario.catalogErrors[name]
  if (errorStatus) {
    return HttpResponse.json(
      { code: 'CATALOG_LOAD_FAILED', message: `Falha ao carregar ${name}` },
      { status: errorStatus },
    )
  }

  const collection = content ?? apiScenario.catalogs[name]
  return HttpResponse.json(
    apiScenario.collectionResponse === 'array'
      ? collection
      : { content: collection },
  )
}

async function patientListResponse(request: Request) {
  apiScenario.catalogRequests.patients += 1
  apiScenario.patientQueries.push(new URL(request.url).searchParams)

  if (apiScenario.catalogDelayMs > 0) {
    await delay(apiScenario.catalogDelayMs)
  }

  const errorStatus = apiScenario.catalogErrors.patients
  if (errorStatus) {
    return HttpResponse.json(
      {
        code: 'PATIENT_LIST_FAILED',
        message: 'Falha ao carregar pacientes',
      },
      { status: errorStatus },
    )
  }

  const searchParams = new URL(request.url).searchParams
  const page = Math.max(Number(searchParams.get('page') ?? 0), 0)
  const size = Math.max(Number(searchParams.get('size') ?? 5), 1)
  const name = searchParams.get('name')?.trim().toLocaleLowerCase('pt-BR')
  const status = searchParams.get('status')
  const serviceId = searchParams.get('serviceId')
  const allPatients = apiScenario.catalogs.patients as PatientListItem[]
  const filtered = allPatients.filter((patient) => {
    const matchesName =
      !name || patient.name.toLocaleLowerCase('pt-BR').includes(name)
    const matchesStatus = !status || patient.status === status
    const matchesService =
      !serviceId || patient.principalService?.id === serviceId

    return matchesName && matchesStatus && matchesService
  })

  if (apiScenario.collectionResponse === 'array') {
    return HttpResponse.json(filtered)
  }

  const start = page * size
  const content = filtered.slice(start, start + size)
  const totalPages = Math.ceil(filtered.length / size)

  return HttpResponse.json({
    content,
    page,
    size,
    totalElements: filtered.length,
    totalPages,
    last: totalPages === 0 || page >= totalPages - 1,
  })
}

function patientErrorStatus(code: string) {
  switch (code) {
    case 'VALIDATION_ERROR':
      return 400
    case 'CLINIC_ACCESS_DENIED':
    case 'UNIT_ACCESS_DENIED':
      return 403
    case 'TENANT_RESOURCE_NOT_FOUND':
      return 404
    default:
      return 409
  }
}

const handlers = [
  http.get('http://localhost:8080/auth/me', () => {
    const session = apiScenario.session

    return HttpResponse.json({
      id: session.user.id,
      name: session.user.name,
      login: 'user@clinica.test',
      role: session.user.role,
      tenantId: session.tenantId,
      activeUnitId: session.activeUnitId,
      clinicName: 'Equilíbrio',
      unitName: 'Matriz',
    })
  }),
  http.get('http://localhost:8080/patient/list', ({ request }) =>
    patientListResponse(request),
  ),
  http.post('http://localhost:8080/patient/save', async ({ request }) => {
    const payload = (await request.json()) as Record<string, unknown>
    apiScenario.patientCreateRequests.push(payload)

    if (apiScenario.patientCreateDelayMs > 0) {
      await delay(apiScenario.patientCreateDelayMs)
    }

    if (apiScenario.patientCreateNetworkError) {
      return HttpResponse.error()
    }

    if (apiScenario.patientCreateErrorCode) {
      return HttpResponse.json(
        {
          code: apiScenario.patientCreateErrorCode,
          message: 'Cadastro recusado pelo domínio',
          fieldErrors: {},
        },
        { status: patientErrorStatus(apiScenario.patientCreateErrorCode) },
      )
    }

    const response: TestPatientListItem = {
      ...apiScenario.createdPatient,
      name: String(payload.name),
      unitIds: Array.isArray(payload.unitIds)
        ? payload.unitIds.map(String)
        : [],
    }
    apiScenario.catalogs.patients.push(response)
    return HttpResponse.json(response, { status: 201 })
  }),
  http.get('http://localhost:8080/api/units', () => catalogResponse('units')),
  http.get('http://localhost:8080/api/services', () =>
    catalogResponse('services'),
  ),
  http.get('http://localhost:8080/api/professionals', ({ request }) => {
    const serviceId = new URL(request.url).searchParams.get('serviceId') ?? ''
    apiScenario.professionalQueries.push(serviceId)
    const matchingProfessionals = apiScenario.catalogs.professionals.filter(
      (professional) => {
        const serviceIds = (professional as { serviceIds?: string[] })
          .serviceIds
        return !serviceId || serviceIds?.includes(serviceId)
      },
    )
    return catalogResponse('professionals', matchingProfessionals)
  }),
  http.get('http://localhost:8080/api/appointments', async ({ request }) => {
    apiScenario.appointmentQueries.push(new URL(request.url).searchParams)
    if (apiScenario.appointmentDelayMs > 0) {
      await delay(apiScenario.appointmentDelayMs)
    }
    if (apiScenario.appointmentErrorStatus) {
      return HttpResponse.json(
        {
          code: 'APPOINTMENT_LOAD_FAILED',
          message: 'Falha ao carregar agenda',
        },
        { status: apiScenario.appointmentErrorStatus },
      )
    }
    return HttpResponse.json(
      apiScenario.collectionResponse === 'array'
        ? apiScenario.appointments
        : { content: apiScenario.appointments },
    )
  }),
  http.post('http://localhost:8080/api/appointments', async ({ request }) => {
    const payload = (await request.json()) as Record<string, unknown>
    apiScenario.createRequests.push(payload)

    if (apiScenario.createDelayMs > 0) {
      await delay(apiScenario.createDelayMs)
    }

    if (apiScenario.createNetworkError) {
      return HttpResponse.error()
    }

    if (apiScenario.createErrorCode) {
      return HttpResponse.json(
        {
          code: apiScenario.createErrorCode,
          message: 'Criação recusada pelo domínio',
          fieldErrors: {},
        },
        {
          status:
            apiScenario.createErrorCode === 'TENANT_RESOURCE_NOT_FOUND'
              ? 404
              : 409,
        },
      )
    }

    apiScenario.appointments.push(apiScenario.createdAppointment)
    return HttpResponse.json(apiScenario.createdAppointment, { status: 201 })
  }),
]

export const server = setupServer(...handlers)
