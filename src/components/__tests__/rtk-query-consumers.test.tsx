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

  it('abre os dados seguros do perfil e oferece o download da foto', async () => {
    server.use(
      http.get('http://localhost:8080/auth/me', () =>
        HttpResponse.json({
          id: 'user-a',
          login: 'ana@clinica.test',
          password: 'nao-exibir',
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

    const user = userEvent.setup()
    renderWithProviders(<AccountMenu />)

    const trigger = await screen.findByRole('button', {
      name: /abrir menu do perfil de ana conta/i,
    })
    await user.click(trigger)
    await user.click(screen.getByRole('menuitem', { name: /perfil/i }))

    expect(
      await screen.findByRole('dialog', { name: /detalhes do perfil/i }),
    ).toBeVisible()
    expect(screen.getByText('ana@clinica.test')).toBeVisible()
    expect(screen.getByText('ADMIN')).toBeVisible()
    expect(screen.getByText('Clínica A')).toBeVisible()
    expect(screen.queryByText('nao-exibir')).not.toBeInTheDocument()

    expect(screen.getByRole('link', { name: /baixar foto/i })).toHaveAttribute(
      'download',
      'foto-de-perfil.png',
    )
  })

  it('fecha o modal por Escape e devolve o foco ao perfil', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AccountMenu />)

    const trigger = await screen.findByRole('button', {
      name: /abrir menu do perfil/i,
    })
    await user.click(trigger)
    await user.click(screen.getByRole('menuitem', { name: /perfil/i }))
    await screen.findByRole('dialog', { name: /detalhes do perfil/i })

    await user.keyboard('{Escape}')

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(trigger).toHaveFocus()
  })

  it('comunica quando os dados do perfil não estão disponíveis', async () => {
    server.use(
      http.get('http://localhost:8080/auth/me', () => HttpResponse.error()),
    )

    const user = userEvent.setup()
    renderWithProviders(<AccountMenu avatarSrc="" />)

    const trigger = await screen.findByRole('button', {
      name: /abrir menu do perfil/i,
    })
    await user.click(trigger)
    await user.click(screen.getByRole('menuitem', { name: /perfil/i }))

    expect(
      await screen.findByText(/dados do perfil não estão disponíveis/i),
    ).toBeVisible()
    expect(screen.queryByRole('link', { name: /baixar foto/i })).not.toBeInTheDocument()
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
