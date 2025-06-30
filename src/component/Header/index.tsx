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
            <div> | </div>
            <div> Agendamento </div>
            <div> Paciente </div>
            <div> Contato </div>
          </NameAndTitle>
        </NameAndTitleContainer>

        {/* <ButtonContent> 
                        Entrar 
                    </ButtonContent> */}

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
