import type { AxiosResponse } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '@/lib/axios'

import {
  addSessionExpiredListener,
  clearSessionExpirationSignal,
  requestWithSession,
} from '../session-client'

describe('session client', () => {
  beforeEach(() => {
    clearSessionExpirationSignal()
    vi.spyOn(api, 'request')
    vi.spyOn(api, 'post')
  })

  it('renova a sessão e repete a requisição original uma vez', async () => {
    vi.mocked(api.request)
      .mockRejectedValueOnce({ response: { status: 401 } })
      .mockResolvedValueOnce({ data: { ok: true } } as AxiosResponse)
    vi.mocked(api.post).mockResolvedValue({ data: null } as AxiosResponse)

    await expect(
      requestWithSession({ url: '/api/appointments', method: 'GET' }),
    ).resolves.toMatchObject({ data: { ok: true } })

    expect(api.post).toHaveBeenCalledOnce()
    expect(api.post).toHaveBeenCalledWith('/auth/refresh', undefined, {
      withCredentials: true,
    })
    expect(api.request).toHaveBeenCalledTimes(2)
  })

  it('compartilha um único refresh entre requisições expiradas', async () => {
    let resolveRefresh!: (response: AxiosResponse) => void
    const refreshResponse = new Promise<AxiosResponse>((resolve) => {
      resolveRefresh = resolve
    })

    vi.mocked(api.request)
      .mockRejectedValueOnce({ response: { status: 401 } })
      .mockRejectedValueOnce({ response: { status: 401 } })
      .mockResolvedValueOnce({ data: 'first' } as AxiosResponse)
      .mockResolvedValueOnce({ data: 'second' } as AxiosResponse)
    vi.mocked(api.post).mockReturnValue(refreshResponse)

    const first = requestWithSession({ url: '/api/appointments/1' })
    const second = requestWithSession({ url: '/api/appointments/2' })

    await Promise.resolve()
    expect(api.post).toHaveBeenCalledOnce()

    resolveRefresh({ data: null } as AxiosResponse)
    await expect(Promise.all([first, second])).resolves.toHaveLength(2)
    expect(api.request).toHaveBeenCalledTimes(4)
  })

  it('sinaliza sessão expirada quando o refresh é rejeitado', async () => {
    const onExpired = vi.fn()
    const removeListener = addSessionExpiredListener(onExpired)

    vi.mocked(api.request).mockRejectedValueOnce({ response: { status: 401 } })
    vi.mocked(api.post).mockRejectedValueOnce({ response: { status: 401 } })

    await expect(requestWithSession({ url: '/auth/me' })).rejects.toMatchObject({
      response: { status: 401 },
    })

    expect(onExpired).toHaveBeenCalledOnce()
    expect(api.request).toHaveBeenCalledOnce()
    removeListener()
  })
})
