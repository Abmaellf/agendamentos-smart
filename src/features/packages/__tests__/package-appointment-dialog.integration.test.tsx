import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { PackageAppointmentDialog } from '../components/package-appointment-dialog'
import { adminSession, basicSession } from '@/test/builders/appointment'
import { patientListItems } from '@/test/builders/patient'
import { apiScenario, server } from '@/test/server'
import { renderWithProviders } from '@/test/render'

const packageForUnitA = {
  id: 'package-unit-a',
  unitId: 'unit-a',
  unitName: 'Unidade Centro',
  serviceId: 'service-pilates',
  serviceName: 'Pilates',
  name: 'Pilates Centro',
  description: null,
  totalSessions: 4,
  totalPrice: '500.00',
  weekDays: ['MONDAY', 'WEDNESDAY'],
  weeklyFrequency: 2,
  active: true,
}

const packageForUnitB = {
  ...packageForUnitA,
  id: 'package-unit-b',
  unitId: 'unit-b',
  unitName: 'Unidade Parque',
  name: 'Pilates Parque',
}

async function openDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    screen.getByRole('button', { name: /agendamento de pacotes/i }),
  )
  await screen.findByRole('dialog', { name: /agendamento de pacotes/i })
}

async function selectOption(
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  value: string,
) {
  await user.selectOptions(
    await screen.findByRole('combobox', { name: label }),
    value,
  )
}

function setupPackageApi() {
  const packageQueries: URLSearchParams[] = []
  const previewRequests: Record<string, unknown>[] = []
  const confirmationRequests: Record<string, unknown>[] = []

  server.use(
    http.get('http://localhost:8080/api/service-packages', ({ request }) => {
      const params = new URL(request.url).searchParams
      packageQueries.push(params)
      const unitId = params.get('unitId')
      const packages = [packageForUnitA, packageForUnitB].filter(
        (item) => !unitId || item.unitId === unitId,
      )
      return HttpResponse.json({ content: packages })
    }),
    http.post(
      'http://localhost:8080/api/package-appointments/preview',
      async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>
        previewRequests.push(body)
        return HttpResponse.json({
          packageId: body.packageId,
          patientId: body.patientId,
          unitId: body.unitId,
          totalPrice: '500.00',
          firstDate: '2026-08-24',
          lastDate: '2026-09-02',
          sessions: [
            {
              sequence: 1,
              date: '2026-08-24',
              time: body.time,
              startsAt: '2026-08-24T12:30:00.000Z',
            },
          ],
          fingerprint: 'preview-fingerprint',
        })
      },
    ),
    http.post(
      'http://localhost:8080/api/package-appointments/confirm',
      async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>
        confirmationRequests.push(body)
        return HttpResponse.json({
          contractId: 'contract-1',
          appointmentIds: ['appointment-package-1'],
          preview: null,
        })
      },
    ),
  )

  return { packageQueries, previewRequests, confirmationRequests }
}

