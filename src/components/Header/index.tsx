// import imgLogo from '../../assets/BolaUnTra.png'
import {
  HeaderContainer,
  HeaderContent,
  NameAndTitle,
  NameAndTitleContainer,
  NavMenu,
} from './styles'
// import avatar from '../../assets/avatar.png'
import { ChartLine, FileSliders, Menu as MenuLucida, Settings } from 'lucide-react'
// import { NavLink } from '../nav-link'
import { Separator } from '../ui/separator'
// import { AddSchedulingModal } from '../AddSchedulingModal'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuSeparator,  DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { Button } from '../ui/button'
import { AddPatientModal } from '../AddPatientModal'
import { NavLink } from 'react-router-dom'
import AccountMenu from '../account-menu'
// import { ModeToggle } from '../theme/ mode-toggle'

interface setMenuIsVisibleProps {
  setMenuIsVisible(data: boolean): void
}
export function Header({ setMenuIsVisible }: setMenuIsVisibleProps) {
  return (
    <HeaderContainer>
      {/* <img src={imgLogo} alt="" /> */}
      <div className='flex items-center rounded-full justify-center w-15 h-15 p-8 m-1'> 
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
                        <DropdownMenuItem>
                          Configurações
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
                              <DropdownMenuItem>Quantidade na Semana</DropdownMenuItem>
                              <DropdownMenuItem>Atendimento no dia</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>Horas do atendimento</DropdownMenuItem>
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
                    <DropdownMenuTrigger >
                      <Button variant="link">Paciente</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="start">
                      <DropdownMenuLabel>                        
                         <NavLink to="/paciente  "> 
                            Pacientes 
                         </NavLink>
                      </DropdownMenuLabel>
                      <DropdownMenuGroup>
                        <DropdownMenuItem asChild className='flex justify-items-start'>
                           <AddPatientModal />
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem>
                          <Settings />
                          Configurações
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem>
                          <FileSliders />
                          Prontuário
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <ChartLine />
                          Evolução
                        </DropdownMenuItem>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>Invite users</DropdownMenuSubTrigger>
                          <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                              <DropdownMenuItem>Email</DropdownMenuItem>
                            </DropdownMenuSubContent>
                          </DropdownMenuPortal>
                        </DropdownMenuSub>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem disabled>Financeiro</DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </DropdownMenuContent>
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
