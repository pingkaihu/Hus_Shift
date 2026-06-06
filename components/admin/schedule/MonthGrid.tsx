'use client'

import { format } from 'date-fns'
import type { Shift, Profile, ScheduleEntry, Holiday, ScheduleMatrix, SelectionState } from '@/lib/types'
import MonthDayCell from '@/components/admin/schedule/MonthDayCell'

const DAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']

interface Props {
  calendarDates: { date: string; isCurrentMonth: boolean }[]
  shifts: Shift[]
  profiles: Profile[]
  matrix: ScheduleMatrix
  holidays: Holiday[]
  selection: SelectionState
  filteredProfileId: string | null
  density: 'full' | 'compact'
  onDateClick: (date: string) => void
  onDelete: (entry: ScheduleEntry) => void
}

export default function MonthGrid({
  calendarDates,
  shifts,
  profiles,
  matrix,
  holidays,
  selection,
  filteredProfileId,
  density,
  onDateClick,
  onDelete,
}: Props) {
  const todayStr = format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="flex flex-col gap-1">
      {/* Header row */}
      <div className="grid grid-cols-7">
        {DAY_LABELS.map((label) => (
          <div key={label} className="text-xs text-zinc-500 text-center py-2">
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDates.map(({ date, isCurrentMonth }) => {
          const holiday = holidays.find((h) => h.date === date)

          const isSelected =
            (selection.mode === 'single' && selection.date === date) ||
            (selection.mode === 'multi' && selection.dates.includes(date))

          const isToday = date === todayStr

          return (
            <MonthDayCell
              key={date}
              date={date}
              isCurrentMonth={isCurrentMonth}
              isToday={isToday}
              holiday={holiday}
              shifts={shifts}
              matrix={matrix}
              profiles={profiles}
              isSelected={isSelected}
              filteredProfileId={filteredProfileId}
              density={density}
              onClick={() => onDateClick(date)}
              onDelete={onDelete}
            />
          )
        })}
      </div>
    </div>
  )
}
