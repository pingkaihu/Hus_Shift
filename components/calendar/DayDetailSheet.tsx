import { Drawer } from 'vaul'
import { format, parseISO } from 'date-fns'
import type { Shift, Holiday } from '@/lib/types'

interface EntryWithName {
  profile_id: string
  shift_id: string
  work_date: string
  profiles: { full_name: string } | null
}

interface Props {
  open: boolean
  onClose: () => void
  date: string | null
  entries: EntryWithName[]
  shifts: Shift[]
  holidays: Holiday[]
}

const DAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']

export default function DayDetailSheet({
  open, onClose, date, entries, shifts, holidays,
}: Props) {
  if (!date) return null

  const d = parseISO(date)
  const dayLabel = DAY_LABELS[d.getDay()]
  const holiday = holidays.find(h => h.date === date)

  return (
    <Drawer.Root open={open} onOpenChange={open => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[20px] max-h-[90dvh] flex flex-col"
          style={{ boxShadow: 'var(--shadow-modal)' }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-8 h-1 rounded-full bg-[var(--neutral-200)]" />
          </div>

          {/* Header */}
          <div className="px-5 pb-3 border-b border-[var(--neutral-200)]">
            <h2 className="text-base font-bold text-[var(--neutral-900)]">
              {format(d, 'M月d日')} ({dayLabel})
            </h2>
            {holiday && (
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block ${
                  holiday.is_holiday
                    ? 'bg-red-50 text-red-500'
                    : 'bg-amber-50 text-amber-600'
                }`}
              >
                {holiday.is_holiday ? '假日' : '補班'} · {holiday.name}
              </span>
            )}
          </div>

          {/* Shift detail list */}
          <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-4">
            {shifts.map(shift => {
              const shiftEntries = entries.filter(e => e.shift_id === shift.id)
              const isEmpty = shiftEntries.length === 0
              return (
                <div key={shift.id} className={isEmpty ? 'opacity-40' : ''}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="w-1 h-6 rounded-sm"
                      style={{ backgroundColor: shift.color }}
                    />
                    <span className="text-sm font-semibold text-[var(--neutral-900)]">
                      {shift.name}
                    </span>
                    <span className="text-xs text-[var(--neutral-500)]">
                      {shift.start_time.slice(0, 5)}–{shift.end_time.slice(0, 5)}
                    </span>
                  </div>
                  {isEmpty ? (
                    <p className="text-sm text-[var(--neutral-500)] pl-3">（未排班）</p>
                  ) : (
                    <div className="pl-3 flex flex-col gap-1">
                      {shiftEntries.map(e => (
                        <p key={e.profile_id} className="text-sm text-[var(--neutral-900)]">
                          {e.profiles?.full_name ?? '—'}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
