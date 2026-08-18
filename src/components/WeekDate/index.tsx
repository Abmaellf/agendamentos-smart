import { ListNumberDate, WeekDatesContainer } from './styles'
import { addDays, format, startOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'

interface CurrentDate {
  date: Date
}
export function WeekDates(currentDate: CurrentDate) {
  const weekStart = startOfWeek(currentDate.date, { weekStartsOn: 1 })
  const listWeek = Array.from({ length: 5 }, (_, index) =>
    format(addDays(weekStart, index), 'EEEE dd/MM/yyyy', { locale: ptBR }),
  )

  return (
    <WeekDatesContainer>
      {listWeek.map((label) => (
        <ListNumberDate key={label}>{label}</ListNumberDate>
      ))}
    </WeekDatesContainer>
  )
}
