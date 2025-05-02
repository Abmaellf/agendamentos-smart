import { CardPatient, CardPatientProps } from "../CardPatient";
import { CardDayContainer, ListPatient, TitleDayWeek } from "./styles";

interface CardDayProps {
    dayWeek: string,
    day: string

}

// criar uma lista do tipo cardPatient e percorrer com os pacientes

export function CardDay(cardDay:CardDayProps, cardPatient:CardPatientProps ) {
    return(
        <CardDayContainer>
           {/* <TitleDayWeek>
                <span> {cardDay.dayWeek} </span>
                <span> {cardDay.day} </span>
           </TitleDayWeek>  */}

           <ListPatient>
                <CardPatient
                    hours = "07:00"
                    namePatient = 'Abmael'
                    pathology = "Fisioterapia"
                    status = "Atendida"
                    variant= "red"
                />
                 <CardPatient
                    hours = "08:00"
                    namePatient = 'Abmael'
                    pathology = "Pilates"
                    status = "Cancelado"
                    variant= "green"
                />
               
               <CardPatient
                    hours = "09:00"
                    namePatient = 'Abmael'
                    pathology = "Fisioterapia"
                    status = "Em atendimento"
                    variant= "yellow"
                />
               
               <CardPatient
                    hours = "10:00"
                    namePatient = 'Abmael'
                    pathology = "Pilates"
                    status = "Atendida"
                     variant= "green"
                />

                <CardPatient
                    hours = "10:00"
                    namePatient = 'Abmael'
                    pathology = "Pilates"
                    status = "Atendida"
                     variant= "green"
                />

                <CardPatient
                    hours = "10:00"
                    namePatient = 'Abmael'
                    pathology = "Pilates"
                    status = "Atendida"
                    variant= "green"
                />
                <CardPatient
                    hours = "10:00"
                    namePatient = 'Abmael'
                    pathology = "Pilates"
                    status = "Atendida"
                    variant= "green"
                />

            <CardPatient
                    hours = "10:00"
                    namePatient = 'Abmael'
                    pathology = "Pilates"
                    status = "Atendida"
                    variant= "green"
                />


                
               
           </ListPatient>
           
          

        </CardDayContainer>
    )
}