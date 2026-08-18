import axios from 'axios'

import type { AppointmentApiError } from './appointment'

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
  if (axios.isAxiosError<AppointmentApiError>(error)) {
    const code = error.response?.data?.code
    if (code && messages[code]) return messages[code]
  }

  return 'Não foi possível criar o agendamento. Tente novamente.'
}
