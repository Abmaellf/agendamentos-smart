import { CardPatientContainer, NameAndPathology, Separator} from "./styles";

 export interface CardPatientProps {
    hours: string,
    namePatient: string,
    pathology: string
    status: 'Em atendimento' | 'Cancelado' | 'Atendida';
    variant: string
}

export function CardPatient(cardPatient: CardPatientProps) {
    
    return(
        <CardPatientContainer variant={cardPatient.variant}>
            <span> {cardPatient.hours} </span>
            <Separator></Separator>
            <NameAndPathology>
                <h2> {cardPatient.namePatient}  </h2>
                <h3> {cardPatient.pathology}  </h3> {/*  pathology  */}
            </NameAndPathology>
        </CardPatientContainer>
    )
}