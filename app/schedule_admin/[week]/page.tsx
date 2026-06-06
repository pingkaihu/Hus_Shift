import { redirect } from 'next/navigation'
import { getCurrentMonthParam } from '@/lib/dates'

export default async function WeekPage() {
  redirect(`/schedule_admin/${getCurrentMonthParam()}`)
}
