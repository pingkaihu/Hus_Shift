# Holiday Enhancements Plan

## Decisions

| # | Decision |
|---|----------|
| 1 | Add `source` column to `da_holidays`: `'government' \| 'weekend' \| 'manual'` |
| 2 | Existing DB rows default to `'government'` |
| 3 | Year selector shows `DB years ∪ {2026…2030}`, sorted descending |
| 4 | "新增週末" button per year — separate from sync button |
| 5 | Weekend entries: `name = '週六'/'週日'`, `is_holiday = true`, `source = 'weekend'` |
| 6 | Duplicate weekends: skip silently, toast "已新增 N 筆，跳過 M 筆重複" |
| 7 | Holidays page filter: Tabs — "節日" (default, source ∈ {government, manual}) / "全部" |
| 8 | Schedule pages: weekends show red date number, NO name label |
| 9 | Admin schedule `DateHeader`: date number turns red when `is_holiday = true` |

---

## Tasks

### 1. DB Migration — add `source` column

File: `supabase/migrations/006_holidays_source.sql`

```sql
ALTER TABLE da_holidays
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'government'
  CHECK (source IN ('government', 'weekend', 'manual'));
```

Existing rows get `'government'` via the DEFAULT.

---

### 2. Update TypeScript type

File: `lib/types.ts`

Add `source: 'government' | 'weekend' | 'manual'` to the `Holiday` type.

---

### 3. Year selector — expand to 2026–2030

File: `app/holidays_admin/page.tsx`

The server component fetches `DISTINCT year` from DB. Merge with the fixed range `[2026, 2027, 2028, 2029, 2030]`, deduplicate, sort descending, pass to client.

---

### 4. "新增週末" button

File: `app/holidays_admin/HolidaysClient.tsx`

- Add button next to the existing sync button.
- On click: compute all Saturdays and Sundays for the selected year.
- POST to a new API route `/api/add-weekends?year=YYYY`.
- Show toast: "已新增 N 筆，跳過 M 筆重複".

File: `app/api/add-weekends/route.ts` (new)

- Admin-only check.
- Accept `year` query param (validate 2000–2100).
- Generate all Sat/Sun dates for the year.
- Upsert with `ON CONFLICT (date) DO NOTHING`.
- Return `{ inserted, skipped }`.
- Each entry: `{ date, name: '週六'|'週日', is_holiday: true, source: 'weekend', year }`.

---

### 5. Holidays page filter tabs

File: `app/holidays_admin/HolidaysClient.tsx`

- Add tabs component ("節日" / "全部") above the table.
- Default: "節日".
- "節日" filters: `source IN ('government', 'manual')`.
- "全部" shows all rows.
- Filter is client-side (data already loaded).

---

### 6. Ensure `source` is passed when manually adding holidays

File: `app/holidays_admin/HolidaysClient.tsx`

Manual add dialog: set `source = 'manual'` on insert.

---

### 7. Schedule pages — suppress weekend name labels

Files:
- `components/calendar/DayCell.tsx`
- `components/admin/schedule/DateHeader.tsx`

Condition: only render the holiday name label when `holiday.source !== 'weekend'`.

---

### 8. Admin schedule — red date number

File: `components/admin/schedule/DateHeader.tsx`

Apply `text-red-500` (or equivalent) to the date number element when a holiday exists for that date and `is_holiday === true`. Match the pattern already used in `DayCell.tsx`.

---

### 9. Update all Supabase queries that insert holidays

- `app/api/sync-holidays/route.ts`: add `source: 'government'` to the upsert payload.

---

## Affected Files Summary

| File | Change |
|------|--------|
| `supabase/migrations/006_holidays_source.sql` | New migration |
| `lib/types.ts` | Add `source` field to `Holiday` |
| `app/holidays_admin/page.tsx` | Merge year range |
| `app/holidays_admin/HolidaysClient.tsx` | Tabs filter, 新增週末 button, source on manual add |
| `app/api/add-weekends/route.ts` | New route |
| `app/api/sync-holidays/route.ts` | Add `source: 'government'` to upsert |
| `components/calendar/DayCell.tsx` | Suppress weekend labels |
| `components/admin/schedule/DateHeader.tsx` | Red date number + suppress weekend labels |
