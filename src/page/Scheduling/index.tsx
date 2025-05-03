import { CaretLeft, CaretRight } from "phosphor-react";
import { CardDaySchedulingContainer, DataSemana, DateDay, ListOfTheDay, SchedulingContainer, SchedulingHeader, Title, WeekContainer } from "./styles";
import { CardDay } from "../../component/Card/CardDay";
import { WeekDates } from "../../component/WeekDate";
import { startOfWeek, addDays, format, isToday } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR'

export function Scheduling() {

     const today = new Date(); // Pega a data de hoje
     const start = startOfWeek(today, { weekStartsOn: 1 }); 
     const days = Array.from({ length: 5 })
        .map((_, index) => {
              const date = addDays(start, index);
                return {
                  date,
                  week: format(date, 'EEEE', {locale: ptBR,}), // segunda - 29/04
                  data: format(date, 'dd/MM/yyyy', {locale: ptBR,}), // segunda - 29/04
                  isToday: isToday(date), //É hoje
                  dayWeek: date.getDay(), // Número do dia da semana
                  hora: date.getHours(),
                  mes: date.getMonth(),
                  time: date.getDate() // dia do mes
                };
              }
         );


    return( 
       <SchedulingContainer>
             <SchedulingHeader>
                    <Title> Agendamentos </Title>
                    <DateDay>
                        <CaretLeft size={32} />
                        <DataSemana> 17 de Outubro de 2024 </DataSemana>
                       
                        <CaretRight size={32} color="black" />
                    </DateDay>
             </SchedulingHeader>

             <ListOfTheDay>

                <WeekContainer>
                    <WeekDates />
                </WeekContainer>
             
                <CardDaySchedulingContainer>
                    {days.map((day) => {
                        return <CardDay 
                                    key={day.data}
                                    isToday = {day.isToday}
                                    date={day.data}
                                    dayWeek={day.dayWeek}

                                />
                    }) }
                    
                    {/* <CardDay />
                    <CardDay />
                    <CardDay />
                    <CardDay /> */}
                </CardDaySchedulingContainer>
              
             </ListOfTheDay>
        </SchedulingContainer>
    )
}