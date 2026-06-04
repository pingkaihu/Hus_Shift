import { X } from 'lucide-react'
import type { ScheduleEntry, Profile } from '@/lib/types'

interface Props {
  entry: ScheduleEntry
  profile: Profile
  dimmed: boolean
  onDelete: (entry: ScheduleEntry) => void
}

export default function StaffChip({ entry, profile, dimmed, onDelete }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-white text-xs font-medium transition-opacity ${
        dimmed ? 'opacity-30' : 'opacity-100'
      }`}
      style={{ backgroundColor: 'var(--shift-color, #888)' }}
    >
      {profile.full_name.charAt(0)}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onDelete(entry) }}
        className="hover:opacity-70 transition-opacity"
        aria-label={`刪除 ${profile.full_name}`}
      >
        <X className="w-2.5 h-2.5" />
      </button>
    </span>
  )
}
