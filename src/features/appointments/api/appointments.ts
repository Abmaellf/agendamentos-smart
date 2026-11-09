import type {
  Appointment,
  AppointmentSession,
  CreateAppointmentInput,
  PatientOption,
  ProfessionalOption,
  ServiceOption,
  UnitOption,
} from '@/@types/appointment'
import { baseApi } from '@/lib/base-api'

import { parseSessionProfile } from '../../session/model/session'

interface ContentResponse<T> {
  content: T[]
}

type CollectionResponse<T> = ContentResponse<T> | T[]

type AppointmentsResponse = ContentResponse<Appointment>

function contentOf<T>(value: CollectionResponse<T>) {
  return Array.isArray(value) ? value : value.content
}

export const appointmentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAppointmentSession: builder.query<AppointmentSession, void>({
      query: () => ({ url: '/auth/me' }),
      transformResponse: parseSessionProfile,
      providesTags: ['Session'],
    }),
    getPatients: builder.query<PatientOption[], void>({
      query: () => ({ url: '/api/patients' }),
      transformResponse: (response: unknown) =>
        contentOf(response as CollectionResponse<PatientOption>),
      providesTags: ['PatientCatalog'],
    }),
    getUnits: builder.query<UnitOption[], void>({
      query: () => ({ url: '/api/units' }),
      transformResponse: (response: unknown) =>
        contentOf(response as CollectionResponse<UnitOption>),
      providesTags: ['UnitCatalog'],
    }),
    getServices: builder.query<ServiceOption[], void>({
      query: () => ({ url: '/api/services' }),
      transformResponse: (response: unknown) =>
        contentOf(response as CollectionResponse<ServiceOption>),
      providesTags: ['ServiceCatalog'],
    }),
    getProfessionals: builder.query<ProfessionalOption[], string>({
      query: (serviceId) => ({
        url: '/api/professionals',
        params: { serviceId },
      }),
      transformResponse: (response: unknown) =>
        contentOf(response as CollectionResponse<ProfessionalOption>),
      providesTags: ['ProfessionalCatalog'],
    }),
    createAppointment: builder.mutation<Appointment, CreateAppointmentInput>({
      query: (data) => ({
        url: '/api/appointments',
        method: 'POST',
        data,
      }),
      invalidatesTags: [{ type: 'Appointment', id: 'LIST' }],
    }),
    getAppointments: builder.query<
      Appointment[],
      { unitId: string; from: string; to: string }
    >({
      query: (params) => ({ url: '/api/appointments', params }),
      transformResponse: (response: unknown) =>
        (response as AppointmentsResponse).content,
      providesTags: [{ type: 'Appointment', id: 'LIST' }],
    }),
  }),
})

export const {
  useCreateAppointmentMutation,
  useGetAppointmentSessionQuery,
  useGetAppointmentsQuery,
  useGetPatientsQuery,
  useGetProfessionalsQuery,
  useGetServicesQuery,
  useGetUnitsQuery,
} = appointmentsApi
