import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createdAppointment } from '@/test/builders/appointment'
import { renderWithProviders } from '@/test/render'
import { apiScenario } from '@/test/server'

import { AppointmentsPage } from '../pages/appointments-page'

async function chooseOption(
  user: UserEvent,
  label: RegExp,
  optionName: RegExp,
) {
  const combobox = await screen.findByRole('combobox', { name: label })
  if (combobox instanceof HTMLSelectElement) {
    const option = await screen.findByRole('option', { name: optionName })
    await user.selectOptions(combobox, (option as HTMLOptionElement).value)
    return
  }
  await user.click(combobox)
  await user.click(await screen.findByRole('option', { name: optionName }))
}

async function fillAndSubmitAppointment(user: UserEvent) {
  await user.click(screen.getByRole('button', { name: /novo agendamento/i }))
  await chooseOption(user, /^paciente/i, /ana paciente/i)
  await chooseOption(user, /^unidade/i, /unidade centro/i)
  await chooseOption(user, /^serviço/i, /pilates/i)

  const date = screen.getByLabelText(/^data/i)
  await user.clear(date)
  await user.type(date, '2026-08-14')
  const time = screen.getByLabelText(/^horário/i)
  await user.clear(time)
  await user.type(time, '08:30')
  await user.click(screen.getByRole('button', { name: /criar agendamento/i }))
}

describe('integração da criação com a agenda semanal', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date('2026-08-13T12:00:00-04:00'))
    apiScenario.createdAppointment = {
      ...createdAppointment,
      startsAt: '2026-08-14T12:30:00.000Z',
    }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('WB-16 refaz a consulta e apresenta uma única vez o agendamento criado', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AppointmentsPage />)
    expect(
      await screen.findByText(/nenhum agendamento nesta semana/i),
    ).toBeVisible()

    await fillAndSubmitAppointment(user)

    expect(
      await screen.findByText(/agendamento criado com sucesso/i),
    ).toBeVisible()
    await waitFor(() =>
      expect(
        screen.getAllByTestId('appointment-appointment-created'),
      ).toHaveLength(1),
    )
    expect(screen.getByText('Ana Paciente')).toBeVisible()
    expect(screen.getByText('08:30')).toBeVisible()
    expect(screen.getByText('AGENDADO')).toBeVisible()
    expect(screen.getByText(/60 min/i)).toBeVisible()
    expect(screen.getByText(/R\$\s*150,00/i)).toBeVisible()
    expect(apiScenario.appointments).toHaveLength(1)
  })

  it('WB-17 apresenta carregamento da agenda', () => {
    apiScenario.appointmentDelayMs = 1_000

    renderWithProviders(<AppointmentsPage />)

    expect(screen.getByRole('status')).toHaveTextContent(/carregando agenda/i)
  })

  it('WB-17 apresenta erro e permite repetir a consulta', async () => {
    apiScenario.appointmentErrorStatus = 500
    const user = userEvent.setup()
    renderWithProviders(<AppointmentsPage />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /não foi possível carregar a agenda/i,
    )
    apiScenario.appointmentErrorStatus = null
    await user.click(screen.getByRole('button', { name: /tentar novamente/i }))

    expect(
      await screen.findByText(/nenhum agendamento nesta semana/i),
    ).toBeVisible()
  })

  it('WB-17 apresenta estado vazio sem usar os fixtures antigos de CardDay', async () => {
    renderWithProviders(<AppointmentsPage />)

    expect(
      await screen.findByText(/nenhum agendamento nesta semana/i),
    ).toBeVisible()
    expect(screen.queryByText('Abmael')).not.toBeInTheDocument()
  })

  it('WB-17 apresenta os dados retornados pela API no fuso da unidade', async () => {
    apiScenario.appointments = [
      {
        ...createdAppointment,
        startsAt: '2026-08-13T14:00:00.000Z',
      },
    ]
    renderWithProviders(<AppointmentsPage />)

    expect(await screen.findByText('Ana Paciente')).toBeVisible()
    expect(screen.getByText('10:00')).toBeVisible()
    expect(apiScenario.appointmentQueries[0]?.get('unitId')).toBe('unit-a')
    expect(apiScenario.appointmentQueries[0]?.get('from')).toBeTruthy()
    expect(apiScenario.appointmentQueries[0]?.get('to')).toBeTruthy()
  })

  it('atualiza a semana por meio do seletor de data', async () => {
    renderWithProviders(<AppointmentsPage />)

    const dateInput = await screen.findByLabelText(/selecionar data da agenda/i)
    fireEvent.change(dateInput, { target: { value: '2026-08-19' } })

    expect(screen.getByText('19 de Agosto de 2026')).toBeVisible()
    const selectedDay = await screen.findByRole('region', {
      name: 'Quarta - 19',
    })
    expect(selectedDay).toBeVisible()
    expect(selectedDay).toHaveAttribute('data-selected', 'true')
  })

  it('navega entre semanas pelos botões do cabeçalho', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AppointmentsPage />)

    await user.click(screen.getByRole('button', { name: /semana anterior/i }))
    expect(screen.getByText('06 de Agosto de 2026')).toBeVisible()

    await user.click(screen.getByRole('button', { name: /próxima semana/i }))
    expect(screen.getByText('13 de Agosto de 2026')).toBeVisible()
  })

  it.each([
    ['AGENDADO', 'bg-appointment-scheduled'],
    ['FALTA', 'bg-appointment-missed'],
    ['REAGENDADO', 'bg-appointment-rescheduled'],
    ['CANCELADO', 'bg-appointment-canceled'],
    ['ATENDENDO', 'bg-appointment-in-progress'],
    ['FINALIZADO', 'bg-appointment-completed'],
  ] as const)(
    'aplica o token visual do status %s',
    async (status, colorToken) => {
      apiScenario.appointments = [
        {
          ...createdAppointment,
          id: `appointment-${status.toLowerCase()}`,
          startsAt: '2026-08-13T14:00:00.000Z',
          status,
        },
      ]

      renderWithProviders(<AppointmentsPage />)

      const card = await screen.findByTestId(
        `appointment-appointment-${status.toLowerCase()}`,
      )
      expect(card).toHaveAttribute('data-status', status)
      expect(card).toHaveClass(colorToken)
    },
  )

  it('WB-18 disponibiliza e abre a criação para sessão operacional autenticada', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AppointmentsPage />)

    const trigger = await screen.findByRole('button', {
      name: /novo agendamento/i,
    })
    expect(trigger).toBeEnabled()
    await user.click(trigger)

    expect(
      await screen.findByRole('dialog', { name: /novo agendamento/i }),
    ).toBeVisible()
  })
})
