import styled, { css } from 'styled-components'

export const WeekDatesContainer = styled.div`
  display: flex;
  align-items: center;
  /* max-width: 100%; */
  /* margin: 2px; */
  gap: 0.75rem;
  /* padding: 0 100px; */
  border-radius: 5px;
  /* background: red; */
`
interface WeekDayProps {
  variant?: 'green'
}

export const WeekDatesLabel = styled.div<WeekDayProps>`
  /* margin-left: 5px; */
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  padding: 10px;
  border-radius: 4px;
  width: 320px; /*Possívelmente retirars*/

  ${(props) =>
    props.variant === 'green' &&
    css`
      background-color: ${({ theme }) => theme.colors['gray-600']};
    `}
`
