import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '@/test/render'
import { apiScenario } from '@/test/server'

import { Patient } from '../pages/patients-page'

describe('feature de pacientes', () => {
  it('carrega e apresenta a lista de pacientes', async () => {
    renderWithProviders(<Patient />, { route: '/paciente' })

    expect(await screen.findByText('Ana Paciente')).toBeVisible()
    expect(screen.getByText('Bia Paciente')).toBeVisible()
  })

  it('refaz a consulta ao submeter o filtro legado', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Patient />, { route: '/paciente' })

    await screen.findByText('Ana Paciente')
    const initialRequests = apiScenario.catalogRequests.patients

    await user.type(screen.getByPlaceholderText('Nome do cliente'), 'Ana')
    await user.click(screen.getByRole('button', { name: /filtrar resultados/i }))

    await waitFor(() =>
      expect(apiScenario.catalogRequests.patients).toBe(initialRequests + 1),
    )
    expect(screen.getByText('Ana Paciente')).toBeVisible()
  })
})
