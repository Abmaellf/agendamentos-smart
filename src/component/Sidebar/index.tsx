
import imgFundo from '../../assets/img_pilates.png';
import { ButtonContent, ImgButton, SidebarContainer } from './styles';

export function Sidebar() {
    return(
    <SidebarContainer>

        <img src={imgFundo}  />

        <ImgButton>
            <ButtonContent>
                Agendar Agora

            </ButtonContent>
        </ImgButton>
           
        
    </SidebarContainer>
    )
}