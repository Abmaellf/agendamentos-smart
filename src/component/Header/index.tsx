import imgLogo from '../../assets/BolaUnTra.png';
import '../../global.css';
import { HeaderContainer, HeaderContent, NameAndTitle, NameAndTitleContainer } from './styles';
import { ButtonContent } from '../Sidebar/styles';

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

                    <ButtonContent> 
                        Entrar 
                    </ButtonContent>
            </HeaderContent>

        </HeaderContainer>
       
    )
}