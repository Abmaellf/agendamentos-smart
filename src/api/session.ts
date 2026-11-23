import { baseApi } from '@/lib/base-api'

export const sessionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
        skipSessionRefresh: true,
      }),
    }),
  }),
})

export const { useLogoutMutation } = sessionApi
