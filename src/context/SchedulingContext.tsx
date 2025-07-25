import { addDays, format, isToday, startOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { createContext, ReactNode, useEffect, useState } from 'react'

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
  createdAt: Date
  status: string
}
interface SchedulingContextType {
  schedulings: Scheduling[]
  patients: Patient[]
  WeekDates: (date: Date) => WeekDatesProps[]
}

export const SchedulingContext = createContext({} as SchedulingContextType)

interface SchedulingProviderType {
  children: ReactNode
}
export function SchedulingProvider({ children }: SchedulingProviderType) {

  const [schedulings, setSchedulings] = useState<Scheduling[]>([])
  const [patients, setPatients] = useState<Patient[]>([]);

  async function loadScheduling() {
    const response = await fetch('http://localhost:3333/schedulings')
    const data = await response.json()
    setSchedulings(data)
  }

  useEffect(() => {
    loadScheduling()
  }, [])

   async function loadPatient() {
    const response = await fetch('http://localhost:3333/patients')
    const data = await response.json()
    setPatients(data)
  }

  useEffect(() => {
      loadPatient()
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

  return (
    <SchedulingContext.Provider
      value={{
        schedulings,
        patients,
        WeekDates,
      }}
    >
      {children}
    </SchedulingContext.Provider>
  )
}
