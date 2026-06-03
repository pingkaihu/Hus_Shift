# PRD — 排班管理網站

> 版本：1.0  
> 狀態：Ready for development  
> 技術棧：Next.js 15 · Supabase · Vercel  

---

## 1. 專案概述

### 1.1 目標

為小型餐廳 / 零售門市（10 人以下）建立一個排班管理網站。店長可在後台建立與管理每週班表；員工及外部訪客無需登入，即可透過公開月曆視圖查看班表。

### 1.2 使用者角色

| 角色 | 登入需求 | 權限 |
|------|----------|------|
| Admin（店長） | 必須登入 | 讀寫全部資料 |
| 訪客（員工 / 一般人） | 不需登入 | 唯讀班表、班次、節假日 |

### 1.3 核心設計原則

- 訪客體驗手機優先，月曆視圖為預設
- Admin 介面桌機優先，週視圖支援多種排班操作
- Schema 設計預留未來擴充（通知系統、員工自助功能）空間

---

## 2. 技術棧

| 層次 | 技術 | 說明 |
|------|------|------|
| 前端框架 | Next.js 15 (App Router) | Vercel 原生支援，內建 API Routes |
| 後端 / 資料庫 | Supabase | Auth + PostgreSQL + Realtime + Edge Functions |
| 部署 | Vercel | 自動 CI/CD，連結 GitHub repo |
| 日期處理 | date-fns | 週 / 月計算、ISO week format |
| 元件庫 | shadcn/ui | Radix UI 基底，Tailwind CSS |
| Drawer | vaul | 手機 bottom sheet（Vercel 出品） |
| Email 通知（未來） | Resend | 與 Next.js 整合簡單，100 封/天免費 |
| LINE 通知（未來） | LINE Notify | 免費，個人 token 綁定 |

---

## 3. 資料庫 Schema

### 3.1 資料表定義

#### `profiles`
Supabase Auth `auth.users` 的業務擴充表，`id` 對應 `auth.users.id`。

```sql
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  email       text not null,
  phone       text,
  role        text not null default 'staff' check (role in ('admin', 'staff')),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
```

#### `shifts`
班次定義（早班 / 午班 / 晚班），靜態設定資料。

```sql
create table shifts (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  start_time  time not null,
  end_time    time not null,
  color       text not null default '#888888'  -- hex color，前端行事曆色條用
);
```

初始資料範例：
```sql
insert into shifts (name, start_time, end_time, color) values
  ('早班', '07:00', '15:00', '#4F81BD'),
  ('午班', '11:00', '19:00', '#70AD47'),
  ('晚班', '15:00', '23:00', '#ED7D31');
```

#### `schedule_entries`
排班明細，每筆代表「某員工在某天排某班次」。

```sql
create table schedule_entries (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references profiles(id) on delete cascade,
  shift_id    uuid not null references shifts(id) on delete cascade,
  work_date   date not null,
  note        text,
  created_at  timestamptz not null default now(),

  -- 同一天同一員工不能排同一班次兩次
  unique (profile_id, shift_id, work_date)
);

create index on schedule_entries (work_date);
create index on schedule_entries (profile_id);
```

#### `holidays`
台灣官方節假日，由 Edge Function 自動同步，`date` 為主鍵。

```sql
create table holidays (
  date        date primary key,
  name        text not null,
  is_holiday  boolean not null,  -- true = 放假, false = 補班
  description text,
  year        int not null
);

create index on holidays (year);
```

資料來源：政府資料開放平臺人事行政局行事曆 API（`data.gov.tw/dataset/14718`）

#### `public_profiles`（View）
給訪客使用，隱藏敏感欄位。

```sql
create view public_profiles as
  select id, full_name, role
  from profiles
  where is_active = true;
```

### 3.2 關聯圖

```
profiles ──< schedule_entries >── shifts
profiles ──< (notifications)       [未來]
holidays                           [獨立參考表，不設外鍵]
```

---

## 4. 權限設計（RLS）

### 4.1 Helper Function

```sql
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;
```

### 4.2 各表 Policy

```sql
-- profiles
alter table profiles enable row level security;

create policy "admin: full access" on profiles
  for all using ( is_admin() );

create policy "public: read only" on profiles
  for select using ( true );

-- shifts
alter table shifts enable row level security;

create policy "admin: full access" on shifts
  for all using ( is_admin() );

create policy "public: read only" on shifts
  for select using ( true );

-- schedule_entries
alter table schedule_entries enable row level security;

create policy "admin: full access" on schedule_entries
  for all using ( is_admin() );

create policy "public: read only" on schedule_entries
  for select using ( true );

-- holidays
alter table holidays enable row level security;

create policy "admin: full access" on holidays
  for all using ( is_admin() );

create policy "public: read only" on holidays
  for select using ( true );
```

