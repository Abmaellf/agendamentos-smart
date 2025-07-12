
import imgLogo from '../../assets/BolaUnTra.png'
import {
  Avatar,
  HeaderContainer,
  HeaderContent,
  LiMenu,
  LiMenuSub,
  NameAndTitle,
  NameAndTitleContainer,
  NavMenu,
  UlDropDown,
  UlMenu
} from './styles'
import avatar from '../../assets/avatar.png'
import { Menu as MenuLucida } from 'lucide-react'
import { NavLink } from '../nav-link'
import { Separator } from '../../components/ui/separator'


interface setMenuIsVisibleProps {
  setMenuIsVisible(data: boolean): void
}
export function Header({ setMenuIsVisible }: setMenuIsVisibleProps) {
  
  return (
    <HeaderContainer>
      <img src={imgLogo} alt="" />

      <HeaderContent>
        <NameAndTitleContainer>
          <NameAndTitle className='flex items-center justify-between gap-3 text-color-sidebar-primary'>

            <div> Equilíbrio </div>

            <div> Fisioterapia & Pilates</div>

            <Separator orientation="vertical" className="h-6" />

            <NavMenu>
              <UlMenu className='flex items-center justify-between gap-3 text-color-sidebar-primary'>

                <LiMenuSub>
                    {/* <NavLink  to='/agendamento'> */}
                      {' '}
                      Agenda{' '}
                    {/* </NavLink> */}

                    <UlDropDown className='dropdown'>
                      <li> <NavLink  to='/agendamento'> Agendamentos  </NavLink></li>
                      <li> <NavLink  to='/configuration'> Configurações </NavLink></li>
                      <li> <NavLink  to='#'>  Ajuda </NavLink> </li>
                    </UlDropDown>
                </LiMenuSub>

                <LiMenu>
                    <NavLink  to='/paciente  '>
                      {' '}
                      Pacientes{' '}
                    </NavLink>
                </LiMenu>

                <LiMenu>
                      <NavLink  to='/contatos'>
                        {' '}
                        Contato{' '}
                      </NavLink>
                </LiMenu>
              </UlMenu>
            </NavMenu>
            
            

            


            

          </NameAndTitle>
        </NameAndTitleContainer>

        <Avatar>
          <span> Ana Cristina </span>
          <img src={avatar} alt="" />
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
