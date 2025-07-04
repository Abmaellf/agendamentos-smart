import { CardPatient } from '../CardPatient'
import { CardDayContainer } from './styles'
// import { schedulings } from '../../../../data.json';
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { useContext } from 'react'
import { SchedulingContext } from '../../../context/SchedulingContext'

interface CardDayProps {
  date: string
  isToday: boolean
  dayWeek: number
}

// criar uma lista do tipo cardPatient e percorrer com os pacientes

export function CardDay(cardDay: CardDayProps) {
  // const listSchendulingDay = schedulings.find((patient) => { patient.dateSchenduling ===ardDay.data})

  // const [schedulings, setSchedulings] = useState<Scheduling[]>([]);
  const { schedulings } = useContext(SchedulingContext)
  const isDayConvert = cardDay.isToday ? 'true' : 'false';
  return (
    <CardDayContainer variant={isDayConvert}>
      
      {schedulings.map((schenduling) => {
        const listSchendulingDay = format(
          schenduling.dateSchenduling,
          'dd/MM/yyyy',
          {
            locale: ptBR,
          },
        )
        if (listSchendulingDay) {
          if (listSchendulingDay === cardDay.date) {
            // console.log(listSchendulingDay, 'listSchendulingDay')
           
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
      })}
    </CardDayContainer>
  )
}