### 4.3 權限矩陣

| 路由 | 訪客 | Admin |
|------|------|-------|
| `/` | 可瀏覽 | 可瀏覽 |
| `/schedule/[month]` | 可瀏覽 | 可瀏覽 |
| `/login` | 可瀏覽 | redirect `/admin/schedule` |
| `/admin/*` | redirect `/login` | 完整存取 |

---

## 5. 路由結構

```
app/
├── page.tsx                          # redirect → /schedule/當月 (YYYY-MM)
├── schedule/
│   └── [month]/
│       └── page.tsx                  # 公開月曆視圖（Server Component）
├── login/
│   └── page.tsx                      # Magic Link 登入（僅 admin 使用）
├── admin/
│   ├── layout.tsx                    # Sidebar 導覽，桌機優先
│   ├── schedule/
│   │   ├── page.tsx                  # redirect → 本週 /admin/schedule/[week]
│   │   └── [week]/
│   │       └── page.tsx              # 週視圖排班介面
│   ├── staff/
│   │   ├── page.tsx                  # 員工列表
│   │   └── [id]/
│   │       └── page.tsx              # 員工詳細 / 編輯
│   ├── holidays/
│   │   └── page.tsx                  # 節假日列表 + 手動補入
│   └── settings/
│       └── page.tsx                  # 班次設定、店家資訊
└── middleware.ts                     # Auth guard + role redirect
```

### 5.1 URL 格式規範

- 公開月曆：`/schedule/2025-06`（`YYYY-MM`）
- Admin 週視圖：`/admin/schedule/2025-W24`（ISO week）

### 5.2 `middleware.ts` 邏輯

```ts
// 非 /admin/* 路徑全部放行
// /admin/* 檢查 Supabase session
//   → 未登入：redirect /login
//   → 已登入但非 admin：redirect /
//   → admin：放行

export const config = {
  matcher: ['/admin/:path*']
}
```

---

## 6. 功能規格

### 6.1 公開月曆視圖（`/schedule/[month]`）

**目標用戶**：員工、訪客  
**裝置**：手機優先

#### 資料載入

Server Component，一次撈三種資料：

```ts
const [entries, shifts, holidays] = await Promise.all([
  supabase
    .from('schedule_entries')
    .select('work_date, shift_id, profiles(full_name)')
    .gte('work_date', monthStart)
    .lte('work_date', monthEnd),
  supabase.from('shifts').select('id, name, color'),
  supabase
    .from('holidays')
    .select('date, name, is_holiday')
    .gte('date', monthStart)
    .lte('date', monthEnd),
])
```

#### 月曆 Grid

- 7 欄 CSS Grid，月初依星期補空格
- 週標題：日 一 二 三 四 五 六

#### `DayCell` 格子規格

```
┌──────────────┐
│ 4            │  ← 日期數字（今天加圓形底色）
│ 端午節       │  ← 假日名稱，紅色（有才顯示）
│ ▌早 王 李    │  ← 班次色條 + 姓氏首字
│ ▌午 陳       │  ← 超過 2 人顯示 +N
└──────────────┘
```

- 假日（`is_holiday: true`）：日期數字紅色、假日名稱標紅
- 補班日（`is_holiday: false`）：格子背景橘黃色
- 今天：日期數字加 primary 色圓形背景

#### `DayDetail` Bottom Sheet

點擊格子後從底部滑出，顯示：
- 日期標題 + 假日 / 補班標籤
- 各班次完整排班（班次名稱 + 時間 + 所有員工全名）
- 未排班的班次顯示「（未排班）」
- 使用 `vaul` Drawer 實作

#### `MonthNavigator`

- 顯示年月（`2025年 6月`）
- 上 / 下月按鈕
- 切換時 `router.push('/schedule/YYYY-MM')`

#### `ShiftLegend`

月曆下方，顯示各班次名稱與對應顏色色條。

---

### 6.2 Admin 週視圖排班介面（`/admin/schedule/[week]`）

**目標用戶**：Admin  
**裝置**：桌機優先

#### 頁面佈局

```
┌─────────────────────────────────────────────┐
│  Sidebar  │  WeekNavigator                  │
│           │  ─────────────────────────────  │
│           │  ScheduleGrid（主排班區）         │
│           │                                 │
└─────────────────────────────────────────────┘
```

