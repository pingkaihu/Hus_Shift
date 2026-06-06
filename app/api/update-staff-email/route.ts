import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: callerProfile } = await supabase
    .from('da_profiles').select('role').eq('id', user.id).single()
  if (callerProfile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const id: string = ((body.id as string) ?? '').trim()
  const email: string = ((body.email as string) ?? '').trim()
  if (!id || !email) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
  }

  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, { email })
  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

  const { error: profileError } = await supabaseAdmin
    .from('da_profiles').update({ email }).eq('id', id)
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}
