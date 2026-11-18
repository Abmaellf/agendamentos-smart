import type { PatientTableRowsProps } from '@/@types/patient'
import { Button } from '@/components/ui/button'
import { TableCell, TableRow } from '@/components/ui/table'
import { ArrowRight, Search, Stethoscope, Trash2 } from 'lucide-react'
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

export default function PatientTableRows({ patient }: PatientTableRowsProps) {
  return (
    <TableRow className="odd:bg-white even:bg-emerald-50/40">
      <TableCell>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={`Ver detalhes de ${patient.name}`}
          title="Detalhes serão disponibilizados em uma próxima etapa"
          disabled
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
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            title="Edição será disponibilizada em uma próxima etapa"
            disabled
          >
            <ArrowRight aria-hidden="true" />
            Editar
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            title="Desativação será disponibilizada em uma próxima etapa"
            disabled
          >
            <Trash2 aria-hidden="true" />
            Desativar
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
