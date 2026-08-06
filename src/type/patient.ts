export type PatientListRequest = {
  page: number
  size: number
}

export type PatientListItemResponse = {
  id: string
  name: string
  clinicId: string
}

export type PatientListResponse = {
  content: PatientListItemResponse[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}
