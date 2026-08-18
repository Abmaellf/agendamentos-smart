import styled from 'styled-components'

import type { AppointmentStatus } from '../model/appointment'

const appointmentColors: Record<AppointmentStatus, string> = {
  AGENDADO: '#02B160',
  FALTA: '#DD4B39',
  REAGENDADO: '#FF9D18',
  CANCELADO: '#4F4D4A',
  ATENDENDO: '#6F7374',
  FINALIZADO: '#6F7374',
}

const appointmentGradients: Record<AppointmentStatus, string> = {
  AGENDADO: 'linear-gradient(135deg, #02B160 0%, #019B55 100%)',
  FALTA: 'linear-gradient(135deg, #DD4B39 0%, #C83E31 100%)',
  REAGENDADO: 'linear-gradient(135deg, #FF9D18 0%, #E9890F 100%)',
  CANCELADO: 'linear-gradient(135deg, #4F4D4A 0%, #393735 100%)',
  ATENDENDO: 'linear-gradient(135deg, #7C8182 0%, #626667 100%)',
  FINALIZADO: 'linear-gradient(135deg, #6F7374 0%, #55595A 100%)',
}

export const SpaceHeader = styled.div`
  height: 4rem;
`

export const AppointmentsPageContainer = styled.main`
  display: flex;
  min-height: calc(100vh - 4rem);
  flex-direction: column;
  gap: 0.25rem;
  background-color: #29292e;
  background-image: linear-gradient(135deg, #242528 0%, #303236 100%);
  padding-bottom: 1rem;
`

export const AppointmentsHeader = styled.header`
  display: grid;
  min-height: 4rem;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  background-color: ${({ theme }) => theme.colors.white};
  background-image: linear-gradient(115deg, #ffffff 0%, #fbfdfc 100%);
  color: #3f3e3c;
  padding: 0.5rem clamp(1rem, 5vw, 6.25rem);
  border-radius: 0 0 0.35rem 0.35rem;
  box-shadow: 0 2px 5px rgb(0 0 0 / 20%);

  @media (max-width: 720px) {
    grid-template-columns: 1fr auto;
    gap: 0.5rem;
    padding-inline: 0.75rem;
  }
`

export const CurrentDate = styled.nav`
  position: relative;
  display: flex;
  grid-column: 2;
  align-items: center;
  justify-content: center;
  gap: clamp(0.5rem, 2vw, 1.5rem);
  border: 1px solid rgb(2 177 96 / 10%);
  border-radius: 999px;
  background: linear-gradient(135deg, #ffffff 0%, #f2faf6 100%);
  padding: 0.1rem 0.35rem;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 85%);

  @media (max-width: 720px) {
    grid-column: 1;
    grid-row: 2;
    justify-self: start;
  }
`

export const DatePickerControl = styled.div`
  position: relative;
  display: grid;
  min-width: 16rem;
  place-items: center;

  @media (max-width: 720px) {
    min-width: 0;
  }
`

export const HeaderDateInput = styled.input`
  position: absolute;
  z-index: 1;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  opacity: 0;
  cursor: pointer;

  &:focus-visible + time {
    border-radius: 0.25rem;
    outline: 3px solid rgb(2 177 96 / 35%);
    outline-offset: 2px;
  }
`

export const DateNavigationButton = styled.button`
  display: grid;
  width: 2.5rem;
  height: 2.5rem;
  flex: 0 0 auto;
  place-items: center;
  border: 0;
  border-radius: 0.35rem;
  background: transparent;
  color: #b9b9b9;
  cursor: pointer;
  transition:
    color 160ms ease,
    background-color 160ms ease;

  &:hover {
    background: rgb(2 177 96 / 9%);
    color: #018e4d;
  }

  &:focus-visible {
    outline: 3px solid rgb(2 177 96 / 35%);
    outline-offset: 1px;
  }

  svg {
    width: 2rem;
    height: 2rem;
    stroke-width: 2.5;
  }
`

export const HeaderDate = styled.time`
  color: #3f3e3c;
  font-size: clamp(1rem, 1.8vw, 1.5rem);
  font-weight: 700;
  text-align: center;
  white-space: nowrap;

  @media (max-width: 720px) {
    min-width: 0;
    font-size: 0.875rem;
  }
`

export const Title = styled.h1`
  grid-column: 1;
  grid-row: 1;
  margin: 0;
  color: #3f3e3c;
  font-size: clamp(1.15rem, 1.8vw, 1.5rem);
  font-weight: 700;

  @media (max-width: 720px) {
    grid-column: 1 / -1;
  }
`

export const HeaderAction = styled.div`
  display: flex;
  grid-column: 3;
  grid-row: 1;
  justify-content: flex-end;

  button {
    width: clamp(8rem, 12vw, 11.5rem);
    height: 2.5rem;
    border: 1px solid rgb(2 177 96 / 25%);
    border-radius: 0.45rem;
    background-color: #ffffff;
    background-image: linear-gradient(135deg, #ffffff 0%, #edf8f2 100%);
    box-shadow: 0 4px 12px rgb(37 50 44 / 10%);
    color: #018e4d;
    font-size: 0.9rem;
  }

  button:hover {
    background-color: #f4faf7;
    background-image: linear-gradient(135deg, #f8fcfa 0%, #e3f4eb 100%);
  }

  @media (max-width: 720px) {
    grid-column: 2;
    grid-row: 2;

    button {
      width: auto;
    }
  }
`

