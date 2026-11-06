import { baseApi } from '@/lib/base-api'

export interface PatientBody {
  name: string
}

export const registerPatientApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    registerPatient: builder.mutation<void, PatientBody>({
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
