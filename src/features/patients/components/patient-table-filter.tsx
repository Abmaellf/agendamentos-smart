import { Grid2X2, RotateCcw, Search } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'

import type {
  PatientFilters,
  PatientStatus,
  PatientTableFilterProps,
} from '@/@types/patient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const ALL = 'ALL'

interface FilterDraft {
  name: string
  status: PatientStatus | typeof ALL
  serviceId: string
}

function draftFrom(value: PatientFilters): FilterDraft {
  return {
    name: value.name,
    status: value.status ?? ALL,
    serviceId: value.serviceId ?? ALL,
  }
}

export function PatientTableFilter({
  value,
  services,
  servicesLoading,
  disabled = false,
  onApply,
  onClear,
}: PatientTableFilterProps) {
  const [draft, setDraft] = useState<FilterDraft>(() => draftFrom(value))

  useEffect(() => {
    setDraft(draftFrom(value))
  }, [value])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onApply({
      name: draft.name.trim(),
      status: draft.status === ALL ? undefined : draft.status,
      serviceId: draft.serviceId === ALL ? undefined : draft.serviceId,
    })
  }

  function handleClear() {
    setDraft({ name: '', status: ALL, serviceId: ALL })
    onClear()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_minmax(200px,0.7fr)_minmax(220px,0.8fr)_auto_auto]"
    >
      <label className="relative">
        <span className="sr-only">Nome do paciente</span>
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          aria-hidden="true"
        />
        <Input
          value={draft.name}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              name: event.target.value,
            }))
          }
          placeholder="Nome do paciente..."
          className="h-11 pl-9"
          disabled={disabled}
        />
      </label>

      <Select
        value={draft.status}
        onValueChange={(status) =>
          setDraft((current) => ({
            ...current,
            status: status as PatientStatus | typeof ALL,
          }))
        }
        disabled={disabled}
      >
        <SelectTrigger className="h-11 w-full" aria-label="Status do paciente">
          <SelectValue placeholder="Todos os status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos os status</SelectItem>
          <SelectItem value="ATIVO">Ativo</SelectItem>
          <SelectItem value="EM_ATENDIMENTO">Em atendimento</SelectItem>
          <SelectItem value="INATIVO">Inativo</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={draft.serviceId}
        onValueChange={(serviceId) =>
          setDraft((current) => ({ ...current, serviceId }))
        }
        disabled={disabled || servicesLoading}
      >
        <SelectTrigger
          className="h-11 w-full"
          aria-label="Serviço principal do paciente"
        >
          <Grid2X2 aria-hidden="true" />
          <SelectValue
            placeholder={
              servicesLoading ? 'Carregando...' : 'Todos os serviços'
            }
          />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos os serviços</SelectItem>
          {services.map((service) => (
            <SelectItem key={service.id} value={service.id}>
              {service.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button type="submit" variant="secondary" disabled={disabled}>
        <Search aria-hidden="true" />
        Filtrar
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={handleClear}
        disabled={disabled}
      >
        <RotateCcw aria-hidden="true" />
        Limpar filtros
      </Button>
    </form>
  )
}
