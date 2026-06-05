# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hus_Shift is a shift scheduling website for small restaurants/retail shops (<10 staff). Admins manage weekly schedules via a protected dashboard; guests (staff/public) browse a read-only monthly calendar without login.

**Stack:** Next.js 15 (App Router) · Supabase (Auth + PostgreSQL + RLS) · shadcn/ui + Tailwind CSS · date-fns · vaul · Vercel

## Commands

```bash
npm run dev        # Start dev server (http://localhost:3000)
npm run build      # Production build
npm run lint       # ESLint
npm run type-check # TypeScript check (tsc --noEmit)
```

## Architecture

### Route Structure

```
app/
├── page.tsx                          # Redirects to /schedule/YYYY-MM
├── schedule/[month]/page.tsx         # Public monthly calendar (Server Component)
├── login/page.tsx                    # Magic Link login (admin only)
├── admin/
│   ├── layout.tsx                    # Sidebar nav, desktop-first
│   ├── schedule/[week]/page.tsx      # Weekly schedule grid (ISO week: 2025-W24)
│   ├── staff/page.tsx + [id]/page.tsx
│   ├── holidays/page.tsx
│   └── settings/page.tsx
├── api/create-staff/route.ts         # Uses service role key to create auth users
└── middleware.ts                     # Protects /admin/* routes
```

URL formats: `/schedule/2025-06` (YYYY-MM) · `/admin/schedule/2025-W24` (ISO week)

### Supabase Client Split

Three separate clients — never mix them:

```
lib/supabase/client.ts    # Browser / Client Components (anon key)
lib/supabase/server.ts    # Server Components + API Routes (cookies, anon key)
lib/supabase/admin.ts     # API Routes only — uses SUPABASE_SERVICE_ROLE_KEY
```

### Database Schema

Four tables: `da_profiles` (extends auth.users), `da_shifts` (static shift definitions with color), `da_schedule_entries` (profile_id + shift_id + work_date, unique constraint), `da_holidays` (Taiwan official holidays, synced via Edge Function).  
One view: `da_public_profiles` — always use this for guest-facing staff name queries.

RLS is enabled on all tables. Helper function `is_admin()` checks `da_profiles.role = 'admin'`. All tables: anon can SELECT, only admin can INSERT/UPDATE/DELETE.

### Key Data Types

```ts
// Admin schedule grid state
type SelectionState =
  | { mode: 'idle' }
  | { mode: 'single'; date: string }
  | { mode: 'dragging'; dates: string[] }
  | { mode: 'multi'; dates: string[] }

// Weekly schedule matrix
type ScheduleMatrix = {
  [shiftId: string]: { [date: string]: ScheduleEntry | null }
}
```

## Git Rules

**No Co-Authored-By:** Never add `Co-Authored-By:` trailers to commit messages.

## Critical Technical Rules

**Date handling:** All dates stored as `date` type (`YYYY-MM-DD`). Always use `date-fns` (+ `date-fns-tz` for Asia/Taipei timezone). Never hand-roll date arithmetic.

**Bulk scheduling conflicts:** When batch-inserting entries, skip conflicts silently. After completion, show toast: "已新增 N 筆，跳過 M 筆重複排班".

**Optimistic updates:** All INSERT/DELETE on `da_schedule_entries` must update local state first, then call Supabase in background, rolling back with error toast on failure.

**`service_role` key:** Only used in `app/api/*` Route Handlers. Never in Client Components, never in `NEXT_PUBLIC_*` env vars.

**Shift deletion guard:** Before deleting a shift, check for existing `da_schedule_entries` referencing it. Block deletion and show a warning if any exist.

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # server-only, never expose to client
```
