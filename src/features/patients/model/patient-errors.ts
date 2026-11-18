import { AxiosBaseQueryError } from "@/lib/axios-base-query"

export type { AxiosBaseQueryError } from "@/lib/axios-base-query"

interface PatientApiErrorPayload {
    code?: string
    message?: string
    fieldErrors?: Record<string, string[]>
}

type PatientOperation = 'create' | 'list'

function payloaddOf(error: unknown) {
    if (!error || typeof error !== 'object' || !('data' in error)) {
        return undefined
    }

    return (error as Partial<AxiosBaseQueryError>).data as
        | PatientApiErrorPayload
        | undefined
}

export function patientErrorMessage(
    error: unknown,
    operation: PatientOperation
) {
    const queryError = error as Partial<AxiosBaseQueryError> | undefined

    if (queryError?.status === 'FETCH_ERROR') {
        return 'Não foi possivel conectar ao servidor. Tente novamente.'
    }
    switch (payloaddOf(error)?.code) {
        case 'PATIENT_ALREADY_EXISTS':
            return 'Já existe um paciente cadastrado com esse nome.'
        case 'CLINIC_ACCESS_DENIED':
            return 'Sua sessão não pode cadastrar paciente nesta clínica.'
        case 'UNIT_ACCESS_DENIED':
            return 'Você só pode cadastrar pacientes na sua unidade autorizada.'
        case 'TENANT_RESOURCE_NOT_FOUND':
            return 'A unidade selecionada não esta disponível para esta clínica.'
        case 'VALIDATION_ERROR':
            return 'Revise o nome e as unidades selecionadas.'
        default:
            return operation === 'create'
                ? 'Não foi possível cadastrar o paciente. Tente novamente.'
                : 'Não foi possível carregar a lista de pacientes. Tente novamente.'
    }
}