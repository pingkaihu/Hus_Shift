import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const GOV_API_BASE =
  'https://allen0099.github.io/taiwan-calendar'

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

  // Fetch government API
  let govRes: Response
  try {
    govRes = await fetch(`${GOV_API_BASE}/${year}/all.json`, {
      cache: 'no-store',
    })
  } catch {
    return NextResponse.json({ error: '無法連線至政府 API' }, { status: 502 })
  }

  if (!govRes.ok) {
    return NextResponse.json({ error: '政府 API 回應錯誤' }, { status: 502 })
  }

  let json: unknown
  try {
    json = await govRes.json()
  } catch {
    return NextResponse.json({ error: '政府 API 回應格式錯誤' }, { status: 502 })
  }

  type GovRecord = { date: string; name: string; isHoliday: boolean; description: string }
  type GovJson = { months?: { holidays?: GovRecord[] }[] }
  const govJson = json as GovJson
  const records: GovRecord[] = govJson.months?.flatMap(m => m.holidays ?? []) ?? []

  if (records.length === 0) {
    return NextResponse.json({ error: `${year} 年無資料` }, { status: 404 })
  }

  // Transform: "20260101" → "2026-01-01"; keep only named entries (holidays + make-up workdays)
  const rows = records
    .filter(r => r.date?.length === 8 && r.name)
    .map(r => ({
      date: `${r.date.slice(0, 4)}-${r.date.slice(4, 6)}-${r.date.slice(6, 8)}`,
      name: r.name.trim(),
      is_holiday: Boolean(r.isHoliday),
      source: 'government',
      year,
      description: r.description?.trim() || null,
    }))

  // Count existing to compute inserted vs updated
  const { data: existingRows, error: countError } = await supabase
    .from('da_holidays')
    .select('date')
    .in('date', rows.map(r => r.date))

  if (countError) console.error('Failed to fetch existing holidays for count:', countError.message)

  const existingDates = new Set(existingRows?.map(r => r.date) ?? [])
  const inserted = rows.filter(r => !existingDates.has(r.date)).length
  const updated = rows.filter(r => existingDates.has(r.date)).length

  const { error } = await supabase
    .from('da_holidays')
    .upsert(rows, { onConflict: 'date' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ inserted, updated })
}
