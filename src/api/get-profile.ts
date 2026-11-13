import { api } from '@/lib/axios'
import { baseApi } from '@/lib/base-api'
import type { GetProfileResponse } from '@/@types/profile'

export const profileApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query<GetProfileResponse, void>({
      query: () => ({ url: 'auth/me' }),
      providesTags: ['Profile'],
    }),
  }),
})

export const { useGetProfileQuery } = profileApi

export async function getProfile() {
  const response = await api.get<GetProfileResponse>('auth/me')
  return response.data
}
