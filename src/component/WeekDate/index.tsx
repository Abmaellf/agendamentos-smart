import { startOfWeek, addDays, format, isToday } from 'date-fns';
import { WeekDatesContainer, WeekDatesLabel } from './styles';
import ptBR from 'date-fns/locale/pt-BR'


export function WeekDates() {
  const today = new Date();
  const start = startOfWeek(today, { weekStartsOn: 1 }); // começa na segunda

  const days = Array.from({ length: 5 }).map((_, index) => {
    const date = addDays(start, index);
    return {
      date,
      label: format(date, 'EEEE - dd/MM', {
        locale: ptBR,}), // segunda - 29/04
      isToday: isToday(date),
    };
  });

  return (
    <WeekDatesContainer>
      {days.map((day, idx) => (
        <WeekDatesLabel key={idx} >
          {day.label}
         
        </WeekDatesLabel>
      ))}
    </WeekDatesContainer>
  );
};

