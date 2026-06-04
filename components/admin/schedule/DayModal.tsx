'use client'

import { format, parseISO } from 'date-fns'
import { Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { Shift, Profile, ScheduleEntry, ScheduleMatrix } from '@/lib/types'
import ShiftSelector from './ShiftSelector'

const DAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']

interface Props {
  open: boolean
  date: string           // "YYYY-MM-DD"
  shifts: Shift[]
  profiles: Profile[]
  matrix: ScheduleMatrix
  onInsert: (shiftId: string, profileIds: string[], dates: string[]) => Promise<void>
  onDelete: (entry: ScheduleEntry) => Promise<void>
  onClose: () => void
}

export default function DayModal({
  open, date, shifts, profiles, matrix, onInsert, onDelete, onClose,
}: Props) {
  if (!date) return null

  const d = parseISO(date)
  const dayLabel = DAY_LABELS[d.getDay()]
  const profileMap = new Map(profiles.map(p => [p.id, p]))

  // All entries for this date
  const dayEntries = Object.values(matrix).flatMap(byDate => byDate[date] ?? [])

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">
            {format(d, 'M月d日')} ({dayLabel})
          </DialogTitle>
        </DialogHeader>

        {/* Existing entries grouped by shift */}
        {shifts.map(shift => {
          const entries = matrix[shift.id]?.[date] ?? []
          if (entries.length === 0) return null
          return (
            <div key={shift.id} className="mb-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: shift.color }} />
                <span className="text-xs font-medium text-zinc-600">
                  {shift.name} {shift.start_time.slice(0, 5)}–{shift.end_time.slice(0, 5)}
                </span>
              </div>
              {entries.map(entry => {
                const profile = profileMap.get(entry.profile_id)
                if (!profile) return null
                return (
                  <div key={entry.id} className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-zinc-50">
                    <span className="text-sm text-zinc-800">{profile.full_name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-zinc-400 hover:text-red-500"
                      onClick={() => onDelete(entry)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )
        })}

        {dayEntries.length === 0 && (
          <p className="text-sm text-zinc-400 mb-3">本日尚無排班</p>
        )}

        <div className="border-t border-zinc-100 pt-4">
          <p className="text-sm font-medium text-zinc-700 mb-3">新增排班</p>
          <ShiftSelector
            shifts={shifts}
            profiles={profiles}
            selectedDates={[date]}
            matrix={matrix}
            onConfirm={(shiftId, profileIds) => onInsert(shiftId, profileIds, [date])}
            onCancel={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
