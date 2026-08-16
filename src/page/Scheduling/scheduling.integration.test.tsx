import { screen, waitFor } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { createdAppointment } from '@/test/builders/appointment'
import { renderWithProviders } from '@/test/render'
import { apiScenario } from '@/test/server'

import { Scheduling } from './index'

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
    apiScenario.createdAppointment = {
      ...createdAppointment,
      startsAt: '2026-08-14T12:30:00.000Z',
    }
  })

  it('WB-16 refaz a consulta e apresenta uma única vez o agendamento criado', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Scheduling />)
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
    apiScenario.scheduleDelayMs = 1_000

    renderWithProviders(<Scheduling />)

    expect(screen.getByRole('status')).toHaveTextContent(/carregando agenda/i)
  })

  it('WB-17 apresenta erro e permite repetir a consulta', async () => {
    apiScenario.scheduleErrorStatus = 500
    const user = userEvent.setup()
    renderWithProviders(<Scheduling />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /não foi possível carregar a agenda/i,
    )
    apiScenario.scheduleErrorStatus = null
    await user.click(screen.getByRole('button', { name: /tentar novamente/i }))

    expect(
      await screen.findByText(/nenhum agendamento nesta semana/i),
    ).toBeVisible()
  })

  it('WB-17 apresenta estado vazio sem usar os fixtures antigos de CardDay', async () => {
    renderWithProviders(<Scheduling />)

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
    renderWithProviders(<Scheduling />)

    expect(await screen.findByText('Ana Paciente')).toBeVisible()
    expect(screen.getByText('10:00')).toBeVisible()
    expect(apiScenario.scheduleQueries[0]?.get('unitId')).toBe('unit-a')
    expect(apiScenario.scheduleQueries[0]?.get('from')).toBeTruthy()
    expect(apiScenario.scheduleQueries[0]?.get('to')).toBeTruthy()
  })

  it('WB-18 disponibiliza e abre a criação para sessão operacional autenticada', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Scheduling />)

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
