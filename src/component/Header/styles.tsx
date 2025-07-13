import styled from 'styled-components'

export const HeaderContainer = styled.div`
  background:${({ theme }) => theme.colors['gray-100']};
  width: 100%;
  display: flex;
  align-items: center;
  overflow: visible;
  position: fixed;
  img {
    margin: 5px;
    width: 50px;
    height: 50px;
  }

  @media (max-width: 980px) {
    gap: 8rem;
  }
`


export const NavMenu = styled.div`

`
export const UlMenu = styled.li`
  margin: 15px;
  padding: 10px;
`

export const LiMenu = styled.ul`

`
export const LiMenuSub = styled.ul`
      position: relative;

      &:hover .dropdown {
        margin-top: 20px;
        padding: 5px;
        display: block;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1.5rem;
      }
`
export const UlDropDown = styled.ul`

    background-color: dimgray;
   
    border: 1px solid #ddd;
    border-radius: 8px;
    
    padding-bottom: 20px;
    position: absolute;
    top:5px;
    /* left: 10px; */
    display: none;
    /* z-index: 99; */
  li {
    /* display: block; */
    /* color: white; */
  }

`
export const HeaderContent = styled.div`
  width: 100%;
  margin: 5px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  .mobile {
    display: none;
  }

  @media (max-width: 980px) {
    justify-content: flex-start;
    gap: 1rem;
    .mobile {
      display: block;
    }
  }
`
export const NameAndTitleContainer = styled.div`
  display: flex;
  align-items: center;
  /* justify-content: space-between; */
  margin-left: 5px;
  width: 900px;
  @media (max-width: 980px) {
    display: none;
  }
`

export const NameAndTitle = styled.div`
  /* display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 3rem;

  font-family: Roboto;
  font-size: 24px;
  color: ${({ theme }) => theme.colors['gray-500']}; */

`




// {
//   background-image: linear-gradient(to bottom, #f0b446, #8a6828);  
//    background-clip: text; 
//   -webkit-background-clip: text;Alguns navegadores precisam do prefixo 
//   -webkit-text-fill-color: transparent;
//   color: white;
//    .link {
//     &:hover { 
//       background: ${({ theme }) => theme.colors['gray-100']}; 
//       color: white;
//       -webkit-background-clip: text;
//     } 
//   }
// }

export const ButtonContent = styled.button`
  /* padding: 10px;
  border-radius: 5px;
  border: 0; */
  /* background-image: linear-gradient(to top, #8a6828, #f0b446); */
  /* color: white; */
  /* font-family: Roboto;
  font-weight: bold;
  cursor: pointer; */
/* 
  transition:
    color 0.5s,
    background-color 0.5s; */

  /* &:hover {
    background-image: linear-gradient(
      to top,
      #8a6828,
      #f0b446,
      var(--dourado-1)
    );
  } */ 
`

export const Avatar = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;

  img {
    border-radius: 50%;
    border: solid 2px white;
  }
`
