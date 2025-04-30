import { CardPatient } from "../CardPatient";
import { CardDayContainer,  TitleDayWeek } from "./styles";

interface CardDayProps {
    dayWeek: string,
    day: string

}

export function CardDay(cardDay:CardDayProps ) {
    return(
        <CardDayContainer>
           <TitleDayWeek>
                <span> {cardDay.dayWeek} </span>
                <span> {cardDay.day} </span>
           </TitleDayWeek> 

           <CardPatient/>
           <CardPatient/>
           <CardPatient/>
           <CardPatient/>
           <CardPatient/>
           <CardPatient/>
           <CardPatient/>
           <CardPatient/>
           <CardPatient/>
           <CardPatient/>
           <CardPatient/>
           <CardPatient/>

        </CardDayContainer>
    )
}