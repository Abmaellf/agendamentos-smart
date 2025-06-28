import { ListNumberDate, WeekDatesContainer } from './styles'
import { useContext, useEffect, useState } from 'react'
import { SchedulingContext } from '../../context/SchedulingContext'

interface CurrentDate {
  date: Date
}
export function WeekDates(currentDate: CurrentDate) {
  const [listWeek, setListWeek] = useState([''])

  const { WeekDates } = useContext(SchedulingContext)

  function dateweeks() {
    const label = WeekDates(currentDate.date).map((day) => day.data)
    setListWeek(label)
    return label
  }

  useEffect(() => {
    dateweeks()
  }, [currentDate])

  return (
    <WeekDatesContainer>
      {listWeek.map((l) => (
        <ListNumberDate> {l}</ListNumberDate>
      ))}
    </WeekDatesContainer>
  )
}
