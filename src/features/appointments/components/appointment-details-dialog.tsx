import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import {
  ArrowRight,
  CalendarDays,
  Cake,
  Check,
  CircleAlert,
  Clock3,
  FileText,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Trash2,
  UserRound,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import type {
  AppointmentDetailsDialogProps,
  AppointmentStatus,
  AppointmentStatusCommand,
} from '@/@types/appointment'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useUpdateAppointmentStatusMutation } from '@/features/appointments/api/appointments'
import { appointmentStatusErrorMessage } from '@/features/appointments/model/appointment-errors'
import { cn } from '@/lib/utils'

const statusPresentation: Record<
  AppointmentStatus,
  { label: string; className: string }
> = {
  AGENDADO: {
    label: 'Aguardando atendimento',
    className: 'border-[#f6c343] bg-[#fff1b8] text-[#4b3a00]',
  },
  ATENDENDO: {
    label: 'Atendimento iniciado',
    className: 'border-[#0b9b63] bg-[#dff7eb] text-[#075e46]',
  },
  CANCELADO: {
    label: 'Cancelado',
    className: 'border-[#343438] bg-[#ececef] text-[#29292e]',
  },
  FALTA: {
    label: 'Falta',
    className: 'border-[#e11d48] bg-[#ffe4e8] text-[#9f1239]',
  },
  FINALIZADO: {
    label: 'Atendida',
    className: 'border-[#0b9b63] bg-[#dff7eb] text-[#075e46]',
  },
  REAGENDADO: {
    label: 'Reagendado',
    className: 'border-[#c7ced7] bg-[#f4f6f8] text-[#53657a]',
  },
}

