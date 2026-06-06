import { createClient } from '@/lib/supabase/server'
import SettingsClient from './SettingsClient'

export default async function SettingsAdminPage() {
  const supabase = await createClient()
  const { data: shifts } = await supabase
    .from('da_shifts')
    .select('*')
    .order('start_time')

  return <SettingsClient initialShifts={shifts ?? []} />
}
