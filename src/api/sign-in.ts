import { baseApi } from '@/lib/base-api'

export interface SignInBody {
  login: string
  password: string
}

export interface SignInResponse {
  token?: unknown
  user?: unknown
}

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
