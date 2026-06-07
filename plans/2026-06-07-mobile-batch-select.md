# Mobile Batch Select Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the broken long-press batch-select on mobile with an explicit "選取" toggle button that enters a dedicated selecting mode, making batch scheduling reliably usable on touch devices.

**Architecture:** Add a `selecting` mode to `SelectionState`; a mobile-only "選取/取消" button in the schedule header enters/exits it; while in selecting mode every cell tap toggles selection and an iOS-style circle indicator appears on each cell; the existing `BulkPanel` opens when ≥1 date is selected.

**Tech Stack:** Next.js 15 App Router · React 19 · TypeScript · Tailwind CSS · Vaul (drawer)

---

## File Map

| File | Change |
|------|--------|
| `lib/types.ts` | Add `selecting` mode to `SelectionState` |
| `components/admin/schedule/ScheduleClient.tsx` | New handlers; "選取" button; updated BulkPanel props |
| `components/admin/schedule/MonthGrid.tsx` | Remove `onLongPress`; add `isSelectingMode` prop |
| `components/admin/schedule/MonthDayCell.tsx` | Remove long press hook; add circle indicator; add `isSelectingMode` prop |
| `app/settings_admin/SettingsClient.tsx` | Update usage instructions (line 245) |

---

## Task 1: Extend SelectionState type

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: Add `selecting` mode**

Replace the current `SelectionState` definition (lines 50–54):

```ts
export type SelectionState =
  | { mode: 'idle' }
  | { mode: 'single'; date: string }
  | { mode: 'dragging'; dates: string[] }
  | { mode: 'multi'; dates: string[] }
  | { mode: 'selecting'; dates: string[] }  // mobile batch-select mode; dates may be empty
```

- [ ] **Step 2: Type-check**

```powershell
npm run type-check
```

Expected: no new errors (nothing else references `selecting` yet).

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add selecting mode to SelectionState for mobile batch select"
```

---

## Task 2: Update MonthDayCell — remove long press, add circle indicator

**Files:**
- Modify: `components/admin/schedule/MonthDayCell.tsx`

- [ ] **Step 1: Remove `onLongPress` prop and `useLongPress` import**

Remove from the imports line:
```ts
import { useLongPress } from '@/hooks/use-long-press'
```

Remove `onLongPress?: () => void` from the `Props` interface.

Remove from the destructured parameters: `onLongPress`.

- [ ] **Step 2: Add `isSelectingMode` prop**

Add to `Props` interface:
```ts
isSelectingMode: boolean
```

Add to the destructured parameters: `isSelectingMode`.

- [ ] **Step 3: Remove long-press hook usage, simplify onClick**

Replace:
```ts
const lp = useLongPress(onLongPress ?? (() => {}))
```
with nothing (delete the line).

Replace the button's `onClick` handler:
```tsx
onClick={() => {
  if (lp.didLongPress()) return
  onClick()
}}
```
with:
```tsx
onClick={onClick}
```

Remove `{...lp.handlers}` from the button's JSX.

- [ ] **Step 4: Add `relative` to button className and circle indicator**

The button's `className` array currently starts with:
```
'flex flex-col items-start p-1 w-full min-h-[90px] rounded-md border text-left',
```

Add `relative` to that string:
```
'relative flex flex-col items-start p-1 w-full min-h-[90px] rounded-md border text-left',
```

Add the circle indicator as the **last child** inside the `<button>`, after all existing content:
```tsx
{/* Selection mode circle indicator (mobile batch select) */}
{isSelectingMode && (
  <div
    className={[
      'absolute top-1 right-1 w-4 h-4 rounded-full border-2 flex items-center justify-center',
      isSelected
        ? 'bg-[var(--accent-500)] border-[var(--accent-500)]'
        : 'bg-white border-zinc-300',
    ].join(' ')}
  >
    {isSelected && (
      <svg
        className="w-2.5 h-2.5 text-white"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={3}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    )}
  </div>
)}
```

- [ ] **Step 5: Type-check**

```powershell
npm run type-check
```

Expected: errors about `onLongPress` no longer existing in Props — those will be fixed in Task 3 when MonthGrid is updated.

- [ ] **Step 6: Commit** (after Task 3 resolves the type errors)

Defer this commit to end of Task 3.

---

## Task 3: Update MonthGrid — remove onLongPress, add isSelectingMode

**Files:**
- Modify: `components/admin/schedule/MonthGrid.tsx`

- [ ] **Step 1: Remove `onLongPress` prop, add `isSelectingMode`**

In the `Props` interface, replace:
```ts
onLongPress: (date: string) => void
```
with:
```ts
isSelectingMode: boolean
```

In the destructured parameters, replace `onLongPress` with `isSelectingMode`.

- [ ] **Step 2: Update `isSelected` logic to include `selecting` mode**

Replace:
```ts
const isSelected =
  (selection.mode === 'single' && selection.date === date) ||
  (selection.mode === 'multi' && selection.dates.includes(date))
