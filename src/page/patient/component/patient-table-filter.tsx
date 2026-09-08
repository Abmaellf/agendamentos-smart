import { Button } from '@/components/ui/button'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { Search } from 'lucide-react'
// import { useContext } from 'react'
import { PatientContext } from '@/context/PatientContextEXCLUIR'
// import { useContext } from 'react'
import { useContextSelector } from 'use-context-selector'

import type { PatientTableFilterFormValues } from '@/@types/components'

const patientTableFilterSchema: z.ZodType<
  PatientTableFilterFormValues,
  PatientTableFilterFormValues
> = z.object({
  name: z.string(),
})


export function PatientTableFilter() {

   const  fetchPatients  = useContextSelector(
          PatientContext,
          (context) => {
           return context.fetchPatients
      });

  const { register, handleSubmit } = useForm<PatientTableFilterFormValues>({
    resolver: zodResolver(patientTableFilterSchema),
  })

  async function handleSearchPatient(data : PatientTableFilterFormValues ) {
    // const { name } = data;
    await fetchPatients();
    console.log(data)
  }

  return (
    <>
      <form
        onSubmit={handleSubmit(handleSearchPatient)}
        className="flex items-center gap-2"
      >
        <span className="text-sm font-semibold"> Filtros: </span>
{/* 
        <input
          type="number"
          placeholder="ID do pedido"
          className="h-8 w-auto"
          {...register('id')}
        /> */}

        <input
          type="text"
          placeholder="Nome do cliente"
          className="h-8 w-[320px]"
          {...register('name')}
        />

        <Button type='submit' variant="secondary" size={'xs'}>
          <Search className="mr-2 h-4 w-4" />
          Filtrar resultados
        </Button>

        {/* <Select defaultValue="all">
          <SelectTrigger className="h-8 w-[180px]">
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all"> Todos Status</SelectItem>
            <SelectItem value="pending"> Pedente </SelectItem>
            <SelectItem value="canceled"> Cancelado </SelectItem>
            <SelectItem value="canceled"> Cancelado </SelectItem>
          </SelectContent>
        </Select>

       

        <Button type="button" variant="outline" size={'xs'}>
          <X className="mr-2 h-4 w-4" />
          Remover filtros
        </Button> */}
      </form>
    </>
  )
}
