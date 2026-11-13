import { baseApi } from '@/lib/base-api'

export type PackageWeekDay =
  | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'

export interface ServicePackage {
  id: string
  unitId: string
  unitName: string
  serviceId: string
  serviceName: string
  name: string
  description: string | null
  totalSessions: number
  totalPrice: string
  weekDays: PackageWeekDay[]
  weeklyFrequency: number
  active: boolean
}

export interface ServicePackageInput {
  name: string
  description?: string
  unitId: string
  serviceId: string
  totalSessions: number
  totalPrice: string
  weekDays: PackageWeekDay[]
  active: boolean
}

function contentOf(value: unknown): ServicePackage[] {
  if (Array.isArray(value)) return value as ServicePackage[]
  return (value as { content?: ServicePackage[] }).content ?? []
}

export const packagesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getServicePackages: builder.query<ServicePackage[], Record<string, string | boolean | number | undefined> | void>({
      query: (params) => ({ url: '/api/service-packages', params }),
      transformResponse: contentOf,
      providesTags: ['ServicePackage'],
    }),
    createServicePackage: builder.mutation<ServicePackage, ServicePackageInput>({
      query: (data) => ({ url: '/api/service-packages', method: 'POST', data }),
      invalidatesTags: ['ServicePackage'],
    }),
    updateServicePackageStatus: builder.mutation<ServicePackage, { id: string; active: boolean }>({
      query: ({ id, active }) => ({ url: `/api/service-packages/${id}/status`, method: 'PATCH', data: { active } }),
      invalidatesTags: ['ServicePackage'],
    }),
  }),
})

export const { useGetServicePackagesQuery, useCreateServicePackageMutation, useUpdateServicePackageStatusMutation } = packagesApi
