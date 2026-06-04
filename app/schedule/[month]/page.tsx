import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  parseMonthParam,
  getMonthDateRange,
  getCurrentMonthParam,
  formatMonthLabel,
} from '@/lib/dates'
import { toZonedTime } from 'date-fns-tz'
import { format } from 'date-fns'
import CalendarView from '@/components/calendar/CalendarView'
import type { Metadata } from 'next'

export const revalidate = 300

interface PageProps {
  params: Promise<{ month: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { month } = await params
  const d = parseMonthParam(month)
  return { title: d ? `${formatMonthLabel(d)} — Hus Shift` : 'Hus Shift' }
}

export default async function SchedulePage({ params }: PageProps) {
  const { month } = await params
  const monthDate = parseMonthParam(month)
  if (!monthDate) {
    redirect(`/schedule/${getCurrentMonthParam()}`)
  }

  const { start, end } = getMonthDateRange(monthDate)

  const supabase = await createClient()
  const [
    { data: rawEntries },
    { data: shifts },
    { data: holidays },
  ] = await Promise.all([
    supabase
      .from('schedule_entries')
      .select('*, profiles:public_profiles(id, full_name)')
      .gte('work_date', start)
      .lte('work_date', end),
    supabase.from('shifts').select('*').order('start_time'),
    supabase
      .from('holidays')
      .select('*')
      .gte('date', start)
      .lte('date', end),
  ])

  // Today in Asia/Taipei timezone — computed server-side to avoid hydration mismatch
  const today = format(toZonedTime(new Date(), 'Asia/Taipei'), 'yyyy-MM-dd')

  return (
    <CalendarView
      month={month}
      monthDate={monthDate.toISOString()}
      entries={rawEntries ?? []}
      shifts={shifts ?? []}
      holidays={holidays ?? []}
      today={today}
    />
  )
}
