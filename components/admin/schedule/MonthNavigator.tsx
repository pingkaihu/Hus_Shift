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

interface Props {
  monthParam: string
}

export default function MonthNavigator({ monthParam }: Props) {
  const router = useRouter()
  const parsed = parseMonthParam(monthParam)

  if (!parsed) return null

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        size="icon"
        onClick={() => router.push('/schedule_admin/' + prevMonthParam(parsed))}
        className="h-8 w-8 border-zinc-200"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm font-semibold text-zinc-800 min-w-[120px] text-center">
        {formatMonthLabel(parsed)}
      </span>
      <Button
        variant="outline"
        size="icon"
        onClick={() => router.push('/schedule_admin/' + nextMonthParam(parsed))}
        className="h-8 w-8 border-zinc-200"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push('/schedule_admin/' + getCurrentMonthParam())}
        className="h-8 border-zinc-200 text-xs"
      >
        今天
      </Button>
    </div>
  )
}
