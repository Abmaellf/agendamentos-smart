import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { AppSidebar } from '@/components/AppSidebar'
import { AppLayout } from '@/_layout/app'
import { renderWithProviders } from '@/test/render'

function CurrentPath() {
  const location = useLocation()
  return <output data-testid="current-path">{location.pathname}</output>
}

function renderLayout(route: string) {
  return renderWithProviders(
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="*" element={<CurrentPath />} />
      </Route>
    </Routes>,
    { route },
  )
}

describe('AppSidebar', () => {
  it('apresenta os destinos disponíveis e marca a rota ativa', () => {
    render(
      <MemoryRouter initialEntries={['/appointments']}>
        <AppSidebar variant="desktop" />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'Início' })).toHaveAttribute(
      'href',
      '/',
    )
    expect(screen.getByRole('link', { name: 'Agenda' })).toHaveAttribute(
      'href',
      '/appointments',
    )
    expect(screen.getByRole('link', { name: 'Pacientes' })).toHaveAttribute(
      'href',
      '/paciente',
    )
    expect(screen.getByRole('link', { name: 'Profissionais' })).toHaveAttribute(
      'href',
      '/doctor',
    )
    expect(screen.getByRole('link', { name: 'Configurações' })).toHaveAttribute(
      'href',
      '/configuration',
    )
    expect(screen.getByRole('link', { name: 'Agenda' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('recolhe a sidebar desktop mantendo os ícones e permite expandi-la novamente', async () => {
    const user = userEvent.setup()
    renderLayout('/appointments')

    const collapseButton = screen.getByRole('button', {
      name: /recolher menu lateral/i,
    })
    await user.click(collapseButton)

    expect(
      screen.getByRole('button', { name: /expandir menu lateral/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Agenda' })).toHaveAttribute(
      'title',
      'Agenda',
    )
    expect(screen.queryByText('Fisioterapia & Pilates')).not.toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: /expandir menu lateral/i }),
    )

    expect(
      screen.getByRole('button', { name: /recolher menu lateral/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('Fisioterapia & Pilates')).toBeInTheDocument()
  })

  it('abre o painel compacto, bloqueia a rolagem e fecha por Escape com foco restaurado', async () => {
    const user = userEvent.setup()
    renderLayout('/appointments')

    const trigger = screen.getByRole('button', { name: /abrir menu lateral/i })
    await user.click(trigger)

    expect(screen.getByRole('dialog', { name: /menu lateral/i })).toBeVisible()
    expect(document.body.style.overflow).toBe('hidden')

    await user.keyboard('{Escape}')

    expect(
      screen.queryByRole('dialog', { name: /menu lateral/i }),
    ).not.toBeInTheDocument()
    expect(document.body.style.overflow).toBe('')
    expect(trigger).toHaveFocus()
  })

  it('fecha pelo controle nomeado', async () => {
    const user = userEvent.setup()
    renderLayout('/appointments')

    await user.click(
      screen.getByRole('button', { name: /abrir menu lateral/i }),
    )
    await user.click(
      screen.getByRole('button', { name: /fechar menu lateral/i }),
    )

    expect(
      screen.queryByRole('dialog', { name: /menu lateral/i }),
    ).not.toBeInTheDocument()
  })

  it('comunica destinos indisponíveis sem alterar a rota', async () => {
    const user = userEvent.setup()
    renderLayout('/appointments')

    await user.click(
      screen.getByRole('button', { name: /abrir menu lateral/i }),
    )
    const dialog = screen.getByRole('dialog', { name: /menu lateral/i })
    const unavailable = within(dialog).getByRole('button', {
      name: /serviços.*em breve/i,
    })

    expect(unavailable).toHaveAttribute('aria-disabled', 'true')
    await user.click(unavailable)

    expect(within(dialog).getByRole('status')).toHaveTextContent(
      /serviços ainda não está disponível/i,
    )
    expect(screen.getByTestId('current-path')).toHaveTextContent('/appointments')
  })

  it('fecha o painel depois de navegar e mantém o card informativo não interativo', async () => {
    const user = userEvent.setup()
    renderLayout('/paciente')

    await user.click(
      screen.getByRole('button', { name: /abrir menu lateral/i }),
    )
    const dialog = screen.getByRole('dialog', { name: /menu lateral/i })
    const informationCard = within(dialog).getByLabelText(/informação da clínica/i)

    expect(within(informationCard).queryByRole('link')).not.toBeInTheDocument()
    expect(within(informationCard).queryByRole('button')).not.toBeInTheDocument()

    await user.click(within(dialog).getByRole('link', { name: 'Agenda' }))

    expect(
      screen.queryByRole('dialog', { name: /menu lateral/i }),
    ).not.toBeInTheDocument()
    expect(screen.getByTestId('current-path')).toHaveTextContent('/appointments')
  })
})
