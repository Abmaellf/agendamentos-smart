
import imgLogo from '../../assets/BolaUnTra.png'
import {
  Avatar,
  HeaderContainer,
  HeaderContent,
  NameAndTitle,
  NameAndTitleContainer,
} from './styles'
import avatar from '../../assets/avatar.png'
import { Menu } from 'lucide-react'
import { Separator } from '@radix-ui/react-separator'
import { NavLink } from '../nav-link'

interface setMenuIsVisibleProps {
  setMenuIsVisible(data: boolean): void
}
export function Header({ setMenuIsVisible }: setMenuIsVisibleProps) {
  
  return (
    <HeaderContainer>
      <img src={imgLogo} alt="" />

      <HeaderContent>
        <NameAndTitleContainer>
          <NameAndTitle>

            <div> Equilíbrio </div>

            <div> Fisioterapia & Pilates</div>

            <Separator orientation="vertical" className="h-6" />

            <NavLink  to='/agendamento'>
              Agendamento{' '}
            </NavLink>

            <NavLink  to='/paciente'>
              {' '}
              Paciente{' '}
            </NavLink>

            <NavLink  to='/contatos'>
              {' '}
              Contato{' '}
            </NavLink>

          </NameAndTitle>
        </NameAndTitleContainer>

        <Avatar>
          <span> Ana Cristina </span>
          <img src={avatar} alt="" />
        </Avatar>
        <Menu
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
