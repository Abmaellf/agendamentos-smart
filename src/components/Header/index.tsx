import imgLogo from '../../assets/BolaUnTra.png'
import {
  Avatar,
  HeaderContainer,
  HeaderContent,
  ImagePerfil,
  LiMenu,
  LiMenuSub,
  NameAndTitle,
  NameAndTitleContainer,
  NavMenu,
  UlDropDown,
  UlMenu,
} from './styles'
// import avatar from '../../assets/avatar.png'
import { Menu as MenuLucida, UserRound } from 'lucide-react'
import { NavLink } from '../nav-link'
import { Separator } from '../ui/separator'
import { AddSchedulingModal } from '../AddSchedulingModal'

interface setMenuIsVisibleProps {
  setMenuIsVisible(data: boolean): void
}
export function Header({ setMenuIsVisible }: setMenuIsVisibleProps) {
  return (
    <HeaderContainer>
      {/* <img src={imgLogo} alt="" /> */}
      <div className='flex items-center rounded-4xl justify-center rounded-50 bg-emerald-300 w-20 h-20 p-10 m-1'>
        <span>Logo</span>
      </div>

      <HeaderContent>
        <NameAndTitleContainer>
          <NameAndTitle className="flex items-center justify-between gap-3 text-color-sidebar-primary">
            <div> Equilíbrio </div>

            <div> Fisioterapia & Pilates</div>

            <Separator orientation="vertical" className="h-6" />

            <NavMenu>
              <UlMenu className="flex items-center justify-between gap-3 text-color-sidebar-primary">
                <LiMenuSub>
                  {/* <NavLink  to='/agendamento'> */} Agenda {/* </NavLink> */}
                  <UlDropDown className="dropdown">
                    <li>
                      {' '}
                      <NavLink to="/agendamento"> Agendamentos </NavLink>
                    </li>
                    <li>
                      {' '}
                      <AddSchedulingModal />{' '}
                    </li>
                    <li>
                      {' '}
                      <NavLink to="/configuration"> Configurações </NavLink>
                    </li>
                    <li>
                      {' '}
                      <NavLink to="#"> Ajuda </NavLink>{' '}
                    </li>
                  </UlDropDown>
                </LiMenuSub>

                <LiMenu>
                  <NavLink to="/paciente  "> Pacientes </NavLink>
                </LiMenu>

                <LiMenu>
                  <NavLink to="/contatos"> Contato </NavLink>
                </LiMenu>
              </UlMenu>
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
