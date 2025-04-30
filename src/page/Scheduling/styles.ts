import styled from "styled-components";

export const SchedulingContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    gap:1rem;

    margin: 0 auto;
    max-width: 100%;
    padding: 0 1rem 1rem 1rem;
    background: ${(props) => props.theme['--gray-400']};

`
export const SchedulingHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    /* margin: 0 10px; */
    width: 100%;
    background: white;
    color: black;
    padding: 0.25rem;
    border-radius: 5px;

`

export const DateDay = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
`
export const Title = styled.h1`
    font-size: 16px;
`
export const DataSemana = styled.span`

`

export const ListOfTheDay = styled.div`
    display: flex;
    gap:1rem;
`