import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { env } from '@/env'
import type { PatientListRequest, PatientListResponse } from '@/type/patient'

export const patientApi = createApi({
  reducerPath: 'patientApi',
  baseQuery: fetchBaseQuery({
    baseUrl: env.VITE_API_URL,
    credentials: 'include',
  }),
  tagTypes: ['Patient'],
  endpoints: (builder) => ({
    listPatients: builder.query<PatientListResponse, PatientListRequest>({
      query: ({ page, size }) => ({
        url: 'patient/list',
        params: {
          page,
          size,
        },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.content.map((patient) => ({
                type: 'Patient' as const,
                id: patient.id,
              })),
              { type: 'Patient' as const, id: 'LIST' },
            ]
          : [{ type: 'Patient' as const, id: 'LIST' }],
    }),
  }),
})

export const { useListPatientsQuery } = patientApi
