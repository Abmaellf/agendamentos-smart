import type { PatientTableProps } from '@/@types/patient'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

import PatientTableRows from './patient-table-rows'

function LoadingRows() {
  return Array.from({ length: 5 }, (_, index) => (
    <TableRow key={index} aria-hidden="true">
      <TableCell colSpan={7} className="p-3">
        <Skeleton className="h-10 w-full" />
      </TableCell>
    </TableRow>
  ))
}

export function PatientTable({
  patients,
  selectedId = null,
  isLoading = false,
  isFetching = false,
  onSelect,
}: PatientTableProps) {
  return (
    <div className="relative overflow-x-auto" aria-busy={isFetching}>
      <Table>
        <TableHeader className="bg-emerald-700 text-white">
          <TableRow className="hover:bg-emerald-700">
            <TableHead className="w-[64px] text-white">
              <span className="sr-only">Detalhes</span>
            </TableHead>
            <TableHead className="w-[110px] text-white">Código</TableHead>
            <TableHead className="min-w-[230px] text-white">Paciente</TableHead>
            <TableHead className="min-w-[190px] text-white">
              Serviço principal
            </TableHead>
            <TableHead className="min-w-[160px] text-white">Status</TableHead>
            <TableHead className="min-w-[170px] text-white">
              Data de cadastro
            </TableHead>
            <TableHead className="min-w-[140px] text-white">Ações</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading ? <LoadingRows /> : null}

          {!isLoading && patients.length > 0
            ? patients.map((patient) => (
                <PatientTableRows
                  patient={patient}
                  selected={patient.id === selectedId}
                  onSelect={onSelect}
                  key={patient.id}
                />
              ))
            : null}

          {!isLoading && patients.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-40 text-center">
                <p className="font-semibold">Nenhum paciente encontrado</p>
                <p className="text-muted-foreground text-sm">
                  Ajuste os filtros ou cadastre um novo paciente.
                </p>
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  )
}
