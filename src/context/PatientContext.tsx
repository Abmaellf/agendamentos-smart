import { api } from '@/lib/axios'
import { AxiosResponse } from 'axios'
import { ReactNode, useCallback, useState } from 'react'
import { createContext } from 'use-context-selector'
import { uuid } from 'zod'

interface Patient {
  id: string
  code: string
  name: string
  empresa: string
  createdAt: Date
  status: string
}
interface PatientContextType {
  patients: Patient[]
  fetchPatients: () => Promise<AxiosResponse>
  createPatient: (data: CreatePatientSchema) => Promise<void>
}
interface CreatePatientSchema {
  name: string
}

export const PatientContext = createContext({} as PatientContextType)

interface PatientProviderProps {
  children: ReactNode
}
export function PatientProvider({ children }: PatientProviderProps) {
  // const [cookies] = useCookies(["jwt"]);
  const [patients, setPatients] = useState<Patient[]>([])

  async function fetchPatients() {
    const response = await api.get('patient/list')
    setPatients(response.data.content)
    return response
  }

  const createPatient = useCallback(async (data: CreatePatientSchema) => {
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
