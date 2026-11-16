import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Route, Routes } from 'react-router-dom'

import { AuthLayout } from '@/_layout/auth'
import { SignIn } from '@/page/auth/sign-in'
import { SignUp } from '@/page/auth/sign-up'
import { renderWithProviders } from '@/test/render'

function renderPublicRoute(route: '/sign-in' | '/sign-up') {
  return renderWithProviders(
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />
      </Route>
    </Routes>,
    { route },
  )
}

describe('experiência pública de autenticação', () => {
  it('renderiza a casca de marca e o login sem overflow horizontal', () => {
    renderPublicRoute('/sign-in')

    expect(screen.getByTestId('auth-shell')).toHaveClass('overflow-x-hidden')
    expect(screen.getAllByRole('img', {
      name: 'Equilíbrio Fisioterapia & Pilates',
    })).toHaveLength(3)
    expect(screen.getByRole('heading', { name: 'Acesse sua conta' })).toBeVisible()
    expect(screen.getByText(/Agendamentos\s+inteligentes/)).toBeVisible()
    expect(screen.getAllByText(/Gestão de agendamento/)).toHaveLength(2)
    expect(screen.getByRole('link', { name: 'Novo Usuário' })).toHaveAttribute(
      'href',
      '/sign-up',
    )
  })

  it('apresenta o cadastro e retorna ao login pelo controle superior', async () => {
    const user = userEvent.setup()
    renderPublicRoute('/sign-up')

    expect(screen.getByRole('heading', { name: 'Faça seu cadastro' })).toBeVisible()
    expect(screen.getByLabelText('Nome da clínica')).toBeVisible()
    expect(screen.getByLabelText('Seu e-mail')).toBeVisible()
    expect(screen.getByLabelText('CPF ou CNPJ')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Salvar cadastro' })).toBeVisible()

    await user.click(screen.getByRole('link', { name: 'Efetuar login' }))

    expect(await screen.findByRole('heading', { name: 'Acesse sua conta' })).toBeVisible()
  })
})