export const EmptyState = styled.p`
  margin: 0.75rem 1rem 0.5rem;
  border-radius: 0.35rem;
  border: 1px solid rgb(2 177 96 / 12%);
  background-color: ${({ theme }) => theme.colors.white};
  background-image: linear-gradient(135deg, #ffffff 0%, #f4faf7 100%);
  color: #4f4d4a;
  padding: 0.75rem 1rem;
  text-align: center;
`

export const FeedbackPanel = styled.div`
  margin: 0.75rem 1rem 0.5rem;
  border-radius: 0.35rem;
  border: 1px solid rgb(2 177 96 / 12%);
  background-color: ${({ theme }) => theme.colors.white};
  background-image: linear-gradient(135deg, #ffffff 0%, #f4faf7 100%);
  color: #4f4d4a;
  padding: 0.75rem 1rem;
  text-align: center;

  button {
    margin-top: 0.5rem;
  }
`

export const AppointmentsGrid = styled.div`
  display: grid;
  min-height: clamp(26rem, 58vh, 34rem);
  grid-template-columns: repeat(5, minmax(12rem, 1fr));
  gap: 0.25rem;
  overflow-x: auto;
  background-color: #29292e;
  background-image: linear-gradient(135deg, #242528 0%, #303236 100%);
`

export const DayColumn = styled.section<{ $selected: boolean }>`
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  border-radius: 0 0 0.85rem 0.85rem;
  background-color: ${({ $selected }) => ($selected ? '#92999B' : '#FFFFFF')};
  background-image: ${({ $selected }) =>
    $selected
      ? 'linear-gradient(160deg, #A6AEB0 0%, #92999B 48%, #858D8F 100%)'
      : 'linear-gradient(180deg, #FFFFFF 0%, #FBFCFC 65%, #F1F5F3 100%)'};
  padding: 0.75rem clamp(0.5rem, 1vw, 1rem) 1.25rem;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 45%);
  scroll-snap-align: start;
`

export const DayTitle = styled.h2`
  position: relative;
  width: 100%;
  min-height: 3.25rem;
  margin: 0;
  overflow: hidden;
  border: 1px solid rgb(79 77 74 / 8%);
  background-color: ${({ theme }) => theme.colors.white};
  background-image: linear-gradient(135deg, #ffffff 0%, #f4f7f5 100%);
  box-shadow: 0 5px 12px rgb(33 35 36 / 14%);
  color: #6f7374;
  padding: 0.55rem 0.75rem;
  font-size: clamp(1.15rem, 2vw, 1.65rem);
  font-weight: 700;
  line-height: 1.35;
  text-align: center;
  text-transform: capitalize;

  &::after {
    position: absolute;
    right: 18%;
    bottom: 0;
    left: 18%;
    height: 2px;
    border-radius: 999px;
    background: linear-gradient(90deg, transparent, #02b160, transparent);
    content: '';
    opacity: 0.55;
  }
`

export const AppointmentList = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 0.4rem;
  margin-top: 1.75rem;
`

export const AppointmentCard = styled.article<{ $status: AppointmentStatus }>`
  position: relative;
  display: grid;
  width: 100%;
  min-height: 5.5rem;
  grid-template-columns: 40% 60%;
  overflow: hidden;
  isolation: isolate;
  border: 1px solid rgb(255 255 255 / 72%);
  border-radius: 0.35rem;
  background-color: ${({ $status }) => appointmentColors[$status]};
  background-image: ${({ $status }) => appointmentGradients[$status]};
  box-shadow:
    0 8px 18px rgb(32 32 36 / 16%),
    inset 0 1px 0 rgb(255 255 255 / 18%);
  color: ${({ theme }) => theme.colors.white};
  font-size: 0.875rem;
  transition:
    transform 160ms ease,
    box-shadow 160ms ease,
    filter 160ms ease;

  &::after {
    position: absolute;
    z-index: -1;
    top: -3rem;
    right: -2.5rem;
    width: 7rem;
    height: 7rem;
    border-radius: 50%;
    background: radial-gradient(
      circle,
      rgb(255 255 255 / 14%),
      transparent 68%
    );
    content: '';
    pointer-events: none;
  }

  &:hover {
    z-index: 1;
    filter: saturate(1.04);
    transform: translateY(-2px);
    box-shadow:
      0 11px 22px rgb(32 32 36 / 22%),
      inset 0 1px 0 rgb(255 255 255 / 22%);
  }
`

export const AppointmentTime = styled.time`
  display: grid;
  place-items: center;
  border-right: 1px solid rgb(255 255 255 / 88%);
  background: rgb(0 0 0 / 4%);
  padding: 0.75rem 0.5rem;
  font-size: 1rem;
  font-weight: 700;
`

export const AppointmentDetails = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: center;
  gap: 0.15rem;
  padding: 0.65rem 0.75rem;

  strong,
  span {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  strong {
    font-size: 0.9rem;
  }
`

export const ScreenReaderDetails = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  clip-path: inset(50%);
  white-space: nowrap;
`
