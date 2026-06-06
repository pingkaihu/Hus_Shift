import { redirect } from 'next/navigation'
import { getCurrentMonthParam } from '@/lib/dates'

export default function ScheduleAdminPage() {
  redirect(`/schedule_admin/${getCurrentMonthParam()}`)
}
