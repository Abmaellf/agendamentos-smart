import { AlertCircle, UsersRound } from 'lucide-react'
import { useState } from 'react'

import type { PatientFilters } from '@/@types/patient'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import { useGetServicesQuery } from '@/features/appointments/api/appointments'

import { useGetPatientPageQuery } from '../api/patients'
import { AddPatientModal } from '../components/add-patient-modal'
import { Pagination } from '../components/pagination'
import { PatientTableFilter } from '../components/patient-table-filter'
import PatientTableRows from '../components/patient-table-rows'
import { patientErrorMessage } from '../model/patient-errors'

const PAGE_SIZE = 5
const emptyFilters: PatientFilters = { name: '' }

function PatientTableLoading() {
  return Array.from({ length: PAGE_SIZE }, (_, index) => (
    <TableRow key={index} aria-hidden="true">
      <TableCell colSpan={7} className="p-3">
        <Skeleton className="h-10 w-full" />
      </TableCell>
    </TableRow>
  ))
}

export function Patient() {
  const [pageIndex, setPageIndex] = useState(0)
  const [filters, setFilters] = useState<PatientFilters>(emptyFilters)
  const patientsQuery = useGetPatientPageQuery({
    page: pageIndex,
    size: PAGE_SIZE,
    name: filters.name || undefined,
    status: filters.status,
    serviceId: filters.serviceId,
  })
  const servicesQuery = useGetServicesQuery()

  const response = patientsQuery.data
  const patients = response?.content ?? []
  const totalPages = response?.totalPages ?? 0
  const totalCount = response?.totalElements ?? 0
  const isLast = response?.last ?? true

  function applyFilters(nextFilters: PatientFilters) {
    setFilters(nextFilters)
    setPageIndex(0)
  }

  function clearFilters() {
    setFilters(emptyFilters)
    setPageIndex(0)
  }

  return (
    <main className="min-h-full bg-slate-50/70 px-4 pt-20 pb-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-[1500px] space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex size-14 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <UsersRound className="size-7" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
              <p className="text-muted-foreground">
                Gerencie o cadastro, histórico e atendimentos dos seus
                pacientes.
              </p>
            </div>
          </div>

          <AddPatientModal />
        </header>

        <PatientTableFilter
          value={filters}
          services={servicesQuery.data ?? []}
          servicesLoading={servicesQuery.isLoading}
          disabled={patientsQuery.isFetching}
          onApply={applyFilters}
          onClear={clearFilters}
        />

        {servicesQuery.isError ? (
          <p className="text-sm text-amber-800" role="status">
            O catálogo de serviços não pôde ser carregado; o filtro de serviço
            está temporariamente indisponível.
          </p>
        ) : null}

        {patientsQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle aria-hidden="true" />
            <AlertTitle>Falha ao carregar pacientes</AlertTitle>
            <AlertDescription>
              <p>{patientErrorMessage(patientsQuery.error, 'list')}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => patientsQuery.refetch()}
              >
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <Table>
            <TableHeader className="bg-emerald-700 text-white">
              <TableRow className="hover:bg-emerald-700">
                <TableHead className="w-[64px] text-white">
                  <span className="sr-only">Detalhes</span>
                </TableHead>
                <TableHead className="w-[110px] text-white">Código</TableHead>
                <TableHead className="min-w-[230px] text-white">
                  Paciente
                </TableHead>
                <TableHead className="min-w-[190px] text-white">
                  Serviço principal
                </TableHead>
                <TableHead className="min-w-[160px] text-white">
                  Status
                </TableHead>
                <TableHead className="min-w-[170px] text-white">
                  Data de cadastro
                </TableHead>
                <TableHead className="min-w-[250px] text-white">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {patientsQuery.isLoading ? <PatientTableLoading /> : null}

              {!patientsQuery.isLoading && !patientsQuery.isError
                ? patients.map((patient) => (
                    <PatientTableRows patient={patient} key={patient.id} />
                  ))
                : null}

              {!patientsQuery.isLoading &&
              !patientsQuery.isError &&
              patients.length === 0 ? (
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

          <Pagination
            pageIndex={response?.page ?? pageIndex}
            totalPages={totalPages}
            totalCount={totalCount}
            isLast={isLast}
            onFirst={() => setPageIndex(0)}
            onPrevious={() =>
              setPageIndex((current) => Math.max(current - 1, 0))
            }
            onNext={() =>
              setPageIndex((current) =>
                Math.min(current + 1, Math.max(totalPages - 1, 0)),
              )
            }
            onLast={() => setPageIndex(Math.max(totalPages - 1, 0))}
          />
        </div>

        {patientsQuery.isFetching && !patientsQuery.isLoading ? (
          <p className="sr-only" role="status" aria-live="polite">
            Atualizando lista de pacientes...
          </p>
        ) : null}
      </section>
    </main>
  )
}
