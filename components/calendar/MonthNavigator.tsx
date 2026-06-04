'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { parseISO } from 'date-fns'
import { formatMonthLabel, prevMonthParam, nextMonthParam } from '@/lib/dates'

interface Props {
  month: string        // "YYYY-MM"
  monthDate: string    // ISO string from server
}

export default function MonthNavigator({ month, monthDate }: Props) {
  const router = useRouter()
  const d = parseISO(monthDate)
  const label = formatMonthLabel(d)

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <button
        type="button"
        onClick={() => router.push(`/schedule/${prevMonthParam(d)}`)}
        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--neutral-100)] transition-colors"
        aria-label="上一個月"
      >
        <ChevronLeft className="w-4 h-4 text-[var(--neutral-700)]" />
      </button>
      <span className="text-sm font-semibold text-[var(--neutral-900)]">{label}</span>
      <button
        type="button"
        onClick={() => router.push(`/schedule/${nextMonthParam(d)}`)}
        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--neutral-100)] transition-colors"
        aria-label="下一個月"
      >
        <ChevronRight className="w-4 h-4 text-[var(--neutral-700)]" />
      </button>
    </div>
  )
}
