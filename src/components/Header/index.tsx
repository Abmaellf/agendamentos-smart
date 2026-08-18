import { Menu as MenuIcon } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import AccountMenu from '../account-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

interface HeaderProps {
  setMenuIsVisible(data: boolean): void
}

const navigationClassName =
  'border-b border-transparent px-1 py-2 text-base font-light text-white/90 transition-colors hover:border-white/70 hover:text-white'

export function Header({ setMenuIsVisible }: HeaderProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 h-16 bg-[#078a4b] text-white shadow-sm">
      <div className="flex h-full w-full items-center gap-5 px-4 sm:px-7">
        <NavLink
          to="/appointments"
          aria-label="Ir para a agenda"
          className="flex shrink-0 items-center gap-4"
        >
          <span
            aria-hidden="true"
            className="size-10 rounded-full border-2 border-white"
          />
          <span className="text-lg font-light tracking-tight">Equilíbrio</span>
        </NavLink>

        <div className="hidden min-[981px]:flex min-w-0 items-center gap-5">
          <p className="flex items-center gap-3 text-lg font-light whitespace-nowrap">
            <span className="border-b border-white pb-0.5">Fisioterapia</span>
            <span aria-hidden="true">&amp;</span>
            <span className="border-b border-white pb-0.5">Pilates</span>
          </p>

          <span aria-hidden="true" className="h-6 w-px bg-white/35" />

          <nav
            aria-label="Navegação principal"
            className="flex items-center gap-4"
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={`${navigationClassName} data-[state=open]:border-white`}
                >
                  Agenda
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-56" align="start">
                <DropdownMenuItem asChild>
                  <NavLink to="/appointments">Agendamentos</NavLink>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem>Pacote</DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      Tempo do pacote
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem>Quantidade no mês</DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                  <DropdownMenuItem>Valores</DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <NavLink
              to="/paciente"
              className={({ isActive }) =>
                `${navigationClassName} ${isActive ? 'border-white text-white' : ''}`
              }
            >
              Pacientes
            </NavLink>
          </nav>
        </div>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <AccountMenu />

          <button
            type="button"
            aria-label="Abrir menu de navegação"
            onClick={() => setMenuIsVisible(true)}
            className="rounded-md p-2 text-white transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none min-[981px]:hidden"
          >
            <MenuIcon className="size-7" />
          </button>
        </div>
      </div>
    </header>
  )
}
