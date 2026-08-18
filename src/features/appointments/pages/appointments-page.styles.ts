import styled from 'styled-components'

export const SpaceHeader = styled.div`
  padding: 40px;
`
export const AppointmentsPageContainer = styled.main`
  display: flex;
  flex-direction: column;
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
export const AppointmentsHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background: white;
  color: black;
  padding: 0.9rem;
  border-radius: 5px;
`

export const CurrentDate = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;

  input {
    border: 1px solid ${({ theme }) => theme.colors['gray-300']};
    border-radius: 6px;
    padding: 0.5rem;
  }
`
export const Title = styled.h1`
  font-size: 24px;
  font-family: Roboto;
  margin-left: 20px;
`

export const EmptyState = styled.p`
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors['gray-800']};
  padding: 2rem;
  text-align: center;
`

export const AppointmentsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(180px, 1fr));
  gap: 0.75rem;
  overflow-x: auto;
  padding-bottom: 1rem;
`

export const DayColumn = styled.section`
  min-height: 180px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.white};
  padding: 0.75rem;
`

export const DayTitle = styled.h2`
  margin-bottom: 0.75rem;
  color: ${({ theme }) => theme.colors['gray-800']};
  font-size: 0.875rem;
  text-transform: capitalize;
`

export const AppointmentCard = styled.article`
  display: grid;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
  border-left: 4px solid ${({ theme }) => theme.colors['green-500']};
  border-radius: 6px;
  background: ${({ theme }) => theme.colors['gray-100']};
  color: ${({ theme }) => theme.colors['gray-800']};
  padding: 0.75rem;
  font-size: 0.875rem;
`
