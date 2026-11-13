import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'

import { AddPatientModal } from '../components/add-patient-modal'

describe('cadastro de pacientes', () => {
  it('envia o cadastro sem alterar o payload legado', async () => {
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
