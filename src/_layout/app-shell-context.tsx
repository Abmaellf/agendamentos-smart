import { addDays } from 'date-fns'
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
} from 'react'

interface AppShellDateContextValue {
  selectedDate: Date
  setSelectedDate: Dispatch<SetStateAction<Date>>
  goToToday: () => void
  moveByWeek: (amount: number) => void
}

const AppShellDateContext = createContext<
  AppShellDateContextValue | undefined
>(undefined)

function initialShellDate() {
  const today = new Date()
  if (today.getDay() === 6) return addDays(today, 2)
  if (today.getDay() === 0) return addDays(today, 1)
  return today
}

export function AppShellDateProvider({ children }: PropsWithChildren) {
  const [selectedDate, setSelectedDate] = useState(initialShellDate)

  const value = useMemo<AppShellDateContextValue>(
    () => ({
      selectedDate,
      setSelectedDate,
      goToToday: () => setSelectedDate(new Date()),
      moveByWeek: (amount) =>
        setSelectedDate((date) => addDays(date, amount * 7)),
    }),
    [selectedDate],
  )

  return (
    <AppShellDateContext.Provider value={value}>
      {children}
    </AppShellDateContext.Provider>
  )
}

export function useAppShellDate() {
  const context = useContext(AppShellDateContext)
  if (!context) {
    throw new Error('useAppShellDate must be used inside AppShellDateProvider')
  }
  return context
}
