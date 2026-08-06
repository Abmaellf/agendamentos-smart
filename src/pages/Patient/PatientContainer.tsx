import { useState } from 'react'

import { useListPatientsQuery } from '@/features/patient/patient-api'

import { PatientForm } from './PatientForm'

const DEFAULT_PAGE_SIZE = 10

export function PatientContainer() {
  const [page, setPage] = useState(0)

  const { data, isError, isFetching, isLoading, refetch } =
    useListPatientsQuery({
      page,
      size: DEFAULT_PAGE_SIZE,
    })

  function handlePreviousPage() {
    setPage((currentPage) => Math.max(currentPage - 1, 0))
  }

  function handleNextPage() {
    if (!data?.last) {
      setPage((currentPage) => currentPage + 1)
    }
  }

  return (
    <PatientForm
      patients={data?.content ?? []}
      page={data?.page ?? page}
      size={data?.size ?? DEFAULT_PAGE_SIZE}
      totalElements={data?.totalElements ?? 0}
      totalPages={data?.totalPages ?? 0}
      isLoading={isLoading}
      isFetching={isFetching}
      isError={isError}
      canPreviousPage={page > 0}
      canNextPage={Boolean(data && !data.last)}
      onPreviousPage={handlePreviousPage}
      onNextPage={handleNextPage}
      onRetry={refetch}
    />
  )
}
