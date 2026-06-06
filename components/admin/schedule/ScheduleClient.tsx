'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Shift, Profile, ScheduleEntry, Holiday, SelectionState, ScheduleMatrix } from '@/lib/types'
import MonthNavigator from './MonthNavigator'
import StaffFilter from './StaffFilter'
import MonthGrid from './MonthGrid'
import DayModal from './DayModal'
import BulkPanel from './BulkPanel'

interface Props {
  monthParam: string
  calendarDates: { date: string; isCurrentMonth: boolean }[]
  shifts: Shift[]
  profiles: Profile[]
  initialEntries: ScheduleEntry[]
  holidays: Holiday[]
}

function buildMatrix(shifts: Shift[], dates: string[], entries: ScheduleEntry[]): ScheduleMatrix {
  const matrix: ScheduleMatrix = {}
  for (const shift of shifts) {
    matrix[shift.id] = {}
    for (const date of dates) {
      matrix[shift.id][date] = entries.filter(
        e => e.shift_id === shift.id && e.work_date === date
      )
    }
  }
  return matrix
}

export default function ScheduleClient({
  monthParam, calendarDates, shifts, profiles, initialEntries, holidays,
}: Props) {
  const supabase = createClient()
  const [matrix, setMatrix] = useState<ScheduleMatrix>(() =>
    buildMatrix(shifts, calendarDates.map(d => d.date), initialEntries)
  )
  const [selection, setSelection] = useState<SelectionState>({ mode: 'idle' })
  const [filteredProfileId, setFilteredProfileId] = useState<string | null>(null)
  const [density, setDensity] = useState<'full' | 'compact'>(() => {
    if (typeof window === 'undefined') return 'compact'
    const saved = localStorage.getItem('adminScheduleDensity')
    if (saved) return saved as 'full' | 'compact'
    return window.innerWidth < 768 ? 'compact' : 'full'
  })

  const handleDateClick = (date: string) => {
    setSelection(prev => {
      if (prev.mode === 'idle') return { mode: 'single', date }
      if (prev.mode === 'single') {
        if (prev.date === date) return { mode: 'idle' }
        return { mode: 'multi', dates: [prev.date, date] }
      }
      if (prev.mode === 'multi') {
        const next = prev.dates.includes(date)
          ? prev.dates.filter(d => d !== date)
          : [...prev.dates, date]
        if (next.length === 0) return { mode: 'idle' }
        if (next.length === 1) return { mode: 'single', date: next[0] }
        return { mode: 'multi', dates: next }
      }
      return prev
    })
  }

  const handleDateLongPress = (date: string) => {
    setSelection(prev => {
      if (prev.mode === 'idle') {
        return { mode: 'multi', dates: [date] }
      }
      if (prev.mode === 'single') {
        const combined = prev.date === date ? [date] : [prev.date, date]
        return { mode: 'multi', dates: combined }
      }
      if (prev.mode === 'multi') {
        const next = prev.dates.includes(date)
          ? prev.dates.filter(d => d !== date)
          : [...prev.dates, date]
        if (next.length === 0) return { mode: 'idle' }
        return { mode: 'multi', dates: next }
      }
      return prev
    })
  }

  const handleClose = () => setSelection({ mode: 'idle' })
  const handleClear = () => setSelection({ mode: 'idle' })

  // Insert entries for (shiftId, profileIds[], dates[]), skipping conflicts
  const handleInsert = async (
    shiftId: string,
    profileIds: string[],
    dates: string[]
  ): Promise<void> => {
    type NewEntry = Omit<ScheduleEntry, 'id' | 'created_at'>
    const toInsert: NewEntry[] = []
    let skipped = 0

    for (const date of dates) {
      for (const profileId of profileIds) {
        const existing = matrix[shiftId]?.[date] ?? []
        if (existing.some(e => e.profile_id === profileId)) {
          skipped++
        } else {
          toInsert.push({ profile_id: profileId, shift_id: shiftId, work_date: date, note: null })
        }
      }
    }

    if (toInsert.length === 0) {
      toast.info(`跳過 ${skipped} 筆重複排班`)
      return
    }

    // Optimistic: add temp entries
    const tempEntries: ScheduleEntry[] = toInsert.map((e, i) => ({
      ...e,
      id: `temp-${Date.now()}-${i}`,
      created_at: new Date().toISOString(),
    }))

    setMatrix(prev => {
      const next = structuredClone(prev)
      for (const entry of tempEntries) {
        next[entry.shift_id][entry.work_date] = [
          ...(next[entry.shift_id][entry.work_date] ?? []),
          entry,
        ]
      }
      return next
    })

    const { data, error } = await supabase
      .from('da_schedule_entries')
      .insert(toInsert)
      .select()

    if (error) {
      // Rollback
      const tempIds = new Set(tempEntries.map(e => e.id))
      setMatrix(prev => {
        const next = structuredClone(prev)
        for (const entry of tempEntries) {
          next[entry.shift_id][entry.work_date] =
            (next[entry.shift_id][entry.work_date] ?? []).filter(e => !tempIds.has(e.id))
        }
        return next
      })
      toast.error('新增失敗，請重試')
      return
    }

    // Replace temp IDs with real DB IDs
    if (data) {
      setMatrix(prev => {
        const next = structuredClone(prev)
        tempEntries.forEach((temp, i) => {
          const real = data[i]
          if (!real) return
          next[temp.shift_id][temp.work_date] =
            (next[temp.shift_id][temp.work_date] ?? []).map(e => e.id === temp.id ? real : e)
        })
        return next
      })
    }

    if (skipped > 0) {
      toast.success(`已新增 ${toInsert.length} 筆，跳過 ${skipped} 筆重複排班`)
    } else {
      toast.success(`已新增 ${toInsert.length} 筆排班`)
    }
  }

  const handleDelete = async (entry: ScheduleEntry) => {
    // Optimistic remove
    setMatrix(prev => {
      const next = structuredClone(prev)
      next[entry.shift_id][entry.work_date] =
        (next[entry.shift_id][entry.work_date] ?? []).filter(e => e.id !== entry.id)
      return next
    })

    const { error } = await supabase
      .from('da_schedule_entries')
      .delete()
      .eq('id', entry.id)

    if (error) {
      // Rollback
      setMatrix(prev => {
        const next = structuredClone(prev)
        next[entry.shift_id][entry.work_date] = [
          ...(next[entry.shift_id][entry.work_date] ?? []),
          entry,
        ]
        return next
      })
      toast.error('刪除失敗，請重試')
    }
  }

  return (
    <div className="flex h-full relative overflow-hidden">
      <div className="flex flex-col flex-1 gap-4 p-6 overflow-auto">
        <div className="flex flex-col gap-2">
          {/* Row 1: month navigator + desktop-only controls */}
          <div className="flex items-center justify-between">
            <MonthNavigator monthParam={monthParam} />
            <div className="hidden md:flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const next = density === 'full' ? 'compact' : 'full'
                  setDensity(next)
                  localStorage.setItem('adminScheduleDensity', next)
                }}
                className="px-3 py-1.5 text-xs border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
              >
                {density === 'full' ? '精簡' : '詳細'}
              </button>
              <StaffFilter profiles={profiles} value={filteredProfileId} onChange={setFilteredProfileId} />
            </div>
          </div>
          {/* Row 2: mobile-only controls */}
          <div className="flex items-center justify-between md:hidden">
            <button
              type="button"
              onClick={() => {
                const next = density === 'full' ? 'compact' : 'full'
                setDensity(next)
                localStorage.setItem('adminScheduleDensity', next)
              }}
              className="px-3 py-1.5 text-xs border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
            >
              {density === 'full' ? '精簡' : '詳細'}
            </button>
            <StaffFilter profiles={profiles} value={filteredProfileId} onChange={setFilteredProfileId} />
          </div>
        </div>
        <MonthGrid
          calendarDates={calendarDates}
          shifts={shifts}
          profiles={profiles}
          matrix={matrix}
          holidays={holidays}
          selection={selection}
          filteredProfileId={filteredProfileId}
          density={density}
          onDateClick={handleDateClick}
          onDelete={handleDelete}
          onLongPress={handleDateLongPress}
        />
      </div>

      <DayModal
        open={selection.mode === 'single'}
        date={selection.mode === 'single' ? selection.date : ''}
        shifts={shifts}
        profiles={profiles}
        matrix={matrix}
        onInsert={handleInsert}
        onDelete={handleDelete}
        onClose={handleClose}
      />

      <BulkPanel
        open={selection.mode === 'multi'}
        dates={selection.mode === 'multi' ? selection.dates : []}
        shifts={shifts}
        profiles={profiles}
        matrix={matrix}
        onInsert={handleInsert}
        onClose={handleClose}
        onClear={handleClear}
      />
    </div>
  )
}
