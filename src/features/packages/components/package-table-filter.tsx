import { FormEvent, useEffect, useState } from 'react'

import type { ServiceOption, UnitOption } from '@/@types/appointment'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import type { ServicePackageFilters } from '../api/packages'

interface PackageTableFilterProps {
  value: ServicePackageFilters
  units: UnitOption[]
  services: ServiceOption[]
  disabled?: boolean
  catalogsLoading?: boolean
  onApply: (value: ServicePackageFilters) => void
  onClear: () => void
}

export function PackageTableFilter({
  value,
  units,
  services,
  disabled = false,
  catalogsLoading = false,
  onApply,
  onClear,
}: PackageTableFilterProps) {
  const [draft, setDraft] = useState<ServicePackageFilters>(value)

  useEffect(() => {
    setDraft(value)
  }, [value])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onApply({
      ...draft,
      name: draft.name?.trim() || undefined,
    })
  }

  function handleClear() {
    setDraft({})
    onClear()
  }

  return (
    <form
      aria-label="Filtros de pacotes"
      onSubmit={handleSubmit}
      className="grid gap-3 rounded-xl border bg-white p-4 lg:grid-cols-5"
    >
      <label className="text-sm">
        Nome
        <Input
          aria-label="Nome"
          value={draft.name ?? ''}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              name: event.target.value || undefined,
            }))
          }
          disabled={disabled}
        />
      </label>

      <label className="text-sm">
        Unidade
        <select
          aria-label="Unidade"
          className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
          value={draft.unitId ?? ''}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              unitId: event.target.value || undefined,
            }))
          }
          disabled={disabled || catalogsLoading}
        >
          <option value="">Todas</option>
          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.name}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm">
        Serviço
        <select
          aria-label="Serviço"
          className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
          value={draft.serviceId ?? ''}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              serviceId: event.target.value || undefined,
            }))
          }
          disabled={disabled || catalogsLoading}
        >
          <option value="">Todos</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm">
        Situação
        <select
          aria-label="Situação"
          className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
          value={draft.active === undefined ? '' : String(draft.active)}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              active:
                event.target.value === ''
                  ? undefined
                  : event.target.value === 'true',
            }))
          }
          disabled={disabled}
        >
          <option value="">Todas</option>
          <option value="true">Ativos</option>
          <option value="false">Inativos</option>
        </select>
      </label>

      <label className="text-sm">
        Sessões
        <Input
          aria-label="Total de sessões"
          type="number"
          min="1"
          value={draft.totalSessions ?? ''}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              totalSessions: event.target.value
                ? Number(event.target.value)
                : undefined,
            }))
          }
          disabled={disabled}
        />
      </label>

      <div className="flex flex-wrap items-end gap-2 lg:col-span-5">
        <Button type="submit" disabled={disabled}>
          Filtrar
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleClear}
          disabled={disabled}
        >
          Limpar filtros
        </Button>
      </div>
    </form>
  )
}
