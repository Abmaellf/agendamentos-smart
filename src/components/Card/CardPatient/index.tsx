// import { isToday } from 'date-fns'
import { CardPatientContainer, NameAndPathology, Separator } from './styles'
// import { format } from 'date-fns'
// import { ptBR } from 'date-fns/locale/pt-BR'

type Props = {
  appointment: {
    id: string
    namePatient: string
    pathology: string[]
    date: Date
    hours: string
    status: string
  }
  isToDay: boolean
}

export function CardPatient({ appointment, isToDay }: Props) {
  return (
    <CardPatientContainer variant={isToDay} status={appointment.status}>
      <span> {appointment.hours} </span>
      <Separator></Separator>
      <NameAndPathology>
        <h2> {appointment.namePatient} </h2>
        <h3> {appointment.pathology} </h3>
        <h3> {appointment.status} </h3>
        {/*  pathology  */}
        {/* <span>
          {' '}
          {format(appointment.date, 'EEEE - dd/MM/yyyy', {
            locale: ptBR,
          })}
        </span> */}
        {/* <span> {appointment.date}</span> */}
      </NameAndPathology>
    </CardPatientContainer>
  )
}
