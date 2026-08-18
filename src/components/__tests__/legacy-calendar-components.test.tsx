import { render, screen } from '@testing-library/react'
import { format } from 'date-fns'
import { describe, expect, it } from 'vitest'

import { CardDay } from '../Card/CardDay'
import { CardPatient } from '../Card/CardPatient'
import { WeekDates } from '../WeekDate'

const appointment = {
  id: 'appointment-a',
  namePatient: 'Ana Paciente',
  pathology: ['Fisioterapia', 'Pilates'],
  date: new Date('2026-08-13T12:00:00-04:00'),
  hours: '10:00',
  status: 'Cancelado',
}

describe('componentes legados da agenda', () => {
  it('apresenta os cinco dias úteis da semana em português', () => {
    render(<WeekDates date={new Date('2026-08-13T12:00:00-04:00')} />)

    expect(screen.getAllByRole('listitem')).toHaveLength(5)
    expect(screen.getByText('segunda-feira 10/08/2026')).toBeVisible()
    expect(screen.getByText('sexta-feira 14/08/2026')).toBeVisible()
  })

  it('mantém o contrato visual e os dados do cartão de paciente', () => {
    render(<CardPatient appointment={appointment} isToDay />)

    const card = screen.getByRole('article', {
      name: 'Agendamento de Ana Paciente',
    })
    expect(card).toHaveAttribute('data-status', 'Cancelado')
    expect(card).toHaveAttribute('data-today', 'true')
    expect(card).toHaveClass('bg-[#121214]', 'text-white')
    expect(screen.getByText('Fisioterapia, Pilates')).toBeVisible()
  })

  it.each([
    ['Agendar', 'bg-white'],
    ['Agendado', 'bg-[#8d8d99]'],
    ['Concluido', 'bg-brand'],
    ['Cancelado', 'bg-[#121214]'],
    ['Falta', 'bg-appointment-missed'],
    ['Em atendimento', 'bg-appointment-rescheduled'],
    ['Reagendado', 'border-[#8d8d99]'],
    ['Ativo', 'bg-white'],
  ])('preserva o token visual do status legado %s', (status, token) => {
    render(
      <CardPatient appointment={{ ...appointment, status }} isToDay={false} />,
    )

    const card = screen.getByRole('article', {
      name: 'Agendamento de Ana Paciente',
    })
    expect(card).toHaveAttribute('data-status', status)
    expect(card).toHaveClass(token)
  })

  it('filtra e apresenta os fixtures do dia informado', () => {
    render(
      <CardDay date={format(new Date(), 'dd/MM/yyyy')} isToday dayWeek={4} />,
    )

    expect(screen.getByText('Abmael')).toBeVisible()
    expect(screen.getByText('Ana')).toBeVisible()
  })
})
