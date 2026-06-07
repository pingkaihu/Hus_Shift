import { format, parseISO, isToday } from 'date-fns'
import type { Holiday, ScheduleEntry } from '@/lib/types'

interface Props {
  date: string            // "YYYY-MM-DD"
  holidays: Holiday[]
  entries: ScheduleEntry[] // all entries for this date (for heat-map)
  totalShifts: number
  isSelected: boolean
  onClick: () => void
}

export default function DateHeader({
  date, holidays, entries, totalShifts, isSelected, onClick,
}: Props) {
  const d = parseISO(date)
  const holiday = holidays.find(h => h.date === date)
  const today = isToday(d)

  // Heat-map: ratio of filled shifts → opacity class
  const ratio = totalShifts > 0 ? entries.length / totalShifts : 0
  const heatClass =
    ratio === 0 ? '' :
    ratio <= 1/3 ? 'bg-[var(--accent-100)]' :
    ratio <= 2/3 ? 'bg-[var(--accent-200)]' :
    'bg-[var(--accent-500)]/30'

  const dayLabel = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'p-3 border-b border-l border-zinc-200 text-left transition-colors hover:bg-[var(--accent-50)]',
        heatClass,
        isSelected ? 'ring-2 ring-[var(--accent-500)] ring-inset' : '',
      ].join(' ')}
    >
      <div className="flex items-center gap-1.5">
        <span
          className={`text-sm font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
            today
              ? 'bg-[var(--accent-500)] text-white'
              : holiday?.is_holiday
              ? 'text-red-500'
              : 'text-zinc-700'
          }`}
        >
          {format(d, 'd')}
        </span>
        <span className="text-xs text-zinc-500">({dayLabel})</span>
        {holiday && holiday.source !== 'weekend' && (
          <span
            className={`text-xs truncate max-w-[60px] ${
              holiday.is_holiday ? 'text-red-500' : 'text-amber-600'
            }`}
          >
            {holiday.name}
          </span>
        )}
      </div>
    </button>
  )
}
