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
    redirect(`/admin/schedule/${getCurrentWeekParam()}`)
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
      .from('schedule_entries')
      .select('*')
      .gte('work_date', dateStart)
      .lte('work_date', dateEnd),
    supabase.from('shifts').select('*').order('start_time'),
    supabase.from('profiles').select('*').eq('is_active', true).order('full_name'),
    supabase
      .from('holidays')
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
