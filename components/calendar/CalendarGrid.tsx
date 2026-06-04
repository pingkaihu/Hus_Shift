import {
  startOfMonth, endOfMonth, eachDayOfInterval, getDay, format,
} from 'date-fns'
import type { Shift, Holiday } from '@/lib/types'
import DayCell from './DayCell'

interface EntryWithName {
  profile_id: string
  shift_id: string
  work_date: string
  profiles: { full_name: string } | null
}

interface Props {
  monthDate: Date
  entries: EntryWithName[]
  shifts: Shift[]
  holidays: Holiday[]
  today: string
  onDayClick: (date: string, dayEntries: EntryWithName[]) => void
}

const WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六']

export default function CalendarGrid({
  monthDate, entries, shifts, holidays, today, onDayClick,
}: Props) {
  const days = eachDayOfInterval({
    start: startOfMonth(monthDate),
    end: endOfMonth(monthDate),
  })

  // getDay() returns 0=Sunday, so no adjustment needed (grid starts Sunday)
  const startOffset = getDay(days[0])

  return (
    <div className="px-3 py-2">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEK_LABELS.map((label, i) => (
          <div
            key={label}
            className={`text-center text-xs font-medium py-1 ${
              i === 0 ? 'text-[var(--danger)]' : 'text-[var(--neutral-500)]'
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Leading empty cells */}
        {Array.from({ length: startOffset }, (_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const dateNum = day.getDate()
          const holiday = holidays.find(h => h.date === dateStr)
          const dayEntries = entries.filter(e => e.work_date === dateStr)

          return (
            <DayCell
              key={dateStr}
              date={dateStr}
              dateNum={dateNum}
              isToday={dateStr === today}
              holiday={holiday}
              shifts={shifts}
              entries={dayEntries}
              onClick={() => onDayClick(dateStr, dayEntries)}
            />
          )
        })}
      </div>
    </div>
  )
}
