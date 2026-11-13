import { Button } from '@/components/ui/button'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { Search } from 'lucide-react'
import { PatientContext } from '../model/patient-context'
import { useContextSelector } from 'use-context-selector'

import type { PatientTableFilterFormValues } from '@/@types/patient'

const patientTableFilterSchema: z.ZodType<
  PatientTableFilterFormValues,
  PatientTableFilterFormValues
> = z.object({
  name: z.string(),
})

export function PatientTableFilter() {
  const fetchPatients = useContextSelector(
    PatientContext,
    (context) => context.fetchPatients,
  )

  const { register, handleSubmit } = useForm<PatientTableFilterFormValues>({
    resolver: zodResolver(patientTableFilterSchema),
  })

  async function handleSearchPatient(data: PatientTableFilterFormValues) {
    await fetchPatients()
    console.log(data)
  }

  return (
    <form
      onSubmit={handleSubmit(handleSearchPatient)}
      className="flex items-center gap-2"
    >
      <span className="text-sm font-semibold">Filtros:</span>
      <input
        type="text"
        placeholder="Nome do cliente"
        className="h-8 w-[320px]"
        {...register('name')}
      />

      <Button type="submit" variant="secondary" size={'xs'}>
        <Search className="mr-2 h-4 w-4" />
        Filtrar resultados
      </Button>
    </form>
  )
}
