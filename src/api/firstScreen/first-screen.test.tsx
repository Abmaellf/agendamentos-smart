import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { FirstScreen } from './first-screen'
import { server } from '@/test/server'

function renderFirstScreen() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<FirstScreen />} />
        <Route path="/appointments" element={<p>Agenda autenticada</p>} />
        <Route path="/sign-in" element={<p>Tela de login</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('FirstScreen', () => {
  it('encaminha uma sessão válida para a agenda', async () => {
    renderFirstScreen()

    expect(await screen.findByText('Agenda autenticada')).toBeVisible()
  })

  it('encaminha para login quando auth/me e refresh são rejeitados', async () => {
    server.use(
      http.get('http://localhost:8080/auth/me', () =>
        HttpResponse.json({}, { status: 401 }),
      ),
      http.post('http://localhost:8080/auth/refresh', () =>
        HttpResponse.json({}, { status: 401 }),
      ),
    )

    renderFirstScreen()

    expect(await screen.findByText('Tela de login')).toBeVisible()
  })
})
