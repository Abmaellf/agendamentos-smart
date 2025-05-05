import { CardPatientContainer, NameAndPathology, Separator} from "./styles";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

 type Props = {
    schenduling: {
        id: string,
        namePatient: string,
        dateSchenduling: Date,
        hours: string,
        pathology: string[],
        status: string;
        image: string
        variant: string
    }
}

export function CardPatient({schenduling}: Props) {
    

    return(
        <CardPatientContainer variant={schenduling.variant} >
            
            <span> {schenduling.hours} </span>
            <Separator></Separator>
            <NameAndPathology>
                <h2> {schenduling.namePatient}  </h2>
                <h3> {schenduling.pathology}  </h3> {/*  pathology  */}
                <span> {format(schenduling.dateSchenduling, 'EEEE - dd/MM', {
                        locale: ptBR,}) }
                </span>

                {/* <span> {schenduling.dateSchenduling}</span> */}
            </NameAndPathology>
        </CardPatientContainer>
    )
}