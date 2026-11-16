import { baseApi } from '@/lib/base-api'
import type { PackageWeekDay } from './packages'

export interface PackageAppointmentInput { packageId: string; patientId: string; startDate: string; time: string; professionalId?: string | null; effectiveWeekDays: PackageWeekDay[] }
export interface PackageAppointmentSession { sequence: number; date: string; time: string; startsAt: string }
export interface PackageAppointmentPreview { packageId: string; patientId: string; unitId: string; totalPrice: string; firstDate: string; lastDate: string; sessions: PackageAppointmentSession[]; fingerprint: string }
export interface PackageAppointmentConfirmation { contractId: string; appointmentIds: string[]; preview: PackageAppointmentPreview | null }

export const packageAppointmentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    previewPackageAppointment: builder.mutation<PackageAppointmentPreview, PackageAppointmentInput>({ query: (data) => ({ url: '/api/package-appointments/preview', method: 'POST', data }) }),
    confirmPackageAppointment: builder.mutation<PackageAppointmentConfirmation, { data: PackageAppointmentInput; fingerprint?: string }>({ query: ({ data, fingerprint }) => ({ url: '/api/package-appointments/confirm', method: 'POST', data, headers: { 'Idempotency-Key': crypto.randomUUID(), ...(fingerprint ? { 'X-Preview-Fingerprint': fingerprint } : {}) } }), invalidatesTags: [{ type: 'Appointment', id: 'LIST' }] }),
  }),
})

export const { usePreviewPackageAppointmentMutation, useConfirmPackageAppointmentMutation } = packageAppointmentsApi
