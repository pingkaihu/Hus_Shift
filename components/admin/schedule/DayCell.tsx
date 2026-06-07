import type { ScheduleEntry, Profile, Shift } from '@/lib/types'
import StaffChip from './StaffChip'

interface Props {
  shift: Shift
  date: string
  entries: ScheduleEntry[]
  profiles: Profile[]
  filteredProfileId: string | null
  isSelected: boolean
  onPointerDown: (date: string) => void
  onPointerEnter: (date: string) => void
  onDelete: (entry: ScheduleEntry) => void
}

export default function DayCell({
  shift, date, entries, profiles, filteredProfileId,
  isSelected, onPointerDown, onPointerEnter, onDelete,
}: Props) {
  const profileMap = new Map(profiles.map(p => [p.id, p]))

  return (
    <div
      onPointerDown={() => onPointerDown(date)}
      onPointerEnter={() => onPointerEnter(date)}
      style={{ '--shift-color': shift.color } as React.CSSProperties}
      className={[
        'p-2 border-b border-l border-zinc-200 min-h-[72px] flex flex-wrap gap-1 content-start',
        'cursor-grab select-none touch-none transition-colors',
        isSelected ? 'bg-[var(--accent-50)] ring-2 ring-[var(--accent-200)] ring-inset' : 'hover:bg-zinc-50',
      ].join(' ')}
    >
      {entries.map(entry => {
        const profile = profileMap.get(entry.profile_id)
        if (!profile) return null
        const dimmed = filteredProfileId !== null && filteredProfileId !== entry.profile_id
        return (
          <StaffChip
            key={entry.id}
            entry={entry}
            profile={profile}
            dimmed={dimmed}
            onDelete={onDelete}
          />
        )
      })}
    </div>
  )
}
