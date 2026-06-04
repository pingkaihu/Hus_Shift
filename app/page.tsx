import { redirect } from 'next/navigation'
import { getCurrentMonthParam } from '@/lib/dates'

export default function HomePage() {
  redirect(`/schedule/${getCurrentMonthParam()}`)
}
