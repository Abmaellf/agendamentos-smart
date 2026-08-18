import { useQuery } from '@tanstack/react-query'

import { getAppointments } from '../api/appointments'

export function useAppointments(
  params: { unitId: string; from: string; to: string },
  enabled = true,
) {
  return useQuery({
    queryKey: ['appointments', params.unitId, params.from, params.to],
    queryFn: () => getAppointments(params),
    enabled,
  })
}
