import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog'
import { Label } from '@/components/ui/label'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useContextSelector } from 'use-context-selector'
import { SchedulingContext } from '@/context/SchedulingContext'
import { toast } from 'sonner'
import { PlusCircle } from 'lucide-react'
 
const createPatientSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
})

type CreatePatientSchema = z.infer<typeof createPatientSchema>

export function AddPatientModal() {

   const  CreatePatients  = useContextSelector(
        SchedulingContext, 
        (context) => {
         return context.CreatePatients
    });
    
const {
    register,
    handleSubmit,
    // reset,
    formState: { errors },
  } = useForm<CreatePatientSchema>({
    resolver: zodResolver(createPatientSchema),
  })

  async function handlePatient(data: CreatePatientSchema) {
    const { name } = data;
    try{
         await CreatePatients({
          name
        }) 
        toast.success('Paciente cadastrado com sucesso', {
          position:'bottom-center',
          duration:500000
        })
    } catch {
         toast.error('Dados incorretos')
    }
  }

  return (
   <div className="flex justify-normal ">

      <Dialog>
        <DialogTrigger >
          <Button  variant={'ghost'}>
             <PlusCircle className='m-0' />
            Novo Paciente
          </Button>
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            
            <DialogTitle>
             
              Novo Paciente
            </DialogTitle>
            <DialogDescription>
              Criar um novo paciente no sistema
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(handlePatient)} className="space-y-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Paciente
              </Label>
              <input
                type='text'
                id="name"
                className=" focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] col-span-3 file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                {...register('name')}
              />
            </div>
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
