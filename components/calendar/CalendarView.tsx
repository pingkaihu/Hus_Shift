'use client'

import { useState } from 'react'
import { parseISO } from 'date-fns'
import type { Shift, Holiday } from '@/lib/types'
import PageHeader from './PageHeader'
import MonthNavigator from './MonthNavigator'
import CalendarGrid from './CalendarGrid'
import DayDetailSheet from './DayDetailSheet'
import ShiftLegend from './ShiftLegend'
import EmptyMonth from './EmptyMonth'

interface EntryWithName {
  profile_id: string
  shift_id: string
  work_date: string
  profiles: { full_name: string } | null
}

interface Props {
  month: string
  monthDate: string     // ISO string — passed from server to avoid client-side date creation
  entries: EntryWithName[]
  shifts: Shift[]
  holidays: Holiday[]
  today: string         // "YYYY-MM-DD" in Asia/Taipei — computed server-side
}

export default function CalendarView({
  month, monthDate, entries, shifts, holidays, today,
}: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedEntries, setSelectedEntries] = useState<EntryWithName[]>([])

  function handleDayClick(date: string, dayEntries: EntryWithName[]) {
    setSelectedDate(date)
    setSelectedEntries(dayEntries)
  }

  return (
    <div className="min-h-screen bg-[var(--neutral-50)]">
      <PageHeader />
      <MonthNavigator month={month} monthDate={monthDate} />
      <CalendarGrid
        monthDate={parseISO(monthDate)}
        entries={entries}
        shifts={shifts}
        holidays={holidays}
        today={today}
        onDayClick={handleDayClick}
      />
      {entries.length === 0 && <EmptyMonth />}
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
