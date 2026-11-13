import { createApi } from '@reduxjs/toolkit/query/react'

import { axiosBaseQuery } from './axios-base-query'

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery,
  tagTypes: [
    'Appointment',
    'Session',
    'Profile',
    'PatientCatalog',
    'UnitCatalog',
    'ServiceCatalog',
    'ProfessionalCatalog',
    'ServicePackage',
  ],
  endpoints: () => ({}),
})
