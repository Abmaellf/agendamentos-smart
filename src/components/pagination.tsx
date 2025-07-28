import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
     pageIndex: number
    perPage:number
    totalCount:number
}

export function Pagination({
    pageIndex,
    perPage,
    totalCount,
}: PaginationProps) {

    const pages = Math.ceil(totalCount / perPage) || 1;
  
  return (
    <div className='flex items-center justify-between'>
      <span className='text-muted-foreground text-sm'>
        Total de {totalCount} item(s)
      </span>

      <div className='flex items-center gap-6 lg:gap-8'>
        <div className='text-sm font-medium'>
            Página {pageIndex + 1} de {pages}
        </div>
        <div className='flex items-center gap-2'>
            <Button variant='outline' className="h-8 w-8 p-0">
                <ChevronLeft className='h-4 w-4' />
                <span className='sr-only'>Primeira página</span>
            </Button>

            <Button variant='outline' className="h-8 w-8 p-0">
                <ChevronLeft className='h-4 w-4' />
                <span className='sr-only'>Página anterior</span>
            </Button>
            

            <Button variant='outline' className="h-8 w-8 p-0">
                <ChevronRight className='h-4 w-4' />
                <span className='sr-only'>Próxima página</span>
            </Button>
           
            <Button variant='outline' className="h-8 w-8 p-0">
                <ChevronRight className='h-4 w-4' />
                <span className='sr-only'>Última página</span>
            </Button>

        </div>
      </div>
    </div>
  )
}
