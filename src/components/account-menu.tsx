import { Building, ChevronDown, LogOut } from 'lucide-react'
import React from 'react'

import { Button } from './ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu'

export default function AccountMenu() {
    return (
    <DropdownMenu>
        <DropdownMenuTrigger >
            <Button
                variant={'outline'}
                className="flex items-center gap-2 select-none"
            >
                {' '}
                Usuário <ChevronDown />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
                <span className="text-muted-foreground text-xs font-normal">
                {' '}
                Abmael Ferreira{' '}
                </span>
                <span> abmaellf@gmail.com</span>
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