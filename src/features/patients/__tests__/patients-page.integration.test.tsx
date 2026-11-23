import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { createdPatient } from '@/test/builders/patient'
import { renderWithProviders } from '@/test/render'
import { apiScenario } from '@/test/server'

import { Patient } from '../pages/patients-page'

describe('feature de pacientes', () => {
  it('apresenta os valores reais retornados pela API', async () => {
    renderWithProviders(<Patient />, { route: '/paciente' })

    expect(await screen.findByText('Ana Paciente')).toBeVisible()
    expect(screen.getByText('0001')).toBeVisible()
    expect(screen.getAllByText('Pilates').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Ativo').length).toBeGreaterThan(0)
    expect(screen.getAllByText('21/10/2025').length).toBeGreaterThan(0)
    expect(screen.getByText('Total de 5 item(s)')).toBeVisible()
  })

  it('envia o nome confirmado e volta para a primeira página', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Patient />, { route: '/paciente' })
    await screen.findByText('Ana Paciente')

    await user.type(screen.getByPlaceholderText('Nome do paciente...'), 'Ana')
    await user.click(screen.getByRole('button', { name: 'Filtrar' }))

    await waitFor(() => {
      const lastQuery =  apiScenario.patientQueries[apiScenario.patientQueries.length - 1]
      expect(lastQuery?.get('name')).toBe('Ana')
      expect(lastQuery?.get('page')).toBe('0')
    })
    expect(screen.getByText('Ana Paciente')).toBeVisible()
    expect(screen.queryByText('Bia Paciente')).not.toBeInTheDocument()
  })

  it('usa os metadados da API para navegar entre páginas', async () => {
    apiScenario.catalogs.patients.push({
      ...createdPatient,
      id: 'patient-f',
      code: 6,
      name: 'Fernanda Lopes',
    })
    const user = userEvent.setup()
    renderWithProviders(<Patient />, { route: '/paciente' })
    await screen.findByText('Ana Paciente')

    expect(screen.getByText('Página 1 de 2')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Próxima página' }))

    expect(await screen.findByText('Fernanda Lopes')).toBeVisible()
    await waitFor(() =>
      expect(apiScenario.patientQueries[apiScenario.patientQueries.length - 1]?.get('page')).toBe('1'),
    )
    expect(screen.getByText('Página 2 de 2')).toBeVisible()
  })

  it('apresenta estado vazio sem inventar linhas', async () => {
    apiScenario.catalogs.patients = []
    renderWithProviders(<Patient />, { route: '/paciente' })

    expect(await screen.findByText('Nenhum paciente encontrado')).toBeVisible()
    expect(screen.getByText('Total de 0 item(s)')).toBeVisible()
  })

  it('permite tentar novamente depois de uma falha', async () => {
    apiScenario.catalogErrors.patients = 500
    const user = userEvent.setup()
    renderWithProviders(<Patient />, { route: '/paciente' })

    expect(await screen.findByText('Falha ao carregar pacientes')).toBeVisible()

    delete apiScenario.catalogErrors.patients
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(await screen.findByText('Ana Paciente')).toBeVisible()
  })
})
