# Schedule UX Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Three improvements to the schedule pages: fix StaffFilter showing UUID after selection; move density toggle + filter to a second row on mobile in schedule_admin; add staff filter to the public schedule page.

**Architecture:** Bug fix via explicit display name derivation in `SelectValue`; admin mobile layout via responsive Tailwind classes (desktop unchanged); public filter via new `StaffFilterBar` component + `filteredProfileId` state in `CalendarView` that filters `entries` before passing down.

**Tech Stack:** Next.js 15 · React · Tailwind CSS · shadcn/ui Select · date-fns

---

### Task 1: Fix StaffFilter display bug

**Files:**
- Modify: `components/admin/schedule/StaffFilter.tsx`

**Context:** Radix UI `SelectValue` sometimes renders the raw `value` prop (a UUID) instead of the matching `SelectItem`'s text content. Fix: derive the display name explicitly and pass it as children to `<SelectValue>`.

- [ ] **Replace the entire file** with:

```tsx
'use client'

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
  const displayName = value
    ? (profiles.find(p => p.id === value)?.full_name ?? '全部員工')
    : '全部員工'

  return (
    <Select
      value={value ?? 'all'}
      onValueChange={v => onChange(v === 'all' ? null : v)}
    >
      <SelectTrigger className="w-36 h-8 text-sm border-zinc-200">
        <SelectValue placeholder="全部員工">{displayName}</SelectValue>
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
```

- [ ] **Verify:** `npm run type-check` — expect 0 errors

- [ ] **Commit:**
```bash
git add components/admin/schedule/StaffFilter.tsx
git commit -m "fix: show staff name in schedule filter trigger after selection"
```

---

### Task 2: Admin schedule — density toggle + filter to second row on mobile

**Files:**
- Modify: `components/admin/schedule/ScheduleClient.tsx`

**Context:** The schedule admin header currently has MonthNavigator and controls (density button + StaffFilter) in a single `flex items-center justify-between` row. On mobile, the controls are cramped. Move them to a second row that is mobile-only; on `md+` keep the current single-row layout.

The current header block (inside the `return`, first `<div className="flex flex-col flex-1 ...">`, first child):
```tsx
<div className="flex items-center justify-between">
  <MonthNavigator monthParam={monthParam} />
  <div className="flex items-center gap-2">
    <button
      type="button"
      onClick={() => {
        const next = density === 'full' ? 'compact' : 'full'
        setDensity(next)
        localStorage.setItem('adminScheduleDensity', next)
      }}
      className="px-3 py-1.5 text-xs border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
    >
      {density === 'full' ? '精簡' : '詳細'}
    </button>
    <StaffFilter profiles={profiles} value={filteredProfileId} onChange={setFilteredProfileId} />
  </div>
</div>
```

- [ ] **Replace** that block with:

```tsx
<div className="flex flex-col gap-2">
  {/* Row 1: month navigator + desktop-only controls */}
  <div className="flex items-center justify-between">
    <MonthNavigator monthParam={monthParam} />
    <div className="hidden md:flex items-center gap-2">
      <button
        type="button"
        onClick={() => {
          const next = density === 'full' ? 'compact' : 'full'
          setDensity(next)
          localStorage.setItem('adminScheduleDensity', next)
        }}
        className="px-3 py-1.5 text-xs border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
      >
        {density === 'full' ? '精簡' : '詳細'}
      </button>
      <StaffFilter profiles={profiles} value={filteredProfileId} onChange={setFilteredProfileId} />
    </div>
  </div>
  {/* Row 2: mobile-only controls */}
  <div className="flex items-center justify-between md:hidden">
    <button
      type="button"
      onClick={() => {
        const next = density === 'full' ? 'compact' : 'full'
        setDensity(next)
        localStorage.setItem('adminScheduleDensity', next)
      }}
      className="px-3 py-1.5 text-xs border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
    >
      {density === 'full' ? '精簡' : '詳細'}
    </button>
    <StaffFilter profiles={profiles} value={filteredProfileId} onChange={setFilteredProfileId} />
  </div>
</div>
```