```
with:
```ts
const isSelected =
  (selection.mode === 'single' && selection.date === date) ||
  (selection.mode === 'multi' && selection.dates.includes(date)) ||
  (selection.mode === 'selecting' && selection.dates.includes(date))
```

- [ ] **Step 3: Pass `isSelectingMode` to MonthDayCell, remove `onLongPress`**

Replace the `MonthDayCell` usage:
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
  onLongPress={() => onLongPress(date)}
/>
```
with:
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
  isSelectingMode={isSelectingMode}
  filteredProfileId={filteredProfileId}
  density={density}
  onClick={() => onDateClick(date)}
  onDelete={onDelete}
/>
```

- [ ] **Step 4: Type-check**

```powershell
npm run type-check
```

Expected: errors in `ScheduleClient.tsx` about missing `isSelectingMode` and unknown `onLongPress` — fixed in Task 4.

- [ ] **Step 5: Commit** (after Task 4 resolves the type errors — commit Tasks 2+3 together)

```bash
git add components/admin/schedule/MonthDayCell.tsx components/admin/schedule/MonthGrid.tsx
git commit -m "feat: remove long press from month calendar cells, add selection mode circle indicator"
```

---

## Task 4: Update ScheduleClient — new handlers, 選取 button, updated props

**Files:**
- Modify: `components/admin/schedule/ScheduleClient.tsx`

- [ ] **Step 1: Update `handleDateClick` to handle `selecting` mode**

Replace the entire `handleDateClick` function:
```ts
const handleDateClick = (date: string) => {
  setSelection(prev => {
    if (prev.mode === 'idle') return { mode: 'single', date }
    if (prev.mode === 'single') {
      if (prev.date === date) return { mode: 'idle' }
      return { mode: 'multi', dates: [prev.date, date] }
    }
    if (prev.mode === 'multi') {
      const next = prev.dates.includes(date)
        ? prev.dates.filter(d => d !== date)
        : [...prev.dates, date]
      if (next.length === 0) return { mode: 'idle' }
      if (next.length === 1) return { mode: 'single', date: next[0] }
      return { mode: 'multi', dates: next }
    }
    if (prev.mode === 'selecting') {
      const next = prev.dates.includes(date)
        ? prev.dates.filter(d => d !== date)
        : [...prev.dates, date]
      return { mode: 'selecting', dates: next }
    }
    return prev
  })
}
```

- [ ] **Step 2: Remove `handleDateLongPress`, update `handleClose`, add selecting mode handlers**

Delete the entire `handleDateLongPress` function.

Replace `handleClose` and `handleClear`:
```ts
// Dismiss BulkPanel without exiting selecting mode (e.g., swipe drawer down)
const handleClose = () => {
  setSelection(prev => {
    if (prev.mode === 'selecting') return { mode: 'selecting', dates: [] }
    return { mode: 'idle' }
  })
}
// Exit selecting mode entirely (e.g., "取消選取" button or header 取消 button)
const handleClear = () => setSelection({ mode: 'idle' })
```

Add the two selecting mode entry/exit handlers right after `handleClear`:
```ts
const handleEnterSelectMode = () => setSelection({ mode: 'selecting', dates: [] })
const handleCancelSelectMode = () => setSelection({ mode: 'idle' })
```

- [ ] **Step 3: Add "選取/取消" button to mobile header row 1**

The current row 1 (`flex items-center justify-between`):
```tsx
<div className="flex items-center justify-between">
  <MonthNavigator monthParam={monthParam} />
  <div className="hidden md:flex items-center gap-2">
    <button ...>{density === 'full' ? '精簡' : '詳細'}</button>
    <StaffFilter ... />
  </div>
