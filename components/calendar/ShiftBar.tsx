import type { Shift } from '@/lib/types'

interface EntryWithName {
  profile_id: string
  profiles: { full_name: string } | null
}

interface Props {
  shift: Shift
  entries: EntryWithName[]
}

export default function ShiftBar({ shift, entries }: Props) {
  if (entries.length === 0) return null
  const visible = entries.slice(0, 2)
  const overflow = entries.length - visible.length
  const names = visible.map(e => e.profiles?.full_name?.charAt(0) ?? '?').join(' ')

  return (
    <div className="flex items-center gap-0.5 my-0.5">
      <span
        className="w-1 h-3.5 rounded-sm shrink-0"
        style={{ backgroundColor: shift.color }}
      />
      <span className="text-[10px] text-[var(--neutral-700)] truncate leading-none">
        {names}{overflow > 0 ? ` +${overflow}` : ''}
      </span>
    </div>
  )
}
