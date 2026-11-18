import { CreatePatientInput, PatientListItem, PatientListQuery, PatientListResponse } from "@/@types/patient"
import { baseApi } from "@/lib/base-api"


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