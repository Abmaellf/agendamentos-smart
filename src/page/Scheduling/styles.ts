import styled from 'styled-components'

export const SpaceHeader = styled.div`
  padding: 40px;
`
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

  @media (max-width: 980px) {
    width: 100%;
    display: flex;
    margin: 0;
    padding: 0;
    flex-direction: column;
    .px-1 {
      display: none;
    }
  }
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

  /* @media (max-width: 980px) {
    width: 100%;
    display: flex;
    margin: 0;
    padding: 0;
    flex-direction: column;
  } */
`

// export const DateDay = styled.div`
//   display: flex;
//   align-items: center;
//   justify-content: space-between;
// `

export const CurrentDate = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: 4px;
  gap: 2rem;
`
export const Title = styled.h1`
  font-size: 24px;
  font-family: Roboto;
  margin-left: 20px;
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

  @media (max-width: 980px) {
    display: none;
  }
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

export const WeekDatesContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;

  @media (max-width: 980px) {
    display: flex;
    flex-direction: column;
    /* color: red; */
  }
`

export const ListOfTheDayMobile = styled.div`
  display: none;

  @media (max-width: 980px) {
    display: block;
    width: 100%;

    /* flex-direction: column; */
  }
`

export const CardDaySchedulingContainerMobile = styled.div`
  display: none;

  @media (max-width: 980px) {
    display: block;
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    flex-direction: column;
    gap: 0.5rem;
  }
`
