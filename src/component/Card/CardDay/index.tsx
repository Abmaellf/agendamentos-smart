import { CardPatient } from "../CardPatient";
import { CardDayContainer, ListPatient} from "./styles";
import { schedulings } from '../../../../data.json';
import { format} from 'date-fns';
import {ptBR} from 'date-fns/locale/pt-BR';

interface CardDayProps{
    date: string,
    isToday: boolean,
    dayWeek: number
}

// criar uma lista do tipo cardPatient e percorrer com os pacientes

export function CardDay(cardDay: CardDayProps) {
    // const listSchendulingDay = schedulings.find((patient) => { patient.dateSchenduling ===ardDay.data})
    return(
        <CardDayContainer>
           {/* <TitleDayWeek>
                <span> {cardDay.dayWeek} </span>
                <span> {cardDay.day} </span>
           </TitleDayWeek>  */}
                
           <ListPatient>
                {
                    schedulings.map((schenduling) => { 
                        const listSchendulingDay = format(
                                        schenduling.dateSchenduling, 'dd/MM/yyyy', 
                                        {
                                             locale: ptBR
                                            }
                        )
                     if(listSchendulingDay) {
                        if(listSchendulingDay === cardDay.date) {
                            console.log(listSchendulingDay,"listSchendulingDay")
                            return (
                                <CardPatient 
                                    key={schenduling.id} 
                                    schenduling={schenduling}
                                    // listSchendulingDay= {listSchendulingDay}
                             />
                            )
                           } 
                     } else {
                        return 
                     }
                    })
                }
           </ListPatient>
        </CardDayContainer>
    )
}