import { Button } from '@/components/ui/button'
import { TableRow, TableCell } from '@/components/ui/table'
import { dateFormatter } from '@/utils/formatter'
import { Search, ArrowRight, X } from 'lucide-react'

type Props = {
    patientObj: {
          id: string
          name: string
          createdAt: Date
          status: string
    }
}

export default function PatientTableRows({patientObj}: Props) {
  return (
    <TableRow>
      <TableCell>
        <Button variant="outline" size={'xs'}>
          <Search className="h-3 w-3" />
          <span className="sr-only"> Detalhes do pedido</span>
        </Button>
      </TableCell>

      <TableCell className="font-mono text-xs font-medium"> { patientObj.id }</TableCell>

      <TableCell className="font-medium"> { patientObj.name }</TableCell>

      <TableCell>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-slate-400" />
          <span className="text-muted-foreground font-medium"> Ativo </span>
        </div>
      </TableCell>

      <TableCell className="text-muted-foreground"> 
        {dateFormatter.format(new Date(patientObj.createdAt) )}
        
      </TableCell>

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
