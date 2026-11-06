import { api } from '@/lib/axios'
import { useCallback, useState } from 'react'
import { createContext } from 'use-context-selector'
import { uuid } from 'zod'

import type {
  CreatePatientInput,
  PatientContextItem,
  PatientContextValue,
  PatientProviderProps,
} from '@/@types/patient'

export const PatientContext = createContext({} as PatientContextValue)

export function PatientProvider({ children }: PatientProviderProps) {
  // const [cookies] = useCookies(["jwt"]);
  const [patients, setPatients] = useState<PatientContextItem[]>([])

  async function fetchPatients() {
    const response = await api.get('patient/list')
    setPatients(response.data.content)
    return response
  }

  const createPatient = useCallback(async (data: CreatePatientInput) => {
    const { name } = data

    const response = await api.post('patients', {
      uuid,
      name,
      empresa: 'Equilibrio',
      createdAt: new Date(),
      status: 'Ativo',
    })
    setPatients((state) => [response.data, ...state])
  }, [])

  return (
    <PatientContext.Provider
      value={{
        patients,
        fetchPatients,
        createPatient,
      }}
    >
      {children}
    </PatientContext.Provider>
  )
}
