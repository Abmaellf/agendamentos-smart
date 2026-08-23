import { Building, ChevronDown, LogOut } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import avatar from '@/assets/abm_avatar.png'
import { getProfile } from '@/api/get-profile'

import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

export default function AccountMenu() {
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  })

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-12 gap-2 rounded-full px-2 text-white select-none hover:bg-white/10 hover:text-white focus-visible:ring-white/70"
        >
          <span className="hidden max-w-36 truncate text-sm font-light sm:inline">
            {/* {profile?.username ?? profile?.clinic.name ?? 'Conta'} */}
          </span>
          <img
            src={avatar}
            alt=""
            className="size-10 rounded-full border-2 border-white/90 object-cover"
          />
          <ChevronDown className="hidden size-4 sm:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <span className="text-muted-foreground text-xs font-normal">
            {/* {profile?.clinic.name ?? profile?.username ?? 'Minha conta'} */}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem>
          <Building className="mr-2 size-4" />
          <span>Perfil</span>
        </DropdownMenuItem>

        <DropdownMenuItem className="text-rose-500 dark:text-rose-400">
          <LogOut className="mr-2 size-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
