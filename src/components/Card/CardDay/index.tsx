import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'

import { CardPatient } from '../CardPatient'
import { CardDayContainer } from './styles'

interface CardDayProps {
  date: string
  isToday: boolean
  dayWeek: number
}

export function CardDay(cardDay: CardDayProps) {
  const appointments = [
    {
      id: '889',
      namePatient: 'Abmael',
      pathology: ['Fisioterapia', 'Pilates'],
      date: new Date(),
      hours: '10:00',
      status: 'Ativo',
      image: 'local',
    },
    {
      id: '890',
      namePatient: 'Ana',
      pathology: ['Fisioterapia', 'Pilates'],
      date: new Date(),
      hours: '10:00',
      status: 'Ativo',
      image: 'local',
    },
  ]

  const isDayConvert = cardDay.isToday ? 'true' : 'false'

  return (
    <CardDayContainer variant={isDayConvert}>
      {appointments.map((appointment) => {
        const appointmentDay = format(appointment.date, 'dd/MM/yyyy', {
          locale: ptBR,
        })

        if (appointmentDay !== cardDay.date) return null

        return (
          <CardPatient
            key={appointment.id}
            appointment={appointment}
            isToDay={cardDay.isToday}
          />
        )
      })}
    </CardDayContainer>
  )
}
