import { api } from '@/lib/axios'
import { baseApi } from '@/lib/base-api'

export interface GetProfileResponse {
    id: string
    login: string
    password: string
    role: string
    clinic:{
        id: string
        code: number
        name: string
        createdAt: string 
    },
    username: string
}

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
  console.log(response)
  return response.data
}
