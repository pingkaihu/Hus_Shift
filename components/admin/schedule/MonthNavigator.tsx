'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  parseMonthParam,
  formatMonthLabel,
  prevMonthParam,
  nextMonthParam,
  getCurrentMonthParam,
} from '@/lib/dates'
import MonthPicker from './MonthPicker'

interface Props {
  monthParam: string
}

export default function MonthNavigator({ monthParam }: Props) {
  const router = useRouter()
  const parsed = parseMonthParam(monthParam)

  if (!parsed) return null

  const label = formatMonthLabel(parsed)

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => router.push('/schedule_admin/' + prevMonthParam(parsed))}
        className="h-8 w-8 border-zinc-200"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <MonthPicker monthParam={monthParam} label={label} />

      <Button
        variant="outline"
        size="icon"
        onClick={() => router.push('/schedule_admin/' + nextMonthParam(parsed))}
        className="h-8 w-8 border-zinc-200"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* 今天 — full text on desktop, abbreviated on mobile */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push('/schedule_admin/' + getCurrentMonthParam())}
        className="h-8 border-zinc-200 text-xs"
      >
        <span className="hidden sm:inline">今天</span>
        <span className="sm:hidden">今</span>
      </Button>
    </div>
  )
}
