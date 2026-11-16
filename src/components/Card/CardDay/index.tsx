import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'

import type { Appointment, CardDayProps } from '@/@types/appointment'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

import { CardPatient } from '../CardPatient/cardPatient'

function appointmentLocalDateKey(appointment: Appointment) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: appointment.timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(appointment.startsAt))
}



export function CardDay({
    date,
    isToday,
    dayWeek,
    appointments,
  }: CardDayProps) {
  return (
    <Card
      data-day-week={dayWeek}
      data-today={isToday}
      className={cn(
        'flex w-80 flex-col gap-2 rounded-[10px] border-0 p-2.5 text-[#202024] shadow-none',
        isToday ? 'bg-[#323238]' : 'bg-white',
      )}
    >
        {appointments.map((appointment) => {
             if (appointmentLocalDateKey(appointment) !== date ) return null
                return (
                  <CardPatient
                    key={appointment.id}
                    appointment={appointment}
                    isToday={isToday}
                  />
                )
        })}
    </Card>
  )
}
