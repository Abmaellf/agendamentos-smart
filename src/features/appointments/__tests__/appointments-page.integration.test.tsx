import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  backendAppointmentFixtures,
  createdAppointment,
} from '@/test/builders/appointment'
import { AppLayout } from '@/_layout/app'
import { renderWithProviders } from '@/test/render'
import { apiScenario } from '@/test/server'
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

async function fillAndSubmitAppointment(
  user: UserEvent,
  patientName: RegExp = /ana paciente/i,
) {
  await user.click(screen.getByRole('button', { name: /novo agendamento/i }))
  await chooseOption(user, /^paciente/i, patientName)
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
    renderAppointmentsPage()
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
    await waitFor(() =>
      expect(apiScenario.appointmentQueries).toHaveLength(2),
    )
  })

  it('permite criar para outro paciente em um horário já ocupado quando a API aceita a vaga', async () => {
    const user = userEvent.setup()
    apiScenario.appointments = [
      {
        ...createdAppointment,
        id: 'appointment-existing-group',
        startsAt: '2026-08-14T12:30:00.000Z',
      },
    ]
    apiScenario.createdAppointment = {
      ...createdAppointment,
      id: 'appointment-new-group',
      patient: { id: 'patient-b', name: 'Bia Paciente' },
      patientId: 'patient-b',
      startsAt: '2026-08-14T12:30:00.000Z',
    }
    renderAppointmentsPage()

    await screen.findByTestId('appointment-appointment-existing-group')
    await fillAndSubmitAppointment(user, /bia paciente/i)

    await waitFor(() =>
      expect(apiScenario.createRequests).toHaveLength(1),
    )
    expect(apiScenario.createRequests[0]).toMatchObject({ patientId: 'patient-b' })
    expect(
      await screen.findByTestId('appointment-appointment-new-group'),
    ).toHaveAttribute('data-lane-count', '2')
    expect(screen.getByText('Ana Paciente')).toBeVisible()
    expect(screen.getByText('Bia Paciente')).toBeVisible()
  })

  it('WB-17 apresenta carregamento da agenda', () => {
    apiScenario.appointmentDelayMs = 1_000

    renderAppointmentsPage()

    expect(screen.getByText(/carregando agenda/i)).toBeVisible()
  })

  it('WB-17 apresenta erro e permite repetir a consulta', async () => {
    apiScenario.appointmentErrorStatus = 500
    const user = userEvent.setup()
    renderAppointmentsPage()

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
    renderAppointmentsPage()

    expect(
      await screen.findByText(/nenhum agendamento nesta semana/i),
    ).toBeVisible()
    expect(screen.queryByText('Abmael')).not.toBeInTheDocument()
  })

  it('apresenta o cabeçalho e o menu central da referência visual', async () => {
    renderAppointmentsPage()

    expect(await screen.findByRole('heading', { name: 'Agendamentos' })).toBeVisible()
    expect(
      screen.getByText('Visualize e gerencie os atendimentos da semana.'),
    ).toBeVisible()

    const menu = screen.getByRole('group', {
      name: 'Visualização da agenda',
    })
    expect(menu).toBeVisible()

    const week = within(menu).getByRole('button', { name: 'Semana' })
    expect(week).toHaveAttribute('aria-pressed', 'true')
    expect(week).toHaveAttribute('data-state', 'active')
    expect(week).toHaveAttribute('data-view', 'week')
    expect(within(menu).getByRole('button', { name: 'Dia' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
    expect(
      within(menu).getByRole('button', { name: 'Lista' }),
    ).toHaveAttribute('aria-disabled', 'true')
  })

  it('mantém a agenda semanal sem consulta nova ao interagir com modos futuros', async () => {
    const user = userEvent.setup()
    renderAppointmentsPage()

    expect(
      await screen.findByText(/nenhum agendamento nesta semana/i),
    ).toBeVisible()
    const queryCount = apiScenario.appointmentQueries.length
    const menu = screen.getByRole('group', {
      name: 'Visualização da agenda',
    })

    await user.click(within(menu).getByRole('button', { name: 'Dia' }))
    await user.click(within(menu).getByRole('button', { name: 'Lista' }))

    expect(apiScenario.appointmentQueries).toHaveLength(queryCount)
    expect(
      screen.getByText(/nenhum agendamento nesta semana/i),
    ).toBeVisible()
    expect(screen.getByRole('button', { name: 'Dia' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })

  it('reorganiza o cabeçalho em viewport estreita', async () => {
    renderAppointmentsPage()

    await screen.findByRole('heading', { name: 'Agendamentos' })

    expect(screen.getByTestId('appointments-header')).toHaveClass(
      'max-[720px]:flex-col',
    )
    expect(screen.getByTestId('appointments-view-menu')).toHaveClass(
      'max-[720px]:w-full',
    )
  })

  it('renderiza a matriz semanal com régua horária, cabeçalhos e o dia atual', async () => {
    apiScenario.appointments = [
      {
        ...createdAppointment,
        startsAt: '2026-08-13T14:00:00.000Z',
      },
    ]
    renderAppointmentsPage()

    const weeklyGrid = await screen.findByTestId('weekly-appointments')
    const headers = within(weeklyGrid).getAllByRole('columnheader')

    expect(
      headers.map((header) => header.textContent?.replace(/\s+/g, ' ').trim()),
    ).toEqual([
      'Segunda10 de Agosto',
      'Terça11 de Agosto',
      'Quarta12 de Agosto',
      'Quinta13 de AgostoHoje',
      'Sexta14 de Agosto',
    ])
    expect(
      within(weeklyGrid).getByTestId('appointments-day-header-2026-08-13'),
    ).toHaveAttribute('data-selected', 'true')
    expect(
      within(weeklyGrid).getByTestId('weekly-appointments-time-ruler'),
    ).toHaveTextContent('07:00')
    expect(
      within(weeklyGrid).getByTestId('weekly-appointments-time-ruler'),
    ).toHaveTextContent('18:00')
    expect(within(weeklyGrid).getAllByRole('region')).toHaveLength(5)
    expect(within(weeklyGrid).getAllByLabelText('Calendário')).toHaveLength(5)
  })

  it('posiciona cards por duração e distribui sobreposições lateralmente', async () => {
    apiScenario.appointments = [
      {
        ...createdAppointment,
        id: 'appointment-first',
        patient: { ...createdAppointment.patient, name: 'Primeiro paciente' },
        startsAt: '2026-08-13T14:00:00.000Z',
        durationMinutes: 60,
      },
      {
        ...createdAppointment,
        id: 'appointment-second',
        patient: { ...createdAppointment.patient, name: 'Segundo paciente' },
        startsAt: '2026-08-13T14:30:00.000Z',
        durationMinutes: 60,
      },
      {
        ...createdAppointment,
        id: 'appointment-after-hours',
        patient: {
          ...createdAppointment.patient,
          name: 'Paciente fora da janela',
        },
        startsAt: '2026-08-13T21:30:00.000Z',
        durationMinutes: 120,
      },
    ]
    renderAppointmentsPage()

    const first = await screen.findByTestId('appointment-appointment-first')
    const second = screen.getByTestId('appointment-appointment-second')
    const afterHours = screen.getByTestId(
      'appointment-appointment-after-hours',
    )

    expect(first).toHaveAttribute('data-top-minutes', '180')
    expect(first).toHaveAttribute('data-height-minutes', '60')
    expect(first).toHaveAttribute('data-lane', '0')
    expect(second).toHaveAttribute('data-lane', '1')
    expect(first).toHaveAttribute('data-lane-count', '2')
    expect(second).toHaveAttribute('data-lane-count', '2')
    expect(afterHours).toHaveAttribute('data-top-minutes', '630')
    expect(afterHours).toHaveAttribute('data-height-minutes', '120')
  })

  it('apresenta todos os pacientes de uma turma simultânea em cartões identificáveis', async () => {
    apiScenario.appointments = Array.from({ length: 5 }, (_, index) => ({
      ...createdAppointment,
      id: `appointment-group-${index + 1}`,
      patient: {
        id: `patient-group-${index + 1}`,
        name: `Paciente da turma ${index + 1}`,
      },
      startsAt: '2026-08-13T14:00:00.000Z',
      durationMinutes: 60,
    }))
    renderAppointmentsPage()

    for (let index = 0; index < 5; index += 1) {
      const patientName = `Paciente da turma ${index + 1}`
      const card = await screen.findByTestId(`appointment-appointment-group-${index + 1}`)

      expect(card).toHaveAttribute('data-lane', String(index))
      expect(card).toHaveAttribute('data-lane-count', '5')
      expect(card).toHaveAttribute('data-density', 'compact')
      expect(card).toHaveAttribute('title', expect.stringContaining(patientName))
      expect(within(card).getByText(patientName)).toBeVisible()
      expect(within(card).getByText('Pilates')).toBeVisible()
    }
  })

  it('exibe a legenda completa e mantém a matriz rolável em telas estreitas', async () => {
    renderAppointmentsPage()

    const weeklyGrid = await screen.findByTestId('weekly-appointments')
    const legend = within(weeklyGrid).getByTestId('appointments-legend')

    expect(legend).toHaveTextContent('Aguardando atendimento')
    expect(legend).toHaveTextContent('Paciente agendado')
    expect(legend).toHaveTextContent('Atendida')
    expect(legend).toHaveTextContent('Atendimento realizado')
    expect(legend).toHaveTextContent('Cancelado')
    expect(legend).toHaveTextContent('Agendamento cancelado')
    expect(legend).toHaveTextContent('Falta')
    expect(legend).toHaveTextContent('Paciente não compareceu')
    expect(legend.querySelectorAll('li')).toHaveLength(4)
    expect(
      within(weeklyGrid).getByTestId('weekly-appointments-scroll'),
    ).toHaveClass('overflow-x-auto')
    expect(
      within(weeklyGrid).getByTestId('weekly-appointments-scroll')
        .firstElementChild,
    ).toHaveClass('min-w-[70rem]')
  })

  it('WB-17 apresenta os dados retornados pela API no fuso da unidade', async () => {
    apiScenario.appointments = [
      {
        ...createdAppointment,
        startsAt: '2026-08-13T14:00:00.000Z',
      },
    ]
    renderAppointmentsPage()

    expect(await screen.findByText('Ana Paciente')).toBeVisible()
    expect(
      within(screen.getByTestId('weekly-appointments-time-ruler')).getByText(
        '10:00',
      ),
    ).toBeVisible()
    expect(apiScenario.appointmentQueries[0]?.get('unitId')).toBe('unit-a')
    expect(apiScenario.appointmentQueries[0]?.get('from')).toBeTruthy()
    expect(apiScenario.appointmentQueries[0]?.get('to')).toBeTruthy()
  })

  it('interpreta o envelope real e renderiza os três agendamentos da resposta', async () => {
    vi.setSystemTime(new Date('2026-11-09T12:00:00-04:00'))
    apiScenario.appointments = [...backendAppointmentFixtures]

    renderAppointmentsPage()

    expect(await screen.findAllByText('Ana Oliveira')).toHaveLength(2)
    expect(screen.getByText('Carla Mendes')).toBeVisible()
    expect(screen.getAllByText('Turma de reabilitação')).toHaveLength(2)
    expect(screen.getByText('Pilates')).toBeVisible()
    expect(screen.getAllByText('R$ 150,00')).toHaveLength(3)
    expect(
      screen.getByTestId('appointment-50000000-0000-4000-8000-000000000001'),
    ).toHaveAttribute('data-status', 'AGENDADO')
    expect(apiScenario.appointmentQueries[0]?.get('unitId')).toBe('unit-a')
  })

  it('atualiza a semana por meio do seletor de data', async () => {
    renderAppointmentsPage()

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
    renderAppointmentsPage()

    expect(
      screen.getAllByLabelText(/selecionar data da agenda/i),
    ).toHaveLength(1)
    expect(
      await screen.findAllByRole('button', { name: /novo agendamento/i }),
    ).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: /semana anterior/i }))
    expect(screen.getByText('06 de Agosto de 2026')).toBeVisible()

    await user.click(screen.getByRole('button', { name: /próxima semana/i }))
    expect(screen.getByText('13 de Agosto de 2026')).toBeVisible()
  })

  it.each([
    ['AGENDADO', 'bg-appointment-yellow', 'text-black'],
    ['FALTA', 'bg-appointment-red', 'text-white'],
    ['REAGENDADO', 'bg-appointment-yellow', 'text-black'],
    ['CANCELADO', 'bg-appointment-graphite', 'text-white'],
    ['EMATENDIMENTO', 'bg-appointment-green', 'text-white'],
    ['FINALIZADO', 'bg-appointment-green', 'text-white'],
  ] as const)(
    'aplica o token visual e o contraste do status %s',
    async (status, colorToken, textToken) => {
      apiScenario.appointments = [
        {
          ...createdAppointment,
          id: `appointment-${status.toLowerCase()}`,
          startsAt: '2026-08-13T14:00:00.000Z',
          status,
        },
      ]

      renderAppointmentsPage()

      const card = await screen.findByTestId(
        `appointment-appointment-${status.toLowerCase()}`,
      )
      expect(card).toHaveAttribute('data-status', status)
      expect(card).toHaveClass(colorToken, textToken)
    },
  )

  it('preserva o conteúdo completo em nomes e serviços longos', async () => {
    const patientName = 'Paciente com nome completo para coluna estreita'
    const serviceName = 'Atendimento individual de reabilitação funcional'
    apiScenario.appointments = [
      {
        ...createdAppointment,
        patient: { ...createdAppointment.patient, name: patientName },
        service: { ...createdAppointment.service, name: serviceName },
        startsAt: '2026-08-13T14:00:00.000Z',
      },
    ]

    renderAppointmentsPage()

    const card = await screen.findByTestId('appointment-appointment-created')
    expect(within(card).getByText(patientName)).toHaveClass('break-words')
    expect(within(card).getByText(serviceName)).toHaveClass('break-words')
    expect(within(card).getByText('AGENDADO')).toHaveClass('sr-only')
    expect(card).toHaveAttribute('aria-label', expect.stringContaining('10:00'))
  })

  it('WB-18 disponibiliza e abre a criação para sessão operacional autenticada', async () => {
    const user = userEvent.setup()
    renderAppointmentsPage()

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
