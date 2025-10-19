import {
  HeaderContainer,
  HeaderContent,
  NameAndTitle,
  NameAndTitleContainer,
  NavMenu,
} from './styles'
import {Menu as MenuLucida } from 'lucide-react'
import { Separator } from '../ui/separator'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuSeparator,  DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { Button } from '../ui/button'
import { NavLink } from 'react-router-dom'
import AccountMenu from '../account-menu'

interface setMenuIsVisibleProps {
  setMenuIsVisible(data: boolean): void
}
export function Header({ setMenuIsVisible }: setMenuIsVisibleProps) {
  return (
    <HeaderContainer>
      {/* <img src={imgLogo} alt="" /> */}
      <div className='flex items-center rounded-full justify-center w-15 h-15 p-8 m-1 '> 
        {/*bg-emerald-500 */}
        <span>Logo</span>
      </div>

      <HeaderContent>
        <NameAndTitleContainer>
          <NameAndTitle className="flex items-center justify-between gap-3 text-color-sidebar-primary">
            <div className='text-white rounded p-2 bg-emerald-500'> Nome Clínica </div>
            <div> Fisioterapia & Pilates</div>
            <Separator orientation="vertical" className="h-6" />
            <NavMenu>
               {/* Agendamento */}
                <DropdownMenu>
                    <DropdownMenuTrigger>
                      <Button variant="link">Agenda</Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent className="w-56" align="start">
                      <DropdownMenuLabel>
                        <NavLink to="/agendamento"> Agendamentos </NavLink>
                      </DropdownMenuLabel>
                      <DropdownMenuGroup>
                        <DropdownMenuItem >
                        </DropdownMenuItem>
                        
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem>Pacote</DropdownMenuItem>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>Tempo do pacote</DropdownMenuSubTrigger>
                          <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                              <DropdownMenuItem>Quantidade no mês</DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </DropdownMenuSubContent>
                          </DropdownMenuPortal>
                        </DropdownMenuSub>
                        <DropdownMenuItem>
                          Valores
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>

               {/* Paciente */}
                <DropdownMenu>
                  
                         <NavLink to="/paciente  "> 
                            Pacientes 
                         </NavLink>
                  
                </DropdownMenu>
            </NavMenu>
          </NameAndTitle>
        </NameAndTitleContainer>

         <AccountMenu />
        {/* <Avatar> */}
          {/* <ImagePerfil> */}
            {/* <img src={avatar} alt="" /> */}
            {/* <UserRound size={45} /> */}
          {/* {/* </ImagePerfil> */}
        {/* </Avatar> */}
        <MenuLucida
          size={38}
          onClick={() => {
            setMenuIsVisible(true)
          }}
          className="mobile"
          color="#8a6828"
        />
      </HeaderContent>
    </HeaderContainer>
  )
}
