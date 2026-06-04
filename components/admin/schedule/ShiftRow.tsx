import type { Shift, Profile, ScheduleEntry, ScheduleMatrix } from '@/lib/types'
import DayCell from './DayCell'

interface Props {
  shift: Shift
  weekDates: string[]
  matrix: ScheduleMatrix
  profiles: Profile[]
  filteredProfileId: string | null
  selectedDates: string[]
  onDragStart: (date: string) => void
  onDragEnter: (date: string) => void
  onDelete: (entry: ScheduleEntry) => void
}

export default function ShiftRow({
  shift, weekDates, matrix, profiles, filteredProfileId,
  selectedDates, onDragStart, onDragEnter, onDelete,
}: Props) {
  return (
    <>
      {/* Shift label cell */}
      <div className="p-3 border-b border-zinc-200 flex items-center">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-8 rounded-sm shrink-0"
            style={{ backgroundColor: shift.color }}
          />
          <div>
            <p className="text-sm font-medium text-zinc-800">{shift.name}</p>
            <p className="text-xs text-zinc-400">
              {shift.start_time.slice(0, 5)}–{shift.end_time.slice(0, 5)}
            </p>
          </div>
        </div>
      </div>
      {weekDates.map(date => (
        <DayCell
          key={date}
          shift={shift}
          date={date}
          entries={matrix[shift.id]?.[date] ?? []}
          profiles={profiles}
          filteredProfileId={filteredProfileId}
          isSelected={selectedDates.includes(date)}
          onPointerDown={onDragStart}
          onPointerEnter={onDragEnter}
          onDelete={onDelete}
        />
      ))}
    </>
  )
}
