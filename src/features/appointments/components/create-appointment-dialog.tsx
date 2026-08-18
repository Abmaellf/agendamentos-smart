import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  cloneElement,
  type FormEvent,
  type ReactElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { toast } from 'sonner'

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
} from '@/components/ui/dialog'

import {
  createAppointment,
  getPatients,
  getProfessionals,
  getServices,
  getUnits,
} from '../api/appointments'
import { appointmentErrorMessage } from '../model/appointment-errors'
import {
  appointmentFormSchema,
  toCreateAppointmentInput,
} from '../model/appointment-form-schema'
import type { AppointmentSession } from '../model/appointment'

interface CreateAppointmentDialogProps {
  session: AppointmentSession
  defaultDate?: string
  triggerLabel?: string
  triggerAriaLabel?: string
}

interface FormState {
  patientId: string
  unitId: string
  serviceId: string
  professionalId: string
  date: string
  time: string
  durationMinutes: number | string
  price: string
}

const emptyForm = (defaultDate = ''): FormState => ({
  patientId: '',
  unitId: '',
  serviceId: '',
  professionalId: '',
  date: defaultDate,
  time: '',
  durationMinutes: '',
  price: '',
})

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactElement<{ id?: string; 'aria-describedby'?: string }>
}) {
  const id = children.props.id ?? label.toLowerCase().replace(/\W+/g, '-')
  const errorId = `${id}-error`

  return (
    <div className="grid gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {cloneElement(children, {
        id,
        'aria-describedby': error ? errorId : undefined,
      })}
      {error ? (
        <p id={errorId} className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  )
}

const controlClassName =
  'h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-black disabled:bg-gray-100'

