# Admin Schedule: Weekly → Monthly View

## Decisions

| # | Decision |
|---|----------|
| 1 | Layout: calendar-style 7-col × ~5-row grid (day cells) |
| 2 | Multi-select: click-only — click to select, click again to deselect; BulkPanel "取消" clears all |
| 3 | Day cell view A (default): shift color bars with staff names (reuse `ShiftBar`) |
| 4 | Day cell view B (compact): one colored dot + count per shift (e.g. `● 2`) |
| 5 | A/B toggle: button in toolbar, persists in `localStorage` |
| 6 | URL: `/schedule_admin/YYYY-MM` (same format as public `/schedule/YYYY-MM`) |
| 7 | Old week URLs (`/schedule_admin/YYYY-Www`): 404 — no redirect |
| 8 | Root `/schedule_admin` redirects to current month |

---

## Affected Files

### Delete / rename
- `app/schedule_admin/[week]/` → rename folder to `app/schedule_admin/[month]/`
- `components/admin/schedule/WeekNavigator.tsx` → replace with `MonthNavigator.tsx`
- `components/admin/schedule/ScheduleGrid.tsx` → replace with `MonthGrid.tsx`

### New files
- `app/schedule_admin/[month]/page.tsx` — server component
- `components/admin/schedule/MonthNavigator.tsx`
- `components/admin/schedule/MonthGrid.tsx`
- `components/admin/schedule/MonthDayCell.tsx` — day cell with A/B mode

### Modified files
- `app/schedule_admin/page.tsx` — redirect to current month
- `app/schedule_admin/[month]/error.tsx` — keep as-is
- `lib/dates.ts` — add month utility functions
- `components/admin/schedule/ScheduleClient.tsx` — major rewrite (remove drag, add click-toggle, add density state)
- `components/admin/schedule/DayModal.tsx` — keep as-is (single-date editing unchanged)
- `components/admin/schedule/BulkPanel.tsx` — add 取消 button to clear selection
- `components/admin/schedule/ShiftSelector.tsx` — keep as-is
- `components/admin/schedule/StaffFilter.tsx` — keep as-is
- `components/admin/schedule/StaffChip.tsx` — keep as-is
- `components/admin/AdminSidebar.tsx` — verify link still points to `/schedule_admin`

---

## Tasks

### 1. Month utility functions — `lib/dates.ts`

Add:
```ts
// Parse "YYYY-MM" → first day of month as Date
parseMonthParam(param: string): Date

// Format Date → "YYYY-MM"
toMonthParam(date: Date): string

// Return array of {date: string, isCurrentMonth: boolean} for the calendar grid
// Includes leading days from prev month and trailing days from next month to fill 7-col rows
getMonthCalendarDates(monthStart: Date): { date: string; isCurrentMonth: boolean }[]

// Prev/next month params
prevMonthParam(param: string): string
nextMonthParam(param: string): string

// Format label: "2026年6月"
formatMonthLabel(param: string): string
```

---

### 2. Rename route folder

`app/schedule_admin/[week]/` → `app/schedule_admin/[month]/`

---

### 3. Server page — `app/schedule_admin/[month]/page.tsx`

Same pattern as the current week page but with a month date range:
- Parse `params.month` as `YYYY-MM`; redirect to `/schedule_admin` on invalid format
- Fetch `da_schedule_entries` for the full month range
- Fetch `da_shifts`, `da_profiles` (active only), `da_holidays` for month range
- Pass `monthParam`, `monthDates` (all calendar grid dates), shifts, profiles, initialEntries, holidays to `ScheduleClient`

---

### 4. Root redirect — `app/schedule_admin/page.tsx`

```ts
redirect(`/schedule_admin/${toMonthParam(toZonedTime(new Date(), 'Asia/Taipei'))}`)
```

---

### 5. MonthNavigator — `components/admin/schedule/MonthNavigator.tsx`

