import { CardPatientContainer } from "./styles";

export function CardPatient() {
    return(
        <CardPatientContainer>
            <span> 07:00 </span>
            <h2> Abmael </h2>
            <h3> Fisioterapia </h3> {/*  pathology  */}

            <span> 08:00 </span>
            <h2> Ana </h2>
            <h3> Fisioterapia </h3> {/*  pathology  */}
        </CardPatientContainer>
    )
}