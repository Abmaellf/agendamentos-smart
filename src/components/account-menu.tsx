import { Building, ChevronDown, LogOut } from 'lucide-react'

import { Button } from './ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu'
import { useQuery } from '@tanstack/react-query'
import { getProfile } from '@/api/get-profile'

export default function AccountMenu() {
const { data: profile } = useQuery({
    queryKey:['profile'],
    queryFn: getProfile,
})

    return (
    <DropdownMenu>
        <DropdownMenuTrigger >
            <Button
                variant={'outline'}
                className="flex items-center gap-2 select-none"
            >
                {' '}
               {profile?.clinic.name} <ChevronDown />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
                <span className="text-muted-foreground text-xs font-normal">
                {' '}
                {profile?.username}
                </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem>
                <Building className="mr-2 h-4 w-4" />
                <span> Perfil</span>
            </DropdownMenuItem>

            <DropdownMenuItem className="text-rose-500 dark:text-rose-400">
                <LogOut className="mr-2 h-4 w-4" />
                <span> Sair </span>
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
    )
}