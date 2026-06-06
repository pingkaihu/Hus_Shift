'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const MONTH_NAMES = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

interface Props {
  monthParam: string  // "YYYY-MM"
  label: string       // e.g. "2025年 6月"
}

export default function MonthPicker({ monthParam, label }: Props) {
  const router = useRouter()
  const currentYear = parseInt(monthParam.slice(0, 4), 10)
  const currentMonth = parseInt(monthParam.slice(5, 7), 10)
  const [pickerYear, setPickerYear] = useState(currentYear)
  const [open, setOpen] = useState(false)

  const navigate = (y: number, m: number) => {
    router.push(`/schedule_admin/${y}-${String(m).padStart(2, '0')}`)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="text-sm font-semibold text-zinc-800 min-w-[120px] text-center hover:text-indigo-600 transition-colors"
      >
        {label}
      </DialogTrigger>
      <DialogContent className="w-60 p-3" showCloseButton={false}>
        {/* Year navigation */}
        <div className="flex items-center justify-between mb-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setPickerYear(y => y - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold text-zinc-800">{pickerYear}年</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setPickerYear(y => y + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        {/* Month grid */}
        <div className="grid grid-cols-3 gap-1">
          {MONTH_NAMES.map((name, i) => {
            const m = i + 1
            const isActive = pickerYear === currentYear && m === currentMonth
            return (
              <button
                key={m}
                type="button"
                onClick={() => navigate(pickerYear, m)}
                className={cn(
                  'py-2 rounded-md text-sm transition-colors',
                  isActive
                    ? 'bg-indigo-500 text-white'
                    : 'hover:bg-zinc-100 text-zinc-700'
                )}
              >
                {name}
              </button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
