'use client'

import { useState, useMemo } from 'react'
import { parseISO } from 'date-fns'
import type { Shift, Holiday } from '@/lib/types'
import PageHeader from './PageHeader'
import MonthNavigator from './MonthNavigator'
import CalendarGrid from './CalendarGrid'
import DayDetailSheet from './DayDetailSheet'
import ShiftLegend from './ShiftLegend'
import EmptyMonth from './EmptyMonth'
import StaffFilterBar from './StaffFilterBar'

interface EntryWithName {
  profile_id: string
  shift_id: string
  work_date: string
  profiles: { full_name: string } | null
}

interface Props {
  month: string
  monthDate: string
  entries: EntryWithName[]
  shifts: Shift[]
  holidays: Holiday[]
  today: string
}

export default function CalendarView({
  month, monthDate, entries, shifts, holidays, today,
}: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedEntries, setSelectedEntries] = useState<EntryWithName[]>([])
  const [filteredProfileId, setFilteredProfileId] = useState<string | null>(null)

  const staffList = useMemo(() => {
    const seen = new Map<string, string>()
    for (const e of entries) {
      if (e.profiles && !seen.has(e.profile_id)) {
        seen.set(e.profile_id, e.profiles.full_name)
      }
    }
    return [...seen.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'zh-TW'))
  }, [entries])

  const filteredEntries = useMemo(
    () => filteredProfileId
      ? entries.filter(e => e.profile_id === filteredProfileId)
      : entries,
    [entries, filteredProfileId]
  )

  function handleDayClick(date: string, dayEntries: EntryWithName[]) {
    setSelectedDate(date)
    setSelectedEntries(dayEntries)
  }

  return (
    <div className="min-h-screen bg-[var(--neutral-50)]">
      <PageHeader />
      <MonthNavigator month={month} monthDate={monthDate} />
      <StaffFilterBar
        staff={staffList}
        value={filteredProfileId}
        onChange={setFilteredProfileId}
      />
      <CalendarGrid
        monthDate={parseISO(monthDate)}
        entries={filteredEntries}
        shifts={shifts}
        holidays={holidays}
        today={today}
        onDayClick={handleDayClick}
      />
      {filteredEntries.length === 0 && <EmptyMonth />}
      <ShiftLegend shifts={shifts} />
      <DayDetailSheet
        open={selectedDate !== null}
        onClose={() => setSelectedDate(null)}
        date={selectedDate}
        entries={selectedEntries}
        shifts={shifts}
        holidays={holidays}
      />
    </div>
  )
}
