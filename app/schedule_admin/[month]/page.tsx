import { redirect } from 'next/navigation'
import { parseMonthParam, getMonthDateRange, getMonthCalendarDates } from '@/lib/dates'
import { createClient } from '@/lib/supabase/server'
import ScheduleClient from '@/components/admin/schedule/ScheduleClient'

interface PageProps {
  params: Promise<{ month: string }>
}

export default async function AdminMonthSchedulePage({ params }: PageProps) {
  const { month } = await params

  const monthStart = parseMonthParam(month)
  if (!monthStart) {
    redirect('/schedule_admin')
  }

  const { start, end } = getMonthDateRange(monthStart)
  const calendarDates = getMonthCalendarDates(monthStart)

  const supabase = await createClient()

  const [
    { data: initialEntries },
    { data: shifts },
    { data: profiles },
    { data: holidays },
  ] = await Promise.all([
    supabase
      .from('da_schedule_entries')
      .select('*')
      .gte('work_date', start)
      .lte('work_date', end),
    supabase
      .from('da_shifts')
      .select('*')
      .order('start_time'),
    supabase
      .from('da_profiles')
      .select('*')
      .eq('is_active', true)
      .order('full_name'),
    supabase
      .from('da_holidays')
      .select('*')
      .gte('date', start)
      .lte('date', end),
  ])

  return (
    <ScheduleClient
      monthParam={month}
      calendarDates={calendarDates}
      shifts={shifts ?? []}
      profiles={profiles ?? []}
      initialEntries={initialEntries ?? []}
      holidays={holidays ?? []}
    />
  )
}
