import imgLogo from '../../assets/BolaUnTra.png';
import '../../global.css';
import { Avatar, HeaderContainer, HeaderContent, NameAndTitle, NameAndTitleContainer } from './styles';
import avatar from '../../assets/avatar.png'
export function Header() {
    return(

        <HeaderContainer>
            
           <img  src={imgLogo} alt='' />

           <HeaderContent>
                    <NameAndTitleContainer>

                        <NameAndTitle>
                            <div> Equilíbrio </div>

                            <div> Fisioterapia & Pilates</div>
                        </NameAndTitle>

                    </NameAndTitleContainer>

                    {/* <ButtonContent> 
                        Entrar 
                    </ButtonContent> */}

                    <Avatar>
                        <span> Abmael </span>
                        <img src={avatar} alt=''/>
                    </Avatar>
            </HeaderContent>

        </HeaderContainer>
       
    )
}