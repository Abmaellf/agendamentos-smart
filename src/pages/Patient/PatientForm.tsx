import { ChevronLeft, ChevronRight, RefreshCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { PatientListItemResponse } from '@/type/patient'

type PatientFormProps = {
  patients: PatientListItemResponse[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  canPreviousPage: boolean
  canNextPage: boolean
  onPreviousPage: () => void
  onNextPage: () => void
  onRetry: () => void
}

export function PatientForm({
  patients,
  page,
  size,
  totalElements,
  totalPages,
  isLoading,
  isFetching,
  isError,
  canPreviousPage,
  canNextPage,
  onPreviousPage,
  onNextPage,
  onRetry,
}: PatientFormProps) {
  const hasPatients = patients.length > 0
  const currentPageLabel = totalPages > 0 ? `${page + 1} de ${totalPages}` : '-'

  return (
    <div className="p-2 pt-20">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
        <span className="text-muted-foreground text-sm">
          {isFetching && !isLoading ? 'Atualizando lista...' : `${size} por pagina`}
        </span>
      </div>

      <div className="mt-6 rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[280px]">Codigo</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead className="w-[280px]">Clinica</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  Carregando pacientes...
                </TableCell>
              </TableRow>
            )}

            {isError && (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <span>Nao foi possivel carregar os pacientes.</span>
                    <Button type="button" variant="outline" size="xs" onClick={onRetry}>
                      <RefreshCcw className="h-3 w-3" />
                      Tentar novamente
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!isLoading && !isError && !hasPatients && (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  Nenhum paciente encontrado.
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              !isError &&
              patients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-mono text-xs">{patient.id}</TableCell>
                  <TableCell className="font-medium">{patient.name}</TableCell>
                  <TableCell className="font-mono text-xs">{patient.clinicId}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        <div className="flex flex-col gap-3 border-t p-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-muted-foreground text-sm">
            Total de {totalElements} paciente(s)
          </span>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Pagina {currentPageLabel}</span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={!canPreviousPage}
                onClick={onPreviousPage}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Pagina anterior</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={!canNextPage}
                onClick={onNextPage}
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Proxima pagina</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
