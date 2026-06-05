import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { parseWeekParam, getWeekDates, getCurrentWeekParam } from '@/lib/dates'
import ScheduleClient from '@/components/admin/schedule/ScheduleClient'

interface PageProps {
  params: Promise<{ week: string }>
}

export default async function WeekPage({ params }: PageProps) {
  const { week } = await params
  const weekStart = parseWeekParam(week)
  if (!weekStart) {
    redirect(`/schedule_admin/${getCurrentWeekParam()}`)
  }

  const weekDates = getWeekDates(weekStart)
  const [dateStart, dateEnd] = [weekDates[0], weekDates[6]]

  const supabase = await createClient()
  const [
    { data: entries },
    { data: shifts },
    { data: profiles },
    { data: holidays },
  ] = await Promise.all([
    supabase
      .from('da_schedule_entries')
      .select('*')
      .gte('work_date', dateStart)
      .lte('work_date', dateEnd),
    supabase.from('da_shifts').select('*').order('start_time'),
    supabase.from('da_profiles').select('*').eq('is_active', true).order('full_name'),
    supabase
      .from('da_holidays')
      .select('*')
      .gte('date', dateStart)
      .lte('date', dateEnd),
  ])

  return (
    <ScheduleClient
      weekDates={weekDates}
      weekParam={week}
      shifts={shifts ?? []}
      profiles={profiles ?? []}
      initialEntries={entries ?? []}
      holidays={holidays ?? []}
    />
  )
}
