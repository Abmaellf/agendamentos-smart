import type { PaginationProps } from '@/@types/patient'
import { Button } from '@/components/ui/button'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'

export function Pagination({
  pageIndex,
  totalPages,
  totalCount,
  isLast,
  onFirst,
  onPrevious,
  onNext,
  onLast,
}: PaginationProps) {
  const normalizedTotalPages = Math.max(totalPages, 1)
  const isFirst = pageIndex <= 0

  return (
    <div className="flex flex-col gap-4 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-muted-foreground text-sm">
        Total de {totalCount} item(s)
      </span>

      <div className="flex items-center gap-4">
        <div className="text-sm font-medium">
          Página {Math.min(pageIndex + 1, normalizedTotalPages)} de{' '}
          {normalizedTotalPages}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onFirst}
            disabled={isFirst}
            aria-label="Primeira página"
          >
            <ChevronsLeft aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onPrevious}
            disabled={isFirst}
            aria-label="Página anterior"
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onNext}
            disabled={isLast}
            aria-label="Próxima página"
          >
            <ChevronRight aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onLast}
            disabled={isLast}
            aria-label="Última página"
          >
            <ChevronsRight aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  )
}
