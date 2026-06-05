import { redirect } from 'next/navigation'
import { getCurrentWeekParam } from '@/lib/dates'

export default function ScheduleAdminPage() {
  redirect(`/schedule_admin/${getCurrentWeekParam()}`)
}
