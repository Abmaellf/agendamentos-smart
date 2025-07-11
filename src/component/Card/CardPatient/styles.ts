import styled, { css } from 'styled-components'

interface StatusIsDayPropsProps {
  status: string,
  variant: boolean;
} 
// interface IsDayProps {
    
// }
export const CardPatientContainer = styled.div<StatusIsDayPropsProps>`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0 18px;
  /* background-color: ${({ theme }) => theme.colors['green-800']}; */

  gap: 2rem;
  border: 1px solid ${props => props.variant === true ? props.theme.colors.white :  props.theme.colors['gray-600'] };
  /* background-color: ${props => props.status === 'Agendar' ? props.theme.colors['green-800'] :  props.theme.colors['gray-600'] };  */

background-color: ${props => {
    if (props.status === 'Agendar') {
      return props.theme.colors['green-800'];
    } else if (props.status === 'cancelado') {
      return props.theme.colors['gray-700'];
    } else if (props.status === 'Agendado') {
      return props.theme.colors['gray-700'];
    } else {
      return 'white';
    }
  }};


color: ${props => {
    if (props.status === 'Agendar') {
      return props.theme.colors['gray-700'];
    } else if (props.status === 'cancelado') {
      return props.theme.colors['gray-700'];
    } else if (props.status === 'Agendado') {
      return props.theme.colors['white'];
    } else {
      return props.theme.colors['gray-700'];
    }
  }};
  /* ${props => props.status === "Agendar" &&  css`background-color: ${({ theme }) => theme.colors['green-800']}; `} */
 /*
  
  ${(props) =>
    props.status === 'agendado' &&
    css`
      background-color: ${({ theme }) => theme.colors['red-800']};
    `}
    ${(props) =>
    props.status === 'agendar' &&
    css`
      background-color: ${({ theme }) => theme.colors['yellow-800']};
    `}

    ${(props) =>
    props.status === 'gray' &&
    css`
      background-color: ${({ theme }) => theme.colors['gray-800']};
    `}  */
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

// const STATUS_COLORS = {
//   yellow: 'yellow-500',
//   green: 'green-500',
//   red: 'red-500',
// } as const
// interface StatusProps {
//   statusColor: keyof typeof STATUS_COLORS
// }

// export const Status = styled.span<StatusProps>`
//   display: flex;
//   align-items: center;
//   gap: 0.5rem;

//   &::before {
//     content: '';
//     width: 0.5rem;
//     height: 0.5rem;
//     border-radius: 9999px;
//   }
// `
// background: ${(props) => props.theme[STATUS_COLORS[props.statusColor]]};
