import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { profileApi } from '@/api/get-profile'
import { registerPatientApi } from '@/features/patients/api/register-patient'
import { signInApi } from '@/api/sign-in'
import { createTestStore } from '@/test/render'
import { server } from '@/test/server'

describe('endpoints remotos legados', () => {
  it('mantém o GET de perfil e a tag de perfil', async () => {
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
          username: 'Ana Admin',
        }),
      ),
    )
    const store = createTestStore()

    await expect(
      store.dispatch(profileApi.endpoints.getProfile.initiate()).unwrap(),
    ).resolves.toMatchObject({ username: 'Ana Admin' })
  })

  it('mantém POST e payload de login', async () => {
    let body: unknown
    server.use(
      http.post('http://localhost:8080/auth/login', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ token: 'session-token', user: { id: 'user-a' } })
      }),
    )
    const store = createTestStore()

    await expect(
      store
        .dispatch(
          signInApi.endpoints.signIn.initiate({
            login: 'ana@clinica.test',
            password: 'secret',
          }),
        )
        .unwrap(),
    ).resolves.toEqual({ token: 'session-token', user: { id: 'user-a' } })
    expect(body).toEqual({ login: 'ana@clinica.test', password: 'secret' })
  })

  it('mantém POST, payload e cabeçalho do cadastro de paciente', async () => {
    let body: unknown
    let contentType: string | null = null
    server.use(
      http.post('http://localhost:8080/patient/save', async ({ request }) => {
        body = await request.json()
        contentType = request.headers.get('content-type')
        return HttpResponse.json({}, { status: 201 })
      }),
    )
    const store = createTestStore()

    await expect(
      store
        .dispatch(
          registerPatientApi.endpoints.registerPatient.initiate({ name: 'Ana' }),
        )
        .unwrap(),
    ).resolves.toEqual({})
    expect(body).toEqual({ name: 'Ana' })
    expect(contentType).toContain('application/json')
  })
})
