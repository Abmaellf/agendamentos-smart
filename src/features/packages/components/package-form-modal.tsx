import { useEffect, useState, type FormEvent } from 'react'

import type { ServiceOption, UnitOption } from '@/@types/appointment'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import {
  packageFormSchema,
  packageWeekDays,
  type PackageFormValues,
} from '../model/package-form-schema'

import type { PackageWeekDay } from '../api/packages'

const weekDayLabels: Record<PackageWeekDay, string> = {
  SUNDAY: 'Domingo',
  MONDAY: 'Segunda',
  TUESDAY: 'Terça',
  WEDNESDAY: 'Quarta',
  THURSDAY: 'Quinta',
  FRIDAY: 'Sexta',
  SATURDAY: 'Sábado',
}

export function emptyPackageForm(): PackageFormValues {
  return {
    name: '',
    description: '',
    unitId: '',
    serviceId: '',
    totalSessions: '10',
    totalPrice: '',
    weekDays: [],
  }
}

interface PackageFormModalProps {
  open: boolean
  isEditing: boolean
  initialValues?: PackageFormValues
  units: UnitOption[]
  services: ServiceOption[]
  catalogsLoading?: boolean
  isSaving?: boolean
  detailLoading?: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: PackageFormValues) => void
}

export function PackageFormModal({
  open,
  isEditing,
  initialValues,
  units,
  services,
  catalogsLoading = false,
  isSaving = false,
  detailLoading = false,
  onOpenChange,
  onSubmit,
}: PackageFormModalProps) {
  const [form, setForm] = useState<PackageFormValues>(
    initialValues ?? emptyPackageForm(),
  )
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) return
    setForm(initialValues ?? emptyPackageForm())
    setFieldErrors({})
  }, [initialValues, open])

  function toggleDay(day: PackageWeekDay) {
    setForm((current) => ({
      ...current,
      weekDays: current.weekDays.includes(day)
        ? current.weekDays.filter((value) => value !== day)
        : [...current.weekDays, day],
    }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
    onSubmit(parsed.data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar pacote' : 'Novo pacote'}</DialogTitle>
          <DialogDescription>
            Configure sessões, dias semanais e valor total por unidade.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="package-name">Nome</Label>
            <Input
              id="package-name"
              aria-invalid={Boolean(fieldErrors.name)}
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
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
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </div>

          <label className="text-sm">
            Unidade
            <select
              aria-label="Unidade do pacote"
              aria-invalid={Boolean(fieldErrors.unitId)}
              className="mt-1 h-10 w-full rounded-md border bg-background px-3"
              value={form.unitId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  unitId: event.target.value,
                }))
              }
              disabled={catalogsLoading}
            >
              <option value="">Selecione</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
            {fieldErrors.unitId ? (
              <p className="mt-1 text-sm text-destructive">{fieldErrors.unitId}</p>
            ) : null}
          </label>

          <label className="text-sm">
            Serviço
            <select
              aria-label="Serviço do pacote"
              aria-invalid={Boolean(fieldErrors.serviceId)}
              className="mt-1 h-10 w-full rounded-md border bg-background px-3"
              value={form.serviceId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  serviceId: event.target.value,
                }))
              }
              disabled={catalogsLoading}
            >
              <option value="">Selecione</option>
              {services.map((service) => (
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
                setForm((current) => ({
                  ...current,
                  totalSessions: event.target.value,
                }))
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
                setForm((current) => ({
                  ...current,
                  totalPrice: event.target.value,
                }))
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

          <DialogFooter className="md:col-span-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSaving || detailLoading || catalogsLoading}
            >
              {isEditing ? 'Salvar alterações' : 'Salvar pacote'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
