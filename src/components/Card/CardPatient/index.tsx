// import { isToday } from 'date-fns'
import { CardPatientContainer, NameAndPathology, Separator } from './styles'
// import { format } from 'date-fns'
// import { ptBR } from 'date-fns/locale/pt-BR'

type Props = {
  schenduling: {
    id: string
    namePatient: string
    pathology: string[]
    dateSchenduling: Date
    hours: string
    status: string
  }
  isToDay: boolean
}

export function CardPatient({ schenduling, isToDay }: Props) {
  return (
    <CardPatientContainer variant={isToDay} status={schenduling.status}>
      <span> {schenduling.hours} </span>
      <Separator></Separator>
      <NameAndPathology>
        <h2> {schenduling.namePatient} </h2>
        <h3> {schenduling.pathology} </h3>
        <h3> {schenduling.status} </h3>
        {/*  pathology  */}
        {/* <span>
          {' '}
          {format(schenduling.dateSchenduling, 'EEEE - dd/MM/yyyy', {
            locale: ptBR,
          })}
        </span> */}
        {/* <span> {schenduling.dateSchenduling}</span> */}
      </NameAndPathology>
    </CardPatientContainer>
  )
}
