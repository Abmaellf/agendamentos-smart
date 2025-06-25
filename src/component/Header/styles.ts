import styled from 'styled-components'

export const HeaderContainer = styled.div`
  background: #110f0f;
  width: 0 auto;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: start;

  img {
    margin: 5px;
    width: 50px;
    height: 50px;
  }
`
export const HeaderContent = styled.div`
  width: 100%;
  margin: 5px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`
export const NameAndTitleContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-left: 5px;
  width: 400px;
`

export const NameAndTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 3rem;

  font-family: Inter;
  font-size: 20px;
  /* color: linear-gradient(to top,#8A6828, #F0B446 ); */
  /* Primeiro passo: definir um degradê como fundo */
  background-image: linear-gradient(to bottom, #f0b446, #8a6828);
  /* Segundo passo: apagar do fundo tudo que não estiver imediatamente atrás de texto */
  background-clip: text;
  -webkit-background-clip: text; /*Alguns navegadores precisam do prefixo */
  /* Terceiro passo: apagar o texto, deixando apenas o fundo atrás dele */
  -webkit-text-fill-color: transparent;
  /* Cor que contraste com o degradê, caso o navegador não suporte background-clip: text */
  color: black;
`

export const ButtonContent = styled.button`
  padding: 10px;
  border-radius: 5px;
  border: 0;
  background-image: linear-gradient(to top, #8a6828, #f0b446);
  color: white;
  font-family: Roboto;
  font-weight: bold;
  cursor: pointer;

  transition:
    color 0.5s,
    background-color 0.5s;

  &:hover {
    background-image: linear-gradient(
      to top,
      #8a6828,
      #f0b446,
      var(--dourado-1)
    );
  }
`

export const Avatar = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`
