import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AppShellDateProvider } from '@/_layout/app-shell-context'
import { AppTopbar } from '@/components/AppTopbar'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'

function renderTopbar(
  options: Partial<React.ComponentProps<typeof AppTopbar>> = {},
) {
  return renderWithProviders(
    <AppShellDateProvider>
      <AppTopbar
        isSidebarCollapsed={false}
        isCompactSidebarOpen={false}
        isCompactViewport={false}
        onToggleSidebar={vi.fn()}
        onOpenCompactSidebar={vi.fn()}
        {...options}
      />
    </AppShellDateProvider>,
  )
}

describe('AppTopbar', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date('2026-08-13T12:00:00-04:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('compartilha a data entre Hoje, navegação semanal e seleção direta', async () => {
    const user = userEvent.setup()
    renderTopbar()

    expect(screen.getByText('13 de Agosto de 2026')).toBeVisible()

    await user.click(screen.getByRole('button', { name: /semana anterior/i }))
    expect(screen.getByText('06 de Agosto de 2026')).toBeVisible()

    await user.click(screen.getByRole('button', { name: /próxima semana/i }))
    expect(screen.getByText('13 de Agosto de 2026')).toBeVisible()

    const dateInput = screen.getByLabelText(/selecionar data da agenda/i)
    fireEvent.change(dateInput, { target: { value: '2026-08-19' } })
    expect(screen.getByText('19 de Agosto de 2026')).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Hoje' }))
    expect(screen.getByText('13 de Agosto de 2026')).toBeVisible()
  })

  it('apresenta busca, notificações, perfil e atalho para focar a busca', async () => {
    const user = userEvent.setup()
    renderTopbar({ notificationCount: 3 })

    const search = screen.getByRole('searchbox', {
      name: /buscar na aplicação/i,
    })
    expect(search).toHaveAttribute(
      'placeholder',
      'Buscar paciente, serviço ou horário...',
    )
    expect(screen.getByText('⌘ K')).toBeVisible()
    expect(screen.getByRole('button', { name: /notificações/i })).toBeVisible()
    expect(screen.getByText('3')).toBeVisible()
    expect(
      await screen.findByRole('button', { name: /abrir menu do perfil/i }),
    ).toBeVisible()

    await user.type(search, 'Ana')
    expect(search).toHaveValue('Ana')

    fireEvent.keyDown(document, { key: 'k', metaKey: true })
    expect(search).toHaveFocus()

    await user.click(screen.getByRole('button', { name: /notificações/i }))
    expect(screen.getByRole('button', { name: /notificações/i })).toBeVisible()
  })

  it('reutiliza o diálogo de agendamento quando a sessão está disponível', async () => {
    const user = userEvent.setup()
    renderTopbar()

    await user.click(
      await screen.findByRole('button', { name: /novo agendamento/i }),
    )

    expect(
      await screen.findByRole('dialog', { name: /novo agendamento/i }),
    ).toBeVisible()
  })

  it('não exibe uma ação de agendamento sem sessão disponível', async () => {
    server.use(
      http.get('http://localhost:8080/auth/me', () => HttpResponse.error()),
    )
    renderTopbar()

    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: /novo agendamento/i }),
      ).not.toBeInTheDocument(),
    )
  })

  it('usa o hamburger para recolher a sidebar em tela ampla', async () => {
    const user = userEvent.setup()
    const onToggleSidebar = vi.fn()
    renderTopbar({ onToggleSidebar })

    const menu = screen.getByRole('button', { name: /recolher menu lateral/i })
    expect(menu).toHaveAttribute('aria-controls', 'app-sidebar-desktop')
    expect(menu).toHaveAttribute('aria-expanded', 'true')

    await user.click(menu)
    expect(onToggleSidebar).toHaveBeenCalledOnce()
  })

  it('usa o hamburger para abrir a sidebar em tela compacta', async () => {
    const user = userEvent.setup()
    const onOpenCompactSidebar = vi.fn()
    renderTopbar({ isCompactViewport: true, onOpenCompactSidebar })

    const menu = screen.getByRole('button', { name: /abrir menu lateral/i })
    expect(menu).toHaveAttribute('aria-controls', 'app-sidebar-compact')
    expect(menu).toHaveAttribute('aria-expanded', 'false')

    await user.click(menu)
    expect(onOpenCompactSidebar).toHaveBeenCalledOnce()
  })
})
