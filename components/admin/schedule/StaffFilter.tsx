import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Profile } from '@/lib/types'

interface Props {
  profiles: Profile[]
  value: string | null
  onChange: (id: string | null) => void
}

export default function StaffFilter({ profiles, value, onChange }: Props) {
  return (
    <Select
      value={value ?? 'all'}
      onValueChange={v => onChange(v === 'all' ? null : v)}
    >
      <SelectTrigger className="w-36 h-8 text-sm border-zinc-200">
        <SelectValue placeholder="全部員工" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">全部員工</SelectItem>
        {profiles.map(p => (
          <SelectItem key={p.id} value={p.id}>
            {p.full_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