export function CreateAppointmentDialog({
  session,
  defaultDate,
  triggerLabel = 'Novo agendamento',
  triggerAriaLabel,
}: CreateAppointmentDialogProps) {
  const queryClient = useQueryClient()
  const patientRef = useRef<HTMLSelectElement>(null)
  const submittingRef = useRef(false)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(() => emptyForm(defaultDate))
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [feedback, setFeedback] = useState('')
  const [durationOverridden, setDurationOverridden] = useState(false)
  const [priceOverridden, setPriceOverridden] = useState(false)

  const patientsQuery = useQuery({
    queryKey: ['appointment-catalog', 'patients'],
    queryFn: getPatients,
    enabled: open,
  })
  const unitsQuery = useQuery({
    queryKey: ['appointment-catalog', 'units'],
    queryFn: getUnits,
    enabled: open,
  })
  const servicesQuery = useQuery({
    queryKey: ['appointment-catalog', 'services'],
    queryFn: getServices,
    enabled: open,
  })
  const professionalsQuery = useQuery({
    queryKey: ['appointment-catalog', 'professionals', form.serviceId],
    queryFn: () => getProfessionals(form.serviceId),
    enabled: open && Boolean(form.serviceId),
  })

  const mutation = useMutation({ mutationFn: createAppointment })

  const requiredQueries = [patientsQuery, unitsQuery, servicesQuery]
  const isCatalogLoading = requiredQueries.some((query) => query.isPending)
  const catalogError = requiredQueries.find((query) => query.isError)
  const hasEmptyCatalog = requiredQueries.some(
    (query) => query.isSuccess && query.data.length === 0,
  )

  const selectedUnit = useMemo(
    () => unitsQuery.data?.find((unit) => unit.id === form.unitId),
    [form.unitId, unitsQuery.data],
  )

  useEffect(() => {
    if (!open) {
      submittingRef.current = false
    }
  }, [open])

  function changeService(serviceId: string) {
    const service = servicesQuery.data?.find((item) => item.id === serviceId)
    setForm((current) => ({
      ...current,
      serviceId,
      professionalId: '',
      durationMinutes:
        service && (session.user.role === 'BASIC' || !durationOverridden)
          ? service.durationMinutes
          : current.durationMinutes,
      price:
        service && (session.user.role === 'BASIC' || !priceOverridden)
          ? service.price
          : current.price,
    }))
  }

  function retryCatalogs() {
    void patientsQuery.refetch()
    void unitsQuery.refetch()
    void servicesQuery.refetch()
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submittingRef.current) return

    setFeedback('')
    const parsed = appointmentFormSchema.safeParse({
      ...form,
      professionalId: form.professionalId || null,
    })

    if (!parsed.success) {
      const flattened = parsed.error.flatten().fieldErrors
      const nextErrors = Object.fromEntries(
        Object.entries(flattened).map(([field, messages]) => [
          field,
          messages?.[0] ?? 'Revise este campo.',
        ]),
      )
      setFieldErrors(nextErrors)
      setFeedback('Revise os campos indicados antes de continuar.')
      patientRef.current?.focus()
      return
    }

    const timeZone = selectedUnit?.timeZone ?? 'America/Cuiaba'
    setFieldErrors({})
    submittingRef.current = true
    try {
      const input = toCreateAppointmentInput(parsed.data, {
        role: session.user.role,
        timeZone,
      })
      await mutation.mutateAsync(input)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['appointments'] }),
        queryClient.invalidateQueries({ queryKey: ['service-capacity'] }),
      ])
      toast.success('Agendamento criado com sucesso.')
      setOpen(false)
      setForm(emptyForm(defaultDate))
      setDurationOverridden(false)
      setPriceOverridden(false)
    } catch (error) {
      setFeedback(appointmentErrorMessage(error))
    } finally {
      submittingRef.current = false
    }
  }

  const roleCanOverride = session.user.role === 'ADMIN'
  const createDisabled =
    isCatalogLoading ||
    Boolean(catalogError) ||
    hasEmptyCatalog ||
    mutation.isPending

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" aria-label={triggerAriaLabel}>
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo agendamento</DialogTitle>
          <DialogDescription>
            Selecione o paciente e os dados do atendimento.
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={submit} className="grid gap-4">
          {isCatalogLoading ? <p role="status">Carregando opções...</p> : null}

          {catalogError ? (
            <div role="alert" className="rounded-md bg-red-50 p-3 text-red-800">
              <p>
                Não foi possível carregar{' '}
                {patientsQuery.isError
                  ? 'os pacientes.'
                  : unitsQuery.isError
                    ? 'as unidades.'
                    : 'os serviços.'}
              </p>
              <Button type="button" variant="outline" onClick={retryCatalogs}>
                Tentar novamente
              </Button>
            </div>
          ) : null}

          {!catalogError && feedback ? (
            <p
              role="alert"
              aria-live="assertive"
              className="rounded-md bg-red-50 p-3 text-red-800"
            >
              {feedback}
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Paciente" error={fieldErrors.patientId}>
              <select
                ref={patientRef}
                className={controlClassName}
                value={form.patientId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    patientId: event.target.value,
                  }))
                }
              >
                <option value="">Selecione</option>
                {patientsQuery.data?.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Unidade" error={fieldErrors.unitId}>
              <select
                className={controlClassName}
                value={form.unitId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    unitId: event.target.value,
                  }))
                }
              >
                <option value="">Selecione</option>
                {unitsQuery.data?.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Serviço" error={fieldErrors.serviceId}>
              <select
                className={controlClassName}
                value={form.serviceId}
                onChange={(event) => changeService(event.target.value)}
              >
                <option value="">Selecione</option>
                {servicesQuery.data?.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Profissional (opcional)">
              <select
                className={controlClassName}
                value={form.professionalId}
                disabled={!form.serviceId || professionalsQuery.isPending}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    professionalId: event.target.value,
                  }))
                }
              >
                <option value="">Sem profissional</option>
                {professionalsQuery.data?.map((professional) => (
                  <option key={professional.id} value={professional.id}>
                    {professional.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Data" error={fieldErrors.date}>
              <input
                type="date"
                className={controlClassName}
                value={form.date}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    date: event.target.value,
                  }))
                }
              />
            </Field>

            <Field label="Horário" error={fieldErrors.time}>
              <input
                type="time"
                className={controlClassName}
                value={form.time}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    time: event.target.value,
                  }))
                }
              />
            </Field>

            <Field
              label="Duração (minutos)"
              error={fieldErrors.durationMinutes}
            >
              <input
                type="number"
                min={1}
                max={480}
                className={controlClassName}
                value={form.durationMinutes}
                readOnly={!roleCanOverride}
                onChange={(event) => {
                  setDurationOverridden(true)
                  setForm((current) => ({
                    ...current,
                    durationMinutes: event.target.value,
                  }))
                }}
              />
            </Field>

            <Field label="Preço" error={fieldErrors.price}>
              <input
                type="text"
                inputMode="decimal"
                className={controlClassName}
                value={form.price}
                readOnly={!roleCanOverride}
                onChange={(event) => {
                  setPriceOverridden(true)
                  setForm((current) => ({
                    ...current,
                    price: event.target.value,
                  }))
                }}
              />
            </Field>
          </div>

          {patientsQuery.isSuccess && patientsQuery.data.length === 0 ? (
            <p>Nenhum paciente disponível.</p>
          ) : null}
          {unitsQuery.isSuccess && unitsQuery.data.length === 0 ? (
            <p>Nenhuma unidade disponível.</p>
          ) : null}
          {servicesQuery.isSuccess && servicesQuery.data.length === 0 ? (
            <p>Nenhum serviço disponível.</p>
          ) : null}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={createDisabled}>
              {mutation.isPending ? 'Criando...' : 'Criar agendamento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
