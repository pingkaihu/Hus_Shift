# Hus Shift — Phase 1 Design Spec

> Date: 2026-06-04
> Scope: Phase 1 MVP — scaffolding, DB migrations, auth, admin schedule grid, public calendar
> Status: Approved

---

## 1. Scope

Phase 1 delivers the core scheduling loop:

- Next.js 15 project scaffolded from scratch
- Supabase schema migrations + RLS (Supabase project already exists, env vars ready)
- Magic Link login + middleware auth guard
- Admin weekly schedule grid (`/admin/schedule/[week]`)
- Public monthly calendar (`/schedule/[month]`)

Phase 2 (staff management, shift settings, holidays) is explicitly out of scope.

---

## 2. Project Scaffolding

**Bootstrap command:**
```bash
npx create-next-app@latest hus-shift --typescript --tailwind --eslint --app --src-dir=no --import-alias="@/*"
```

**Additional packages:**
```bash
# Supabase
npm install @supabase/supabase-js @supabase/ssr

# shadcn/ui (init + components)
npx shadcn@latest init
npx shadcn@latest add button dialog drawer toast select checkbox radio-group badge label

# Date + bottom sheet
npm install date-fns date-fns-tz vaul
```

**Supabase client split** (`lib/supabase/`):

| File | Key | Used in |
|------|-----|---------|
| `client.ts` | anon key | Browser / Client Components |
| `server.ts` | anon key + cookies | Server Components + API Routes |
| `admin.ts` | service role key | API Routes only |

---

## 3. Database Migrations

**Location:** `supabase/migrations/` — tracked via Supabase CLI (`supabase db push`).

**Seed data:** `supabase/seed.sql` — three shift rows (早/午/晚).

### Migration files

| File | Contents |
|------|----------|
| `001_create_profiles.sql` | `profiles` table + `handle_new_user` trigger |
| `002_create_shifts.sql` | `shifts` table + seed inserts |
| `003_create_schedule_entries.sql` | `schedule_entries` table + indexes |
| `004_create_holidays.sql` | `holidays` table + index |
| `005_rls_and_policies.sql` | Enable RLS, `is_admin()` function, all policies |
| `006_public_profiles_view.sql` | `public_profiles` view |

### `handle_new_user` trigger (001)

The PRD does not include this, but it is required: without it, creating a user in the Supabase Auth dashboard does not auto-populate `profiles`, silently breaking `is_admin()`.

```sql
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
```

### First admin user setup

Since there is no staff creation UI in Phase 1, the first admin must be created manually:

1. Add user in Supabase Auth dashboard (Email + confirm)
2. Run:
```sql
update profiles set role = 'admin', full_name = '店長' where email = 'your@email.com';
```

---

## 4. Authentication & Middleware

### Login page (`/login`)

- Client Component
- Single email input + submit button
- Three UI states: `idle` → `loading` → `sent`
- On sent: show "請檢查您的信箱" confirmation, hide form
- Server-side: if session exists + admin → redirect `/admin/schedule/[current-week]`

### Auth callback (`/auth/callback/route.ts`)

Required by `@supabase/ssr` to exchange the Magic Link token for a session cookie. Without this the Magic Link lands on a broken page.

```ts
// GET /auth/callback?code=...
// Exchange code for session, redirect to /admin/schedule
```

### Middleware (`middleware.ts`)

```
matcher: ['/admin/:path*', '/login']

/admin/*
  no session          → redirect /login
  session, not admin  → redirect /schedule/YYYY-MM
  session, admin      → pass through

/login
  session + admin     → redirect /admin/schedule/YYYY-W[ww]
  else                → pass through
```

**Session helper:** `lib/supabase/server.ts` exports a `getSession()` wrapper used by both middleware and Server Components.

---

## 5. Admin Schedule Grid (`/admin/schedule/[week]`)

### Route

- `app/admin/schedule/page.tsx` — redirect to current ISO week URL
- `app/admin/schedule/[week]/page.tsx` — main page

URL format: `/admin/schedule/2025-W24`

### Server / Client split

```
WeekPage (Server Component)
  ↓ Promise.all: entries + shifts + active profiles + holidays for week
  ↓ props
ScheduleClient (Client Component — owns all state)
```

### Component tree

`app/admin/layout.tsx` wraps all admin routes with `AdminSidebar` (deep zinc-900 sidebar with links to schedule / staff / holidays / settings — Phase 2 links are stub placeholders in Phase 1).

```
ScheduleClient
├── WeekNavigator          (week label + prev/next, router.push)
├── StaffFilter            (dropdown, pure client filter state, no refetch)
├── ScheduleGrid           (pointer events, selection state machine)
│   ├── DateHeader × 7     (date + holiday label + heat-map tint)
│   └── ShiftRow × N
│       └── DayCell × 7
│           └── StaffChip × M  (name pill + delete)
├── DayModal               (mode: single — shadcn Dialog)
│   └── ShiftSelector      (shift radio + staff checkbox)
└── BulkPanel              (mode: multi — fixed right panel, slides in)
    └── ShiftSelector      (same component)
```

### Selection state machine

