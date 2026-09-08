import type { AxiosResponse } from 'axios'
import type { ReactNode } from 'react'

export interface PatientProviderProps {
  children: ReactNode
}

export interface PatientContextValue {
  patients: PatientContextItem[]
  fetchPatients: () => Promise<AxiosResponse>
  createPatient: (data: CreatePatientInput) => Promise<void>
}

export interface PatientContextItem {
  id: string
  code: string
  name: string
  empresa: string
  createdAt: Date
  status: string
}

export interface CreatePatientInput {
  name: string
}
