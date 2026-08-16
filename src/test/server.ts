import { delay, http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

import {
  adminSession,
  createdAppointment,
  patients,
  professionals,
  services,
  units,
  type TestAppointment,
} from './builders/appointment'

type CatalogName = 'patients' | 'units' | 'services' | 'professionals'

interface ApiScenario {
  catalogs: Record<CatalogName, unknown[]>
  catalogDelayMs: number
  catalogErrors: Partial<Record<CatalogName, number>>
  createDelayMs: number
  createErrorCode: string | null
  createNetworkError: boolean
  scheduleDelayMs: number
  scheduleErrorStatus: number | null
  createdAppointment: TestAppointment
  appointments: TestAppointment[]
  createRequests: Record<string, unknown>[]
  professionalQueries: string[]
  scheduleQueries: URLSearchParams[]
}

function initialScenario(): ApiScenario {
  return {
    catalogs: {
      patients: [...patients],
      units: [...units],
      services: [...services],
      professionals: [...professionals],
    },
    catalogDelayMs: 0,
    catalogErrors: {},
    createDelayMs: 0,
    createErrorCode: null,
    createNetworkError: false,
    scheduleDelayMs: 0,
    scheduleErrorStatus: null,
    createdAppointment,
    appointments: [],
    createRequests: [],
    professionalQueries: [],
    scheduleQueries: [],
  }
}

export const apiScenario = initialScenario()

export function resetApiScenario() {
  Object.assign(apiScenario, initialScenario())
}

async function catalogResponse(name: CatalogName, content?: unknown[]) {
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

  return HttpResponse.json({ content: content ?? apiScenario.catalogs[name] })
}

const handlers = [
  http.get('http://localhost:8082/auth/me', () =>
    HttpResponse.json({
      id: adminSession.user.id,
      name: adminSession.user.name,
      login: 'admin@clinica.test',
      role: adminSession.user.role,
      tenantId: adminSession.tenantId,
      activeUnitId: adminSession.activeUnitId,
    }),
  ),
  http.get('http://localhost:8082/api/patients', () =>
    catalogResponse('patients'),
  ),
  http.get('http://localhost:8082/api/units', () => catalogResponse('units')),
  http.get('http://localhost:8082/api/services', () =>
    catalogResponse('services'),
  ),
  http.get('http://localhost:8082/api/professionals', ({ request }) => {
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
  http.get('http://localhost:8082/api/scheduling', async ({ request }) => {
    apiScenario.scheduleQueries.push(new URL(request.url).searchParams)
    if (apiScenario.scheduleDelayMs > 0) {
      await delay(apiScenario.scheduleDelayMs)
    }
    if (apiScenario.scheduleErrorStatus) {
      return HttpResponse.json(
        { code: 'SCHEDULE_LOAD_FAILED', message: 'Falha ao carregar agenda' },
        { status: apiScenario.scheduleErrorStatus },
      )
    }
    return HttpResponse.json({ content: apiScenario.appointments })
  }),
  http.post('http://localhost:8082/api/scheduling', async ({ request }) => {
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
