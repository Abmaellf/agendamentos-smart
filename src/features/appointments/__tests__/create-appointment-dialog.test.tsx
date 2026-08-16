import { screen, waitFor } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import type { ComponentType } from 'react'
import { describe, expect, it, vi } from 'vitest'

import {
  adminSession,
  basicSession,
  type TestSession,
} from '@/test/builders/appointment'
import { loadSubject } from '@/test/load-subject'
import { renderWithProviders } from '@/test/render'
import { apiScenario } from '@/test/server'

interface DialogProps {
  session: TestSession
  defaultDate?: string
}

interface DialogModule {
  CreateAppointmentDialog: ComponentType<DialogProps>
}

const subjectUrl = new URL(
  '../components/create-appointment-dialog.tsx',
  import.meta.url,
)

async function renderDialog(session: TestSession = adminSession) {
  const { CreateAppointmentDialog } =
    await loadSubject<DialogModule>(subjectUrl)
  const user = userEvent.setup()
  const rendered = renderWithProviders(
    <CreateAppointmentDialog session={session} defaultDate="2026-08-20" />,
  )
  return { user, ...rendered }
}

async function openDialog(user: UserEvent) {
  const trigger = screen.getByRole('button', { name: /novo agendamento/i })
  await user.click(trigger)
  expect(
    await screen.findByRole('dialog', { name: /novo agendamento/i }),
  ).toBeInTheDocument()
  return trigger
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

async function typeInto(user: UserEvent, label: RegExp, value: string) {
  const input = await screen.findByLabelText(label)
  await user.clear(input)
  await user.type(input, value)
}

async function fillValidForm(user: UserEvent) {
  await chooseOption(user, /^paciente/i, /ana paciente/i)
  await chooseOption(user, /^unidade/i, /unidade centro/i)
  await chooseOption(user, /^serviço/i, /pilates/i)
  await typeInto(user, /^data/i, '2026-08-20')
  await typeInto(user, /^horário/i, '08:30')
}

async function submit(user: UserEvent) {
  await user.click(screen.getByRole('button', { name: /criar agendamento/i }))
}

describe('diálogo de criação manual', () => {
  it('WB-05 preenche duração e preço ao selecionar o serviço', async () => {
    const { user } = await renderDialog()
    await openDialog(user)

    await chooseOption(user, /^serviço/i, /pilates/i)

    expect(screen.getByLabelText(/duração/i)).toHaveValue(60)
    expect(screen.getByLabelText(/preço/i)).toHaveValue('150.00')
  })

  it('WB-06 troca os padrões enquanto não houve sobrescrita administrativa', async () => {
    const { user } = await renderDialog()
    await openDialog(user)

    await chooseOption(user, /^serviço/i, /pilates/i)
    await chooseOption(user, /^serviço/i, /fisioterapia/i)

    expect(screen.getByLabelText(/duração/i)).toHaveValue(45)
    expect(screen.getByLabelText(/preço/i)).toHaveValue('120.00')
  })

  it('WB-06 preserva a sobrescrita intencional do ADMIN ao trocar de serviço', async () => {
    const { user } = await renderDialog()
    await openDialog(user)

    await chooseOption(user, /^serviço/i, /pilates/i)
    await typeInto(user, /duração/i, '75')
    await typeInto(user, /preço/i, '175.00')
    await chooseOption(user, /^serviço/i, /fisioterapia/i)

    expect(screen.getByLabelText(/duração/i)).toHaveValue(75)
    expect(screen.getByLabelText(/preço/i)).toHaveValue('175.00')
  })

  it('WB-07 permite ao ADMIN editar duração e preço', async () => {
    const { user } = await renderDialog(adminSession)
    await openDialog(user)
    await chooseOption(user, /^serviço/i, /pilates/i)

    expect(screen.getByLabelText(/duração/i)).toBeEnabled()
    expect(screen.getByLabelText(/preço/i)).toBeEnabled()
  })

  it('WB-07 impede o BASIC de editar ou enviar valores fora do padrão', async () => {
    const { user } = await renderDialog(basicSession)
    await openDialog(user)
    await fillValidForm(user)

    const duration = screen.getByLabelText(/duração/i)
    const price = screen.getByLabelText(/preço/i)
    expect(
      duration.matches(':disabled') || duration.hasAttribute('readonly'),
    ).toBe(true)
    expect(price.matches(':disabled') || price.hasAttribute('readonly')).toBe(
      true,
    )

    await submit(user)

    await waitFor(() => expect(apiScenario.createRequests).toHaveLength(1))
    expect(apiScenario.createRequests[0]).toMatchObject({
      durationMinutes: 60,
      price: '150.00',
    })
  })

  it('WB-08 apresenta carregamento dos cadastros', async () => {
    apiScenario.catalogDelayMs = 1_000
    const { user } = await renderDialog()
    await openDialog(user)

    expect(screen.getByRole('status')).toHaveTextContent(/carregando opções/i)
    expect(
      screen.getByRole('button', { name: /criar agendamento/i }),
    ).toBeDisabled()
  })

  it('WB-08 apresenta erro e permite tentar carregar novamente', async () => {
    apiScenario.catalogErrors.patients = 500
    const { user } = await renderDialog()
    await openDialog(user)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /não foi possível carregar.*paciente/i,
    )
    expect(
      screen.getByRole('button', { name: /tentar novamente/i }),
    ).toBeEnabled()
  })

  it('WB-08 apresenta estado vazio para cada cadastro obrigatório', async () => {
    apiScenario.catalogs.patients = []
    apiScenario.catalogs.units = []
    apiScenario.catalogs.services = []
    const { user } = await renderDialog()
    await openDialog(user)

    expect(await screen.findByText(/nenhum paciente disponível/i)).toBeVisible()
    expect(screen.getByText(/nenhuma unidade disponível/i)).toBeVisible()
    expect(screen.getByText(/nenhum serviço disponível/i)).toBeVisible()
  })

  it('WB-08 apresenta os cadastros carregados com sucesso', async () => {
    const { user } = await renderDialog()
    await openDialog(user)

    await chooseOption(user, /^paciente/i, /ana paciente/i)
    await chooseOption(user, /^unidade/i, /unidade centro/i)
    await chooseOption(user, /^serviço/i, /pilates/i)

    expect(screen.getByRole('combobox', { name: /^paciente/i })).toHaveValue(
      'patient-a',
    )
  })

  it('WB-09 filtra profissionais pelo serviço e mantém a seleção opcional', async () => {
    const { user } = await renderDialog()
    await openDialog(user)
    await chooseOption(user, /^serviço/i, /pilates/i)

    await waitFor(() =>
      expect(apiScenario.professionalQueries).toContain('service-pilates'),
    )
    expect(
      screen.getByRole('combobox', { name: /profissional.*opcional/i }),
    ).toHaveValue('')
    expect(
      await screen.findByRole('option', { name: /carla profissional/i }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('option', { name: /diego profissional/i }),
    ).not.toBeInTheDocument()
  })

  it('WB-10 não chama a API quando faltam campos e preserva os valores válidos', async () => {
    const { user } = await renderDialog()
    await openDialog(user)
    await chooseOption(user, /^unidade/i, /unidade centro/i)
    await chooseOption(user, /^serviço/i, /pilates/i)
    await typeInto(user, /^data/i, '2026-08-20')
    await typeInto(user, /^horário/i, '08:30')

    await submit(user)

    expect(apiScenario.createRequests).toHaveLength(0)
    expect(await screen.findByText(/selecione um paciente/i)).toBeVisible()
    expect(screen.getByLabelText(/^data/i)).toHaveValue('2026-08-20')
    expect(screen.getByLabelText(/^horário/i)).toHaveValue('08:30')
  })

  it('WB-11 envia somente IDs e valores autorizados pelo contrato', async () => {
    const { user } = await renderDialog()
    await openDialog(user)
    await fillValidForm(user)

    await submit(user)

    await waitFor(() => expect(apiScenario.createRequests).toHaveLength(1))
    expect(apiScenario.createRequests[0]).toEqual({
      patientId: 'patient-a',
      unitId: 'unit-a',
      serviceId: 'service-pilates',
      professionalId: null,
      startsAt: '2026-08-20T12:30:00.000Z',
      durationMinutes: 60,
      price: '150.00',
    })
    expect(apiScenario.createRequests[0]).not.toHaveProperty('tenantId')
    expect(apiScenario.createRequests[0]).not.toHaveProperty('status')
    expect(apiScenario.createRequests[0]).not.toHaveProperty('createdBy')
    expect(apiScenario.createRequests[0]).not.toHaveProperty('createdAt')
  })

  it('WB-12 indica envio e transforma cliques repetidos em uma única chamada', async () => {
    apiScenario.createDelayMs = 500
    const { user } = await renderDialog()
    await openDialog(user)
    await fillValidForm(user)
    const button = screen.getByRole('button', { name: /criar agendamento/i })

    await Promise.all([user.click(button), user.click(button)])

    expect(
      await screen.findByRole('button', { name: /criando/i }),
    ).toBeDisabled()
    await waitFor(() => expect(apiScenario.createRequests).toHaveLength(1))
  })

  it.each([
    ['PATIENT_SCHEDULE_CONFLICT', /paciente.*outro agendamento/i],
    ['PROFESSIONAL_SCHEDULE_CONFLICT', /profissional.*outro agendamento/i],
    ['SERVICE_CAPACITY_EXCEEDED', /capacidade.*esgotada/i],
    ['APPOINTMENT_OVERRIDE_FORBIDDEN', /somente administradores/i],
    ['TENANT_RESOURCE_NOT_FOUND', /cadastro não encontrado/i],
    ['PROFESSIONAL_UNAVAILABLE_DAY', /profissional.*indisponível.*dia/i],
  ])('WB-13 traduz %s em orientação específica', async (code, message) => {
    apiScenario.createErrorCode = code
    const { user } = await renderDialog()
    await openDialog(user)
    await fillValidForm(user)

    await submit(user)

    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(
      screen.getByRole('dialog', { name: /novo agendamento/i }),
    ).toBeVisible()
  })

  it('WB-14 preserva o formulário após erro de rede desconhecido', async () => {
    apiScenario.createNetworkError = true
    const { user } = await renderDialog()
    await openDialog(user)
    await fillValidForm(user)

    await submit(user)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /não foi possível criar o agendamento.*tente novamente/i,
    )
    expect(screen.getByLabelText(/^data/i)).toHaveValue('2026-08-20')
    expect(screen.getByLabelText(/^horário/i)).toHaveValue('08:30')
  })

  it('WB-15 fecha, confirma e invalida agenda/capacidade após sucesso', async () => {
    const { user, queryClient } = await renderDialog()
    const invalidation = vi.spyOn(queryClient, 'invalidateQueries')
    await openDialog(user)
    await fillValidForm(user)

    await submit(user)

    expect(
      await screen.findByText(/agendamento criado com sucesso/i),
    ).toBeVisible()
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: /novo agendamento/i }),
      ).not.toBeInTheDocument(),
    )
    expect(invalidation).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['appointments'] }),
    )
    expect(invalidation).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['service-capacity'] }),
    )
  })

  it('WB-19 cancela sem request e devolve foco ao disparador', async () => {
    const { user } = await renderDialog()
    const trigger = await openDialog(user)

    await user.click(screen.getByRole('button', { name: /cancelar/i }))

    expect(apiScenario.createRequests).toHaveLength(0)
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('WB-20 associa labels e erros, move foco e anuncia feedback', async () => {
    const { user } = await renderDialog()
    await openDialog(user)

    expect(screen.getByLabelText(/^paciente/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^unidade/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^serviço/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^data/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^horário/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/duração/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/preço/i)).toBeInTheDocument()

    await submit(user)

    const patient = screen.getByLabelText(/^paciente/i)
    expect(patient).toHaveFocus()
    expect(patient).toHaveAccessibleDescription(/selecione um paciente/i)
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive')
  })

  it('WB-22 apresenta a recusa definitiva por dia indisponível', async () => {
    apiScenario.createErrorCode = 'PROFESSIONAL_UNAVAILABLE_DAY'
    const { user } = await renderDialog()
    await openDialog(user)
    await fillValidForm(user)
    await chooseOption(user, /profissional.*opcional/i, /carla profissional/i)

    await submit(user)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /profissional.*indisponível.*dia/i,
    )
    expect(screen.getByLabelText(/^data/i)).toHaveValue('2026-08-20')
  })
})