#### 矩陣結構

列：班次（早 / 午 / 晚），欄：星期一～日。

```ts
type ScheduleMatrix = {
  [shiftId: string]: {
    [date: string]: ScheduleEntry | null
  }
}
```

#### 出勤熱度色階

每個日期欄頭依當天已排班人次 / 總班次數顯示深淺：

```ts
// 0 人    → 無填色
// 1/3 滿  → 淡色
// 2/3 滿  → 中色
// 全滿    → 深色
```

使用 `shifts.color` 系統主色計算深淺，非固定色。

#### 新增排班：模式 A（點擊單日）

1. 點擊日期欄頭
2. 開啟 Modal，顯示當日現有排班
3. 點擊「新增排班」按鈕
4. 展示排班選擇器：選班別（radio）+ 勾選員工（checkbox）
5. 員工清單中，當天已排該班次的人顯示 disabled
6. 確認後 INSERT entries

#### 新增排班：模式 B（拖曳多日）

1. `mousedown` 起始格子，進入 `dragging` 模式
2. 拖曳經過的格子即時反白
3. `mouseup` 結束，進入 `multi` 模式
4. 右側展開批量排班 Panel
5. Panel 顯示已選日期清單
6. 選班別 + 勾選員工
7. 顯示衝突警告（哪幾天該員工已有此班）
8. 確認後批量 INSERT，跳過衝突格，完成後 toast 提示跳過筆數

#### Selection State

```ts
type SelectionState =
  | { mode: 'idle' }
  | { mode: 'single'; date: string }
  | { mode: 'dragging'; dates: string[] }
  | { mode: 'multi'; dates: string[] }
```

#### 刪除排班

入口在模式 A 的日期 Modal 內，現有排班列表每筆附刪除按鈕，確認後 DELETE。

#### Optimistic Update

所有 INSERT / DELETE 操作先更新本地 matrix state，背景呼叫 Supabase，失敗時 rollback 並顯示 toast 錯誤訊息。

#### `WeekNavigator`

- 顯示週次（`2025 W24 · 6/9–6/15`）
- 上 / 下週按鈕
- 切換時 `router.push('/admin/schedule/YYYY-W[ww]')`
- 使用 `date-fns` 的 `getISOWeek`、`addWeeks` 處理邊界

---

### 6.3 員工管理（`/admin/staff`）

- 員工列表：姓名、Email、角色、狀態（啟用 / 停用）
- 新增員工：填寫姓名 + Email → 呼叫 Next.js API Route（`/api/create-staff`）→ 用 Supabase Admin SDK 建立 auth user → INSERT profiles
- 編輯員工（`/admin/staff/[id]`）：修改姓名、電話、啟用狀態
- 停用員工（`is_active: false`）不刪除資料，避免歷史排班紀錄損毀

#### 新增員工 API Route

```ts
// app/api/create-staff/route.ts
// 使用 SUPABASE_SERVICE_ROLE_KEY（server only）
// 1. supabaseAdmin.auth.admin.createUser({ email, email_confirm: true })
// 2. insert into profiles(id, full_name, email, role)
// 3. 回傳成功 / 錯誤
```

---

### 6.4 班次設定（`/admin/settings`）

- 顯示現有班次列表（名稱、時間、顏色）
- 新增 / 編輯 / 刪除班次
- 刪除前檢查是否有關聯的 `schedule_entries`，若有則阻止刪除並提示

---

### 6.5 節假日管理（`/admin/holidays`）

- 顯示當年節假日列表，標示放假 / 補班
- 手動新增單筆（處理政府 API 未涵蓋的特殊假日）
- 同步按鈕：觸發 Supabase Edge Function 重新抓取政府 API

#### 節假日自動同步 Edge Function

- 排程：每年 12 月 1 日 09:00 自動執行（`pg_cron`）
- 來源：`data.gov.tw/dataset/14718`
- 操作：`upsert`（`on conflict (date) do update`）
- 格式轉換：`"20250101"` → `2025-01-01`，`"是"` → `true`

---

### 6.6 登入流程（`/login`）

- 使用 Supabase Auth **Magic Link**（Email 無密碼登入）
- 員工不需要登入，此頁僅供 Admin 使用
- 登入後自動 redirect 至 `/admin/schedule`
- 已登入者訪問 `/login` 自動 redirect 至 `/admin/schedule`

---

## 7. 元件清單

### 公開視圖

