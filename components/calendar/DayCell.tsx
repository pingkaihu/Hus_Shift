import type { Shift, Holiday } from '@/lib/types'
import ShiftBar from './ShiftBar'

interface EntryWithName {
  profile_id: string
  shift_id: string
  profiles: { full_name: string } | null
}

interface Props {
  date: string            // "YYYY-MM-DD"
  dateNum: number
  isToday: boolean
  holiday: Holiday | undefined
  shifts: Shift[]
  entries: EntryWithName[]
  onClick: () => void
}

export default function DayCell({
  date, dateNum, isToday, holiday, shifts, entries, onClick,
}: Props) {
  const isHoliday = holiday?.is_holiday === true
  const isMakeUp = holiday?.is_holiday === false

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-xl border border-[var(--neutral-200)] p-1.5 min-h-[70px] flex flex-col text-left w-full',
        'transition-colors hover:border-[var(--accent-200)] hover:bg-[var(--accent-50)]',
        isMakeUp ? 'bg-[var(--holiday-bg)]' : 'bg-white',
      ].join(' ')}
    >
      {/* Date number */}
      <span
        className={[
          'text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full mb-0.5',
          isToday ? 'bg-[var(--accent-500)] text-white' : '',
          isHoliday && !isToday ? 'text-[var(--danger)]' : 'text-[var(--neutral-900)]',
        ].join(' ')}
      >
        {dateNum}
      </span>

      {/* Holiday name */}
      {holiday && holiday.source !== 'weekend' && (
        <span
          className={`text-[9px] leading-none mb-0.5 truncate ${
            isHoliday ? 'text-[var(--danger)]' : 'text-[var(--warning)]'
          }`}
        >
          {holiday.name}
        </span>
      )}

      {/* Shift bars */}
      {shifts.map(shift => (
        <ShiftBar
          key={shift.id}
          shift={shift}
          entries={entries.filter(e => e.shift_id === shift.id)}
        />
      ))}
    </button>
  )
}
