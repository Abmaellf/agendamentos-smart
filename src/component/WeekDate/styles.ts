import styled from 'styled-components'

export const WeekDatesContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
`
export const ListNumberDate = styled.div`
  padding: 0 100px;
  border-radius: 5px;
  background-color: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors['gray-800']};
  width: 320px;
`
