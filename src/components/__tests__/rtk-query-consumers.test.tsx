import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { AddPatientModal } from '@/components/AddPatientModal'
import AccountMenu from '@/components/account-menu'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'

describe('consumidores RTK Query', () => {
  it('consulta e apresenta o perfil no menu da conta', async () => {
    server.use(
      http.get('http://localhost:8080/auth/me', () =>
        HttpResponse.json({
          id: 'user-a',
          login: 'ana@clinica.test',
          password: 'not-used',
          role: 'ADMIN',
          clinic: {
            id: 'clinic-a',
            code: 1,
            name: 'Clínica A',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
          username: 'Ana Conta',
        }),
      ),
    )

    renderWithProviders(<AccountMenu />)

    expect(await screen.findByText('Ana Conta')).toBeVisible()
  })

  it('envia o cadastro de paciente sem alterar o payload', async () => {
    let body: unknown
    server.use(
      http.post('http://localhost:8080/patient/save', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({}, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    renderWithProviders(<AddPatientModal />)

    await user.click(
      screen.getAllByRole('button', { name: /novo paciente/i })[0],
    )
    await user.type(screen.getByRole('textbox', { name: 'Paciente' }), 'Beatriz')
    await user.click(screen.getByRole('button', { name: /salvar/i }))

    await waitFor(() => expect(body).toEqual({ name: 'Beatriz' }))
  })
})
