// import imgLogo from '../../assets/BolaUnTra.png'
import {
  Avatar,
  HeaderContainer,
  HeaderContent,
  ImagePerfil,
  NameAndTitle,
  NameAndTitleContainer,
  NavMenu,
} from './styles'
// import avatar from '../../assets/avatar.png'
import { Menu as MenuLucida, UserRound } from 'lucide-react'
// import { NavLink } from '../nav-link'
import { Separator } from '../ui/separator'
// import { AddSchedulingModal } from '../AddSchedulingModal'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuSeparator,  DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { Button } from '../ui/button'
import { AddPatientModal } from '../AddPatientModal'
import { NavLink } from 'react-router-dom'

interface setMenuIsVisibleProps {
  setMenuIsVisible(data: boolean): void
}
export function Header({ setMenuIsVisible }: setMenuIsVisibleProps) {
  return (
    <HeaderContainer>
      {/* <img src={imgLogo} alt="" /> */}
      <div className='flex items-center rounded-full justify-center  bg-emerald-500 w-15 h-15 p-8 m-1'>
        <span>Logo</span>
      </div>

      <HeaderContent>
        <NameAndTitleContainer>
          <NameAndTitle className="flex items-center justify-between gap-3 text-color-sidebar-primary">
            <div> Equilíbrio </div>
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
                          Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          Keyboard shortcuts
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem>Team</DropdownMenuItem>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>Invite users</DropdownMenuSubTrigger>
                          <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                              <DropdownMenuItem>Email</DropdownMenuItem>
                              <DropdownMenuItem>Message</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>More...</DropdownMenuItem>
                            </DropdownMenuSubContent>
                          </DropdownMenuPortal>
                        </DropdownMenuSub>
                        <DropdownMenuItem>
                          New Team
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>GitHub</DropdownMenuItem>
                      <DropdownMenuItem>Support</DropdownMenuItem>
                      <DropdownMenuItem disabled>API</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

               {/* Paciente */}
                <DropdownMenu>
                    <DropdownMenuTrigger >
                      <Button variant="link">Paciente</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="start">
                      <DropdownMenuLabel>
                         <NavLink to="/paciente  "> Pacientes </NavLink>
                      </DropdownMenuLabel>
                      <DropdownMenuGroup>
                        <DropdownMenuItem asChild className='flex justify-items-start'>
                           <AddPatientModal />
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem>
                          Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          Keyboard shortcuts
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem>Team</DropdownMenuItem>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>Invite users</DropdownMenuSubTrigger>
                          <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                              <DropdownMenuItem>Email</DropdownMenuItem>
                              <DropdownMenuItem>Message</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>More...</DropdownMenuItem>
                            </DropdownMenuSubContent>
                          </DropdownMenuPortal>
                        </DropdownMenuSub>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>GitHub</DropdownMenuItem>
                      <DropdownMenuItem>Support</DropdownMenuItem>
                      <DropdownMenuItem disabled>API</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </NavMenu>
          </NameAndTitle>
        </NameAndTitleContainer>

        <Avatar>
          <span> Usuário </span>
          <ImagePerfil>
            {/* <img src={avatar} alt="" /> */}
            <UserRound size={45} />
          </ImagePerfil>
        </Avatar>
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
