import { createClient } from '@/lib/supabase/server'
import StaffClient from './StaffClient'

export default async function StaffAdminPage() {
  const supabase = await createClient()
  const { data: profiles } = await supabase
    .from('da_profiles')
    .select('*')
    .order('created_at', { ascending: true })

  return <StaffClient initialProfiles={profiles ?? []} />
}
