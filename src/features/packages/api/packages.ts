import { baseApi } from '@/lib/base-api'

export type PackageWeekDay =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY'

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

export interface ServicePackageFilters {
  unitId?: string
  serviceId?: string
  active?: boolean
  totalSessions?: number
  name?: string
}

export interface ServicePackageListQuery extends ServicePackageFilters {
  page: number
  size: number
}

export interface ServicePackagePage {
  content: ServicePackage[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

interface PageFallback {
  page: number
  size: number
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function numberOr(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

export function normalizeServicePackagePage(
  value: unknown,
  fallback: PageFallback = { page: 0, size: 10 },
): ServicePackagePage {
  const record = asRecord(value)
  const content = Array.isArray(value)
    ? (value as ServicePackage[])
    : Array.isArray(record?.content)
      ? (record.content as ServicePackage[])
      : []
  const hasPaginationMetadata =
    record &&
    typeof record.page === 'number' &&
    typeof record.size === 'number' &&
    typeof record.totalElements === 'number' &&
    typeof record.totalPages === 'number' &&
    typeof record.last === 'boolean'

  if (hasPaginationMetadata) {
    return {
      content,
      page: numberOr(record.page, fallback.page),
      size: numberOr(record.size, fallback.size),
      totalElements: numberOr(record.totalElements, content.length),
      totalPages: numberOr(record.totalPages, content.length ? 1 : 0),
      last: Boolean(record.last),
    }
  }

  return {
    content,
    page: 0,
    size: fallback.size,
    totalElements: content.length,
    totalPages: content.length ? 1 : 0,
    last: true,
  }
}

export const packagesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getServicePackages: builder.query<
      ServicePackagePage,
      ServicePackageListQuery | void
    >({
      query: (params) => {
        const query = params ?? { page: 0, size: 10 }
        const { page, size, unitId, serviceId, active, totalSessions, name } =
          query

        return {
          url: '/api/service-packages',
          params: {
            page,
            size,
            ...(unitId ? { unitId } : {}),
            ...(serviceId ? { serviceId } : {}),
            ...(active === undefined ? {} : { active }),
            ...(totalSessions === undefined ? {} : { totalSessions }),
            ...(name ? { name } : {}),
          },
        }
      },
      transformResponse: (value, _meta, arg) =>
        normalizeServicePackagePage(value, {
          page: arg?.page ?? 0,
          size: arg?.size ?? 10,
        }),
      providesTags: ['ServicePackage'],
    }),
    getServicePackage: builder.query<ServicePackage, string>({
      query: (id) => ({ url: `/api/service-packages/${id}` }),
      providesTags: (_result, _error, id) => [{ type: 'ServicePackage', id }],
    }),
    createServicePackage: builder.mutation<ServicePackage, ServicePackageInput>(
      {
        query: (data) => ({
          url: '/api/service-packages',
          method: 'POST',
          data,
        }),
        invalidatesTags: ['ServicePackage'],
      },
    ),
    updateServicePackage: builder.mutation<
      ServicePackage,
      { id: string; data: ServicePackageInput }
    >({
      query: ({ id, data }) => ({
        url: `/api/service-packages/${id}`,
        method: 'PATCH',
        data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        'ServicePackage',
        { type: 'ServicePackage', id },
      ],
    }),
    updateServicePackageStatus: builder.mutation<
      ServicePackage,
      { id: string; active: boolean }
    >({
      query: ({ id, active }) => ({
        url: `/api/service-packages/${id}/status`,
        method: 'PATCH',
        data: { active },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        'ServicePackage',
        { type: 'ServicePackage', id },
      ],
    }),
  }),
})

export const {
  useGetServicePackagesQuery,
  useGetServicePackageQuery,
  useCreateServicePackageMutation,
  useUpdateServicePackageMutation,
  useUpdateServicePackageStatusMutation,
} = packagesApi
