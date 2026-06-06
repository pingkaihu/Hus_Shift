import { format, parseISO } from 'date-fns'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Shift, Profile, ScheduleMatrix } from '@/lib/types'
import ShiftSelector from './ShiftSelector'

interface Props {
  open: boolean
  dates: string[]       // multi-selected dates in "YYYY-MM-DD"
  shifts: Shift[]
  profiles: Profile[]
  matrix: ScheduleMatrix
  onInsert: (shiftId: string, profileIds: string[], dates: string[]) => Promise<void>
  onClose: () => void
  onClear: () => void
}

export default function BulkPanel({
  open, dates, shifts, profiles, matrix, onInsert, onClose, onClear,
}: Props) {
  const sortedDates = [...dates].sort()

  return (
    <div
      className={`absolute right-0 top-0 h-full w-72 bg-white border-l border-zinc-200 shadow-[var(--shadow-modal)] flex flex-col transition-transform duration-200 z-10 ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-zinc-200">
        <h3 className="text-sm font-semibold text-zinc-800">批量排班</h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="text-xs text-zinc-500" onClick={onClear}>
            取消選取
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Selected dates list */}
        <div>
          <p className="text-xs font-medium text-zinc-500 uppercase mb-2">
            已選 {dates.length} 天
          </p>
          <div className="flex flex-wrap gap-1.5">
            {sortedDates.map(date => (
              <span
                key={date}
                className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium"
              >
                {format(parseISO(date), 'M/d')}
              </span>
            ))}
          </div>
        </div>

        {/* ShiftSelector in Mode B (multiple dates) */}
        <ShiftSelector
          shifts={shifts}
          profiles={profiles}
          selectedDates={sortedDates}
          matrix={matrix}
          onConfirm={(shiftId, profileIds) => onInsert(shiftId, profileIds, sortedDates)}
          onCancel={onClose}
        />
      </div>
    </div>
  )
}
