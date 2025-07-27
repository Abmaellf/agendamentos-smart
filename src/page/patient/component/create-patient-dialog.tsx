import { Button } from '@/components/ui/button'
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Input } from '@/components/ui/input'
// import { api } from '@/lib/axios'
import { SchedulingContext } from '@/context/SchedulingContext'
// import { useContext } from 'react'
import { useContextSelector } from 'use-context-selector'

const createPatientSchema = z.object({
  name: z.string(),
  // dataNascimento: z.string(),
})

type CreatePatientSchema = z.infer<typeof createPatientSchema>

export default function CreatePatientDialog() {

  // const  {CreatePatients }  = useContext(SchedulingContext);

    const  CreatePatients  = useContextSelector(
			SchedulingContext, 
			(context) => {
			 return context.CreatePatients
		    });
	
  
  const { register, handleSubmit, reset } = useForm<CreatePatientSchema>({
    resolver: zodResolver(createPatientSchema),
  })

  async function handleCreatePatient(data: CreatePatientSchema ) {
    const { name } = data;

     await CreatePatients({
      name
     })
     reset()
  }
  
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle> Novo Paciente</DialogTitle>

        <DialogDescription>
          {' '}
          Criar um novo paciente no sistema{' '}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(handleCreatePatient)}>
        <div className="grid grid-cols-4 items-center text-right gap-3">
          <Label htmlFor="name"> Paciente </Label>
          <Input className="col-span-3" id="name" {...register('name')} />
        </div>

        {/* <div className="grid grid-cols-4 items-center text-right gap-3">
          <Label htmlFor="name"> Data Nascimento </Label>
          <Input
            type="date"
            className="col-span-3"
            id="name"
            {...register('dataNascimento')}
          />
        </div> */}

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant={'outline'}>
              Cancelar
            </Button>
          </DialogClose>
          <Button type="submit"> Salvar </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
