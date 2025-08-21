import { CardPatient } from '../CardPatient'
import { CardDayContainer } from './styles'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
// import { SchedulingContext } from '../../../context/SchedulingContext'
// import { useContextSelector } from 'use-context-selector'

interface CardDayProps {
  date: string
  isToday: boolean
  dayWeek: number
}

// criar uma lista do tipo cardPatient e percorrer com os pacientes

export function CardDay(cardDay: CardDayProps) {
  const  schedulings = 
    [
    {
      id: '889',  
      namePatient: 'Abmael',  
      pathology: ['Fisioterapia', 'Pilates'],
      dateSchenduling: new Date,
      hours: '10:00',
      status: 'Ativo',
      image: 'local'
    },
    {
      id: '890',  
      namePatient: 'Ana',  
      pathology: ['Fisioterapia', 'Pilates'],
      dateSchenduling: new Date,
      hours: '10:00',
      status: 'Ativo',
      image: 'local'
    }
  ]
  

  //  const  schedulings  = useContextSelector(
	// 		SchedulingContext, 
	// 		(context) => {
	// 		 return context.schedulings
	//  });
  const isDayConvert = cardDay.isToday ? 'true' : 'false'
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
                isToDay={cardDay.isToday}
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
