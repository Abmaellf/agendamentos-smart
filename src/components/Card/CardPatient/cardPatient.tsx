import type {
  CardPatientProps,
  StatusPresentation,
} from '@/@types/components'
import type { AppointmentStatus } from '@/@types/appointment'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const statusPresentation = {
  AGENDADO: {
    label: 'Agendado',
    className: 'border-white bg-[#8d8d99] text-white',
  },
  FALTA: {
    label: 'Em atendimento',
    className:
      'border-white bg-appointment-rescheduled text-white',
  },
  REAGENDADO: {
    label: 'Cancelado',
    className: 'border-white bg-[#121214] text-white',
  },
  CANCELADO: {
    label: 'Cancelado',
    className: 'border-white bg-[#121214] text-white',
  },
  EMATENDIMENTO: {
    label: 'Concluído',
    className: 'border-white bg-brand text-[#29292e]',
  },
  FINALIZADO: {
    label: 'Concluído',
    className: 'border-white bg-brand text-[#29292e]',
  },
} satisfies Record<AppointmentStatus, StatusPresentation>

export function CardPatient({ appointment, isToday }: CardPatientProps) {
  const presentation = statusPresentation[appointment.status]
  return (
    <Card
      role="article"
      aria-label={`Agendamento de ${appointment.patient.name}: ${presentation.label}`}
      data-status={appointment.status}
      data-today={isToday}
      className={cn(
        'flex flex-row items-center justify-start gap-8 rounded-none border px-[18px] py-0 shadow-none',
        presentation.className,
      )}
    >
      <span>{appointment.startsAt}</span>
      <Separator orientation="vertical" className="h-[100px] bg-white" />
      <div className="flex w-full flex-col items-center justify-end">
        <h2>{appointment.patient.name}</h2>
        {/* <h3>{appointment.patient.pathology.join(', ')}</h3> */}
        <h3>{appointment.status}</h3>
      </div>
    </Card>
  )
}
