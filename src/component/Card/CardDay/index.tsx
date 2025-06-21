import { CardPatient } from "../CardPatient";
import { CardDayContainer, ListPatient} from "./styles";
// import { schedulings } from '../../../../data.json';
import { format} from 'date-fns';
import {ptBR} from 'date-fns/locale/pt-BR';
import { useEffect, useState } from "react";

interface Scheduling {
   id: string;
   namePatient: string;
   pathology: ["Fisioterapia", "Pilates"];
   dateSchenduling: Date;
   hours: string;
   status: ["Em Atendimento", "Agendando", "Atendido", "Cancelado"]
   image: string;
}
interface CardDayProps{
    date: string,
    isToday: boolean,
    dayWeek: number
}

// criar uma lista do tipo cardPatient e percorrer com os pacientes

export function CardDay(cardDay: CardDayProps) {
    // const listSchendulingDay = schedulings.find((patient) => { patient.dateSchenduling ===ardDay.data})
    const [schedulings, setSchedulings] = useState<Scheduling[]>([]);

    async function loadScheduling() {
        const response = await fetch('http://localhost:3333/schedulings');
        const data = await response.json();
        console.log(data)
        setSchedulings(data);
    }

    useEffect(
        ()=> {
            loadScheduling()
        }, []
    )

    return(
        <CardDayContainer>
                        
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