import { X } from 'lucide-react'

import type { PatientListItem } from '@/@types/patient'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { PatientStatusBadge } from './patients-status-badge'

interface PatientDetailModalProps {
  open: boolean
  patient: PatientListItem | null
  onOpenChange: (open: boolean) => void
}

function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('pt-BR').format(date)
}

export function PatientDetailModal({
  open,
  patient,
  onOpenChange,
}: PatientDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[90vh] overflow-y-auto sm:max-w-2xl xl:max-w-[560px]"
      >
        <DialogHeader className="pr-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogDescription>Detalhe do paciente</DialogDescription>
              <DialogTitle className="mt-1">
                {patient?.name ?? 'Paciente selecionado'}
              </DialogTitle>
            </div>
            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Fechar detalhe do paciente"
              >
                <X aria-hidden="true" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        {patient ? (
          <div className="space-y-5">
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Código</dt>
                <dd className="font-medium">
                  {String(patient.code).padStart(4, '0')}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <PatientStatusBadge status={patient.status} />
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Data de cadastro</dt>
                <dd className="font-medium">{formatDate(patient.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Serviço principal</dt>
                <dd className="font-medium">
                  {patient.principalService?.name ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Unidades vinculadas</dt>
                <dd className="font-medium">
                  {patient.unitIds.length
                    ? `${patient.unitIds.length} unidade(s)`
                    : '—'}
                </dd>
              </div>
            </dl>

            <div className="flex justify-end border-t pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Fechar
                </Button>
              </DialogClose>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
