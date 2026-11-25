import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'

import { Button } from '@/components/ui/button'

interface PackagePaginationProps {
  page: number
  totalPages: number
  totalElements: number
  last: boolean
  disabled?: boolean
  onPageChange: (page: number) => void
}

export function PackagePagination({
  page,
  totalPages,
  totalElements,
  last,
  disabled = false,
  onPageChange,
}: PackagePaginationProps) {
  const normalizedTotalPages = Math.max(totalPages, 1)
  const isFirst = page <= 0
  const isLast = last || page >= normalizedTotalPages - 1

  return (
    <div className="flex flex-col gap-4 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-muted-foreground text-sm">
        Total de {totalElements} pacote(s)
      </span>
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">
          Página {Math.min(page + 1, normalizedTotalPages)} de{' '}
          {normalizedTotalPages}
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Primeira página"
            disabled={disabled || isFirst}
            onClick={() => onPageChange(0)}
          >
            <ChevronsLeft aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Página anterior"
            disabled={disabled || isFirst}
            onClick={() => onPageChange(Math.max(page - 1, 0))}
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Próxima página"
            disabled={disabled || isLast}
            onClick={() => onPageChange(Math.min(page + 1, normalizedTotalPages - 1))}
          >
            <ChevronRight aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Última página"
            disabled={disabled || isLast}
            onClick={() => onPageChange(Math.max(normalizedTotalPages - 1, 0))}
          >
            <ChevronsRight aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  )
}
