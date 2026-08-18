import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const statusClassNames: Record<string, string> = {
  Agendar: 'border-white bg-white text-[#29292e]',
  Agendado: 'border-white bg-[#8d8d99] text-white',
  Concluido: 'border-white bg-brand text-[#29292e]',
  Cancelado: 'border-white bg-[#121214] text-white',
  Falta: 'border-white bg-appointment-missed text-[#29292e]',
  'Em atendimento': 'border-white bg-appointment-rescheduled text-white',
  Reagendado: 'border-[#8d8d99] bg-white text-[#29292e]',
}

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
    <Card
      role="article"
      aria-label={`Agendamento de ${appointment.namePatient}`}
      data-status={appointment.status}
      data-today={isToDay}
      className={cn(
        'flex flex-row items-center justify-start gap-8 rounded-none border px-[18px] py-0 shadow-none',
        statusClassNames[appointment.status] ??
          'border-white bg-white text-[#29292e]',
      )}
    >
      <span>{appointment.hours}</span>
      <Separator orientation="vertical" className="h-[100px] bg-white" />
      <div className="flex w-full flex-col items-center justify-end">
        <h2>{appointment.namePatient}</h2>
        <h3>{appointment.pathology.join(', ')}</h3>
        <h3>{appointment.status}</h3>
      </div>
    </Card>
  )
}
