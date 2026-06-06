'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface StaffOption {
  id: string
  name: string
}

interface Props {
  staff: StaffOption[]
  value: string | null
  onChange: (id: string | null) => void
}

export default function StaffFilterBar({ staff, value, onChange }: Props) {
  const displayName = value
    ? (staff.find(s => s.id === value)?.name ?? '全部員工')
    : '全部員工'

  return (
    <div className="sticky top-12 z-10 bg-white border-b border-[var(--neutral-200)] px-4 py-2 flex items-center justify-between">
      <span className="text-xs text-[var(--neutral-500)] font-medium">篩選員工</span>
      <Select value={value ?? 'all'} onValueChange={v => onChange(v === 'all' ? null : v)}>
        <SelectTrigger className="w-32 h-7 text-xs border-zinc-200">
          <SelectValue placeholder="全部員工">{displayName}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部員工</SelectItem>
          {staff.map(s => (
            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
