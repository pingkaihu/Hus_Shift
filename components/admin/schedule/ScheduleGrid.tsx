'use client'

import { useEffect } from 'react'
import type { Shift, Profile, Holiday, ScheduleEntry, ScheduleMatrix, SelectionState } from '@/lib/types'
import DateHeader from './DateHeader'
import ShiftRow from './ShiftRow'

interface Props {
  shifts: Shift[]
  weekDates: string[]
  matrix: ScheduleMatrix
  holidays: Holiday[]
  profiles: Profile[]
  selection: SelectionState
  filteredProfileId: string | null
  onDateClick: (date: string) => void
  onDragStart: (date: string) => void
  onDragEnter: (date: string) => void
  onDragEnd: () => void
  onDelete: (entry: ScheduleEntry) => void
}

export default function ScheduleGrid({
  shifts, weekDates, matrix, holidays, profiles, selection,
  filteredProfileId, onDateClick, onDragStart, onDragEnter, onDragEnd, onDelete,
}: Props) {
  // Listen for global pointerup to end drag
  useEffect(() => {
    if (selection.mode !== 'dragging') return
    window.addEventListener('pointerup', onDragEnd)
    return () => window.removeEventListener('pointerup', onDragEnd)
  }, [selection.mode, onDragEnd])

  const selectedDates =
    selection.mode === 'dragging' || selection.mode === 'multi'
      ? selection.dates
      : []

  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-auto flex-1">
      <div
        className="grid min-w-[640px]"
        style={{ gridTemplateColumns: `160px repeat(7, 1fr)` }}
      >
        {/* Header: empty corner + DateHeader × 7 */}
        <div className="p-3 border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-400 font-medium">
          班次
        </div>
        {weekDates.map(date => (
          <DateHeader
            key={date}
            date={date}
            holidays={holidays}
            entries={Object.values(matrix).flatMap(byDate => byDate[date] ?? [])}
            totalShifts={shifts.length}
            isSelected={selectedDates.includes(date)}
            onClick={() => onDateClick(date)}
          />
        ))}

        {/* Shift rows */}
        {shifts.map(shift => (
          <ShiftRow
            key={shift.id}
            shift={shift}
            weekDates={weekDates}
            matrix={matrix}
            profiles={profiles}
            filteredProfileId={filteredProfileId}
            selectedDates={selectedDates}
            onDragStart={onDragStart}
            onDragEnter={onDragEnter}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  )
}
