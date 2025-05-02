import { CardPatient } from "../CardPatient";
import { CardDayContainer, ListPatient} from "./styles";
import { schedulings } from '../../../../data.json';



// criar uma lista do tipo cardPatient e percorrer com os pacientes

export function CardDay( ) {
    return(
        <CardDayContainer>
           {/* <TitleDayWeek>
                <span> {cardDay.dayWeek} </span>
                <span> {cardDay.day} </span>
           </TitleDayWeek>  */}

           <ListPatient>


                {
                    schedulings.map((schenduling) =>{ 
                        return (
                            <CardPatient key={schenduling.id} schenduling={schenduling}
                         />
                        )
                    })
                }
           </ListPatient>
           
          

        </CardDayContainer>
    )
}