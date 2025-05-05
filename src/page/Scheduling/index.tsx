import { CaretLeft, CaretRight } from "phosphor-react";
import { ButtonSelectDate, CardDaySchedulingContainer, DataSemana, DateDay, ListOfTheDay, SchedulingContainer, SchedulingHeader, Title, WeekContainer } from "./styles";
import { CardDay } from "../../component/Card/CardDay";
import { WeekDates } from "../../component/WeekDate";
import { startOfWeek, addDays, format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR'

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { useState } from "react";

export function Scheduling() {

   const today = new Date(); // Pega a data de hoje
  
    console.log(today, "today") 

    const [startDate, setStartDate] = useState(today);

     const start = startOfWeek(startDate, { weekStartsOn: 1 }); 
     const days = Array.from({ length: 5 })
        .map((_, index) => {
              const date = addDays(start, index);
                return {
                  date,
                  week: format(date, 'EEEE', {locale: ptBR,}), 
                  data: format(date, 'dd/MM/yyyy', {locale: ptBR,}), 
                  isToday: isToday(date), 
                  dayWeek: date.getDay(), 
                  hora: date.getHours(),
                  mes: date.getMonth(),
                  time: date.getDate() 
                };
              }
         );

    function setNewStartDate(date: Date | null) {
        const dateString = new Date(date)
        setStartDate(dateString)
    }
        
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
                                    key={day.dayWeek}
                                    isToday = {day.isToday}
                                    date={day.data}
                                    dayWeek={day.dayWeek}
                                />
                    }) }
                    
                </CardDaySchedulingContainer>

                {/* // https://github.com/devsuperior/aula-react-datepicker
                // https://github.com/Hacker0x01/react-datepicker */}
                
                    <ButtonSelectDate>
                       <DatePicker
                            selected={startDate} 
                            onChange={date => setNewStartDate(date)} 
                        />
                    </ButtonSelectDate>
             </ListOfTheDay>
        </SchedulingContainer>
    )
}