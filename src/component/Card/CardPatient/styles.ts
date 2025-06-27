import styled, { css } from 'styled-components'

interface StatusSchedulingProps {
  variant?: 'green' | 'red' | 'gray' | 'yellow'
}

export const CardPatientContainer = styled.div<StatusSchedulingProps>`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0 18px;
  /* background-color: ${({ theme }) => theme.colors['green-800']}; */

  gap: 2rem;

  ${(props) =>
    props.variant === 'green' &&
    css`
      background-color: ${({ theme }) => theme.colors['green-800']};
    `}

  ${(props) =>
    props.variant === 'red' &&
    css`
      background-color: ${({ theme }) => theme.colors['red-800']};
    `}
    ${(props) =>
    props.variant === 'yellow' &&
    css`
      background-color: ${({ theme }) => theme.colors['yellow-800']};
    `}

    ${(props) =>
    props.variant === 'gray' &&
    css`
      background-color: ${({ theme }) => theme.colors['gray-800']};
    `}
`

export const NameAndPathology = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: right;
  width: 100%;
`

export const Separator = styled.span`
  border: solid 1px ${({ theme }) => theme.colors.white};
  height: 100px;
`

const STATUS_COLORS = {
  yellow: 'yellow-500',
  green: 'green-500',
  red: 'red-500',
} as const
interface StatusProps {
  statusColor: keyof typeof STATUS_COLORS
}

export const Status = styled.span<StatusProps>`
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &::before {
    content: '';
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 9999px;
  }
`
// background: ${(props) => props.theme[STATUS_COLORS[props.statusColor]]};
