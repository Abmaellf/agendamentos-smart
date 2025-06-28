import styled from 'styled-components'

export const SchedulingContainer = styled.div`
  display: flex;
  flex-direction: column;
  /* align-items: center; */
  justify-content: space-between;
  gap: 1rem;

  margin: 0 auto;
  max-width: 100%;
  padding: 0 1rem 1rem 1rem;
  background-color: ${({ theme }) => theme.colors['gray-600']};
`
export const SchedulingHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  /* margin: 0 10px; */
  width: 100%;
  background: white;
  color: black;
  padding: 0.9rem;
  border-radius: 5px;
`

export const DateDay = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`
export const Title = styled.h1`
  font-size: 24px;
  font-family: Roboto;
  margin-left: 20px;
`
export const DataSemana = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: 4px;
  gap: 2rem;
`

export const ListOfTheDay = styled.div`
  display: flex;
  align-items: center; /* desfazer alinhmento a esquerdar */
  flex-direction: column;
  /* justify-content: space-around; */
  background-color: ${({ theme }) => theme.colors['gray-800']};
  padding: 1rem 2rem;
  gap: 1rem;
  max-width: 100%;
`
//Excluir depois
export const WeekContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: black;
  border-radius: 5px;
  gap: 0.75rem;
  margin: 0 auto;
  max-width: 100%;
`

export const CardDaySchedulingContainer = styled.div`
  display: flex;
  gap: 0.75rem;
`

export const ButtonSelectDate = styled.button`
  /* display: block; */
  padding: 20px;
  border-radius: 5px;
  background-color: ${({ theme }) => theme.colors['yellow-dark']};
`

export const WeekDatesContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
`
