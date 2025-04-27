import styled from "styled-components";

export const SidebarContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;

    img {
        position: relative;
        z-index: 1;
        width: 80rem;
        height:48rem ;
        object-fit: cover;
        opacity: 30%;
    }
`
 
export const ImgButton = styled.div`
     position: absolute;
    
    z-index: 2;
    top: 90%;
    left: 50%;
`

export const ButtonContent = styled.button`
     padding: 10px;
    border-radius: 5px;
    border: 0;
    background-image: linear-gradient(to top,#8A6828, #F0B446 );
    color: white;
    font-family: Roboto  ;
    font-weight: bold;  
    cursor: pointer;

    /* transition: color 0.5s, background-color 0.5s; */


    &:hover {
        background-image: linear-gradient(to top, #8A6828,  #F0B446, var(--dourado-1));
    }


`
   