function appointmentDateLabel(appointmentDate: string) {
  return format(parseISO(appointmentDate), "d 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  })
}

function durationLabel(durationMinutes: number) {
  if (durationMinutes % 60 === 0) {
    const hours = durationMinutes / 60
    return `${hours} ${hours === 1 ? 'hora' : 'horas'}`
  }
  return `${durationMinutes} minutos`
}

function DisabledFeature({
  icon: Icon,
  label,
}: {
  icon: typeof Phone
  label: string
}) {
  return (
    <button
      type="button"
      disabled
      title="Em breve"
      className="flex w-full items-center gap-3 rounded-lg border border-dashed border-[#d7e2dc] px-3 py-2 text-left text-sm text-[#7a8c82] disabled:cursor-not-allowed disabled:opacity-70"
    >
      <Icon aria-hidden="true" className="size-4 shrink-0 text-[#6aa287]" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="shrink-0 text-xs font-semibold">Em breve</span>
    </button>
  )
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays
  label: string
  value: string
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 border-r border-[#e2ebe6] pr-4 last:border-r-0">
      <Icon
        aria-hidden="true"
        className="mt-0.5 size-5 shrink-0 text-[#087b52]"
      />
      <div className="min-w-0">
        <dt className="text-xs font-semibold text-[#53657a]">{label}</dt>
        <dd className="mt-1 truncate text-sm font-bold text-[#17202a]">
          {value}
        </dd>
      </div>
    </div>
  )
}

export function AppointmentDetailsDialog({
  appointment,
  open,
  onOpenChange,
  onStatusUpdated,
}: AppointmentDetailsDialogProps) {
  const [updateStatus, { isLoading }] = useUpdateAppointmentStatusMutation()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    setErrorMessage(null)
  }, [appointment?.id])

  if (!appointment) return null

  const currentAppointment = appointment
  const presentation = statusPresentation[currentAppointment.status]
  const canChangeStatus = currentAppointment.status === 'AGENDADO'
  const patientInitials = currentAppointment.patient.name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  async function changeStatus(status: AppointmentStatusCommand) {
    if (!canChangeStatus || isLoading) return

    setErrorMessage(null)
    try {
      const updated = await updateStatus({
        id: currentAppointment.id,
        status,
      }).unwrap()
      onStatusUpdated(updated)
    } catch (error) {
      setErrorMessage(appointmentStatusErrorMessage(error))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border-[#dfe9e4] bg-white p-0 text-[#17202a] shadow-[0_24px_70px_rgb(19_48_36_/_30%)] sm:max-w-[min(66rem,calc(100vw-2rem))]"
      >
        <DialogHeader className="border-b border-[#e0e9e4] px-6 py-5 pr-16 text-left sm:px-8">
          <div className="flex items-center gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#087b52] text-white shadow-[0_8px_18px_rgb(2_177_96_/_22%)]">
              <CalendarDays aria-hidden="true" className="size-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-[#132238] sm:text-2xl">
                Detalhes do agendamento
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-[#718196]">
                Consulte o atendimento e atualize o status permitido.
              </DialogDescription>
            </div>
          </div>
          <DialogClose asChild disabled={isLoading}>
            <button
              type="button"
              aria-label="Fechar detalhes do agendamento"
              className="absolute top-5 right-6 rounded-lg p-2 text-[#075e46] transition-colors hover:bg-[#e9f8f2] focus-visible:ring-2 focus-visible:ring-[#087b52] focus-visible:outline-none disabled:opacity-50"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </DialogClose>
        </DialogHeader>

        <div className="grid min-w-0 grid-cols-1 gap-5 px-4 py-5 sm:px-6 sm:py-6 xl:grid-cols-[19rem_minmax(0,1fr)] xl:px-8">
          <section
            className="min-w-0 rounded-2xl border border-[#dcebe3] bg-[#f3faf7] p-5"
            aria-labelledby="patient-details-title"
          >
            <h2
              id="patient-details-title"
              className="text-lg font-bold text-[#075e46]"
            >
              Paciente
            </h2>
            <div className="mt-5 flex items-center gap-3">
              <div className="grid size-14 shrink-0 place-items-center rounded-full bg-[#d9f6e5] text-lg font-bold text-[#087b52]">
                {patientInitials}
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-lg font-bold text-[#17202a]">
                  {appointment.patient.name}
                </h3>
                <p className="break-words text-sm text-[#53657a]">
                  ID: {appointment.patient.id}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-2 border-t border-[#dcebe3] pt-4">
              <DisabledFeature icon={Phone} label="Telefone" />
              <DisabledFeature icon={Mail} label="E-mail" />
              <DisabledFeature icon={Cake} label="Data de nascimento" />
            </div>

            <Button
              type="button"
              variant="outline"
              disabled
              className="mt-4 w-full justify-between border-[#cfe5d9] bg-white text-[#075e46]"
              title="Em breve"
            >
              <span className="flex min-w-0 items-center gap-2 truncate">
                <UserRound aria-hidden="true" className="size-4" />
                Ver cadastro completo
              </span>
              <span className="text-xs">Em breve</span>
            </Button>
          </section>

          <section
            className="min-w-0"
            aria-labelledby="appointment-details-title"
          >
            <div className="rounded-2xl border border-[#dcebe3] bg-[#f7fbf9] p-5">
              <h2
                id="appointment-details-title"
                className="text-lg font-bold text-[#075e46]"
              >
                Atendimento
              </h2>
              <dl className="mt-4 grid min-w-0 grid-cols-1 gap-4 rounded-xl border border-[#e0e9e4] bg-white p-4 sm:grid-cols-2 xl:grid-cols-4">
                <DetailItem
                  icon={CalendarDays}
                  label="Data"
                  value={appointmentDateLabel(appointment.appointmentDate)}
                />
                <DetailItem
                  icon={Clock3}
                  label="Horário"
                  value={`${appointment.hours.slice(0, 5)} (${durationLabel(appointment.durationMinutes)})`}
                />
                <DetailItem
                  icon={FileText}
                  label="Serviço"
                  value={appointment.service.name}
                />
                <DetailItem icon={MapPin} label="Sala" value="Em breve" />
              </dl>
            </div>

            <div className="mt-5">
              <h2 className="text-base font-bold text-[#075e46]">
                Status do atendimento
              </h2>
              <div
                className="mt-3 flex flex-wrap gap-2"
                role="group"
                aria-label="Status do atendimento"
              >
                <span
                  className={cn(
                    'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold',
                    presentation.className,
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="size-3 rounded-full border-2 border-current"
                  />
                  {presentation.label}
                </span>
                {appointment.professional ? (
                  <span className="inline-flex items-center gap-2 rounded-lg border border-[#dcebe3] bg-white px-3 py-2 text-sm text-[#53657a]">
                    Profissional: {appointment.professional.name}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="mt-5 grid gap-2 border-t border-[#e0e9e4] pt-4">
              <DisabledFeature icon={FileText} label="Observações" />
              <DisabledFeature icon={MapPin} label="Sala de atendimento" />
            </div>

            {errorMessage ? (
              <div
                className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                role="alert"
              >
                <CircleAlert
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0"
                />
                <span>{errorMessage}</span>
              </div>
            ) : null}
          </section>
        </div>

        <DialogFooter className="border-t border-[#e0e9e4] px-4 py-4 sm:px-6 xl:flex-row xl:items-center xl:justify-between xl:px-8">
          <div className="flex w-full flex-wrap gap-2 xl:w-auto">
            <Button
              type="button"
              variant="destructive"
              disabled={!canChangeStatus || isLoading}
              onClick={() => void changeStatus('CANCELADO')}
              title={
                !canChangeStatus
                  ? 'Disponível somente enquanto aguarda atendimento'
                  : undefined
              }
            >
              <Trash2 aria-hidden="true" className="size-4" />
              Cancelar agendamento
            </Button>
            <Button type="button" variant="outline" disabled title="Em breve">
              <Pencil aria-hidden="true" className="size-4" />
              Editar agendamento
              <span className="text-xs">Em breve</span>
            </Button>
          </div>
          <div className="flex w-full flex-wrap gap-2 xl:w-auto">
            <Button type="button" variant="outline" disabled title="Em breve">
              <Check aria-hidden="true" className="size-4" />
              Atendida
              <span className="text-xs">Em breve</span>
            </Button>
            <Button
              type="button"
              disabled={!canChangeStatus || isLoading}
              onClick={() => void changeStatus('ATENDENDO')}
              className="bg-[#087b52] text-white hover:bg-[#075e46]"
            >
              <ArrowRight aria-hidden="true" className="size-4" />
              {isLoading ? 'Salvando...' : 'Iniciar agendamento'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
