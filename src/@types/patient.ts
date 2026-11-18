export type PatientStatus = 'ATIVO' | 'INATIVO' | 'EM_ATENDIMENTO'

export interface PatientPrincipalService {
  id: string
  name: string
}

export interface PatientListItem {
  id: string
  code: number
  name: string
  clinicId: string
  unitIds: string[]
  createdAt: string
  status?: PatientStatus | null
  principalService?: PatientPrincipalService | null
}

export interface PatientListResponse {
  content: PatientListItem[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export interface PatientListQuery {
  page: number
  size: number
  name?: string
  status?: PatientStatus
  serviceId?: string
}

export interface PatientFilters {
  name: string
  status?: PatientStatus
  serviceId?: string
}

export interface PatientServiceOption {
  id: string
  name: string
}

export interface CreatePatientInput {
  name: string
  unitIds: string[]
}

export interface CreatePatientFormValues {
  name: string
  unitIds: string[]
}

export interface PatientTableFilterProps {
  value: PatientFilters
  services: PatientServiceOption[]
  servicesLoading: boolean
  disabled?: boolean
  onApply: (filters: PatientFilters) => void
  onClear: () => void
}

export interface PatientTableRowsProps {
  patient: PatientListItem
}

export interface PaginationProps {
  pageIndex: number
  totalPages: number
  totalCount: number
  isLast: boolean
  onFirst: () => void
  onPrevious: () => void
  onNext: () => void
  onLast: () => void
}
