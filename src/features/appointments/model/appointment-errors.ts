import type { AppointmentApiError } from '@/@types/appointment'

const messages: Record<string, string> = {
  PATIENT_SCHEDULE_CONFLICT:
    'O paciente já possui outro agendamento nesse horário.',
  PROFESSIONAL_SCHEDULE_CONFLICT:
    'O profissional já possui outro agendamento nesse horário.',
  SERVICE_CAPACITY_EXCEEDED:
    'A capacidade do serviço está esgotada nesse horário.',
  APPOINTMENT_OVERRIDE_FORBIDDEN:
    'Somente administradores podem alterar duração ou preço padrão.',
  TENANT_RESOURCE_NOT_FOUND:
    'Cadastro não encontrado para a clínica da sessão.',
  PROFESSIONAL_UNAVAILABLE_DAY: 'O profissional está indisponível nesse dia.',
}

export function appointmentErrorMessage(error: unknown) {
  const data =
    typeof error === 'object' && error !== null && 'data' in error
      ? error.data
      : undefined
  const code =
    typeof data === 'object' && data !== null && 'code' in data
      ? (data as AppointmentApiError).code
      : undefined

  if (code && messages[code]) return messages[code]

  return 'Não foi possível criar o agendamento. Tente novamente.'
}
