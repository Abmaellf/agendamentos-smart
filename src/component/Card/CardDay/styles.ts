import styled from 'styled-components'

interface IsDayProps {
    variant: 'false' | 'true';
}

export const CardDayContainer = styled.div<IsDayProps>`
  display: flex;
  flex-direction: column;
  background-color: ${props => props.variant === 'true' ? props.theme.colors['gray-600'] : props.theme.colors.white};
  /* background-color: ${({ theme }) => theme.colors.white}; */
  color: ${({ theme }) => theme.colors['gray-800']};
  padding: 10px;
  border-radius: 5px;
  border: 1px solid ${props => props.variant === 'true' ? props.theme.colors.white :  props.theme.colors['gray-600'] };
  width: 320px; /*Possívelmente retirars*/
  gap: 0.5rem;
`
