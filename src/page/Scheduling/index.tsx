import { CaretLeft, CaretRight } from "phosphor-react";
import { DataSemana, DateDay, ListOfTheDay, SchedulingContainer, SchedulingHeader, Title } from "./styles";
import { CardDay } from "../../component/Card/CardDay";

export function Scheduling() {
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
                <CardDay
                    dayWeek="Segunda-Feira"
                    day="17"
                />
                <CardDay
                    dayWeek="Terça-Feira"
                    day="18"
                />
                <CardDay
                    dayWeek="Quarta-Feira"
                    day="19"
                />
                <CardDay
                    dayWeek="Quinta-Feira"
                    day="20"
                />
                <CardDay
                    dayWeek="Sexta-Feira"
                    day="21"
                />
              
             </ListOfTheDay>
        </SchedulingContainer>
    )
}