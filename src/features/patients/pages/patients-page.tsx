import { AlertCircle, UsersRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import type { PatientFilters, PatientListItem } from '@/@types/patient'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { DataTableCard } from '@/components/data-table-shell'
import { PageContainer, PageHeader } from '@/components/page-shell'
import { useGetServicesQuery } from '@/features/appointments/api/appointments'

import { useGetPatientPageQuery } from '../api/patients'
import { Pagination } from '../components/pagination'
import { PatientTableFilter } from '../components/patient-table-filter'
import { PatientTable } from '../components/patient-table'
import { PatientDetailModal } from '../components/patient-detail-modal'
import { PatientFormModal } from '../components/patient-form-modal'
import { patientErrorMessage } from '../model/patient-errors'

const PAGE_SIZE = 5
const emptyFilters: PatientFilters = { name: '' }

export function Patient() {
  const [pageIndex, setPageIndex] = useState(0)
  const [filters, setFilters] = useState<PatientFilters>(emptyFilters)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const detailReturnFocus = useRef<HTMLElement | null>(null)
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
  const selectedPatient =
    patients.find((patient) => patient.id === selectedId) ?? null

  useEffect(() => {
    if (selectedId && !patients.some((patient) => patient.id === selectedId)) {
      setSelectedId(null)
      setDetailOpen(false)
    }
  }, [patients, selectedId])

  function applyFilters(nextFilters: PatientFilters) {
    setFilters(nextFilters)
    setPageIndex(0)
    setSelectedId(null)
    setDetailOpen(false)
  }

  function clearFilters() {
    setFilters(emptyFilters)
    setPageIndex(0)
    setSelectedId(null)
    setDetailOpen(false)
  }

  function selectPatient(patient: PatientListItem, trigger: HTMLElement) {
    setSelectedId(patient.id)
    detailReturnFocus.current = trigger
    setDetailOpen(true)
  }

  function handleDetailOpenChange(open: boolean) {
    setDetailOpen(open)

    if (!open) {
      requestAnimationFrame(() => detailReturnFocus.current?.focus())
    }
  }

  return (
    <PageContainer contentClassName="max-w-[2048px]">
      <PageHeader
        title="Pacientes"
        description="Gerencie o cadastro, histórico e atendimentos dos seus pacientes."
        icon={<UsersRound className="size-7" aria-hidden="true" />}
        actions={<PatientFormModal />}
      />

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

        <DataTableCard
          ariaLabel="Lista de pacientes"
          footer={
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
          }
        >
          <PatientTable
            patients={patientsQuery.isError ? [] : patients}
            selectedId={selectedId}
            isLoading={patientsQuery.isLoading}
            isFetching={patientsQuery.isFetching}
            onSelect={selectPatient}
          />
        </DataTableCard>

        <PatientDetailModal
          open={detailOpen}
          patient={selectedPatient}
          onOpenChange={handleDetailOpenChange}
        />

        {patientsQuery.isFetching && !patientsQuery.isLoading ? (
          <p className="sr-only" role="status" aria-live="polite">
            Atualizando lista de pacientes...
          </p>
        ) : null}
    </PageContainer>
  )
}