</div>
```

Replace with:
```tsx
<div className="flex items-center justify-between">
  <MonthNavigator monthParam={monthParam} />
  {/* Desktop controls */}
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
  {/* Mobile: 選取 / 取消 toggle */}
  <button
    type="button"
    className="md:hidden text-sm font-medium text-[var(--accent-600)] px-2 py-1 rounded-lg hover:bg-[var(--accent-50)] transition-colors"
    onClick={selection.mode === 'selecting' ? handleCancelSelectMode : handleEnterSelectMode}
  >
    {selection.mode === 'selecting' ? '取消' : '選取'}
  </button>
</div>
```

- [ ] **Step 4: Update MonthGrid — remove onLongPress, add isSelectingMode**

Replace the `<MonthGrid ... />` usage:
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
  onLongPress={handleDateLongPress}
/>
```
with:
```tsx
<MonthGrid
  calendarDates={calendarDates}
  shifts={shifts}
  profiles={profiles}
  matrix={matrix}
  holidays={holidays}
  selection={selection}
  isSelectingMode={selection.mode === 'selecting'}
  filteredProfileId={filteredProfileId}
  density={density}
  onDateClick={handleDateClick}
  onDelete={handleDelete}
/>
```

- [ ] **Step 5: Update BulkPanel open condition and dates**

Replace:
```tsx
<BulkPanel
  open={selection.mode === 'multi'}
  dates={selection.mode === 'multi' ? selection.dates : []}
  ...
/>
```
with:
```tsx
<BulkPanel
  open={
    selection.mode === 'multi' ||
    (selection.mode === 'selecting' && selection.dates.length > 0)
  }
  dates={
    selection.mode === 'multi' || selection.mode === 'selecting'
      ? selection.dates
      : []
  }
  shifts={shifts}
  profiles={profiles}
  matrix={matrix}
  onInsert={handleInsert}
  onClose={handleClose}
  onClear={handleClear}
/>
```

- [ ] **Step 6: Type-check**

```powershell
npm run type-check
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add components/admin/schedule/ScheduleClient.tsx
git commit -m "feat: add 選取 button and selecting mode for mobile batch scheduling"
```

---

## Task 5: Update usage instructions

**Files:**
- Modify: `app/settings_admin/SettingsClient.tsx`

- [ ] **Step 1: Update the long-press instruction**

Find and replace line 245:
```tsx
<li>長按日期進入多選模式，批次選取後指派班次與員工。</li>
```
with:
```tsx
<li>點選右上角「選取」後點擊日期，可批次選取多日指派班次與員工。</li>
```

- [ ] **Step 2: Type-check and lint**

```powershell
npm run type-check
npm run lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/settings_admin/SettingsClient.tsx
git commit -m "docs: update usage instructions to reflect 選取 button replacing long press"
```

---

## Self-Review

### Spec coverage

| Requirement | Task |
|-------------|------|
| Long press removed entirely | Tasks 2, 3, 4 |
| "選取" button in header row 1, mobile-only (`md:hidden`) | Task 4 step 3 |
| Button becomes "取消" when in selecting mode | Task 4 step 3 |
| iOS-style circle on every cell in selecting mode | Task 2 step 4 |
| Empty circle → filled checkmark when selected | Task 2 step 4 |
| Tap cell toggles selection in selecting mode | Task 4 step 1 |
| BulkPanel opens when ≥1 date selected | Task 4 step 5 |
| Swipe-dismiss BulkPanel clears dates but stays in selecting mode | Task 4 step 2 (handleClose) |
| "取消選取" in BulkPanel exits selecting mode | Task 4 step 2 (handleClear) |
| Desktop behavior unchanged | Tasks 3, 4 (desktop paths untouched) |
| Usage instructions updated | Task 5 |

### Placeholder scan

No TBDs, no "implement later", all steps contain exact code.

### Type consistency

- `SelectionState` `selecting` mode defined in Task 1, consumed in Tasks 2–4.
- `isSelectingMode: boolean` prop defined in MonthGrid (Task 3) and MonthDayCell (Task 2) — both receive `boolean`.
- `handleCancelSelectMode` / `handleEnterSelectMode` defined in Task 4 step 2, used in Task 4 step 3.
