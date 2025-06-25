import styled from 'styled-components'

export const CardDayContainer = styled.div`
  display: flex;
  flex-direction: column;

  background-color: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors['gray-800']};
  padding: 10px;
  border-radius: 5px;
  width: 320px; /*Possívelmente retirars*/
  gap: 0.5rem;
`

// Retirar
export const TitleDayWeek = styled.div`
  /* display: flex; */
  /* align-items: center; */
`

export const ListPatient = styled.div`
  display: flex;
  flex-direction: column;
  /* border-radius: 5px; */
  gap: 0.4rem;
`
