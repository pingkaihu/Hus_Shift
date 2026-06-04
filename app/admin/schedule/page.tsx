import { redirect } from 'next/navigation'
import { getCurrentWeekParam } from '@/lib/dates'

export default function AdminSchedulePage() {
  redirect(`/admin/schedule/${getCurrentWeekParam()}`)
}
