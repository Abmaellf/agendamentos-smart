export interface GetProfileResponse {
  id: string
  login: string
  role: string
  clinic: {
    id: string
    code: number
    name: string
    createdAt: string
  }
  username: string
  clinicName?: string
  unitName?: string
  activeUnitName?: string
}
