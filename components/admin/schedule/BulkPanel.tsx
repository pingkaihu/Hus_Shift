'use client'

import { format, parseISO } from 'date-fns'
import { X } from 'lucide-react'
import { Drawer } from 'vaul'
import { Button } from '@/components/ui/button'
import type { Shift, Profile, ScheduleMatrix } from '@/lib/types'
import ShiftSelector from './ShiftSelector'
import { useIsMobile } from '@/hooks/use-is-mobile'

interface Props {
  open: boolean
  dates: string[]
  shifts: Shift[]
  profiles: Profile[]
  matrix: ScheduleMatrix
  onInsert: (shiftId: string, profileIds: string[], dates: string[]) => Promise<void>
  onClose: () => void
  onClear: () => void
}

function BulkPanelBody({
  dates, shifts, profiles, matrix, onInsert, onClose, onClear,
}: Omit<Props, 'open'>) {
  const sortedDates = [...dates].sort()
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-zinc-800">批量排班</h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="text-xs text-zinc-500" onClick={onClear}>
            取消選取
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <p className="text-xs font-medium text-zinc-500 uppercase mb-2">
        已選 {dates.length} 天
      </p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {sortedDates.map(date => (
          <span
            key={date}
            className="px-2 py-0.5 rounded-full bg-[var(--accent-100)] text-[var(--accent-700)] text-xs font-medium"
          >
            {format(parseISO(date), 'M/d')}
          </span>
        ))}
      </div>

      <ShiftSelector
        shifts={shifts}
        profiles={profiles}
        selectedDates={sortedDates}
        matrix={matrix}
        onConfirm={(shiftId, profileIds) => onInsert(shiftId, profileIds, sortedDates)}
        onCancel={onClose}
      />
    </>
  )
}

export default function BulkPanel({
  open, dates, shifts, profiles, matrix, onInsert, onClose, onClear,
}: Props) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Drawer.Root open={open} onOpenChange={(o) => !o && onClose()}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Drawer.Content className="bg-white flex flex-col rounded-t-2xl fixed bottom-0 left-0 right-0 z-50 max-h-[90dvh] outline-none">
            <div className="mx-auto mt-3 mb-2 w-12 h-1.5 rounded-full bg-zinc-300 flex-shrink-0" />
            <div className="overflow-y-auto flex-1 px-5 pb-8">
              <BulkPanelBody
                dates={dates}
                shifts={shifts}
                profiles={profiles}
                matrix={matrix}
                onInsert={onInsert}
                onClose={onClose}
                onClear={onClear}
              />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    )
  }

  return (
    <div
      className={`absolute right-0 top-0 h-full w-72 bg-white border-l border-zinc-200 shadow-[var(--shadow-modal)] flex flex-col transition-transform duration-200 z-10 ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex-1 overflow-y-auto p-4">
        <BulkPanelBody
          dates={dates}
          shifts={shifts}
          profiles={profiles}
          matrix={matrix}
          onInsert={onInsert}
          onClose={onClose}
          onClear={onClear}
        />
      </div>
    </div>
  )
}
