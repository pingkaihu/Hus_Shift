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

  // In Mode A: profile is disabled if already assigned to this shift on this date
  function isDisabled(profileId: string): boolean {
    if (!isModeA || !selectedShiftId) return false
    return (matrix[selectedShiftId]?.[singleDate] ?? []).some(e => e.profile_id === profileId)
  }

  // In Mode B: collect dates where this profile already has this shift
  function conflictDates(profileId: string): string[] {
    if (!selectedShiftId) return []
    return selectedDates.filter(date =>
      (matrix[selectedShiftId]?.[date] ?? []).some(e => e.profile_id === profileId)
    )
  }

  async function handleConfirm() {
    if (!selectedShiftId || selectedProfileIds.size === 0) return
    setLoading(true)
    await onConfirm(selectedShiftId, Array.from(selectedProfileIds))
    setLoading(false)
    setSelectedProfileIds(new Set())
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
              <a href="/admin/staff" className="text-indigo-500 hover:underline">前往新增</a>
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {profiles.map(profile => {
                const disabled = isDisabled(profile.id)
                const conflicts = !isModeA ? conflictDates(profile.id) : []
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
                      {disabled && (
                        <span className="text-xs text-zinc-400">已排班</span>
                      )}
                    </div>
                    {conflicts.length > 0 && (
                      <p className="text-xs text-amber-600 ml-6">
                        {conflicts.map(d => format(parseISO(d), 'M/d')).join('、')} 已有此班
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
          className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-full flex-1"
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