describe('diálogo de agendamento por pacote', () => {
  it('permite ao ADMIN escolher a unidade antes de consultar pacientes', async () => {
    const user = userEvent.setup()
    const { packageQueries } = setupPackageApi()
    renderWithProviders(
      <PackageAppointmentDialog session={adminSession} defaultDate="2026-08-20" />,
    )

    await openDialog(user)

    expect(screen.getByRole('combobox', { name: 'Paciente' })).toBeDisabled()
    expect(apiScenario.appointmentPatientQueries).toHaveLength(0)

    await selectOption(user, 'Unidade', 'unit-a')

    await waitFor(() =>
      expect(
        apiScenario.appointmentPatientQueries[
          apiScenario.appointmentPatientQueries.length - 1
        ]?.get('unitId'),
      ).toBe('unit-a'),
    )
    await waitFor(() =>
      expect(packageQueries[packageQueries.length - 1]?.get('unitId')).toBe(
        'unit-a',
      ),
    )
    expect(screen.getByRole('combobox', { name: 'Paciente' })).toBeEnabled()
  })

  it('fixa a unidade da sessão e não permite troca para BASIC', async () => {
    const user = userEvent.setup()
    setupPackageApi()
    renderWithProviders(
      <PackageAppointmentDialog session={basicSession} defaultDate="2026-08-20" />,
    )

    await openDialog(user)

    const unit = await screen.findByRole('combobox', { name: 'Unidade' })
    await waitFor(() => expect(unit).toHaveValue('unit-a'))
    expect(unit).toBeDisabled()
    await waitFor(() =>
      expect(
        apiScenario.appointmentPatientQueries[
          apiScenario.appointmentPatientQueries.length - 1
        ]?.get('unitId'),
      ).toBe('unit-a'),
    )
  })

  it('limpa paciente e prévia quando ADMIN troca a unidade', async () => {
    const user = userEvent.setup()
    apiScenario.catalogs.units.push({
      id: 'unit-b',
      name: 'Unidade Parque',
      tenantId: 'tenant-a',
      timeZone: 'America/Cuiaba',
    })
    apiScenario.catalogs.patients.push({
      ...patientListItems[0],
      id: 'patient-unit-b',
      name: 'Paciente Parque',
      unitIds: ['unit-b'],
    })
    setupPackageApi()
    renderWithProviders(
      <PackageAppointmentDialog session={adminSession} defaultDate="2026-08-20" />,
    )

    await openDialog(user)
    await selectOption(user, 'Unidade', 'unit-a')
    await selectOption(user, 'Paciente', 'patient-a')
    await selectOption(user, 'Pacote', 'package-unit-a')
    await user.type(screen.getByLabelText('Horário'), '08:30')
    await user.click(screen.getByRole('button', { name: /gerar prévia/i }))
    expect(await screen.findByRole('button', { name: /confirmar agendamentos/i })).toBeVisible()

    await selectOption(user, 'Unidade', 'unit-b')

    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: 'Paciente' })).toHaveValue(''),
    )
    expect(screen.getByRole('combobox', { name: 'Pacote' })).toHaveValue('')
    expect(
      screen.queryByRole('button', { name: /confirmar agendamentos/i }),
    ).not.toBeInTheDocument()
    await waitFor(() =>
      expect(
        apiScenario.appointmentPatientQueries[
          apiScenario.appointmentPatientQueries.length - 1
        ]?.get('unitId'),
      ).toBe('unit-b'),
    )
  })

  it('envia a unidade efetiva na prévia e na confirmação', async () => {
    const user = userEvent.setup()
    const { previewRequests, confirmationRequests } = setupPackageApi()
    renderWithProviders(
      <PackageAppointmentDialog session={adminSession} defaultDate="2026-08-20" />,
    )

    await openDialog(user)
    await selectOption(user, 'Unidade', 'unit-a')
    await selectOption(user, 'Paciente', 'patient-a')
    await selectOption(user, 'Pacote', 'package-unit-a')
    await user.type(screen.getByLabelText('Horário'), '08:30')
    await user.click(screen.getByRole('button', { name: /gerar prévia/i }))
    await screen.findByRole('button', { name: /confirmar agendamentos/i })

    expect(previewRequests[0]).toMatchObject({
      unitId: 'unit-a',
      patientId: 'patient-a',
      packageId: 'package-unit-a',
    })

    await user.click(
      screen.getByRole('button', { name: /confirmar agendamentos/i }),
    )

    await waitFor(() => expect(confirmationRequests).toHaveLength(1))
    expect(confirmationRequests[0]).toMatchObject({
      unitId: 'unit-a',
      patientId: 'patient-a',
      packageId: 'package-unit-a',
    })
  })

  it('bloqueia a confirmação quando a unidade não possui pacientes', async () => {
    const user = userEvent.setup()
    apiScenario.catalogs.patients = []
    setupPackageApi()
    renderWithProviders(
      <PackageAppointmentDialog session={adminSession} defaultDate="2026-08-20" />,
    )

    await openDialog(user)
    await selectOption(user, 'Unidade', 'unit-a')

    expect(
      await screen.findByText(/nenhum paciente disponível para esta unidade/i),
    ).toBeVisible()
    expect(
      screen.getByRole('button', { name: /gerar prévia/i }),
    ).toBeDisabled()
  })
})
