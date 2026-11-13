import type { CreatePatientInput } from '@/@types/patient'
import { baseApi } from '@/lib/base-api'

export const registerPatientApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    registerPatient: builder.mutation<void, CreatePatientInput>({
      query: (data) => ({
        url: '/patient/save',
        method: 'POST',
        data,
        headers: { 'Content-Type': 'application/json' },
      }),
    }),
  }),
})

export const { useRegisterPatientMutation } = registerPatientApi
