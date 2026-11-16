import { FormEvent, useEffect, useState } from 'react'
import { toast } from 'sonner'

import {
  useGetAppointmentSessionQuery,
  useGetServicesQuery,
  useGetUnitsQuery,
} from '@/features/appointments/api/appointments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  type PackageWeekDay,
  type ServicePackage,
  type ServicePackageFilters,
  useCreateServicePackageMutation,
  useGetServicePackageQuery,
  useGetServicePackagesQuery,
  useUpdateServicePackageMutation,
  useUpdateServicePackageStatusMutation,
} from '../api/packages'
import {
  packageFormSchema,
  packageWeekDays,
  toServicePackageInput,
  type PackageFormValues,
} from '../model/package-form-schema'

const weekDayLabels: Record<PackageWeekDay, string> = {
  SUNDAY: 'Domingo',
  MONDAY: 'Segunda',
  TUESDAY: 'Terça',
  WEDNESDAY: 'Quarta',
  THURSDAY: 'Quinta',
  FRIDAY: 'Sexta',
  SATURDAY: 'Sábado',
}

const emptyForm = (): PackageFormValues => ({
  name: '',
  description: '',
  unitId: '',
  serviceId: '',
  totalSessions: '10',
  totalPrice: '',
  weekDays: [],
})

function formFromPackage(item: ServicePackage): PackageFormValues {
  return {
    name: item.name,
    description: item.description ?? '',
    unitId: item.unitId,
    serviceId: item.serviceId,
    totalSessions: String(item.totalSessions),
    totalPrice: item.totalPrice,
    weekDays: item.weekDays,
  }
}

function messageFrom(error: unknown) {
  const data = (error as { data?: { message?: string } })?.data
  return (
    data?.message ??
    'Não foi possível salvar o pacote. Revise os dados e tente novamente.'
  )
}

