# Schedule Admin Mobile UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Optimise the `schedule_admin` UI for mobile-first operation using a responsive (`md:` breakpoint) strategy — mobile gets bottom nav, vaul drawers, long-press multi-select, and a clickable month picker; desktop keeps the existing sidebar + Dialog + BulkPanel layout.

**Architecture:** A single `md:` Tailwind breakpoint (768 px) splits mobile and desktop behaviour. Mobile adds a fixed bottom nav (replacing the sidebar), swaps Dialog/BulkPanel for vaul `Drawer`, and replaces click-accumulation multi-select with a long-press gesture. All changes are additive — no existing desktop code is removed.

**Tech Stack:** Next.js 15 App Router · Tailwind CSS (`md:` breakpoint) · vaul ^1.1.2 (already installed) · shadcn/ui Popover · lucide-react

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `app/schedule_admin/layout.tsx` | Hide sidebar on mobile, add bottom-nav, add `pb-16 md:pb-0` to main |
| Modify | `components/admin/AdminSidebar.tsx` | Add `hidden md:flex` so sidebar is desktop-only |
| **Create** | `components/admin/MobileBottomNav.tsx` | Fixed bottom nav bar (排班/員工/節假日/設定) |
| Modify | `components/admin/schedule/ScheduleClient.tsx` | Mobile density default, long-press handler, icon-only density button on mobile |
| **Create** | `components/admin/schedule/MonthPicker.tsx` | Year/month grid popover triggered by month title |
| Modify | `components/admin/schedule/MonthNavigator.tsx` | Replace static month label with `<MonthPicker>`, compact "今" on mobile |
| **Create** | `hooks/use-long-press.ts` | Returns pointer handlers + `didLongPress()` query |
| Modify | `components/admin/schedule/MonthDayCell.tsx` | Wire long-press hook, add `onLongPress` prop |
| Modify | `components/admin/schedule/MonthGrid.tsx` | Thread `onLongPress` prop to `MonthDayCell` |
| **Create** | `hooks/use-is-mobile.ts` | `useIsMobile()` — MediaQueryList-based, SSR-safe |
| Modify | `components/admin/schedule/DayModal.tsx` | vaul `Drawer` on mobile, existing `Dialog` on desktop |
| Modify | `components/admin/schedule/BulkPanel.tsx` | vaul `Drawer` on mobile, existing right-panel on desktop |

---

## Task 1: Bottom Nav + Sidebar Responsive Layout

**Files:**
- Create: `components/admin/MobileBottomNav.tsx`
- Modify: `components/admin/AdminSidebar.tsx`
- Modify: `app/schedule_admin/layout.tsx`

- [ ] **Step 1: Create MobileBottomNav**

```tsx
// components/admin/MobileBottomNav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, Users, CalendarOff, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/schedule_admin', label: '排班',  icon: CalendarDays },
  { href: '/staff_admin',    label: '員工',  icon: Users },
  { href: '/holidays_admin', label: '節假日', icon: CalendarOff },
  { href: '/settings_admin', label: '設定',  icon: Settings },
]

export default function MobileBottomNav() {
  const pathname = usePathname()
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-zinc-200 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center py-2 gap-1 text-xs',
                active ? 'text-indigo-600' : 'text-zinc-400'
              )}
            >
              <Icon size={22} />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Hide AdminSidebar on mobile**

In `components/admin/AdminSidebar.tsx` line 18, change:
```tsx
// Before
<aside className="w-56 shrink-0 bg-zinc-900 flex flex-col py-6 px-3">

// After
<aside className="w-56 shrink-0 bg-zinc-900 hidden md:flex flex-col py-6 px-3">
```

- [ ] **Step 3: Update layout to add MobileBottomNav and bottom padding**

Replace `app/schedule_admin/layout.tsx` entirely:
```tsx
import AdminSidebar from '@/components/admin/AdminSidebar'
import MobileBottomNav from '@/components/admin/MobileBottomNav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-zinc-100 overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  )
}
```

- [ ] **Step 4: Type-check**

```bash
npm run type-check
```
Expected: no errors.

- [ ] **Step 5: Lint**

```bash
npm run lint
```
Expected: no new warnings.

- [ ] **Step 6: Visual check**

Start `npm run dev`, open `http://localhost:3000/schedule_admin` in Chrome DevTools mobile emulation (375 px wide). Confirm:
- Sidebar is hidden
- Bottom nav shows 4 icons + labels at the bottom
- Main content does not hide behind the nav (has bottom padding)
- On desktop (> 768 px): sidebar is visible, bottom nav is hidden

