// import { CaretLeft, CaretRight } from 'phosphor-react'

import {
  // ButtonSelectDate,
  CardDaySchedulingContainer,
  CurrentDate,
  // DateDay,
  ListOfTheDay,
  SchedulingContainer,
  SchedulingHeader,
  SpaceHeader,
  Title,
  WeekDatesContainer,
} from './styles'

import * as React from 'react'
import { ChevronDownIcon } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Calendar } from '../../components/ui/calendar'
import { Label } from '../../components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../components/ui/popover'
import { CardDay } from '../../component/Card/CardDay'
import { WeekDates } from '../../component/WeekDate'
import { startOfWeek, addDays, format, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'

// import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

import { useState } from 'react'
import { Helmet } from 'react-helmet-async'

export function Scheduling() {
  const today = new Date() // Pega a data de hoje
  const [startDate, setStartDate] = useState<Date>(today)
  const start = startOfWeek(startDate, { weekStartsOn: 1 })

  const [open, setOpen] = React.useState(false)

  const days = Array.from({ length: 5 }).map((_, index) => {
    const date = addDays(start, index)
    return {
      date,
      data: format(date, 'dd/MM/yyyy', { locale: ptBR }),
      isToday: isToday(date),
      dayWeek: date.getDay(),
    }
  })

  function setNewStartDate(date: Date | undefined) {
    if (!date) {
      throw new Error('Data não existe')
    }
    const dateString = new Date(date)
    setStartDate(dateString)
  }
  return (
    <>
      <SpaceHeader> </SpaceHeader>

      <SchedulingContainer>
        <Helmet title="Agendamentos" />
        <SchedulingHeader>
          <Title> Agendamentos </Title>

          {/* <DateDay> */}
          {/* <CaretLeft size={32} /> */}

          <CurrentDate>
            <div className="flex items-center gap-3">
              <Label htmlFor="date" className="px-1">
                Selecione a data
              </Label>
              <Popover modal={true} open={open} onOpenChange={setOpen}>
                <PopoverTrigger>
                  <Button
                    variant="outline"
                    id="date"
                    className="w-48 justify-around font-normal"
                  >
                    {startDate ? startDate.toLocaleDateString() : 'Select date'}
                    <ChevronDownIcon />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto overflow-hidden p-0"
                  align="center"
                >
                  <Calendar
                    mode="single"
                    selected={startDate}
                    captionLayout="dropdown"
                    onSelect={(date) => {
                      setNewStartDate(date)
                      setOpen(false)
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CurrentDate>

          {/* <CaretRight size={32} color="black" /> */}
          {/* </DateDay> */}
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

          {/* <ButtonSelectDate>
          <DatePicker
            selected={startDate}
            onChange={(date) => setNewStartDate(date)}
          />
        </ButtonSelectDate> */}
        </ListOfTheDay>
      </SchedulingContainer>
    </>
  )
}