Props: `monthParam: string`

- Chevron buttons: `router.push(/schedule_admin/${prev|nextMonthParam(monthParam)})`
- Center label: `formatMonthLabel(monthParam)` — e.g., "2026年6月"
- "今天" button that pushes to current month

---

### 6. MonthDayCell — `components/admin/schedule/MonthDayCell.tsx`

Props:
```ts
{
  date: string
  isCurrentMonth: boolean
  isToday: boolean
  holiday: Holiday | undefined
  shifts: Shift[]
  entries: ScheduleEntry[]  // all entries for this date
  profiles: Profile[]
  isSelected: boolean
  filteredProfileId: string | null
  density: 'full' | 'compact'
  onClick: () => void
}
```

Layout:
- Date number: top-left, red if holiday, indigo circle if today, muted if outside current month
- View A (`density === 'full'`): render `<ShiftBar>` per shift (reuse existing component), filtered by `filteredProfileId`
- View B (`density === 'compact'`): render one colored dot + count per shift that has ≥1 entry; dot color = shift color; hide shifts with 0 entries
- Selection highlight: indigo ring when `isSelected`
- Out-of-month dates: dimmed (`opacity-40`), still clickable

---

### 7. MonthGrid — `components/admin/schedule/MonthGrid.tsx`

Props: `calendarDates`, shifts, profiles, entries (all month), holidays, selection, filteredProfileId, density, onDateClick

- Header row: 日 一 二 三 四 五 六
- 7-column CSS grid; ~5–6 rows
- Renders `MonthDayCell` for each calendar date
- No global pointerup listener (drag removed)

---

### 8. ScheduleClient rewrite — `components/admin/schedule/ScheduleClient.tsx`

**Remove:**
- `handleDragStart`, `handleDragEnter`, `handleDragEnd`
- `dragging` mode from SelectionState usage
- `weekDates` prop → replaced by `monthDates` (calendar grid dates)

**Add:**
- `density` state: `'full' | 'compact'`, initialized from `localStorage.getItem('adminScheduleDensity') ?? 'full'`
- Save to `localStorage` on toggle
- `handleDateClick(date)`: 
  - If `mode === 'idle'` → set `{ mode: 'single', date }`
  - If `mode === 'single'` and same date → set `{ mode: 'idle' }` (deselect)
  - If `mode === 'single'` and different date → set `{ mode: 'multi', dates: [prev, newDate] }`
  - If `mode === 'multi'`: toggle date in/out of `dates`; if 0 remain → idle; if 1 remains → single
  - If `mode === 'multi'` and date not in set → add it

**Toolbar layout:**
- Left: MonthNavigator
- Right: density toggle button (icon or "詳 / 簡"), StaffFilter

**Panel behavior:**
- `mode === 'single'` → DayModal opens (unchanged)
- `mode === 'multi'` → BulkPanel opens (add "取消" button)

---

### 9. BulkPanel update — `components/admin/schedule/BulkPanel.tsx`

Add a "取消" button that calls `onClear()` prop (parent sets selection to idle).

---

### 10. Error page

`app/schedule_admin/[month]/error.tsx` — copy from `[week]/error.tsx` unchanged.

---

## Data Flow (new)

```
[month] page (Server)
  ↓ fetch entries for full month, shifts, profiles, holidays
  ↓
ScheduleClient (Client)
  ├─ matrix: ScheduleMatrix (same structure, larger date range)
  ├─ selection: SelectionState (idle | single | multi — no dragging)
  ├─ density: 'full' | 'compact' (localStorage)
  ├─ filteredProfileId
  │
  ├─ MonthNavigator (prev/next/今天)
  ├─ MonthGrid (7×5 calendar)
  │   └─ MonthDayCell × ~35 (A: ShiftBars, B: dots+count)
  ├─ DayModal (single-date, unchanged)
  └─ BulkPanel (multi-date, + 取消 button)
```
