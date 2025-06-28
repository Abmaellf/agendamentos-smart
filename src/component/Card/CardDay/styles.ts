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
