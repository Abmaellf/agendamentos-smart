import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { PackagesPage } from '@/features/packages/pages/packages-page'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'

const servicePackage = {
  id: 'package-1',
  unitId: 'unit-1',
  unitName: 'Matriz',
  serviceId: 'service-1',
  serviceName: 'Fisioterapia',
  name: 'Fisioterapia 10 sessões',
  description: 'Recuperação funcional',
  totalSessions: 10,
  totalPrice: '400.00',
  weekDays: ['MONDAY', 'WEDNESDAY'],
  weeklyFrequency: 2,
  active: true,
}

describe('PackagesPage', () => {
  it('apresenta o pacote e envia os filtros configurados pelo administrador', async () => {
    const user = userEvent.setup()
    const queries: URLSearchParams[] = []
    server.use(
      http.get('http://localhost:8080/api/service-packages', ({ request }) => {
        queries.push(new URL(request.url).searchParams)
        return HttpResponse.json({ content: [servicePackage] })
      }),
    )

    renderWithProviders(<PackagesPage />, { route: '/services/packages' })

    expect(
      await screen.findByRole('heading', { name: /pacotes de serviços/i }),
    ).toBeVisible()
    expect(await screen.findByText('Fisioterapia 10 sessões')).toBeVisible()
    expect(
      screen.getByText(/10 sessões.*2 por semana.*R\$ 400.00/i),
    ).toBeVisible()
    expect(screen.getByText('Segunda, Quarta')).toBeVisible()

    await user.type(
      screen.getAllByRole('textbox', { name: 'Nome' })[0],
      'fisioterapia',
    )
    await user.click(screen.getByRole('button', { name: 'Filtrar' }))

    await waitFor(() =>
      expect(queries[queries.length -1]?.get('name')).toBe('fisioterapia'),
    )
  })

  it('mantém os dados no formulário e mostra as validações locais antes de criar', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('http://localhost:8080/api/service-packages', () =>
        HttpResponse.json({ content: [] }),
      ),
    )
    renderWithProviders(<PackagesPage />)

    await screen.findByRole('heading', { name: /pacotes de serviços/i })
    await user.click(screen.getByRole('button', { name: /salvar pacote/i }))

    expect(await screen.findByText('Informe o nome do pacote.')).toBeVisible()
    expect(screen.getByText('Selecione uma unidade.')).toBeVisible()
    expect(screen.getByText('Selecione um serviço.')).toBeVisible()
    expect(screen.getByText('Informe o valor no formato 0.00.')).toBeVisible()
    expect(screen.getByText('Selecione ao menos um dia.')).toBeVisible()
  })

  it('altera a situação sem remover o pacote da listagem administrativa', async () => {
    const user = userEvent.setup()
    let active = true
    const statusRequests: unknown[] = []
    server.use(
      http.get('http://localhost:8080/api/service-packages', () =>
        HttpResponse.json({ content: [{ ...servicePackage, active }] }),
      ),
      http.patch(
        'http://localhost:8080/api/service-packages/package-1/status',
        async ({ request }) => {
          statusRequests.push(await request.json())
          active = false
          return HttpResponse.json({ ...servicePackage, active })
        },
      ),
    )
    renderWithProviders(<PackagesPage />)

    await user.click(await screen.findByRole('button', { name: 'Desativar' }))

    await waitFor(() => expect(statusRequests).toEqual([{ active: false }]))
    expect(await screen.findByText('Inativo')).toBeVisible()
    expect(screen.getByText('Fisioterapia 10 sessões')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Ativar' })).toBeVisible()
  })

  it('não consulta nem apresenta a gestão para usuário sem papel administrativo', async () => {
    server.use(
      http.get('http://localhost:8080/auth/me', () =>
        HttpResponse.json({
          id: 'user-1',
          name: 'Atendente',
          login: 'user@clinica.test',
          role: 'BASIC',
          tenantId: 'tenant-1',
          activeUnitId: 'unit-1',
          clinicName: 'Equilíbrio',
          unitName: 'Matriz',
        }),
      ),
      http.get('http://localhost:8080/api/service-packages', () =>
        HttpResponse.json({ content: [servicePackage] }),
      ),
    )
    renderWithProviders(<PackagesPage />)

    expect(
      await screen.findByText(
        /somente administradores podem gerenciar pacotes/i,
      ),
    ).toBeVisible()
    expect(
      screen.queryByText('Fisioterapia 10 sessões'),
    ).not.toBeInTheDocument()
  })
})
