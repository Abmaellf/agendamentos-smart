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
    <ol className="flex items-center justify-center gap-3 max-[980px]:flex-col">
      {listWeek.map((label) => (
        <li
          key={label}
          className="bg-brand-accent text-brand-foreground w-80 rounded-[5px] px-[100px]"
        >
          {label}
        </li>
      ))}
    </ol>
  )
}
