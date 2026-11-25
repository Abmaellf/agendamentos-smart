import { X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  item: ServicePackage | null
  isLoading?: boolean
  isError?: boolean
  statusUpdating?: boolean
  onClose: () => void
  onEdit: (item: ServicePackage, trigger: HTMLElement) => void
  onToggleStatus: (item: ServicePackage) => void
}

export function PackageDetailPanel({
  item,
  isLoading = false,
  isError = false,
  statusUpdating = false,
  onClose,
  onEdit,
  onToggleStatus,
}: PackageDetailPanelProps) {
  return (
    <aside
      aria-label="Detalhe do pacote"
      className="rounded-xl border bg-white p-5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Detalhe
          </p>
          <h2 className="mt-1 text-xl font-semibold">
            {item?.name ?? 'Pacote selecionado'}
          </h2>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Fechar detalhe do pacote"
          onClick={onClose}
        >
          <X aria-hidden="true" />
        </Button>
      </div>

      {isLoading ? (
        <div className="mt-6 space-y-3" role="status">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : null}

      {isError ? (
        <p className="mt-6 text-sm text-destructive" role="alert">
          Não foi possível carregar o detalhe deste pacote.
        </p>
      ) : null}

      {!isLoading && !isError && item ? (
        <div className="mt-6 space-y-5">
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
    </aside>
  )
}
