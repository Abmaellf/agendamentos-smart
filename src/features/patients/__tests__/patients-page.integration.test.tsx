import { screen, waitFor, within } from '@testing-library/react'
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
    expect(screen.getByRole('main')).toHaveClass('overflow-x-hidden')
    expect(screen.getByRole('heading', { name: 'Pacientes' })).toBeVisible()
    expect(screen.getByText('0001')).toBeVisible()
    expect(screen.getAllByText('Pilates').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Ativo').length).toBeGreaterThan(0)
    expect(screen.getAllByText('21/10/2025').length).toBeGreaterThan(0)
    expect(screen.getByText('Total de 5 item(s)')).toBeVisible()
    expect(apiScenario.patientQueries[0]?.has('name')).toBe(false)
    expect(apiScenario.patientQueries[0]?.has('status')).toBe(false)
    expect(apiScenario.patientQueries[0]?.has('serviceId')).toBe(false)
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

  it('abre o detalhe em modal e devolve o foco ao acionador', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Patient />, { route: '/paciente' })

    await screen.findByText('Ana Paciente')
    const detailsButton = screen.getByRole('button', {
      name: 'Detalhes de Ana Paciente',
    })

    await user.click(detailsButton)

    const dialog = await screen.findByRole('dialog', { name: 'Ana Paciente' })
    expect(dialog).toBeVisible()
    expect(within(dialog).getByText('0001')).toBeVisible()
    expect(within(dialog).getByText('Pilates')).toBeVisible()
    expect(dialog).toContainElement(document.activeElement as HTMLElement)

    await user.click(
      within(dialog).getByRole('button', {
        name: 'Fechar detalhe do paciente',
      }),
    )

    await waitFor(() => expect(detailsButton).toHaveFocus())
  })

  it('abre o mesmo detalhe ao selecionar a linha por teclado', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Patient />, { route: '/paciente' })

    const row = await screen.findByRole('row', { name: /ana paciente/i })
    row.focus()
    await user.keyboard('{Enter}')

    expect(
      await screen.findByRole('dialog', { name: 'Ana Paciente' }),
    ).toBeVisible()
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

  it('comunica indisponibilidade do catálogo de serviços sem ocultar a lista', async () => {
    apiScenario.catalogErrors.services = 500
    renderWithProviders(<Patient />, { route: '/paciente' })

    expect(
      await screen.findByText(
        'O catálogo de serviços não pôde ser carregado; o filtro de serviço está temporariamente indisponível.',
      ),
    ).toBeVisible()
    expect(await screen.findByText('Ana Paciente')).toBeVisible()
  })
})
