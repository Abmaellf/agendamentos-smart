import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

import { CardPatient } from '../CardPatient'

interface CardDayProps {
  date: string
  isToday: boolean
  dayWeek: number
}

export function CardDay(cardDay: CardDayProps) {
  const appointmentDate = new Date()
  const appointments = [
    {
      id: '889',
      namePatient: 'Abmael',
      pathology: ['Fisioterapia', 'Pilates'],
      date: appointmentDate,
      hours: '10:00',
      status: 'Ativo',
      image: 'local',
    },
    {
      id: '890',
      namePatient: 'Ana',
      pathology: ['Fisioterapia', 'Pilates'],
      date: appointmentDate,
      hours: '10:00',
      status: 'Ativo',
      image: 'local',
    },
  ]

  return (
    <Card
      data-day-week={cardDay.dayWeek}
      data-today={cardDay.isToday}
      className={cn(
        'flex w-80 flex-col gap-2 rounded-[10px] border-0 p-2.5 text-[#202024] shadow-none',
        cardDay.isToday ? 'bg-[#323238]' : 'bg-white',
      )}
    >
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
    </Card>
  )
}
