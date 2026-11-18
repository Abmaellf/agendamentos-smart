import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle, PlusCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import type { CreatePatientFormValues } from '@/@types/patient'
import { FormField } from '@/components/form-field'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  useGetAppointmentSessionQuery,
  useGetUnitsQuery,
} from '@/features/appointments/api/appointments'

import { useRegisterPatientMutation } from '../api/patients'
import { patientErrorMessage } from '../model/patient-errors'

const createPatientSchema: z.ZodType<
  CreatePatientFormValues,
  CreatePatientFormValues
> = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório'),
  unitIds: z
    .array(z.string().min(1))
    .min(1, 'Selecione pelo menos uma unidade'),
})

const emptyForm: CreatePatientFormValues = {
  name: '',
  unitIds: [],
}

export function AddPatientModal() {
  const [open, setOpen] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const sessionQuery = useGetAppointmentSessionQuery(undefined, {
    skip: !open,
  })
  const unitsQuery = useGetUnitsQuery(undefined, { skip: !open })
  const [registerPatient, registerPatientState] = useRegisterPatientMutation()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreatePatientFormValues>({
    resolver: zodResolver(createPatientSchema),
    defaultValues: emptyForm,
  })

  const session = sessionQuery.data
  const units = unitsQuery.data ?? []
  const selectedUnitIds = watch('unitIds')
  const isBasic = session?.user.role === 'BASIC'
  const activeUnit = units.find((unit) => unit.id === session?.activeUnitId)
  const dependenciesLoading = sessionQuery.isLoading || unitsQuery.isLoading
  const dependenciesFailed = sessionQuery.isError || unitsQuery.isError

  useEffect(() => {
    if (!open || !isBasic) return

    setValue('unitIds', activeUnit ? [activeUnit.id] : [], {
      shouldValidate: true,
    })
  }, [activeUnit, isBasic, open, setValue])

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    setApiError(null)

    if (!nextOpen) {
      reset(emptyForm)
    }
  }

  function toggleAdminUnit(unitId: string, checked: boolean) {
    const nextUnitIds = checked
      ? [...new Set([...selectedUnitIds, unitId])]
      : selectedUnitIds.filter((id) => id !== unitId)

    setValue('unitIds', nextUnitIds, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  async function handlePatient(data: CreatePatientFormValues) {
    setApiError(null)

    const resolvedUnitIds = isBasic
      ? activeUnit
        ? [activeUnit.id]
        : []
      : data.unitIds

    if (resolvedUnitIds.length === 0) {
      setApiError('Nenhuma unidade autorizada está disponível para o cadastro.')
      return
    }

    try {
      await registerPatient({
        name: data.name.trim(),
        unitIds: resolvedUnitIds,
      }).unwrap()

      toast.success('Paciente cadastrado com sucesso', {
        position: 'bottom-center',
      })
      handleOpenChange(false)
    } catch (error) {
      const message = patientErrorMessage(error, 'create')
      setApiError(message)
      toast.error(message, { position: 'bottom-center' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 text-white hover:bg-emerald-700">
          <PlusCircle aria-hidden="true" />
          Novo Paciente
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Paciente</DialogTitle>
          <DialogDescription>
            Cadastre o paciente e vincule-o às unidades autorizadas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handlePatient)} className="space-y-5">
          <FormField label="Paciente" error={errors.name?.message}>
            <Input
              type="text"
              placeholder="Nome completo"
              autoComplete="name"
              aria-invalid={Boolean(errors.name)}
              {...register('name')}
            />
          </FormField>

          <fieldset className="space-y-2" disabled={dependenciesLoading}>
            <legend className="text-sm font-medium">Unidades</legend>

            {dependenciesLoading ? (
              <p role="status" className="text-muted-foreground text-sm">
                Carregando unidades autorizadas...
              </p>
            ) : null}

            {isBasic && activeUnit ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                <p className="font-medium text-emerald-900">
                  {activeUnit.name}
                </p>
                <p className="text-sm text-emerald-700">
                  Unidade ativa definida pela sua sessão.
                </p>
              </div>
            ) : null}

            {isBasic && !dependenciesLoading && !activeUnit ? (
              <Alert variant="destructive">
                <AlertDescription>
                  A unidade ativa da sessão não está disponível no catálogo.
                </AlertDescription>
              </Alert>
            ) : null}

            {session?.user.role === 'ADMIN' ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {units.map((unit) => (
                  <label
                    key={unit.id}
                    className="flex cursor-pointer items-center gap-3 rounded-md border p-3 hover:bg-emerald-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUnitIds.includes(unit.id)}
                      onChange={(event) =>
                        toggleAdminUnit(unit.id, event.target.checked)
                      }
                    />
                    <span className="text-sm font-medium">{unit.name}</span>
                  </label>
                ))}
              </div>
            ) : null}

            {session?.user.role === 'ADMIN' && units.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nenhuma unidade autorizada foi encontrada.
              </p>
            ) : null}

            {errors.unitIds?.message ? (
              <p className="text-sm text-red-700">{errors.unitIds.message}</p>
            ) : null}
          </fieldset>

          {dependenciesFailed ? (
            <Alert variant="destructive">
              <AlertDescription>
                Não foi possível carregar sua sessão e suas unidades.
              </AlertDescription>
            </Alert>
          ) : null}

          {apiError ? (
            <Alert variant="destructive">
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                dependenciesLoading ||
                dependenciesFailed ||
                registerPatientState.isLoading ||
                (isBasic && !activeUnit)
              }
            >
              {registerPatientState.isLoading ? (
                <LoaderCircle className="animate-spin" aria-hidden="true" />
              ) : null}
              {registerPatientState.isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
