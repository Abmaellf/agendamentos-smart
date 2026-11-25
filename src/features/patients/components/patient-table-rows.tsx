import type { PatientTableRowsProps } from '@/@types/patient'
import type { KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { TableCell, TableRow } from '@/components/ui/table'
import { Search, Stethoscope } from 'lucide-react'
import { PatientStatusBadge } from './patients-status-badge'


function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function formatCode(code: number) {
  return String(code).padStart(4, '0')
}

function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('pt-BR').format(date)
}

export default function PatientTableRows({
  patient,
  selected = false,
  onSelect,
}: PatientTableRowsProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLTableRowElement>) {
    if (event.target !== event.currentTarget) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect(patient, event.currentTarget)
    }
  }

  return (
    <TableRow
      tabIndex={0}
      data-state={selected ? 'selected' : undefined}
      aria-selected={selected}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onSelect(patient, event.currentTarget)
        }
      }}
      onKeyDown={handleKeyDown}
      className="cursor-pointer odd:bg-white even:bg-emerald-50/40 focus-visible:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600 data-[state=selected]:bg-emerald-100"
    >
      <TableCell>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={`Detalhes de ${patient.name}`}
          title={`Detalhes de ${patient.name}`}
          onClick={(event) => onSelect(patient, event.currentTarget)}
        >
          <Search aria-hidden="true" />
        </Button>
      </TableCell>

      <TableCell className="font-semibold text-emerald-800">
        {formatCode(patient.code)}
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-10 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-900"
          >
            {initials(patient.name)}
          </span>
          <span className="font-semibold">{patient.name}</span>
        </div>
      </TableCell>

      <TableCell>
        {patient.principalService ? (
          <span className="flex items-center gap-2">
            <Stethoscope
              className="size-4 text-emerald-700"
              aria-hidden="true"
            />
            {patient.principalService.name}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>

      <TableCell>
        <PatientStatusBadge status={patient.status} />
      </TableCell>

      <TableCell>{formatDate(patient.createdAt)}</TableCell>

      <TableCell>
        <span className="text-muted-foreground text-sm">—</span>
      </TableCell>
    </TableRow>
  )
}