- [ ] **Step 7: Commit**

```bash
git add components/admin/MobileBottomNav.tsx components/admin/AdminSidebar.tsx app/schedule_admin/layout.tsx
git commit -m "feat: add mobile bottom nav, hide sidebar on mobile"
```

---

## Task 2: Mobile Density Default (Compact)

**Files:**
- Modify: `components/admin/schedule/ScheduleClient.tsx` (line 44–47)

- [ ] **Step 1: Update density initialiser**

In `ScheduleClient.tsx`, replace lines 44–47:

```tsx
// Before
const [density, setDensity] = useState<'full' | 'compact'>(() => {
  if (typeof window === 'undefined') return 'full'
  return (localStorage.getItem('adminScheduleDensity') as 'full' | 'compact') ?? 'full'
})

// After
const [density, setDensity] = useState<'full' | 'compact'>(() => {
  if (typeof window === 'undefined') return 'compact'
  const saved = localStorage.getItem('adminScheduleDensity')
  if (saved) return saved as 'full' | 'compact'
  return window.innerWidth < 768 ? 'compact' : 'full'
})
```

Saved preference always wins; the mobile default only applies on first visit (no localStorage entry yet).

- [ ] **Step 2: Type-check + commit**

```bash
npm run type-check
git add components/admin/schedule/ScheduleClient.tsx
git commit -m "feat: default density to compact on mobile"
```

---

## Task 3: Clickable Month Title + MonthPicker

**Files:**
- Create: `components/admin/schedule/MonthPicker.tsx`
- Modify: `components/admin/schedule/MonthNavigator.tsx`

- [ ] **Step 1: Create MonthPicker**

```tsx
// components/admin/schedule/MonthPicker.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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

  const navigate = (y: number, m: number) => {
    router.push(`/schedule_admin/${y}-${String(m).padStart(2, '0')}`)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="text-sm font-semibold text-zinc-800 min-w-[120px] text-center hover:text-indigo-600 transition-colors"
        >
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-3" align="center">
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
      </PopoverContent>
    </Popover>
  )
}
```

- [ ] **Step 2: Update MonthNavigator**

Replace `components/admin/schedule/MonthNavigator.tsx` entirely:

```tsx
'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  parseMonthParam,
  formatMonthLabel,
  prevMonthParam,
  nextMonthParam,
  getCurrentMonthParam,
} from '@/lib/dates'
import MonthPicker from './MonthPicker'

interface Props {
  monthParam: string
}

export default function MonthNavigator({ monthParam }: Props) {
  const router = useRouter()
  const parsed = parseMonthParam(monthParam)

  if (!parsed) return null

  const label = formatMonthLabel(parsed)

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => router.push('/schedule_admin/' + prevMonthParam(parsed))}
        className="h-8 w-8 border-zinc-200"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <MonthPicker monthParam={monthParam} label={label} />

      <Button
        variant="outline"
        size="icon"
        onClick={() => router.push('/schedule_admin/' + nextMonthParam(parsed))}
        className="h-8 w-8 border-zinc-200"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* 今天 — full text on desktop, abbreviated on mobile */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push('/schedule_admin/' + getCurrentMonthParam())}
        className="h-8 border-zinc-200 text-xs"
      >
        <span className="hidden sm:inline">今天</span>
        <span className="sm:hidden">今</span>
      </Button>
    </div>
  )
}
```

- [ ] **Step 3: Type-check**

```bash
npm run type-check
```
Expected: no errors.

- [ ] **Step 4: Visual check**

On mobile: tapping the month title opens a popover with year navigation and 12 month buttons. Tapping a month navigates to that month. "今天" shows as "今" on small screens.

- [ ] **Step 5: Commit**

```bash
git add components/admin/schedule/MonthPicker.tsx components/admin/schedule/MonthNavigator.tsx
git commit -m "feat: add month picker popover, compact today button on mobile"
```

---

## Task 4: Long-Press Multi-Select (Mobile)

**Files:**
- Create: `hooks/use-long-press.ts`
- Modify: `components/admin/schedule/MonthDayCell.tsx`
- Modify: `components/admin/schedule/MonthGrid.tsx`
- Modify: `components/admin/schedule/ScheduleClient.tsx`

- [ ] **Step 1: Create `hooks/use-long-press.ts`**

