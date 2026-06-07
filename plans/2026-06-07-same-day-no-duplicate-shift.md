# 同一天不可重複排班 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Block a staff member from being assigned to a second shift on any day they already have a shift, and replace the generic "已排班" label with "已排 [班次名稱]" naming the specific shift they already hold.

**Architecture:** Two independent changes — (1) tighten the DB unique constraint from `(profile_id, shift_id, work_date)` to `(profile_id, work_date)`, cleaning up any existing duplicates first; (2) update ShiftSelector's disabled logic and label rendering to check any-shift conflict and surface the shift name in both Mode A (single date) and Mode B (multi-date bulk).

**Tech Stack:** Next.js 15 App Router · Supabase SQL Editor · TypeScript · shadcn/ui

---

## File Map

| File | Change |
|------|--------|
| `components/admin/schedule/ShiftSelector.tsx` | Replace `isDisabled` + `conflictDates` helpers; update render |
| DB (run in Supabase SQL Editor) | Delete duplicates → drop old constraint → add new constraint |
| `CLAUDE.md` | Update constraint note in Database Schema section |

---

## Task 1: DB Migration — clean duplicates & tighten constraint

Run each block in the **Supabase SQL Editor** (Dashboard → SQL Editor).

**Files:**
- DB only (no code files)

- [ ] **Step 1: Check for existing duplicates**

```sql
SELECT profile_id, work_date, COUNT(*) AS cnt
FROM da_schedule_entries
GROUP BY profile_id, work_date
HAVING COUNT(*) > 1;
```

Expected: empty result set (no duplicates). If rows appear, proceed to Step 2; otherwise skip to Step 3.

- [ ] **Step 2: Delete duplicates — keep earliest `created_at` per (profile_id, work_date)**

```sql
DELETE FROM da_schedule_entries
WHERE id IN (
  SELECT id FROM (
    SELECT id,
      ROW_NUMBER() OVER (
        PARTITION BY profile_id, work_date
        ORDER BY created_at ASC
      ) AS rn
    FROM da_schedule_entries
  ) ranked
  WHERE rn > 1
);
```

Expected: `DELETE N` where N ≥ 0. Re-run Step 1 to confirm result is now empty.

- [ ] **Step 3: Verify current unique constraint name**

```sql
SELECT constraint_name
FROM information_schema.table_constraints
WHERE table_name = 'da_schedule_entries'
  AND constraint_type = 'UNIQUE';
```

Note the name of the constraint covering `(profile_id, shift_id, work_date)` — typically `da_schedule_entries_profile_id_shift_id_work_date_key`.

- [ ] **Step 4: Drop old constraint and add new one**

Replace `<old_constraint_name>` with the name found in Step 3.

```sql
ALTER TABLE da_schedule_entries
  DROP CONSTRAINT <old_constraint_name>;

ALTER TABLE da_schedule_entries
  ADD CONSTRAINT da_schedule_entries_profile_id_work_date_key
  UNIQUE (profile_id, work_date);
```

Expected: `ALTER TABLE` twice, no errors.

- [ ] **Step 5: Verify new constraint**

```sql
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'da_schedule_entries'
  AND constraint_type = 'UNIQUE';
```

Expected: one row — `da_schedule_entries_profile_id_work_date_key`.

---

## Task 2: Update ShiftSelector logic and labels

**Files:**
- Modify: `components/admin/schedule/ShiftSelector.tsx`

- [ ] **Step 1: Replace the two helper functions**

In `components/admin/schedule/ShiftSelector.tsx`, replace the `isDisabled` and `conflictDates` functions (lines 38–50) with:

```typescript
  // Returns the Shift this profile already holds on the given date, or null
  function existingShiftOnDate(profileId: string, date: string): Shift | null {
    for (const shift of shifts) {
      const entries = matrix[shift.id]?.[date] ?? []
      if (entries.some(e => e.profile_id === profileId)) return shift
    }
    return null
  }

  // Mode A: disabled if this profile has ANY shift on this date
  function isDisabled(profileId: string): boolean {
    if (!isModeA) return false
    return existingShiftOnDate(profileId, singleDate) !== null
  }

  // Mode B: list of dates where this profile already has any shift, with shift name
  function conflictShiftsOnDates(profileId: string): { date: string; shiftName: string }[] {
    return selectedDates.flatMap(date => {
      const shift = existingShiftOnDate(profileId, date)
      return shift ? [{ date, shiftName: shift.name }] : []
    })
  }
```

- [ ] **Step 2: Update the profile list render**

Replace the `profiles.map` block (lines 96–126) with:

```tsx
              {profiles.map(profile => {
                const existingShift = isModeA ? existingShiftOnDate(profile.id, singleDate) : null
                const disabled = existingShift !== null
                const conflicts = !isModeA ? conflictShiftsOnDates(profile.id) : []
                return (
                  <div key={profile.id} className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`profile-${profile.id}`}
                        checked={selectedProfileIds.has(profile.id)}
                        onCheckedChange={() => !disabled && toggleProfile(profile.id)}
                        disabled={disabled}
                      />
                      <Label
                        htmlFor={`profile-${profile.id}`}
                        className={`text-sm cursor-pointer ${disabled ? 'opacity-40' : ''}`}
                      >
                        {profile.full_name}
                      </Label>
                      {existingShift && (
                        <span className="text-xs text-zinc-400">已排 {existingShift.name}</span>
                      )}
                    </div>
                    {conflicts.length > 0 && (
                      <p className="text-xs text-amber-600 ml-6">
                        {conflicts.map(c => `${format(parseISO(c.date), 'M/d')} 已排 ${c.shiftName}`).join('、')}
                      </p>
                    )}
                  </div>
                )
              })}
```

- [ ] **Step 3: Type-check**

```powershell
npm run type-check
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/admin/schedule/ShiftSelector.tsx
git commit -m "feat: block same-day double booking, show named shift in disabled label"
```

---

## Task 3: Update CLAUDE.md constraint note

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update the Database Schema section**

Find this line in `CLAUDE.md`:

```
Four tables: `da_profiles` (extends auth.users), `da_shifts` (static shift definitions with color), `da_schedule_entries` (profile_id + shift_id + work_date, unique constraint), `da_holidays` (Taiwan official holidays, synced via Edge Function).
```

Change `profile_id + shift_id + work_date, unique constraint` to `profile_id + shift_id + work_date; unique on (profile_id, work_date) — one shift per person per day`.

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update schema note — constraint is now (profile_id, work_date)"
```

---

## Self-Review

**Spec coverage:**
- ✅ Mode A: "已排班" → "已排 [shift name]" — Task 2 Step 2, `existingShift && <span>已排 {existingShift.name}</span>`
- ✅ Mode A: blocks ANY shift, not just this shift — Task 2 Step 1, `existingShiftOnDate` loops all shifts
- ✅ Mode B: per-date skip (existing behavior preserved) — `conflictShiftsOnDates` returns dates, not disabling the whole person
- ✅ Mode B: warning shows `M/d 已排 [shift name]` — Task 2 Step 2 render
- ✅ DB constraint tightened — Task 1
- ✅ Duplicates cleaned before constraint added — Task 1 Steps 1–2

**Placeholder scan:** None found — all code blocks are complete and runnable.

**Type consistency:** `existingShiftOnDate` returns `Shift | null`; used as `existingShift` in render, `existingShift.name` is valid since `Shift.name: string` per `lib/types.ts`. `conflictShiftsOnDates` returns `{ date: string; shiftName: string }[]`; consumed as `c.date` and `c.shiftName` in render. Consistent.
