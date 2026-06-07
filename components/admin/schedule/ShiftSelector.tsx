'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import type { Shift, Profile, ScheduleMatrix } from '@/lib/types'

interface Props {
  shifts: Shift[]
  profiles: Profile[]
  selectedDates: string[]   // 1 date in Mode A, N dates in Mode B
  matrix: ScheduleMatrix
  onConfirm: (shiftId: string, profileIds: string[]) => Promise<void>
  onCancel: () => void
}

export default function ShiftSelector({
  shifts, profiles, selectedDates, matrix, onConfirm, onCancel,
}: Props) {
  const [selectedShiftId, setSelectedShiftId] = useState<string>(shifts[0]?.id ?? '')
  const [selectedProfileIds, setSelectedProfileIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  const isModeA = selectedDates.length === 1
  const singleDate = selectedDates[0] ?? ''

  function toggleProfile(id: string) {
    setSelectedProfileIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function existingShiftOnDate(profileId: string, date: string): Shift | null {
    for (const shift of shifts) {
      const entries = matrix[shift.id]?.[date] ?? []
      if (entries.some(e => e.profile_id === profileId)) return shift
    }
    return null
  }

  function conflictShiftsOnDates(profileId: string): { date: string; shiftName: string }[] {
    return selectedDates.flatMap(date => {
      const shift = existingShiftOnDate(profileId, date)
      return shift ? [{ date, shiftName: shift.name }] : []
    })
  }

  async function handleConfirm() {
    if (!selectedShiftId || selectedProfileIds.size === 0) return
    setLoading(true)
    try {
      await onConfirm(selectedShiftId, Array.from(selectedProfileIds))
      setSelectedProfileIds(new Set())
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Shift selection */}
      <div>
        <p className="text-sm font-medium text-zinc-700 mb-2">選擇班次</p>
        <RadioGroup
          value={selectedShiftId}
          onValueChange={(v: string) => { setSelectedShiftId(v); setSelectedProfileIds(new Set()) }}
          className="flex flex-wrap gap-2"
        >
          {shifts.map(shift => (
            <div key={shift.id} className="flex items-center gap-1.5">
              <RadioGroupItem value={shift.id} id={`shift-${shift.id}`} />
              <Label htmlFor={`shift-${shift.id}`} className="text-sm cursor-pointer flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: shift.color }}
                />
                {shift.name}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Profile selection */}
      {selectedShiftId && (
        <div>
          <p className="text-sm font-medium text-zinc-700 mb-2">選擇員工</p>
          {profiles.length === 0 ? (
            <p className="text-sm text-zinc-400">
              尚未新增員工。{' '}
              <a href="/staff_admin" className="text-[var(--accent-500)] hover:underline">前往新增</a>
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {profiles.map(profile => {
                const existingShift = isModeA ? existingShiftOnDate(profile.id, singleDate) : null
                const disabled = existingShift !== null
                const conflicts = !isModeA ? conflictShiftsOnDates(profile.id) : []
                return (
                  <div key={profile.id} className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`profile-${profile.id}`}
                        checked={selectedProfileIds.has(profile.id)}
                        onCheckedChange={() => !disabled && toggleProfile(profile.id)}
                        disabled={disabled}
                      />
                      <Label
                        htmlFor={`profile-${profile.id}`}
                        className={`text-sm cursor-pointer ${disabled ? 'opacity-40' : ''}`}
                      >
                        {profile.full_name}
                      </Label>
                      {existingShift && (
                        <span className="text-xs text-zinc-400">已排 {existingShift.name}</span>
                      )}
                    </div>
                    {conflicts.length > 0 && (
                      <p className="text-xs text-amber-600 ml-6">
                        {conflicts.map(c => `${format(parseISO(c.date), 'M/d')} 已排 ${c.shiftName}`).join('、')}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button
          onClick={handleConfirm}
          disabled={loading || selectedProfileIds.size === 0}
          className="bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-white rounded-full flex-1"
        >
          {loading ? '新增中...' : '確認新增'}
        </Button>
        <Button variant="outline" onClick={onCancel} className="rounded-md">
          取消
        </Button>
      </div>
    </div>
  )
}
