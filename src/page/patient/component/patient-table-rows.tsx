import { Button } from '@/components/ui/button'
import { TableRow, TableCell } from '@/components/ui/table'
import { Search, ArrowRight, X } from 'lucide-react'

export default function PatientTableRows() {
  return (
    <TableRow>
      <TableCell>
        <Button variant="outline" size={'xs'}>
          <Search className="h-3 w-3" />
          <span className="sr-only"> Detalhes do pedido</span>
        </Button>
      </TableCell>

      <TableCell className="font-mono text-xs font-medium">1245</TableCell>

      <TableCell className="font-medium">Abmael Ferreira</TableCell>

      <TableCell>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-slate-400" />
          <span className="text-muted-foreground font-medium"> Ativo </span>
        </div>
      </TableCell>

      <TableCell className="text-muted-foreground">01/07/2025</TableCell>

      <TableCell className="font-medium">Fisioterapia</TableCell>

      <TableCell className="bg-green-600">
        <Button variant="outline" size="xs">
          <ArrowRight className="mr-2 h-3 w-3" />
          Editar
        </Button>
      </TableCell>

      <TableCell className="bg-red-500">
        <Button variant="ghost" size="xs">
          <X className="mr-2 h-3 w-3" />
          Desativar
        </Button>
      </TableCell>
    </TableRow>
  )
}
