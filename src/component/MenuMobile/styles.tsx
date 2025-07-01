import styled, { css } from 'styled-components'

interface isVisibleProps {
  isVisible: boolean
}
export const ContainerMobile = styled.section<isVisibleProps>`
  position: absolute;
  backdrop-filter: blur(2px);
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 5;
  /* display: flex; */
  align-items: center;
  justify-content: center;

  /* background-image: linear-gradient(to bottom, #f0b446, #8a6828); */

  background: #f0b446;
  background: linear-gradient(
    52deg,
    rgba(240, 180, 70, 1) 25%,
    rgba(138, 104, 40, 0.67) 100%
  );

  opacity: 0;
  pointer-events: none;
  transform: translateY(50px);

  transition: all.5s;

  > svg {
    position: absolute;
    top: 1rem;
    right: 1rem;
    color: white;
    transform: rotate(45deg);
    transition: 0.7s;
  }

  nav {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3rem;
    font-family: Inter;
    font-size: 32px;
    font-weight: bold;
    line-height: 2;
    background: white;
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    color: white;
    transform: scale(0.7);
    transition: 0.7s;
  }

  ${({ isVisible }) =>
    isVisible &&
    css`
      opacity: 1;
      pointer-events: auto;
      cursor: pointer;
      transform: translateY(0);
      svg {
        transform: rotate(0deg);
      }
      nva {
        transform: scale(1);
      }
    `}
`
