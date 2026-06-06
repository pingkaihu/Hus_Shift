import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  // Verify caller is an authenticated admin
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
  const full_name: string = ((body.full_name as string) ?? '').trim()
  const email: string = ((body.email as string) ?? '').trim()
  if (!full_name || !email) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
  }

  // Check 50-person limit (active staff only)
  const { count } = await supabase
    .from('da_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
  if ((count ?? 0) >= 50) {
    return NextResponse.json({ error: 'STAFF_LIMIT' }, { status: 422 })
  }

  // Create auth user (email_confirm: true, no invite email sent)
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true,
  })
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  // Insert profile row
  const { error: profileError } = await supabaseAdmin
    .from('da_profiles')
    .insert({ id: authData.user.id, full_name, email, role: 'staff', is_active: true })

  if (profileError) {
    // Rollback: remove the auth user we just created
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
    if (deleteError) {
      console.error('Rollback failed — orphaned auth user:', authData.user.id, deleteError.message)
    }
    return NextResponse.json({ error: profileError.message }, { status: 400 })
  }

  return NextResponse.json({ id: authData.user.id })
}