export function PackagesPage() {
  const sessionQuery = useGetAppointmentSessionQuery()
  const session = sessionQuery.data
  const units = useGetUnitsQuery()
  const services = useGetServicesQuery()
  const isAdmin = session?.user.role === 'ADMIN'
  const [filters, setFilters] = useState<ServicePackageFilters>({})
  const [filterDraft, setFilterDraft] = useState<ServicePackageFilters>({})
  const packages = useGetServicePackagesQuery(filters, {
    skip: sessionQuery.isLoading || !isAdmin,
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const detailQuery = useGetServicePackageQuery(editingId ?? '', {
    skip: !editingId,
  })
  const [form, setForm] = useState<PackageFormValues>(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [createPackage, createState] = useCreateServicePackageMutation()
  const [updatePackage, updateState] = useUpdateServicePackageMutation()
  const [changeStatus, changeStatusState] =
    useUpdateServicePackageStatusMutation()
  const isEditing = Boolean(editingId)
  const isSaving = createState.isLoading || updateState.isLoading

  useEffect(() => {
    if (detailQuery.data) {
      setForm(formFromPackage(detailQuery.data))
      setFieldErrors({})
    }
  }, [detailQuery.data])

  function resetForm() {
    setEditingId(null)
    setForm(emptyForm())
    setFieldErrors({})
  }

  function toggleDay(day: PackageWeekDay) {
    setForm((current) => ({
      ...current,
      weekDays: current.weekDays.includes(day)
        ? current.weekDays.filter((value) => value !== day)
        : [...current.weekDays, day],
    }))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = packageFormSchema.safeParse(form)

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors
      setFieldErrors(
        Object.fromEntries(
          Object.entries(errors).map(([field, messages]) => [
            field,
            messages?.[0] ?? 'Revise este campo.',
          ]),
        ),
      )
      return
    }

    setFieldErrors({})
    try {
      const active = detailQuery.data?.active ?? true
      const data = toServicePackageInput(parsed.data, active)
      if (editingId) {
        await updatePackage({ id: editingId, data }).unwrap()
        toast.success('Pacote atualizado com sucesso.')
      } else {
        await createPackage(data).unwrap()
        toast.success('Pacote criado com sucesso.')
      }
      resetForm()
    } catch (error) {
      toast.error(messageFrom(error))
    }
  }

  async function toggleStatus(item: ServicePackage) {
    try {
      await changeStatus({ id: item.id, active: !item.active }).unwrap()
      toast.success(item.active ? 'Pacote desativado.' : 'Pacote ativado.')
    } catch (error) {
      toast.error(messageFrom(error))
    }
  }

  if (sessionQuery.isLoading) {
    return (
      <main className="p-6" role="status">
        Carregando permissões...
      </main>
    )
  }

  if (sessionQuery.isError || !session) {
    return (
      <main className="p-6" role="alert">
        Não foi possível identificar sua sessão.
      </main>
    )
  }

  if (!isAdmin) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-bold">Pacotes</h1>
        <p className="mt-3">Somente administradores podem gerenciar pacotes.</p>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold text-[#20382d]">
          Pacotes de serviços
        </h1>
        <p className="text-sm text-muted-foreground">
          Configure sessões, dias semanais e valor total por unidade.
        </p>
      </header>

      <section
        aria-label="Filtros de pacotes"
        className="grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-5"
      >
        <label className="text-sm">
          Nome
          <Input
            value={filterDraft.name ?? ''}
            onChange={(event) =>
              setFilterDraft({
                ...filterDraft,
                name: event.target.value || undefined,
              })
            }
          />
        </label>
        <label className="text-sm">
          Unidade
          <select
            className="mt-1 h-10 w-full rounded-md border px-3"
            value={filterDraft.unitId ?? ''}
            onChange={(event) =>
              setFilterDraft({
                ...filterDraft,
                unitId: event.target.value || undefined,
              })
            }
          >
            <option value="">Todas</option>
            {units.data?.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Serviço
          <select
            className="mt-1 h-10 w-full rounded-md border px-3"
            value={filterDraft.serviceId ?? ''}
            onChange={(event) =>
              setFilterDraft({
                ...filterDraft,
                serviceId: event.target.value || undefined,
              })
            }
          >
            <option value="">Todos</option>
            {services.data?.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Situação
          <select
            className="mt-1 h-10 w-full rounded-md border px-3"
            value={
              filterDraft.active === undefined ? '' : String(filterDraft.active)
            }
            onChange={(event) =>
              setFilterDraft({
                ...filterDraft,
                active:
                  event.target.value === ''
                    ? undefined
                    : event.target.value === 'true',
              })
            }
          >
            <option value="">Todas</option>
            <option value="true">Ativos</option>
            <option value="false">Inativos</option>
          </select>
        </label>
        <label className="text-sm">
          Sessões
          <Input
            type="number"
            min="1"
            value={filterDraft.totalSessions ?? ''}
            onChange={(event) =>
              setFilterDraft({
                ...filterDraft,
                totalSessions: event.target.value
                  ? Number(event.target.value)
                  : undefined,
              })
            }
          />
        </label>
        <div className="flex items-end gap-2 md:col-span-5">
          <Button type="button" onClick={() => setFilters(filterDraft)}>
            Filtrar
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFilterDraft({})
              setFilters({})
            }}
          >
            Limpar filtros
          </Button>
        </div>
      </section>

      <form
        onSubmit={submit}
        className="grid gap-4 rounded-xl border bg-white p-5 md:grid-cols-2"
      >
        <div className="md:col-span-2 flex items-center justify-between gap-3">
          <h2 className="font-semibold">
            {isEditing ? 'Editar pacote' : 'Novo pacote'}
          </h2>
          {isEditing ? (
            <Button type="button" variant="ghost" onClick={resetForm}>
              Cancelar edição
            </Button>
          ) : null}
        </div>
        <div>
          <Label htmlFor="package-name">Nome</Label>
          <Input
            id="package-name"
            aria-invalid={Boolean(fieldErrors.name)}
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
          {fieldErrors.name ? (
            <p className="mt-1 text-sm text-destructive">{fieldErrors.name}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="package-description">Descrição</Label>
          <Input
            id="package-description"
            value={form.description}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
          />
        </div>
        <label>
          Unidade
          <select
            aria-invalid={Boolean(fieldErrors.unitId)}
            className="mt-1 h-10 w-full rounded-md border px-3"
            value={form.unitId}
            onChange={(event) =>
              setForm({ ...form, unitId: event.target.value })
            }
          >
            <option value="">Selecione</option>
            {units.data?.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </select>
          {fieldErrors.unitId ? (
            <p className="mt-1 text-sm text-destructive">
              {fieldErrors.unitId}
            </p>
          ) : null}
        </label>
        <label>
          Serviço
          <select
            aria-invalid={Boolean(fieldErrors.serviceId)}
            className="mt-1 h-10 w-full rounded-md border px-3"
            value={form.serviceId}
            onChange={(event) =>
              setForm({ ...form, serviceId: event.target.value })
            }
          >
            <option value="">Selecione</option>
            {services.data?.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
          {fieldErrors.serviceId ? (
            <p className="mt-1 text-sm text-destructive">
              {fieldErrors.serviceId}
            </p>
          ) : null}
        </label>
        <div>
          <Label htmlFor="package-sessions">Total de sessões</Label>
          <Input
            id="package-sessions"
            aria-invalid={Boolean(fieldErrors.totalSessions)}
            type="number"
            min="1"
            value={form.totalSessions as string}
            onChange={(event) =>
              setForm({ ...form, totalSessions: event.target.value })
            }
          />
          {fieldErrors.totalSessions ? (
            <p className="mt-1 text-sm text-destructive">
              {fieldErrors.totalSessions}
            </p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="package-price">Valor total</Label>
          <Input
            id="package-price"
            aria-invalid={Boolean(fieldErrors.totalPrice)}
            inputMode="decimal"
            value={form.totalPrice}
            onChange={(event) =>
              setForm({ ...form, totalPrice: event.target.value })
            }
            placeholder="400.00"
          />
          {fieldErrors.totalPrice ? (
            <p className="mt-1 text-sm text-destructive">
              {fieldErrors.totalPrice}
            </p>
          ) : null}
        </div>
        <fieldset className="md:col-span-2">
          <legend className="font-medium">
            Dias da semana ({form.weekDays.length} por semana)
          </legend>
          <div className="mt-2 flex flex-wrap gap-3">
            {packageWeekDays.map((day) => (
              <label key={day} className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={form.weekDays.includes(day)}
                  onChange={() => toggleDay(day)}
                />
                {weekDayLabels[day]}
              </label>
            ))}
          </div>
          {fieldErrors.weekDays ? (
            <p className="mt-1 text-sm text-destructive">
              {fieldErrors.weekDays}
            </p>
          ) : null}
        </fieldset>
        <div className="md:col-span-2">
          <Button type="submit" disabled={isSaving || detailQuery.isLoading}>
            {isEditing ? 'Salvar alterações' : 'Salvar pacote'}
          </Button>
        </div>
      </form>

      {packages.isLoading ? <p role="status">Carregando pacotes...</p> : null}
      {packages.isError ? (
        <p role="alert">
          Não foi possível carregar os pacotes.{' '}
          <Button
            type="button"
            variant="link"
            onClick={() => packages.refetch()}
          >
            Tentar novamente
          </Button>
        </p>
      ) : null}
      {packages.data?.length === 0 ? (
        <p>Nenhum pacote cadastrado para os filtros informados.</p>
      ) : null}
      <section
        aria-label="Lista de pacotes"
        className="grid gap-3 md:grid-cols-2"
      >
        {packages.data?.map((item) => (
          <article key={item.id} className="rounded-xl border bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{item.name}</h2>
                <p className="text-sm">
                  {item.serviceName} · {item.unitName}
                </p>
              </div>
              <span className="rounded-full bg-muted px-2 py-1 text-xs">
                {item.active ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            {item.description ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {item.description}
              </p>
            ) : null}
            <p className="mt-2 text-sm">
              {item.totalSessions} sessões · {item.weeklyFrequency} por semana ·
              R$ {item.totalPrice}
            </p>
            <p className="text-xs text-muted-foreground">
              {item.weekDays.map((day) => weekDayLabels[day]).join(', ')}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingId(item.id)}
              >
                Editar
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={changeStatusState.isLoading}
                onClick={() => void toggleStatus(item)}
              >
                {item.active ? 'Desativar' : 'Ativar'}
              </Button>
            </div>
          </article>
        ))}
      </section>
    </main>
  )
}
