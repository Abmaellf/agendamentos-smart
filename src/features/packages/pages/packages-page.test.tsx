import { screen, waitFor, within } from '@testing-library/react'
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

const secondPackage = {
  ...servicePackage,
  id: 'package-2',
  name: 'Pilates 20 sessões',
  serviceName: 'Pilates',
}

describe('PackagesPage', () => {
  it('apresenta a listagem em tabela, pagina e envia filtros', async () => {
    const user = userEvent.setup()
    const queries: URLSearchParams[] = []
    server.use(
      http.get('http://localhost:8080/api/service-packages', ({ request }) => {
        const params = new URL(request.url).searchParams
        queries.push(params)
        const page = Number(params.get('page') ?? 0)
        return HttpResponse.json({
          content: [page === 0 ? servicePackage : secondPackage],
          page,
          size: 10,
          totalElements: 11,
          totalPages: 2,
          last: page === 1,
        })
      }),
    )

    renderWithProviders(<PackagesPage />, { route: '/services/packages' })

    expect(
      await screen.findByRole('heading', { name: /pacotes de serviços/i }),
    ).toBeVisible()
    expect(screen.getByRole('main')).toHaveClass('overflow-x-hidden')
    expect(screen.getByRole('form', { name: 'Filtros de pacotes' })).toBeVisible()
    expect(await screen.findByText('Fisioterapia 10 sessões')).toBeVisible()
    expect(screen.getByRole('columnheader', { name: 'Pacote' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Detalhes' })).toBeVisible()
    expect(screen.getByText('Total de 11 pacote(s)')).toBeVisible()
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
    expect(screen.getByText('10')).toBeVisible()
    expect(screen.getByText('2 por semana')).toBeVisible()
    expect(screen.getByText('R$ 400.00')).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Próxima página' }))
    expect(await screen.findByText('Pilates 20 sessões')).toBeVisible()
    expect(queries[queries.length - 1]?.get('page')).toBe('1')
    expect(queries[queries.length - 1]?.get('size')).toBe('10')

    await user.type(screen.getByRole('textbox', { name: 'Nome' }), 'pilates')
    await user.click(screen.getByRole('button', { name: 'Filtrar' }))

    await waitFor(() => {
      expect(queries[queries.length - 1]?.get('page')).toBe('0')
      expect(queries[queries.length - 1]?.get('name')).toBe('pilates')
    })
  })

  it('abre o formulário no modal e mostra validações locais antes de criar', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('http://localhost:8080/api/service-packages', () =>
        HttpResponse.json({ content: [] }),
      ),
    )
    renderWithProviders(<PackagesPage />)

    await screen.findByRole('heading', { name: /pacotes de serviços/i })
    const newPackageButton = screen.getByRole('button', { name: 'Novo pacote' })
    await user.click(newPackageButton)

    const dialog = await screen.findByRole('dialog', { name: 'Novo pacote' })
    expect(dialog).toBeVisible()
    expect(dialog).toContainElement(document.activeElement as HTMLElement)
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
    await waitFor(() => expect(newPackageButton).toHaveFocus())
    await user.click(newPackageButton)
    await user.click(screen.getByRole('button', { name: 'Salvar pacote' }))

    expect(await screen.findByText('Informe o nome do pacote.')).toBeVisible()
    expect(screen.getByText('Selecione uma unidade.')).toBeVisible()
    expect(screen.getByText('Selecione um serviço.')).toBeVisible()
    expect(screen.getByText('Informe o valor no formato 0.00.')).toBeVisible()
    expect(screen.getByText('Selecione ao menos um dia.')).toBeVisible()
  })

  it('abre o detalhe em modal e preserva a origem ao editar', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('http://localhost:8080/api/service-packages', () =>
        HttpResponse.json({ content: [servicePackage] }),
      ),
      http.get(
        'http://localhost:8080/api/service-packages/package-1',
        () => HttpResponse.json(servicePackage),
      ),
    )
    renderWithProviders(<PackagesPage />)

    await user.click(
      await screen.findByRole('button', { name: 'Detalhes' }),
    )
    const detailDialog = await screen.findByRole('dialog', {
      name: 'Fisioterapia 10 sessões',
    })
    expect(detailDialog).toBeVisible()
    expect(detailDialog).toContainElement(document.activeElement as HTMLElement)
    expect(within(detailDialog).getByText('Recuperação funcional')).toBeVisible()
    expect(within(detailDialog).getByText('Segunda, Quarta')).toBeVisible()

    await user.click(
      within(detailDialog).getByRole('button', { name: 'Editar pacote' }),
    )
    const editDialog = await screen.findByRole('dialog', { name: 'Editar pacote' })
    expect(editDialog).toBeVisible()
    expect(within(editDialog).getByLabelText('Nome')).toHaveValue(
      'Fisioterapia 10 sessões',
    )

    await user.click(within(editDialog).getByRole('button', { name: 'Cancelar' }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Detalhes' })).toHaveFocus(),
    )

    await user.click(screen.getByRole('button', { name: 'Detalhes' }))
    const reopenedDetail = await screen.findByRole('dialog', {
      name: 'Fisioterapia 10 sessões',
    })
    await user.click(
      within(reopenedDetail).getByRole('button', {
        name: 'Fechar detalhe do pacote',
      }),
    )
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Fisioterapia 10 sessões' })).not.toBeInTheDocument(),
    )
  })

  it('abre o detalhe pela seleção de teclado e comunica carregamento', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('http://localhost:8080/api/service-packages', () =>
        HttpResponse.json({ content: [servicePackage] }),
      ),
      http.get(
        'http://localhost:8080/api/service-packages/package-1',
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 50))
          return HttpResponse.json(servicePackage)
        },
      ),
    )
    renderWithProviders(<PackagesPage />)

    const row = await screen.findByRole('row', {
      name: /fisioterapia 10 sessões/i,
    })
    row.focus()
    await user.keyboard('{Enter}')

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Carregando detalhe do pacote',
    )
    expect(
      await screen.findByRole('dialog', { name: 'Fisioterapia 10 sessões' }),
    ).toBeVisible()
  })

  it('mantém a listagem e informa erro ao carregar o detalhe', async () => {
    const user = userEvent.setup()
    server.use(
      http.get('http://localhost:8080/api/service-packages', () =>
        HttpResponse.json({ content: [servicePackage] }),
      ),
      http.get(
        'http://localhost:8080/api/service-packages/package-1',
        () => HttpResponse.json({ message: 'Falha' }, { status: 500 }),
      ),
    )
    renderWithProviders(<PackagesPage />)

    await user.click(await screen.findByRole('button', { name: 'Detalhes' }))

    expect(
      await screen.findByText('Não foi possível carregar o detalhe deste pacote.'),
    ).toBeVisible()
    expect(screen.getByRole('alert')).toBeVisible()
    expect(
      within(screen.getByRole('main', { hidden: true })).getByRole('columnheader', {
        name: 'Pacote',
        hidden: true,
      }),
    ).toBeInTheDocument()
  })

  it('altera a situação sem remover o pacote da tabela', async () => {
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
    expect(screen.queryByText('Fisioterapia 10 sessões')).not.toBeInTheDocument()
  })
})
