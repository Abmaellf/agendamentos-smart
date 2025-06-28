import { CaretLeft, CaretRight } from 'phosphor-react'
import {
  ButtonSelectDate,
  CardDaySchedulingContainer,
  DataSemana,
  DateDay,
  ListOfTheDay,
  SchedulingContainer,
  SchedulingHeader,
  Title,
  WeekDatesContainer,
} from './styles'
import { CardDay } from '../../component/Card/CardDay'
import { WeekDates } from '../../component/WeekDate'
import { startOfWeek, addDays, format, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'

import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

import { useState } from 'react'
import { Helmet } from 'react-helmet-async'

export function Scheduling() {
  const today = new Date() // Pega a data de hoje
  const [startDate, setStartDate] = useState(today)
  const start = startOfWeek(startDate, { weekStartsOn: 1 })

  const days = Array.from({ length: 5 }).map((_, index) => {
    const date = addDays(start, index)
    return {
      date,
      data: format(date, 'dd/MM/yyyy', { locale: ptBR }),
      isToday: isToday(date),
      dayWeek: date.getDay(),
    }
  })

  function setNewStartDate(date: Date | null) {
    if (!date) {
      throw new Error('Data não existe')
    }
    const dateString = new Date(date)
    setStartDate(dateString)
  }
  return (
    <SchedulingContainer>
      <Helmet title="Agendamentos" />
      <SchedulingHeader>
        <Title> Agendamentos </Title>
        <DateDay>
          <CaretLeft size={32} />

          <DataSemana>
            {format(startDate, 'dd/MM/yyyy', { locale: ptBR })}{' '}
          </DataSemana>

          <CaretRight size={32} color="black" />
        </DateDay>
      </SchedulingHeader>

      <ListOfTheDay>
        <WeekDatesContainer>
          <WeekDates date={startDate} />
        </WeekDatesContainer>

        <CardDaySchedulingContainer>
          {days.map((day) => {
            return (
              <CardDay
                key={day.dayWeek}
                isToday={day.isToday}
                date={day.data}
                dayWeek={day.dayWeek}
              />
            )
          })}
        </CardDaySchedulingContainer>

        {/* // https://github.com/devsuperior/aula-react-datepicker
                // https://github.com/Hacker0x01/react-datepicker */}

        <ButtonSelectDate>
          <DatePicker
            selected={startDate}
            onChange={(date) => setNewStartDate(date)}
          />
        </ButtonSelectDate>
      </ListOfTheDay>
    </SchedulingContainer>
  )
}
