import type { PatientStatus } from '@/@types/patient'
import { Badge } from '@/components/ui/badge'
import { CircleCheck, CirclePause, Clock3 } from 'lucide-react'

interface PatientStatusBadgeProps {
status?: PatientStatus | null
}

export function PatientStatusBadge({ status }: PatientStatusBadgeProps) {
 switch (status) {
    case 'ATIVO':
    return (
            <Badge className="border-emerald-200 bg-emerald-100 text-emerald-800">
                <CircleCheck aria-hidden="true" />
                Ativo
            </Badge>
    )
    case 'EM_ATENDIMENTO':
    return (
            <Badge className="border-amber-200 bg-amber-100 text-amber-900">
                <Clock3 aria-hidden="true" />
                    Em atendimento
            </Badge>
    )
    case 'INATIVO':
    return (
               <Badge className="border-slate-300 bg-slate-700 text-white">
                   <CirclePause aria-hidden="true" />
                  Inativo
               </Badge>
    )
    default:
    return <span className="text-muted-foreground">—</span>
    }
}