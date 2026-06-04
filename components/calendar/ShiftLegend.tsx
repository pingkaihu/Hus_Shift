import type { Shift } from '@/lib/types'

export default function ShiftLegend({ shifts }: { shifts: Shift[] }) {
  return (
    <div className="px-4 pb-6 flex flex-wrap gap-3">
      {shifts.map(shift => (
        <div key={shift.id} className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: shift.color }}
          />
          <span className="text-xs text-[var(--neutral-700)]">
            {shift.name} {shift.start_time.slice(0, 5)}–{shift.end_time.slice(0, 5)}
          </span>
        </div>
      ))}
    </div>
  )
}
