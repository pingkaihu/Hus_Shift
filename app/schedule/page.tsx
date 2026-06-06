import { redirect } from 'next/navigation'
import { getCurrentMonthParam } from '@/lib/dates'

export default function SchedulePage() {
  redirect(`/schedule/${getCurrentMonthParam()}`)
}
