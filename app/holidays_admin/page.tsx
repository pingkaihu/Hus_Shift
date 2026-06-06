import { createClient } from '@/lib/supabase/server'
import { toZonedTime } from 'date-fns-tz'
import HolidaysClient from './HolidaysClient'

export default async function HolidaysAdminPage() {
  const supabase = await createClient()
  const currentYear = toZonedTime(new Date(), 'Asia/Taipei').getFullYear()

  const [{ data: holidays }, { data: yearRows }] = await Promise.all([
    supabase
      .from('da_holidays')
      .select('*')
      .eq('year', currentYear)
      .order('date'),
    supabase
      .from('da_holidays')
      .select('year'),
  ])

  const yearSet = new Set(yearRows?.map(r => r.year as number) ?? [])
  yearSet.add(currentYear)
  const availableYears = [...yearSet].sort((a, b) => b - a)

  return (
    <HolidaysClient
      initialHolidays={holidays ?? []}
      initialYear={currentYear}
      availableYears={availableYears}
    />
  )
}