```ts
// hooks/use-long-press.ts
import { useCallback, useRef } from 'react'

/**
 * Returns pointer event handlers for long-press detection.
 *
 * Usage:
 *   const lp = useLongPress(() => enterMultiSelect())
 *   <button {...lp.handlers} onClick={() => { if (lp.didLongPress()) return; handleClick() }}>
 *
 * didLongPress() returns true if a long press just fired, then resets.
 * This lets onClick skip its own logic after a long press.
 */
export function useLongPress(onLongPress: () => void, delay = 500) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const firedRef = useRef(false)

  const start = useCallback(() => {
    firedRef.current = false
    timerRef.current = setTimeout(() => {
      firedRef.current = true
      onLongPress()
    }, delay)
  }, [onLongPress, delay])

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const didLongPress = useCallback((): boolean => {
    const result = firedRef.current
    firedRef.current = false
    return result
  }, [])

  return {
    handlers: {
      onPointerDown: start,
      onPointerUp: cancel,
      onPointerLeave: cancel,
    },
    didLongPress,
  }
}
```

- [ ] **Step 2: Add `onLongPress` prop to `MonthDayCell`**

In `components/admin/schedule/MonthDayCell.tsx`, make these changes:

Add import at top:
```tsx
import { useLongPress } from '@/hooks/use-long-press'
```

Add `onLongPress?: () => void` to the `Props` interface (after `onDelete`):
```tsx
interface Props {
  // ...existing props...
  onClick: () => void
  onDelete: (entry: ScheduleEntry) => void
  onLongPress?: () => void   // ← add this
}
```

Add `onLongPress` to the destructured params:
```tsx
export default function MonthDayCell({
  date, isCurrentMonth, isToday, holiday, shifts, matrix, profiles,
  isSelected, filteredProfileId, density, onClick, onDelete, onLongPress,  // ← add onLongPress
}: Props) {
```

Add the hook call right after the props destructuring (before `const dayNumber`):
```tsx
  const lp = useLongPress(onLongPress ?? (() => {}))
```

Update the `<button>` element — add `{...lp.handlers}` and wrap `onClick` to skip if long press fired:
```tsx
  <button
    type="button"
    {...lp.handlers}
    onClick={() => {
      if (lp.didLongPress()) return
      onClick()
    }}
    className={[
      'flex flex-col items-start p-1 w-full min-h-[90px] rounded-md border text-left',
      'transition-colors focus:outline-none touch-none',
      isSelected
        ? 'ring-2 ring-indigo-500 border-indigo-300 bg-indigo-50'
        : 'border-zinc-200 bg-white hover:bg-zinc-50',
      !isCurrentMonth ? 'opacity-40' : '',
    ]
      .filter(Boolean)
      .join(' ')}
  >
```

- [ ] **Step 3: Thread `onLongPress` through `MonthGrid`**

In `components/admin/schedule/MonthGrid.tsx`, add `onLongPress` to the `Props` interface:
```tsx
interface Props {
  // ...existing props...
  onDateClick: (date: string) => void
  onDelete: (entry: ScheduleEntry) => void
  onLongPress: (date: string) => void   // ← add this
}
```

Add `onLongPress` to the destructured params:
```tsx
export default function MonthGrid({
  calendarDates, shifts, profiles, matrix, holidays, selection,
  filteredProfileId, density, onDateClick, onDelete, onLongPress,  // ← add
}: Props) {
```

Pass it to `MonthDayCell`:
```tsx
<MonthDayCell
  key={date}
  date={date}
  isCurrentMonth={isCurrentMonth}
  isToday={isToday}
  holiday={holiday}
  shifts={shifts}
  matrix={matrix}
  profiles={profiles}
  isSelected={isSelected}
  filteredProfileId={filteredProfileId}
  density={density}
  onClick={() => onDateClick(date)}
  onDelete={onDelete}
  onLongPress={() => onLongPress(date)}   // ← add
/>
```

- [ ] **Step 4: Add `handleDateLongPress` to `ScheduleClient` and pass it through**

In `components/admin/schedule/ScheduleClient.tsx`, add `handleDateLongPress` after `handleDateClick` (around line 66):

```tsx
const handleDateLongPress = (date: string) => {
  setSelection(prev => {
    if (prev.mode === 'idle') {
      return { mode: 'multi', dates: [date] }
    }
    if (prev.mode === 'single') {
      const combined = prev.date === date ? [date] : [prev.date, date]
      return { mode: 'multi', dates: combined }
    }
    if (prev.mode === 'multi') {
      const next = prev.dates.includes(date)
        ? prev.dates.filter(d => d !== date)
        : [...prev.dates, date]
      if (next.length === 0) return { mode: 'idle' }
      return { mode: 'multi', dates: next }
    }
    return prev
  })
}
```

