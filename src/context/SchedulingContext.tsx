import { api } from '@/lib/axios'
import { addDays, format, isToday, startOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ReactNode, useCallback, useEffect, useState } from 'react'
import { createContext } from "use-context-selector";
import { uuid } from 'zod'

interface Scheduling {
  id: string
  namePatient: string
  pathology: ['Fisioterapia', 'Pilates']
  dateSchenduling: Date
  hours: string
  status: string
  image: string
}
interface WeekDatesProps {
  date: Date
  data: string
  isToday: boolean
  dayWeek: number
}
interface Patient {
  id: string
  name: string
  empresa: string
  createdAt: Date
  status: string
}
interface SchedulingContextType {
  schedulings: Scheduling[]
  patients: Patient[]
  fetchPatients:(query?: string)=> Promise<void>
  WeekDates: (date: Date) => WeekDatesProps[]
  CreatePatients:(data:CreatePatientSchema) => Promise<void>
}
interface CreatePatientSchema {
  name: string
}

export const SchedulingContext = createContext({} as SchedulingContextType)

interface SchedulingProviderType {
  children: ReactNode
}
export function SchedulingProvider({ children }: SchedulingProviderType) {

  const [schedulings, setSchedulings] = useState<Scheduling[]>([])
  const [patients, setPatients] = useState<Patient[]>([]);

  async function loadScheduling() {
    const response = await api.get('schedulings', {
    })
    setSchedulings(response.data)
  }

  useEffect(() => {
    loadScheduling()
  }, [])

  async function fetchPatients(query?: string) {
    const response = await api.get('patients', {
      params: {
        q:query
      }
    })
    setPatients(response.data)
  }

  useEffect(() => {
      fetchPatients()
    }, [])

  function WeekDates(date: Date) {
    const today = new Date(date) //Pega a data de hoje ou da pesquisa efetuada
    const start = startOfWeek(today, { weekStartsOn: 1 })

    const days = Array.from({ length: 5 }).map((_, index) => {
      const date = addDays(start, index)

      return {
        date,
        data: format(date, 'EEEE dd/MM/yyyy', { locale: ptBR }),
        isToday: isToday(date), //É hoje
        dayWeek: date.getDay(), // Número do dia da semana
      }
    })
    return days
  } 

  const  CreatePatients = useCallback(async (data: CreatePatientSchema) => {
   const { name } = data;

   const response = await api.post('patients', {
      uuid,
      name,
      empresa: 'Equilibrio',
      createdAt: new Date(),
      status: 'Ativo'
    })
    setPatients(state => [response.data, ...state])
}, 
  [])

  return (
    <SchedulingContext.Provider
      value={{
        schedulings,
        patients,
        fetchPatients,
        WeekDates,
        CreatePatients
      }}
    >
      {children}
    </SchedulingContext.Provider>
  )
}
