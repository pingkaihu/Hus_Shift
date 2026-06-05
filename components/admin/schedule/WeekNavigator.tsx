'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { parseWeekParam, formatWeekLabel, prevWeekParam, nextWeekParam } from '@/lib/dates'

interface Props {
  weekParam: string   // e.g. "2025-W24"
}

export default function WeekNavigator({ weekParam }: Props) {
  const router = useRouter()
  const weekStart = parseWeekParam(weekParam)
  const label = weekStart ? formatWeekLabel(weekStart) : weekParam

  function navigate(param: string) {
    router.push(`/schedule_admin/${param}`)
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        size="icon"
        onClick={() => weekStart && navigate(prevWeekParam(weekStart))}
        className="h-8 w-8 border-zinc-200"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm font-semibold text-zinc-800 min-w-[180px] text-center">
        {label}
      </span>
      <Button
        variant="outline"
        size="icon"
        onClick={() => weekStart && navigate(nextWeekParam(weekStart))}
        className="h-8 w-8 border-zinc-200"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
