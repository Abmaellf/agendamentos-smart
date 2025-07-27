import { Button } from '@/components/ui/button'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { Search } from 'lucide-react'
// import { useContext } from 'react'
import { SchedulingContext } from '@/context/SchedulingContext'
// import { useContext } from 'react'
import { useContextSelector } from 'use-context-selector'

const patientTableFilterSchema = z.object({
  name: z.string(),
})

type PatientTableFilterSchema = z.infer<typeof patientTableFilterSchema>


export function PatientTableFilter() {

  // const {  fetchPatients } = useContext(SchedulingContext);

   const  fetchPatients  = useContextSelector(
          SchedulingContext, 
          (context) => {
           return context.fetchPatients
      });

  const { register, handleSubmit } = useForm<PatientTableFilterSchema>({
    resolver: zodResolver(patientTableFilterSchema),
  })

  async function handleSearchPatient(data : PatientTableFilterSchema ) {
    const { name } = data;
    await fetchPatients(name);
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
