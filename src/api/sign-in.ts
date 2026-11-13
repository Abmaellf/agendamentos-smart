import { baseApi } from '@/lib/base-api'
import type { SignInBody, SignInResponse } from '@/@types/auth'

export const signInApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    signIn: builder.mutation<SignInResponse, SignInBody>({
      query: (data) => ({
        url: '/auth/login',
        method: 'POST',
        data,
      }),
    }),
  }),
})

export const { useSignInMutation } = signInApi