- [ ] **Verify:** `npm run type-check` — expect 0 errors

- [ ] **Commit:**
```bash
git add components/admin/schedule/ScheduleClient.tsx
git commit -m "feat: move density toggle and staff filter to second row on mobile"
```

---

### Task 3: Public schedule — staff filter bar

**Files:**
- Create: `components/calendar/StaffFilterBar.tsx`
- Modify: `components/calendar/CalendarView.tsx`

**Context:** The public schedule page (`/schedule/[month]`) has no staff filter. Add a sticky filter bar between `MonthNavigator` and `CalendarGrid`. Staff list is derived from this month's `entries` (unique `profile_id` + `full_name` pairs). Filtering applies to both the calendar grid and the `DayDetailSheet` (via filtered entries passed to `CalendarGrid`, which then passes `dayEntries` to `onDayClick`). State is local to `CalendarView`.

**PageHeader height:** `py-3` padding (12px × 2) + `text-base` line-height (~24px) = 48px = `top-12` in Tailwind. The sticky filter bar uses `top-12` to appear just below the PageHeader.

#### Step 1: Create `components/calendar/StaffFilterBar.tsx`

```tsx
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
```

#### Step 2: Update `components/calendar/CalendarView.tsx`

Replace the entire file with:

```tsx
'use client'

import { useState, useMemo } from 'react'
import { parseISO } from 'date-fns'
import type { Shift, Holiday } from '@/lib/types'
import PageHeader from './PageHeader'
import MonthNavigator from './MonthNavigator'
import CalendarGrid from './CalendarGrid'
import DayDetailSheet from './DayDetailSheet'
import ShiftLegend from './ShiftLegend'
import EmptyMonth from './EmptyMonth'
import StaffFilterBar from './StaffFilterBar'

interface EntryWithName {
  profile_id: string
  shift_id: string
  work_date: string
  profiles: { full_name: string } | null
}

interface Props {
  month: string
  monthDate: string
  entries: EntryWithName[]
  shifts: Shift[]
  holidays: Holiday[]
  today: string
}

export default function CalendarView({
  month, monthDate, entries, shifts, holidays, today,
}: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedEntries, setSelectedEntries] = useState<EntryWithName[]>([])
  const [filteredProfileId, setFilteredProfileId] = useState<string | null>(null)

  const staffList = useMemo(() => {
    const seen = new Map<string, string>()
    for (const e of entries) {
      if (e.profiles && !seen.has(e.profile_id)) {
        seen.set(e.profile_id, e.profiles.full_name)
      }
    }
    return [...seen.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'zh-TW'))
  }, [entries])

  const filteredEntries = useMemo(
    () => filteredProfileId
      ? entries.filter(e => e.profile_id === filteredProfileId)
      : entries,
    [entries, filteredProfileId]
  )

  function handleDayClick(date: string, dayEntries: EntryWithName[]) {
    setSelectedDate(date)
    setSelectedEntries(dayEntries)
  }

  return (
    <div className="min-h-screen bg-[var(--neutral-50)]">
      <PageHeader />
      <MonthNavigator month={month} monthDate={monthDate} />
      <StaffFilterBar
        staff={staffList}
        value={filteredProfileId}
        onChange={setFilteredProfileId}
      />
      <CalendarGrid
        monthDate={parseISO(monthDate)}
        entries={filteredEntries}
        shifts={shifts}
        holidays={holidays}
        today={today}
        onDayClick={handleDayClick}
      />
      {filteredEntries.length === 0 && <EmptyMonth />}
      <ShiftLegend shifts={shifts} />
      <DayDetailSheet
        open={selectedDate !== null}
        onClose={() => setSelectedDate(null)}
        date={selectedDate}
        entries={selectedEntries}
        shifts={shifts}
        holidays={holidays}
      />
    </div>
  )
}
```

- [ ] **Verify:** `npm run type-check` — expect 0 errors

- [ ] **Commit:**
```bash
git add components/calendar/StaffFilterBar.tsx components/calendar/CalendarView.tsx
git commit -m "feat: add staff filter to public schedule page"
```
