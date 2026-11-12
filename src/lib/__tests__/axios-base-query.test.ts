import type { AxiosResponse } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '@/lib/axios'

import { axiosBaseQuery } from '../axios-base-query'

describe('axiosBaseQuery', () => {
  beforeEach(() => {
    vi.spyOn(api, 'request')
  })

  it('retorna os dados da resposta Axios', async () => {
    vi.mocked(api.request).mockResolvedValue(
      { data: { id: 'appointment-a' } } as AxiosResponse,
    )

    const result = await axiosBaseQuery(
      { url: '/api/appointments', method: 'GET' },
      {} as never,
      {} as never,
    )

    expect(api.request).toHaveBeenCalledWith({
      url: '/api/appointments',
      method: 'GET',
      data: undefined,
      params: undefined,
      headers: undefined,
    })
    expect(result).toEqual({ data: { id: 'appointment-a' } })
  })

  it('serializa resposta HTTP e falha de rede no formato do RTK Query', async () => {
    vi.mocked(api.request).mockRejectedValueOnce({
      response: { status: 409, data: { code: 'PATIENT_APPOINTMENT_CONFLICT' } },
    })
    vi.mocked(api.request).mockRejectedValueOnce(new Error('Network Error'))

    await expect(
      axiosBaseQuery({ url: '/api/appointments' }, {} as never, {} as never),
    ).resolves.toEqual({
      error: {
        status: 409,
        data: { code: 'PATIENT_APPOINTMENT_CONFLICT' },
      },
    })
    await expect(
      axiosBaseQuery({ url: '/api/appointments' }, {} as never, {} as never),
    ).resolves.toEqual({
      error: { status: 'FETCH_ERROR', data: 'Network Error' },
    })
  })
})
