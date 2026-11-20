import { screen, waitFor } from '@testing-library/react'
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

  it('abre a ação acima do mais e confirma presença em uma chamada', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/appointments" element={<AppointmentsPage />} />
        </Route>
      </Routes>,
    )

    await user.click(await screen.findByTestId('start-current-hour-toggle'))
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
})