Pass it to `MonthGrid` (around line 204):
```tsx
<MonthGrid
  calendarDates={calendarDates}
  shifts={shifts}
  profiles={profiles}
  matrix={matrix}
  holidays={holidays}
  selection={selection}
  filteredProfileId={filteredProfileId}
  density={density}
  onDateClick={handleDateClick}
  onDelete={handleDelete}
  onLongPress={handleDateLongPress}   // ← add
/>
```

- [ ] **Step 5: Type-check**

```bash
npm run type-check
```
Expected: no errors.

- [ ] **Step 6: Visual check**

On mobile emulation:
- Short tap on a date → opens single-date view (DayModal still works)
- Long press (hold ~500 ms) on a date → no modal opens; cell shows selected ring (multi mode)
- Short tap on another date while in multi mode → toggles it in/out of selection
- Long press the same selected date → removes it from selection

- [ ] **Step 7: Commit**

```bash
git add hooks/use-long-press.ts components/admin/schedule/MonthDayCell.tsx components/admin/schedule/MonthGrid.tsx components/admin/schedule/ScheduleClient.tsx
git commit -m "feat: long-press multi-select on mobile"
```

---

## Task 5: `useIsMobile` Hook

**Files:**
- Create: `hooks/use-is-mobile.ts`

- [ ] **Step 1: Create hook**

```ts
// hooks/use-is-mobile.ts
'use client'

import { useEffect, useState } from 'react'

/**
 * Returns true when viewport width < breakpoint (default 768 px, matches Tailwind `md:`).
 * SSR-safe: returns false during server render.
 */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [breakpoint])

  return isMobile
}
```

- [ ] **Step 2: Commit**

```bash
git add hooks/use-is-mobile.ts
git commit -m "feat: add useIsMobile hook"
```

---

## Task 6: Responsive DayModal (Dialog → Drawer on Mobile)

**Files:**
- Modify: `components/admin/schedule/DayModal.tsx`

- [ ] **Step 1: Refactor DayModal to support both Dialog and Drawer**

Replace `components/admin/schedule/DayModal.tsx` entirely:

```tsx
'use client'

import { format, parseISO } from 'date-fns'
import { Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Drawer } from 'vaul'
import { Button } from '@/components/ui/button'
import type { Shift, Profile, ScheduleEntry, ScheduleMatrix } from '@/lib/types'
import ShiftSelector from './ShiftSelector'
import { useIsMobile } from '@/hooks/use-is-mobile'

const DAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']

interface Props {
  open: boolean
  date: string
  shifts: Shift[]
  profiles: Profile[]
  matrix: ScheduleMatrix
  onInsert: (shiftId: string, profileIds: string[], dates: string[]) => Promise<void>
  onDelete: (entry: ScheduleEntry) => Promise<void>
  onClose: () => void
}

function DayModalBody({
  date, shifts, profiles, matrix, onInsert, onDelete, onClose,
}: Omit<Props, 'open'>) {
  const d = parseISO(date)
  const dayLabel = DAY_LABELS[d.getDay()]
  const profileMap = new Map(profiles.map(p => [p.id, p]))
  const dayEntries = Object.values(matrix).flatMap(byDate => byDate[date] ?? [])

  return (
    <>
      <p className="text-base font-semibold text-zinc-900 mb-4">
        {format(d, 'M月d日')} ({dayLabel})
      </p>

      {shifts.map(shift => {
        const entries = matrix[shift.id]?.[date] ?? []
        if (entries.length === 0) return null
        return (
          <div key={shift.id} className="mb-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: shift.color }} />
              <span className="text-xs font-medium text-zinc-600">
                {shift.name} {shift.start_time.slice(0, 5)}–{shift.end_time.slice(0, 5)}
              </span>
            </div>
            {entries.map(entry => {
              const profile = profileMap.get(entry.profile_id)
              if (!profile) return null
              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-zinc-50"
                >
                  <span className="text-sm text-zinc-800">{profile.full_name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-zinc-400 hover:text-red-500"
                    onClick={() => onDelete(entry)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )
            })}
          </div>
        )
      })}

      {dayEntries.length === 0 && (
        <p className="text-sm text-zinc-400 mb-3">本日尚無排班</p>
      )}

      <div className="border-t border-zinc-100 pt-4">
        <p className="text-sm font-medium text-zinc-700 mb-3">新增排班</p>
        <ShiftSelector
          shifts={shifts}
          profiles={profiles}
          selectedDates={[date]}
          matrix={matrix}
          onConfirm={(shiftId, profileIds) => onInsert(shiftId, profileIds, [date])}
          onCancel={onClose}
        />
      </div>
    </>
  )
}

export default function DayModal({
  open, date, shifts, profiles, matrix, onInsert, onDelete, onClose,
}: Props) {
  const isMobile = useIsMobile()

  if (!date) return null

  if (isMobile) {
    return (
      <Drawer.Root open={open} onOpenChange={(o) => !o && onClose()}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Drawer.Content className="bg-white flex flex-col rounded-t-2xl fixed bottom-0 left-0 right-0 z-50 max-h-[90dvh] outline-none">
            {/* Drag handle */}
            <div className="mx-auto mt-3 mb-2 w-12 h-1.5 rounded-full bg-zinc-300 flex-shrink-0" />
            <div className="overflow-y-auto flex-1 px-5 pb-8">
              <DayModalBody
                date={date}
                shifts={shifts}
                profiles={profiles}
                matrix={matrix}
                onInsert={onInsert}
                onDelete={onDelete}
                onClose={onClose}
              />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="sr-only">排班詳情</DialogTitle>
        </DialogHeader>
        <DayModalBody
          date={date}
          shifts={shifts}
          profiles={profiles}
          matrix={matrix}
          onInsert={onInsert}
          onDelete={onDelete}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```
