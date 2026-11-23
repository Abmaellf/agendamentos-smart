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
  statusUpdateDelayMs: number
  statusUpdateErrorCode: string | null
  statusUpdateNetworkError: boolean
  appointmentDelayMs: number
  appointmentErrorStatus: number | null
  startCurrentHourRequests: { unitId: string; hourStart: string }[]
  startCurrentHourDelayMs: number
  startCurrentHourErrorCode: string | null
  startCurrentHourNetworkError: boolean
  createdAppointment: TestAppointment
  appointments: TestAppointment[]
  createRequests: Record<string, unknown>[]
  statusUpdateRequests: { id: string; status: string }[]
  professionalQueries: string[]
  appointmentQueries: URLSearchParams[]
  catalogRequests: Record<CatalogName, number>
  collectionResponse: 'content' | 'array'
  patientCreateDelayMs: number
  patientCreateErrorCode: string | null
  patientCreateNetworkError: boolean
  patientCreateRequests: Record<string, unknown>[]
  patientQueries: URLSearchParams[]
  appointmentPatientQueries: URLSearchParams[]
  createdPatient: TestPatientListItem
  refreshRequests: number
  refreshErrorStatus: number | null
  logoutRequests: number
  logoutErrorStatus: number | null
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
    statusUpdateDelayMs: 0,
    statusUpdateErrorCode: null,
    statusUpdateNetworkError: false,
    appointmentDelayMs: 0,
    appointmentErrorStatus: null,
    startCurrentHourRequests: [],
    startCurrentHourDelayMs: 0,
    startCurrentHourErrorCode: null,
    startCurrentHourNetworkError: false,
    createdAppointment,
    appointments: [],
    createRequests: [],
    statusUpdateRequests: [],
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
    appointmentPatientQueries: [],
    createdPatient,
    refreshRequests: 0,
    refreshErrorStatus: null,
    logoutRequests: 0,
    logoutErrorStatus: null,
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

async function appointmentPatientCatalogResponse(request: Request) {
  apiScenario.catalogRequests.patients += 1
  const searchParams = new URL(request.url).searchParams
  apiScenario.appointmentPatientQueries.push(searchParams)

  if (apiScenario.catalogDelayMs > 0) {
    await delay(apiScenario.catalogDelayMs)
  }

  const errorStatus = apiScenario.catalogErrors.patients
  if (errorStatus) {
    return HttpResponse.json(
      {
        code: 'PATIENT_CATALOG_FAILED',
        message: 'Falha ao carregar pacientes da unidade',
      },
      { status: errorStatus },
    )
  }

  const unitId = searchParams.get('unitId')
  const patients = (apiScenario.catalogs.patients as PatientListItem[]).filter(
    (patient) => !unitId || patient.unitIds.includes(unitId),
  )

  const options = patients.map((patient) => ({
    id: patient.id,
    name: patient.name,
    tenantId:
      (patient as PatientListItem & { tenantId?: string }).tenantId ??
      patient.clinicId,
  }))

  return HttpResponse.json(
    apiScenario.collectionResponse === 'array' ? options : { content: options },
  )
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
  http.post('http://localhost:8080/auth/refresh', () => {
    apiScenario.refreshRequests += 1

    if (apiScenario.refreshErrorStatus) {
      return HttpResponse.json({}, { status: apiScenario.refreshErrorStatus })
    }

    return new HttpResponse(null, { status: 204 })
  }),
  http.post('http://localhost:8080/auth/logout', () => {
    apiScenario.logoutRequests += 1

    if (apiScenario.logoutErrorStatus) {
      return HttpResponse.json({}, { status: apiScenario.logoutErrorStatus })
    }

    return new HttpResponse(null, { status: 204 })
  }),
  http.get('http://localhost:8080/patient/list', ({ request }) =>
    patientListResponse(request),
  ),
  http.get('http://localhost:8080/api/patients', ({ request }) =>
    appointmentPatientCatalogResponse(request),
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
  http.post(
    'http://localhost:8080/api/appointments/start-current-hour',
    async ({ request }) => {
      const payload = (await request.json()) as {
        unitId?: string
        hourStart?: string
      }
      const input = {
        unitId: String(payload.unitId),
        hourStart: String(payload.hourStart),
      }
      apiScenario.startCurrentHourRequests.push(input)

      if (apiScenario.startCurrentHourDelayMs > 0) {
        await delay(apiScenario.startCurrentHourDelayMs)
      }
      if (apiScenario.startCurrentHourNetworkError) return HttpResponse.error()
      if (apiScenario.startCurrentHourErrorCode) {
        return HttpResponse.json(
          {
            code: apiScenario.startCurrentHourErrorCode,
            message: 'Início coletivo recusado pelo domínio',
          },
          { status: apiScenario.startCurrentHourErrorCode === 'APPOINTMENT_HOUR_NOT_CURRENT' ? 409 : 422 },
        )
      }

      const updated = apiScenario.appointments.filter(
        (appointment) =>
          appointment.unitId === input.unitId &&
          appointment.startsAt >= input.hourStart &&
          appointment.startsAt <
            new Date(new Date(input.hourStart).getTime() + 3_600_000).toISOString() &&
          (appointment.status === 'AGENDADO' || appointment.status === 'FALTA'),
      )
      apiScenario.appointments = apiScenario.appointments.map((appointment) =>
        updated.includes(appointment)
          ? { ...appointment, status: 'ATENDENDO' }
          : appointment,
      )
      return HttpResponse.json({
        unitId: input.unitId,
        timeZone: 'America/Cuiaba',
        hourStart: input.hourStart,
        hourEnd: new Date(
          new Date(input.hourStart).getTime() + 3_600_000,
        ).toISOString(),
        evaluatedAt: input.hourStart,
        targetStatus: 'ATENDENDO',
        matchedCount: updated.length,
        updatedCount: updated.length,
        skippedCount: 0,
        skippedByStatus: {},
      })
    },
  ),
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
  http.patch(
    'http://localhost:8080/api/appointments/:id/status',
    async ({ params, request }) => {
      const payload = (await request.json()) as { status?: string }
      const id = String(params.id)
      apiScenario.statusUpdateRequests.push({
        id,
        status: String(payload.status),
      })

      if (apiScenario.statusUpdateDelayMs > 0) {
        await delay(apiScenario.statusUpdateDelayMs)
      }

      if (apiScenario.statusUpdateNetworkError) {
        return HttpResponse.error()
      }

      if (apiScenario.statusUpdateErrorCode) {
        return HttpResponse.json(
          {
            code: apiScenario.statusUpdateErrorCode,
            message: 'Alteração de status recusada pelo domínio',
            fieldErrors: {},
          },
          {
            status:
              apiScenario.statusUpdateErrorCode === 'TENANT_RESOURCE_NOT_FOUND'
                ? 404
                : 409,
          },
        )
      }

      const index = apiScenario.appointments.findIndex(
        (appointment) => appointment.id === id,
      )
      if (index < 0) {
        return HttpResponse.json(
          {
            code: 'TENANT_RESOURCE_NOT_FOUND',
            message: 'Cadastro não encontrado',
          },
          { status: 404 },
        )
      }

      const updatedAppointment = {
        ...apiScenario.appointments[index],
        status:
          payload.status as (typeof apiScenario.appointments)[number]['status'],
        updatedAt: '2026-08-13T16:00:00.000Z',
      }
      apiScenario.appointments[index] = updatedAppointment
      return HttpResponse.json(updatedAppointment)
    },
  ),
]

export const server = setupServer(...handlers)
