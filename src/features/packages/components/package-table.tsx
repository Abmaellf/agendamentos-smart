import type { KeyboardEvent } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import type { ServicePackage } from '../api/packages'

interface PackageTableProps {
  items: ServicePackage[]
  selectedId: string | null
  isLoading?: boolean
  isFetching?: boolean
  statusUpdating?: boolean
  onSelect: (item: ServicePackage) => void
  onEdit: (item: ServicePackage, trigger: HTMLElement) => void
  onToggleStatus: (item: ServicePackage) => void
}

function LoadingRows() {
  return Array.from({ length: 5 }, (_, index) => (
    <TableRow key={index} aria-hidden="true">
      <TableCell colSpan={8} className="p-3">
        <Skeleton className="h-9 w-full" />
      </TableCell>
    </TableRow>
  ))
}

export function PackageTable({
  items,
  selectedId,
  isLoading = false,
  isFetching = false,
  statusUpdating = false,
  onSelect,
  onEdit,
  onToggleStatus,
}: PackageTableProps) {
  function handleRowKeyDown(
    event: KeyboardEvent<HTMLTableRowElement>,
    item: ServicePackage,
  ) {
    if (event.target !== event.currentTarget) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect(item)
    }
  }

  return (
    <div className="relative overflow-x-auto">
      <Table>
        <TableHeader className="bg-emerald-700 text-white">
          <TableRow className="hover:bg-emerald-700">
            <TableHead className="min-w-[220px] text-white">Pacote</TableHead>
            <TableHead className="min-w-[170px] text-white">Serviço</TableHead>
            <TableHead className="min-w-[150px] text-white">Unidade</TableHead>
            <TableHead className="text-white">Sessões</TableHead>
            <TableHead className="text-white">Frequência</TableHead>
            <TableHead className="text-white">Valor</TableHead>
            <TableHead className="text-white">Situação</TableHead>
            <TableHead className="min-w-[190px] text-white">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? <LoadingRows /> : null}

          {!isLoading && items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-40 text-center">
                <p className="font-semibold">Nenhum pacote encontrado</p>
                <p className="text-muted-foreground text-sm">
                  Ajuste os filtros ou cadastre um novo pacote.
                </p>
              </TableCell>
            </TableRow>
          ) : null}

          {!isLoading
            ? items.map((item) => (
                <TableRow
                  key={item.id}
                  tabIndex={0}
                  aria-selected={selectedId === item.id}
                  data-state={selectedId === item.id ? 'selected' : undefined}
                  className="cursor-pointer"
                  onClick={() => onSelect(item)}
                  onKeyDown={(event) => handleRowKeyDown(event, item)}
                >
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.serviceName}</TableCell>
                  <TableCell>{item.unitName}</TableCell>
                  <TableCell>{item.totalSessions}</TableCell>
                  <TableCell>{item.weeklyFrequency} por semana</TableCell>
                  <TableCell>R$ {item.totalPrice}</TableCell>
                  <TableCell>
                    <Badge variant={item.active ? 'default' : 'outline'}>
                      {item.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={(event) => {
                          event.stopPropagation()
                          onSelect(item)
                        }}
                      >
                        Detalhes
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={(event) => {
                          event.stopPropagation()
                          onEdit(item, event.currentTarget)
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={statusUpdating}
                        onClick={(event) => {
                          event.stopPropagation()
                          onToggleStatus(item)
                        }}
                      >
                        {item.active ? 'Desativar' : 'Ativar'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            : null}
        </TableBody>
      </Table>
      {isFetching && !isLoading ? (
        <p className="sr-only" role="status" aria-live="polite">
          Atualizando lista de pacotes...
        </p>
      ) : null}
    </div>
  )
}