Expected: no errors.

- [ ] **Step 3: Visual check**

Mobile: tapping a date opens a bottom drawer that slides up from the bottom. Can swipe down to close. Shows existing entries + ShiftSelector.
Desktop: unchanged Dialog behaviour.

- [ ] **Step 4: Commit**

```bash
git add components/admin/schedule/DayModal.tsx
git commit -m "feat: responsive DayModal — vaul Drawer on mobile, Dialog on desktop"
```

---

## Task 7: Responsive BulkPanel (Panel → Drawer on Mobile)

**Files:**
- Modify: `components/admin/schedule/BulkPanel.tsx`

- [ ] **Step 1: Refactor BulkPanel**

Replace `components/admin/schedule/BulkPanel.tsx` entirely:

```tsx
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
            className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium"
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
      <Drawer.Root open={open} onOpenChange={(o) => !o && onClear()}>
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
```

- [ ] **Step 2: Type-check + lint**

```bash
npm run type-check && npm run lint
```
Expected: no errors.

- [ ] **Step 3: Visual check**

Mobile: long-pressing multiple dates, then the bulk drawer slides up from the bottom showing selected date badges + ShiftSelector.
Desktop: existing right-panel slide-in behaviour is unchanged.

- [ ] **Step 4: Final smoke test**

On mobile emulation, run through the full flows:
1. Navigate months using ← →, tap month title to use month picker
2. Tap a date → bottom drawer opens → add a shift → close
3. Long press a date → multi-select mode (ring visible) → tap more dates → bulk drawer opens → add shifts → toast confirms

- [ ] **Step 5: Commit**

```bash
git add components/admin/schedule/BulkPanel.tsx hooks/use-is-mobile.ts
git commit -m "feat: responsive BulkPanel — vaul Drawer on mobile, right panel on desktop"
```

---

## Self-Review

### Spec Coverage

| Decision | Task |
|----------|------|
| Bottom Nav Bar (A) | Task 1 |
| Density default compact on mobile (B, default compact) | Task 2 |
| Clickable month title + MonthPicker (C) | Task 3 |
| Long press multi-select (B) | Task 4 |
| DayModal → vaul Drawer on mobile (A) | Task 6 |
| BulkPanel → vaul Drawer on mobile (A) | Task 7 |
| Responsive md: strategy (A) | All tasks |

All grill-me decisions are covered. ✓

### Placeholder Scan

No TBDs, TODOs, or placeholder references. Every step has complete code. ✓

### Type Consistency

- `onLongPress` added consistently in MonthDayCell Props → MonthGrid Props → ScheduleClient call ✓
- `DayModalBody` / `BulkPanelBody` receive `Omit<Props, 'open'>` which matches all usage ✓
- `useIsMobile` imported from `@/hooks/use-is-mobile` in both DayModal and BulkPanel ✓
- `useLongPress` imported from `@/hooks/use-long-press` in MonthDayCell ✓
