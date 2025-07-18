import {Card, Text} from '@sanity/ui'
import {isPast} from 'date-fns'
import {useCallback} from 'react'

interface CalendarDayProps {
  date: Date
  focused?: boolean
  onSelect: (date: Date) => void
  isCurrentMonth?: boolean
  isToday: boolean
  selected?: boolean
  isPastDisabled?: boolean
}

export function CalendarDay(props: CalendarDayProps) {
  const {date, focused, isCurrentMonth, isToday, onSelect, selected, isPastDisabled} = props

  const handleClick = useCallback(() => {
    onSelect(date)
  }, [date, onSelect])

  return (
    <div aria-selected={selected} data-ui="CalendarDay">
      <Card
        aria-label={date.toDateString()}
        aria-pressed={selected}
        as="button"
        __unstable_focusRing
        data-weekday
        data-focused={focused ? 'true' : ''}
        role="button"
        tabIndex={-1}
        disabled={isPastDisabled && !isToday && isPast(date)}
        onClick={handleClick}
        padding={2}
        radius={2}
        selected={selected}
        tone={isToday || selected ? 'primary' : 'default'}
        data-testid={`calendar-day-${date.toDateString().replaceAll(' ', '-')}`}
      >
        <Text
          muted={!selected && !isCurrentMonth}
          size={1}
          style={{textAlign: 'center'}}
          weight={isCurrentMonth ? 'medium' : 'regular'}
        >
          {date.getDate()}
        </Text>
      </Card>
    </div>
  )
}