| 元件 | 說明 |
|------|------|
| `MonthNavigator` | 年月顯示 + 上下月切換 |
| `CalendarGrid` | 7 欄月曆 Grid，處理月初補空格 |
| `DayCell` | 單日格子，色條 + 姓氏 + 假日標記 |
| `ShiftBar` | 班次色條 + 姓氏（最多 2 人，超過 +N） |
| `DayDetailSheet` | Bottom sheet，點擊日期展開完整排班 |
| `ShiftLegend` | 班次顏色圖例 |

### Admin 排班介面

| 元件 | 說明 |
|------|------|
| `WeekNavigator` | 週次顯示 + 上下週切換 |
| `ScheduleGrid` | 週矩陣主體，管理 selection state |
| `DateHeader` | 欄頭：日期 + 假日標記 + 出勤熱度底色 |
| `ShiftRow` | 班次橫列（早 / 午 / 晚） |
| `DayCell` | 格子：空格為 drop target，有排班顯示 StaffChip |
| `StaffChip` | 員工名稱 pill，可刪除 |
| `DayModal` | 點擊單日開啟，顯示當日排班 + 新增入口 |
| `ShiftSelector` | 班別 radio + 員工 checkbox，模式 A / B 共用 |
| `BulkPanel` | 模式 B 批量排班側邊 Panel |

### Admin 共用

| 元件 | 說明 |
|------|------|
| `AdminSidebar` | 左側導覽列（排班 / 員工 / 節假日 / 設定） |
| `StaffForm` | 新增 / 編輯員工表單 |
| `ShiftForm` | 新增 / 編輯班次表單（含顏色選擇器） |

---

## 8. 環境變數

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # server only，絕不放前端

# 未來通知用（Phase 3）
RESEND_API_KEY=
LINE_NOTIFY_TOKEN=
```

---

## 9. 開發階段規劃

### Phase 1 — 核心可用（MVP）

優先順序：

1. Supabase 專案建置 + Schema migration + RLS
2. Next.js 專案建置（shadcn/ui + Tailwind）
3. `/login` Magic Link 登入
4. `middleware.ts` Auth guard
5. `/admin/schedule/[week]` 排班主介面
6. `/schedule/[month]` 公開月曆視圖

**完成標準**：Admin 可以登入、建立班表；訪客可以用手機看月曆。

### Phase 2 — 管理完善

7. `/admin/staff` 員工管理（含新增 API Route）
8. `/admin/settings` 班次設定
9. `/admin/holidays` 節假日管理 + Edge Function 自動同步

### Phase 3 — 通知系統（未來）

10. Resend Email 通知（班表發布時發送）
11. LINE Notify 整合
12. 通知紀錄表（`notifications`）

### Phase 4 — 員工自助（未來）

13. 員工登入
14. 員工查看個人班表
15. 請假 / 換班申請流程

---

## 10. 技術注意事項

### Supabase Client 分離

```ts
// lib/supabase/client.ts    → 前端 Client Component 用
// lib/supabase/server.ts    → Server Component / API Route 用（cookies）
// lib/supabase/admin.ts     → service role key，只在 API Route 使用
```

### `public_profiles` View 使用規則

- 訪客查詢員工姓名一律用 `public_profiles`
- Admin 操作（建立 / 編輯員工）才直接操作 `profiles`

### 日期處理規範

- 資料庫存 `date` 型別（`YYYY-MM-DD`）
- 前端一律用 `date-fns` 處理，不自己算
- 時區以台灣時區（`Asia/Taipei`）為準，`date-fns-tz` 處理轉換

### 批量操作衝突處理

批量排班遇到衝突（已有排班）時：跳過衝突，新增其餘，完成後 toast 顯示「已新增 N 筆，跳過 M 筆重複排班」。

### `service_role` Key 安全

- 僅在 `app/api/*` 的 Route Handler 中使用
- 存放於 Vercel 環境變數（非 `NEXT_PUBLIC_` 前綴）
- 絕不在任何 Client Component 或 `NEXT_PUBLIC_` 變數中出現

---

## 11. 未來擴充預留

以下功能已在 Schema 設計中預留，未來開發時不需要改動現有資料表：

| 功能 | 預留設計 |
|------|----------|
| 通知系統 | 新增 `notifications` 表即可 |
| 員工登入 | `profiles.role = 'staff'` 已存在，middleware 加判斷即可 |
| 請假換班 | 新增 `leave_requests` 表 |
| 多門市 | `profiles` / `schedule_entries` 加 `store_id FK` |
| 薪資計算 | `schedule_entries` 已有 `shift_id` 可連結時薪資料 |
