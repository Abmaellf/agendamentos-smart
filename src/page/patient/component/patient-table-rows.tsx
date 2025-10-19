import { Button } from '@/components/ui/button'
import { TableRow, TableCell } from '@/components/ui/table'
import { Search, ArrowRight, X } from 'lucide-react'

type Props = {
    patientObj: {
          name: string          
    }
}

export default function PatientTableRows({patientObj}: Props) {
console.log("Row", patientObj)
  return (
    <TableRow>
      <TableCell>
        <Button variant="outline" size={'xs'}>
          <Search className="h-3 w-3" />
          <span className="sr-only"> Detalhes do pedido</span>
        </Button>
      </TableCell>


      <TableCell className="font-medium"> 0001</TableCell>
      <TableCell className="font-medium"> { patientObj.name }</TableCell>

      <TableCell>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-slate-400" />
        </div>
      </TableCell>

      <TableCell className="text-muted-foreground"> 
        21/10/2025
        
      </TableCell>

      <TableCell >
        <Button variant="outline" size="xs">
          <ArrowRight className="mr-2 h-3 w-3" />
          Editar
        </Button>
      </TableCell>

      <TableCell >
        <Button variant="ghost" size="xs">
          <X className="mr-2 h-3 w-3" />
          Desativar
        </Button>
      </TableCell>
    </TableRow>
  )
}
