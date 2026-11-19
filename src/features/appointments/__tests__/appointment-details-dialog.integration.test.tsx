import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AppLayout } from '@/_layout/app'
import { renderWithProviders } from '@/test/render'
import { apiScenario } from '@/test/server'
import { createdAppointment } from '@/test/builders/appointment'
import { Route, Routes } from 'react-router-dom'

import { AppointmentsPage } from '../pages/appointments-page'

function renderAppointmentsPage() {
  return renderWithProviders(
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/appointments" element={<AppointmentsPage />} />
      </Route>
    </Routes>,
  )
}

function appointmentWithStatus(
  status: typeof createdAppointment.status = 'AGENDADO',
) {
  return {
    ...createdAppointment,
    id: `appointment-details-${status.toLowerCase()}`,
    startsAt: '2026-08-13T18:00:00.000Z',
    appointmentDate: '2026-08-13T14:00:00',
    hours: '14:00:00',
    status,
  }
}

describe('detalhes do agendamento do paciente', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date('2026-08-13T12:00:00-04:00'))
    apiScenario.appointments = [appointmentWithStatus()]
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  async function openDetails(user: ReturnType<typeof userEvent.setup>) {
    const card = await screen.findByTestId(
      'appointment-appointment-details-agendado',
    )
    await user.click(card)
    expect(
      await screen.findByRole('dialog', { name: /detalhes do agendamento/i }),
    ).toBeVisible()
  }

  it('apresenta os dados do paciente e desabilita recursos fora do escopo', async () => {
    const user = userEvent.setup()
    renderAppointmentsPage()
    await openDetails(user)

    const dialog = screen.getByRole('dialog', {
      name: /detalhes do agendamento/i,
    })
    expect(dialog).toHaveClass('w-[calc(100vw-2rem)]')
    expect(dialog).toHaveClass('sm:max-w-[min(66rem,calc(100vw-2rem))]')
    expect(dialog).toHaveTextContent('Ana Paciente')
    expect(dialog).toHaveTextContent('ID: patient-a')
    expect(dialog).toHaveTextContent('Pilates')
    expect(dialog).toHaveTextContent('13 de agosto de 2026')
    expect(dialog).toHaveTextContent('14:00 (1 hora)')
    expect(dialog).toHaveTextContent('Aguardando atendimento')
    expect(dialog).toHaveTextContent('Em breve')
    expect(
      screen.getByRole('button', { name: /editar agendamento/i }),
    ).toBeDisabled()
    expect(screen.getByRole('button', { name: /atendida/i })).toBeDisabled()
  })

  it('fecha com o botão e com Escape sem alterar o agendamento', async () => {
    const user = userEvent.setup()
    renderAppointmentsPage()
    await openDetails(user)

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(apiScenario.statusUpdateRequests).toHaveLength(0)
    expect(apiScenario.appointments[0]?.status).toBe('AGENDADO')
  })

  it('inicia o atendimento pelo toggle e bloqueia o cancelamento depois da transição', async () => {
    const user = userEvent.setup()
    renderAppointmentsPage()
    await openDetails(user)

    await user.click(
      screen.getByRole('button', { name: /iniciar agendamento/i }),
    )

    await waitFor(() =>
      expect(apiScenario.statusUpdateRequests).toEqual([
        { id: 'appointment-details-agendado', status: 'ATENDENDO' },
      ]),
    )
    const dialog = screen.getByRole('dialog', {
      name: /detalhes do agendamento/i,
    })
    expect(within(dialog).getByText('Atendimento iniciado')).toBeVisible()
    expect(
      screen.getByRole('button', { name: /cancelar agendamento/i }),
    ).toBeDisabled()
    expect(
      screen.getByRole('button', { name: /iniciar agendamento/i }),
    ).toBeDisabled()
  })

  it('permite cancelar somente enquanto aguarda atendimento', async () => {
    const user = userEvent.setup()
    renderAppointmentsPage()
    await openDetails(user)

    await user.click(
      screen.getByRole('button', { name: /cancelar agendamento/i }),
    )

    await waitFor(() =>
      expect(apiScenario.statusUpdateRequests).toEqual([
        { id: 'appointment-details-agendado', status: 'CANCELADO' },
      ]),
    )
    const dialog = screen.getByRole('dialog', {
      name: /detalhes do agendamento/i,
    })
    expect(within(dialog).getByText('Cancelado')).toBeVisible()
    expect(
      screen.getByRole('button', { name: /cancelar agendamento/i }),
    ).toBeDisabled()
    expect(
      screen.getByRole('button', { name: /iniciar agendamento/i }),
    ).toBeDisabled()
  })

  it('mantém o estado quando a API recusa a transição e exibe o erro de domínio', async () => {
    const user = userEvent.setup()
    apiScenario.statusUpdateErrorCode = 'APPOINTMENT_STATUS_TRANSITION_INVALID'
    renderAppointmentsPage()
    await openDetails(user)

    await user.click(
      screen.getByRole('button', { name: /iniciar agendamento/i }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /não permite essa mudança de status/i,
    )
    const dialog = screen.getByRole('dialog', {
      name: /detalhes do agendamento/i,
    })
    expect(within(dialog).getByText('Aguardando atendimento')).toBeVisible()
    expect(apiScenario.statusUpdateRequests).toHaveLength(1)
    expect(
      screen.getByRole('button', { name: /iniciar agendamento/i }),
    ).toBeEnabled()
  })

  it('não permite ações manuais quando o status é falta', async () => {
    const user = userEvent.setup()
    apiScenario.appointments = [appointmentWithStatus('FALTA')]
    renderAppointmentsPage()

    const card = await screen.findByTestId(
      'appointment-appointment-details-falta',
    )
    await user.click(card)

    const dialog = screen.getByRole('dialog', {
      name: /detalhes do agendamento/i,
    })
    expect(within(dialog).getByText('Falta')).toBeVisible()
    expect(
      screen.getByRole('button', { name: /cancelar agendamento/i }),
    ).toBeDisabled()
    expect(
      screen.getByRole('button', { name: /iniciar agendamento/i }),
    ).toBeDisabled()
    expect(apiScenario.statusUpdateRequests).toHaveLength(0)
  })
})