```ts
type SelectionState =
  | { mode: 'idle' }
  | { mode: 'single'; date: string }
  | { mode: 'dragging'; dates: string[] }
  | { mode: 'multi'; dates: string[] }
```

Two distinct entry points — they do not share a threshold:

- **Mode A entry:** Click on `DateHeader` → immediately set state to `single: { date }` → `DayModal` opens
- **Mode B entry:** `pointerdown` on any `DayCell` → `dragging: { dates: [startDate] }`; `pointermove` across cells → append dates; `pointerup` → `multi: { dates }`
- Close modal/panel → `idle`

`DateHeader` click and `DayCell` pointerdown are separate handlers on separate elements — no threshold detection needed.

### Optimistic updates

All INSERT/DELETE on `schedule_entries`:
1. Update local `ScheduleMatrix` state immediately
2. Call Supabase in background
3. On error: rollback state + `toast.error()`

Bulk insert conflict handling: skip existing entries silently, show toast "已新增 N 筆，跳過 M 筆重複排班".

### Heat-map tint on DateHeader

Computed client-side from local matrix state (no extra fetch). Uses the primary accent color at varying opacity:
- 0 entries → no tint
- 1/total entries → `opacity-20`
- 2/total entries → `opacity-50`
- all filled → `opacity-80`

### ShiftSelector (shared component)

Used in both `DayModal` and `BulkPanel`. Receives:
- `selectedDates: string[]` (one date in Mode A, multiple in Mode B)
- `existingEntries: ScheduleMatrix` (for conflict detection in Mode B)
- `shifts`, `profiles`

In Mode B, shows per-date conflict warnings ("王小明 6/10 已有早班").

### Staff filter

Dropdown at top of grid. Default: all staff. Selecting a staff member:
- Highlights that staff's `StaffChip` (full opacity)
- Dims other staff chips (`opacity-40`)
- Pure `useState`, no data refetch

### Delete flow

Entry point: inside `DayModal`, each existing entry row has a delete button. Confirm → optimistic DELETE.

---

## 6. Public Calendar (`/schedule/[month]`)

### Route

- `app/page.tsx` — redirect to `/schedule/YYYY-MM` (current month, Asia/Taipei)
- `app/schedule/[month]/page.tsx` — calendar page

URL format: `/schedule/2025-06`

### Rendering strategy

```ts
export const revalidate = 300  // ISR, 5-minute cache
```

### Server / Client split

```
SchedulePage (Server Component)
  ↓ Promise.all: entries + shifts + holidays for month
  ↓ today (computed with date-fns-tz, Asia/Taipei — avoids hydration mismatch)
  ↓ props
CalendarView (Client Component — selectedDay state for bottom sheet only)
  ├── PageHeader             (static — "Hus Shift 班表")
  ├── MonthNavigator         (currentMonth prop, router.push on nav)
  ├── CalendarGrid           (entries, shifts, holidays, today)
  │   └── DayCell × N        (onClick → setSelectedDay)
  │       └── ShiftBar       (color strip + surnames, max 2 + "+N")
  ├── DayDetailSheet         (vaul Drawer, selectedDay state)
  ├── ShiftLegend            (shifts list)
  └── EmptyMonth             (shown when entries.length === 0)
```

### DayCell variants

| State | Visual |
|-------|--------|
| Normal | white bg, `neutral-200` border |
| Today | date number has `accent-500` circle bg |
| Holiday (`is_holiday: true`) | date number + holiday name in `danger` red |
| Make-up day (`is_holiday: false`) | cell bg `holiday-bg` (#fff7ed), label in amber |
| Empty (no entries) | normal cell, no shift bars |

### DayDetailSheet

- `vaul` Drawer, opens from bottom
- Shows all shifts for the day (empty shifts show "（未排班）" at reduced opacity)
- Staff names fetched from `public_profiles` view (server-side join in initial query)
- No client-side fetch on open — data pre-loaded, state update only

### Staff name queries

Guest-facing queries for staff names always use `public_profiles` view, never `profiles` directly.

### Error handling

| State | Treatment |
|-------|-----------|
| Supabase fetch failure | Next.js error boundary — "載入失敗，請重新整理" |
| No entries for month | `EmptyMonth` component — "本月尚無排班資料" |
| Invalid month param | redirect to current month |

---

## 7. Route Summary

| Route | Type | Auth |
|-------|------|------|
| `/` | Server, redirect | None |
| `/schedule/[month]` | Server + ISR | None |
| `/login` | Client | Redirect if admin |
| `/auth/callback` | API Route | None (exchanges Magic Link token) |
| `/admin/schedule` | Server, redirect | Admin |
| `/admin/schedule/[week]` | Server + Client | Admin |
| `/admin/layout.tsx` | Layout | Admin (middleware) |

---

## 8. Out of Scope (Phase 2)

- `/admin/staff` — staff management
- `/admin/settings` — shift settings
- `/admin/holidays` — holiday management
- `app/api/create-staff/route.ts` — staff creation API
- Supabase Edge Function for holiday sync
- `AdminSidebar` links to staff/settings/holidays (stub links only in Phase 1)
