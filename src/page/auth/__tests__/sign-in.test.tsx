import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { SignIn } from '@/page/auth/sign-in'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'

describe('login', () => {
  it('mantém o payload, a mensagem e a navegação de sucesso', async () => {
    let body: unknown
    server.use(
      http.post('http://localhost:8080/auth/login', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ token: 'session-token', user: { id: 'user-a' } })
      }),
    )
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const user = userEvent.setup()
    renderWithProviders(<SignIn />, { route: '/sign-in' })

    await user.type(
      screen.getByRole('textbox', { name: /seu e-mail/i }),
      'ana@clinica.test',
    )
    await user.type(screen.getByLabelText(/senha/i), 'secret')
    await user.click(screen.getByRole('button', { name: /acessar painel/i }))

    expect(await screen.findByText(/conectado com sucesso/i)).toBeVisible()
    expect(body).toEqual({ login: 'ana@clinica.test', password: 'secret' })
  })

  it('exibe erro quando a API recusa as credenciais', async () => {
    server.use(
      http.post('http://localhost:8080/auth/login', () =>
        HttpResponse.json({ message: 'invalid credentials' }, { status: 401 }),
      ),
    )
    const user = userEvent.setup()
    renderWithProviders(<SignIn />, { route: '/sign-in' })

    await user.type(screen.getByRole('textbox', { name: /seu e-mail/i }), 'invalido@clinica.test')
    await user.type(screen.getByLabelText(/^senha$/i), 'wrong')
    await user.click(screen.getByRole('button', { name: /acessar painel/i }))

    expect(await screen.findByText(/credenciais inválidas/i)).toBeVisible()
  })

  it('mantém o botão desabilitado enquanto autentica', async () => {
    server.use(
      http.post('http://localhost:8080/auth/login', async () => {
        await delay(100)
        return HttpResponse.json({ token: 'session-token' })
      }),
    )
    const user = userEvent.setup()
    renderWithProviders(<SignIn />, { route: '/sign-in' })

    await user.type(screen.getByRole('textbox', { name: /seu e-mail/i }), 'ana@clinica.test')
    await user.type(screen.getByLabelText(/^senha$/i), 'secret')
    await user.click(screen.getByRole('button', { name: /acessar painel/i }))

    expect(screen.getByRole('button', { name: /acessar painel/i })).toBeDisabled()
  })
})
