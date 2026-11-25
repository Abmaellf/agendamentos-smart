import { X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'

import type { ServicePackage } from '../api/packages'

const weekDayLabels: Record<ServicePackage['weekDays'][number], string> = {
  SUNDAY: 'Domingo',
  MONDAY: 'Segunda',
  TUESDAY: 'Terça',
  WEDNESDAY: 'Quarta',
  THURSDAY: 'Quinta',
  FRIDAY: 'Sexta',
  SATURDAY: 'Sábado',
}

interface PackageDetailPanelProps {
  open: boolean
  item: ServicePackage | null
  isLoading?: boolean
  isError?: boolean
  statusUpdating?: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (item: ServicePackage, trigger: HTMLElement) => void
  onToggleStatus: (item: ServicePackage) => void
}

export function PackageDetailPanel({
  open,
  item,
  isLoading = false,
  isError = false,
  statusUpdating = false,
  onOpenChange,
  onEdit,
  onToggleStatus,
}: PackageDetailPanelProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[90vh] overflow-y-auto sm:max-w-2xl xl:max-w-[560px]"
      >
        <DialogHeader className="pr-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogDescription>Detalhe do pacote</DialogDescription>
              <DialogTitle className="mt-1">
                {item?.name ?? 'Pacote selecionado'}
              </DialogTitle>
            </div>
            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Fechar detalhe do pacote"
              >
                <X aria-hidden="true" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="mt-2 space-y-3" role="status">
            <span className="sr-only">Carregando detalhe do pacote...</span>
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : null}

        {isError ? (
          <p className="mt-2 text-sm text-destructive" role="alert">
            Não foi possível carregar o detalhe deste pacote.
          </p>
        ) : null}

        {!isLoading && !isError && item ? (
          <div className="space-y-5">
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Serviço</dt>
                <dd className="font-medium">{item.serviceName}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Unidade</dt>
                <dd className="font-medium">{item.unitName}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Sessões</dt>
                <dd className="font-medium">{item.totalSessions}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Frequência semanal</dt>
                <dd className="font-medium">{item.weeklyFrequency} por semana</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Valor total</dt>
                <dd className="font-medium">R$ {item.totalPrice}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Situação</dt>
                <dd>
                  <Badge variant={item.active ? 'default' : 'outline'}>
                    {item.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </dd>
              </div>
            </dl>

            {item.description ? (
              <div>
                <p className="text-muted-foreground text-sm">Descrição</p>
                <p className="mt-1 text-sm">{item.description}</p>
              </div>
            ) : null}

            <div>
              <p className="text-muted-foreground text-sm">Dias configurados</p>
              <p className="mt-1 text-sm">
                {item.weekDays.map((day) => weekDayLabels[day]).join(', ')}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={(event) => onEdit(item, event.currentTarget)}
              >
                Editar pacote
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={statusUpdating}
                onClick={() => onToggleStatus(item)}
              >
                {item.active ? 'Desativar' : 'Ativar'}
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
