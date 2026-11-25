import { CreatePatientInput, PatientListItem, PatientListQuery, PatientListResponse } from "@/@types/patient"
import { baseApi } from "@/lib/base-api"

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

export function normalizePatientPage(
    value: unknown,
    fallback: PageFallback = { page: 0, size: 5 },
): PatientListResponse {
    const record = asRecord(value)
    const content = Array.isArray(value)
        ? (value as PatientListItem[])
        : Array.isArray(record?.content)
            ? (record.content as PatientListItem[])
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


export const patientApi = baseApi.injectEndpoints({

    endpoints: (builder) => ({

        getPatientPage: builder.query<PatientListResponse, PatientListQuery>({
            query: ({ page, size, name, status, serviceId }) => ({
                url: '/patient/list',
                params: {
                    page,
                    size,
                    name: name || undefined,
                    status: status || undefined,
                    serviceId: serviceId || undefined,
                },
            }),
            transformResponse: (value, _meta, arg) =>
                normalizePatientPage(value, {
                    page: arg.page,
                    size: arg.size,
                }),
            providesTags: (result) =>
                result
                    ? [
                        { type: 'PatientCatalog' as const, id: 'LIST' },
                        ...result.content.map((patient) => ({
                            type: 'PatientCatalog' as const,
                            id: patient.id
                        })),
                    ]
                    : [{ type: 'PatientCatalog' as const, id: 'LIST' }],
        }),

        registerPatient: builder.mutation<PatientListItem, CreatePatientInput>({
            query: (data) => ({
                url: '/patient/save',
                method: 'POST',
                data,
                headers: { 'Content-Type': 'application/json' },
            }),
            invalidatesTags: [{ type: 'PatientCatalog' as const, id: 'LIST' }],
        }),
    }),
})

export const { useGetPatientPageQuery, useRegisterPatientMutation } = patientApi
