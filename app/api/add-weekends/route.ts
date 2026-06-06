import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { eachDayOfInterval, getDay, format, startOfYear, endOfYear } from 'date-fns'

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const yearStr = searchParams.get('year') ?? String(new Date().getFullYear())
  const year = parseInt(yearStr)

  if (isNaN(year) || year < 2000 || year > 2100)
    return NextResponse.json({ error: '無效的年份' }, { status: 400 })

  // Auth: admin only
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: callerProfile } = await supabase
    .from('da_profiles').select('role').eq('id', user.id).single()
  if (callerProfile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Generate all Saturdays and Sundays for the year
  const yearStart = startOfYear(new Date(year, 0, 1))
  const yearEnd = endOfYear(new Date(year, 0, 1))
  const allDays = eachDayOfInterval({ start: yearStart, end: yearEnd })

  const rows = allDays
    .filter(d => getDay(d) === 0 || getDay(d) === 6)
    .map(d => ({
      date: format(d, 'yyyy-MM-dd'),
      name: getDay(d) === 6 ? '週六' : '週日',
      is_holiday: true,
      source: 'weekend',
      year,
      description: null,
    }))

  // Count existing to compute inserted vs skipped
  const { data: existingRows, error: countError } = await supabase
    .from('da_holidays')
    .select('date')
    .in('date', rows.map(r => r.date))

  if (countError) console.error('Failed to fetch existing holidays for count:', countError.message)

  const existingDates = new Set(existingRows?.map(r => r.date) ?? [])
  const inserted = rows.filter(r => !existingDates.has(r.date)).length
  const skipped = rows.filter(r => existingDates.has(r.date)).length

  const { error } = await supabase
    .from('da_holidays')
    .upsert(rows, { onConflict: 'date', ignoreDuplicates: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ inserted, skipped })
}
