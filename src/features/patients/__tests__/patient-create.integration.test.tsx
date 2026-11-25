import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { adminSession, basicSession } from '@/test/builders/appointment'
import { renderWithProviders } from '@/test/render'
import { apiScenario } from '@/test/server'

import { PatientFormModal } from '../components/patient-form-modal'

describe('cadastro de pacientes', () => {
  it('deriva a unidade ativa ao cadastrar como BASIC', async () => {
    apiScenario.session = basicSession
    const user = userEvent.setup()
    renderWithProviders(<PatientFormModal />)

    await user.click(screen.getByRole('button', { name: /novo paciente/i }))
    expect(await screen.findByText('Unidade Centro')).toBeVisible()

    await user.type(
      screen.getByRole('textbox', { name: 'Paciente' }),
      'Beatriz',
    )
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() =>
      expect(apiScenario.patientCreateRequests).toContainEqual({
        name: 'Beatriz',
        unitIds: ['unit-a'],
      }),
    )
  })

  it('envia as unidades explicitamente selecionadas pelo ADMIN', async () => {
    apiScenario.session = adminSession
    apiScenario.catalogs.units.push({
      id: 'unit-b',
      name: 'Unidade Norte',
      tenantId: 'tenant-a',
      timeZone: 'America/Cuiaba',
    })
    const user = userEvent.setup()
    renderWithProviders(<PatientFormModal />)

    await user.click(screen.getByRole('button', { name: /novo paciente/i }))
    await user.click(
      await screen.findByRole('checkbox', { name: 'Unidade Centro' }),
    )
    await user.click(screen.getByRole('checkbox', { name: 'Unidade Norte' }))
    await user.type(
      screen.getByRole('textbox', { name: 'Paciente' }),
      'Beatriz',
    )
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() =>
      expect(apiScenario.patientCreateRequests).toContainEqual({
        name: 'Beatriz',
        unitIds: ['unit-a', 'unit-b'],
      }),
    )
  })

  it('preserva o formulário e informa nome duplicado', async () => {
    apiScenario.session = basicSession
    apiScenario.patientCreateErrorCode = 'PATIENT_ALREADY_EXISTS'
    const user = userEvent.setup()
    renderWithProviders(<PatientFormModal />)

    await user.click(screen.getByRole('button', { name: /novo paciente/i }))
    await screen.findByText('Unidade Centro')
    const nameInput = screen.getByRole('textbox', { name: 'Paciente' })
    await user.type(nameInput, 'Ana Paciente')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(
      (await screen.findAllByText('Já existe um paciente cadastrado com esse nome.')).length,
    ).toBeGreaterThan(0)
    expect(nameInput).toHaveValue('Ana Paciente')
  })

  it('bloqueia BASIC quando a unidade ativa não pertence ao catálogo', async () => {
    apiScenario.session = {
      ...basicSession,
      activeUnitId: 'unit-outside-catalog',
    }
    const user = userEvent.setup()
    renderWithProviders(<PatientFormModal />)

    await user.click(screen.getByRole('button', { name: /novo paciente/i }))

    expect(
      await screen.findByText(
        'A unidade ativa da sessão não está disponível no catálogo.',
      ),
    ).toBeVisible()
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled()
  })

  it('fecha o cadastro por cancelamento e devolve o foco ao acionador', async () => {
    const user = userEvent.setup()
    renderWithProviders(<PatientFormModal />)

    const trigger = screen.getByRole('button', { name: /novo paciente/i })
    await user.click(trigger)

    const dialog = await screen.findByRole('dialog', { name: 'Novo Paciente' })
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))

    await waitFor(() => expect(trigger).toHaveFocus())
  })
})
