import { ListNumberDate, WeekDatesContainer } from './styles'
import { useEffect, useState } from 'react'
import { SchedulingContext } from '../../context/SchedulingContext'
import { useContextSelector } from 'use-context-selector'

interface CurrentDate {
  date: Date
}
export function WeekDates(currentDate: CurrentDate) {
  const [listWeek, setListWeek] = useState([''])

  // const { WeekDates } = useContext(SchedulingContext)

    const  WeekDates  = useContextSelector(
			SchedulingContext, 
			(context) => {
			 return context.WeekDates
		    });

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
