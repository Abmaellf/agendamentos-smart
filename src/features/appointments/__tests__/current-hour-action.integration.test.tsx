import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Route, Routes } from 'react-router-dom'

import { AppLayout } from '@/_layout/app'
import { renderWithProviders } from '@/test/render'
import { apiScenario } from '@/test/server'

import { AppointmentsPage } from '../pages/appointments-page'

describe('ação coletiva da hora corrente', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date('2026-08-13T16:30:00.000Z'))
    apiScenario.appointments = [
      {
        ...apiScenario.createdAppointment,
        id: 'appointment-current-hour',
        startsAt: '2026-08-13T16:00:00.000Z',
        appointmentDate: '2026-08-13T12:00:00',
        hours: '12:00:00',
        status: 'FALTA',
      },
    ]
  })

  afterEach(() => vi.useRealTimers())

  it('posiciona o botão simples e confirma presença em uma chamada', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/appointments" element={<AppointmentsPage />} />
        </Route>
      </Routes>,
    )

    const container = await screen.findByTestId('start-current-hour-container')
    expect(container).toHaveAttribute(
      'data-action-anchor',
      'current-hour-group-bottom-right',
    )
    expect(container).toHaveClass('size-[72px]', 'pointer-events-none')

    const toggle = await screen.findByTestId('start-current-hour-toggle')
    expect(toggle).toHaveAttribute('data-button-color', '#6F3CFF')
    expect(toggle).not.toHaveAttribute('data-button-shape')
    expect(toggle).toHaveClass(
      'size-12',
      'rounded-full',
      'text-[#6F3CFF]',
      'hover:bg-[#6F3CFF]/10',
      'focus-visible:ring-[#6F3CFF]',
    )
    expect(
      screen.queryByTestId('start-current-hour-triangle'),
    ).not.toBeInTheDocument()

    await user.click(toggle)
    expect(screen.getByTestId('start-current-hour-action')).toBeVisible()

    await user.click(screen.getByTestId('start-current-hour-action'))

    await waitFor(() =>
      expect(apiScenario.startCurrentHourRequests).toEqual([
        {
          unitId: 'unit-a',
          hourStart: '2026-08-13T16:00:00.000Z',
        },
      ]),
    )
    await waitFor(() => expect(apiScenario.appointments[0]?.status).toBe('ATENDENDO'))
    expect(await screen.findByText('1 atendimento iniciado.')).toBeVisible()
  })

  it('agrupa os cartões da hora corrente e não chama a API ao passar o cursor', async () => {
    apiScenario.appointments = [
      {
        ...apiScenario.createdAppointment,
        id: 'appointment-current-hour-first',
        startsAt: '2026-08-13T16:00:00.000Z',
        appointmentDate: '2026-08-13T12:00:00',
        hours: '12:00:00',
        status: 'FALTA',
      },
      {
        ...apiScenario.createdAppointment,
        id: 'appointment-current-hour-second',
        patient: { id: 'patient-second', name: 'Segundo Paciente' },
        patientId: 'patient-second',
        startsAt: '2026-08-13T16:20:00.000Z',
        appointmentDate: '2026-08-13T12:20:00',
        hours: '12:20:00',
        status: 'AGENDADO',
      },
      {
        ...apiScenario.createdAppointment,
        id: 'appointment-next-hour',
        startsAt: '2026-08-13T17:00:00.000Z',
        appointmentDate: '2026-08-13T13:00:00',
        hours: '13:00:00',
        status: 'AGENDADO',
      },
    ]

    renderWithProviders(
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/appointments" element={<AppointmentsPage />} />
        </Route>
      </Routes>,
    )

    const group = await screen.findByTestId('current-hour-appointment-group')
    expect(group).toHaveAttribute('data-day', '2026-08-13')
    expect(group).toHaveAttribute('data-hour', '12')
    expect(group).toHaveAttribute('data-appointment-count', '2')
    expect(group).toHaveClass('border', 'border-transparent')
    expect(
      screen.getByTestId('appointments-day-2026-08-13').querySelectorAll(
        '[data-testid="current-hour-appointment-group"]',
      ),
    ).toHaveLength(1)

    const currentHourRow = screen
      .getByTestId('appointments-day-2026-08-13')
      .querySelector('[data-hour="12"]') as HTMLElement
    fireEvent.mouseEnter(currentHourRow)
    expect(group).toHaveAttribute('data-hovered', 'true')
    expect(group).toHaveClass('border-[#6F3CFF]')
    expect(apiScenario.startCurrentHourRequests).toHaveLength(0)

    fireEvent.mouseLeave(currentHourRow)
    expect(group).toHaveAttribute('data-hovered', 'false')
    expect(group).toHaveClass('border-transparent')
  })

  it('atualiza somente os agendamentos elegíveis da hora corrente', async () => {
    apiScenario.appointments = [
      {
        ...apiScenario.createdAppointment,
        id: 'appointment-current-hour-eligible',
        startsAt: '2026-08-13T16:00:00.000Z',
        status: 'AGENDADO',
      },
      {
        ...apiScenario.createdAppointment,
        id: 'appointment-current-hour-cancelled',
        startsAt: '2026-08-13T16:20:00.000Z',
        status: 'CANCELADO',
      },
      {
        ...apiScenario.createdAppointment,
        id: 'appointment-next-hour-untouched',
        startsAt: '2026-08-13T17:00:00.000Z',
        status: 'AGENDADO',
      },
    ]

    const user = userEvent.setup()
    renderWithProviders(
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/appointments" element={<AppointmentsPage />} />
        </Route>
      </Routes>,
    )

    await user.click(await screen.findByTestId('start-current-hour-toggle'))
    await user.click(screen.getByTestId('start-current-hour-action'))

    await waitFor(() =>
      expect(apiScenario.startCurrentHourRequests).toHaveLength(1),
    )
    await waitFor(() =>
      expect(
        apiScenario.appointments.find(
          (appointment) => appointment.id === 'appointment-current-hour-eligible',
        )?.status,
      ).toBe('ATENDENDO'),
    )
    expect(
      apiScenario.appointments.find(
        (appointment) => appointment.id === 'appointment-current-hour-cancelled',
      )?.status,
    ).toBe('CANCELADO')
    expect(
      apiScenario.appointments.find(
        (appointment) => appointment.id === 'appointment-next-hour-untouched',
      )?.status,
    ).toBe('AGENDADO')
  })

  it('desabilita a ação quando não há agendamento elegível', async () => {
    apiScenario.appointments = [
      {
        ...apiScenario.createdAppointment,
        id: 'appointment-current-hour-cancelled-only',
        startsAt: '2026-08-13T16:00:00.000Z',
        status: 'CANCELADO',
      },
    ]

    const user = userEvent.setup()
    renderWithProviders(
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/appointments" element={<AppointmentsPage />} />
        </Route>
      </Routes>,
    )

    await user.click(await screen.findByTestId('start-current-hour-toggle'))
    expect(screen.getByTestId('start-current-hour-action')).toBeDisabled()
    expect(
      screen.getByText('Nenhum agendamento para iniciar nesta faixa'),
    ).toBeInTheDocument()
    expect(apiScenario.startCurrentHourRequests).toHaveLength(0)
  })

  it('fecha com Escape, devolvendo o foco ao botão de abertura sem enviar', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/appointments" element={<AppointmentsPage />} />
        </Route>
      </Routes>,
    )

    const toggle = await screen.findByTestId('start-current-hour-toggle')
    await user.click(toggle)
    expect(screen.getByTestId('start-current-hour-action')).toBeVisible()

    await user.keyboard('{Escape}')

    await waitFor(() => expect(screen.queryByTestId('start-current-hour-action')).not.toBeInTheDocument())
    expect(toggle).toHaveFocus()
    expect(apiScenario.startCurrentHourRequests).toHaveLength(0)
    expect(apiScenario.appointments[0]?.status).toBe('FALTA')
  })

  it('fecha ao clicar fora sem propagar a ação para a grade', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/appointments" element={<AppointmentsPage />} />
        </Route>
      </Routes>,
    )

    await user.click(await screen.findByTestId('start-current-hour-toggle'))
    await user.click(screen.getByTestId('appointments-header'))

    expect(screen.queryByTestId('start-current-hour-action')).not.toBeInTheDocument()
    expect(apiScenario.startCurrentHourRequests).toHaveLength(0)
  })

  it('não exibe a ação quando a hora corrente já ultrapassou o limite da grade', async () => {
    vi.setSystemTime(new Date('2026-08-14T00:30:00.000Z'))

    renderWithProviders(
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/appointments" element={<AppointmentsPage />} />
        </Route>
      </Routes>,
    )

    await screen.findByTestId('weekly-appointments')
    expect(screen.queryByTestId('start-current-hour-toggle')).not.toBeInTheDocument()
  })
})
