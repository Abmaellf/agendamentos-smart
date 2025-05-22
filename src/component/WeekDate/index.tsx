import { startOfWeek, addDays, format, isToday } from 'date-fns';
import { WeekDatesContainer, WeekDatesLabel } from './styles';
import { ptBR } from 'date-fns/locale/pt-BR'

interface CurrentDate {
  date: Date
}

export function WeekDates(currentDate: CurrentDate) {

   const today = new Date(currentDate.date); //Pega a data de hoje ou da pesquisa efetuada

  // Passando a data por parametro definimos o unicio da semana
  // const today = new Date("2025-05-05T10:30:00"); 
  // weekStartsOn defino em qual dia da semana vai começar 0=domingo, 1-segunda ...
  // const start = startOfWeek(today, { weekStartsOn: 1 }); 
   const start = startOfWeek(today, { weekStartsOn: 1 }); 

  //length define quantos dias será apresentado
  const days = Array.from({ length: 5 })
    .map((_, index) => {
          const date = addDays(start, index);
            return {
              date,
              label: format(date, 'EEEE - dd/MM/yyyy', {locale: ptBR,}), // segunda - 29/04
              isToday: isToday(date), //É hoje
              dayWeek: date.getDay(), // Número do dia da semana
              hora: date.getHours(),
              mes: date.getMonth(),
              time: date.getDate(),// dia do mes
              dateSemFormt: date
            };
          }
     );

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

