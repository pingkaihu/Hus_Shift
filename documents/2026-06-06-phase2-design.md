# Phase 2 設計文件 — 管理完善

> 日期：2026-06-06  
> 狀態：已審核，待實作

---

## 1. 範圍

Phase 2 補完三個 Admin 管理頁面，讓排班後台具備完整的員工、班次、節假日管理能力。

| 頁面 | 路由 | 功能摘要 |
|------|------|----------|
| 員工管理 | `/staff_admin` | 列表、新增（API Route）、編輯、停用 |
| 班次設定 | `/settings_admin` | 列表、新增/編輯/刪除（含刪除保護） |
| 節假日管理 | `/holidays_admin` | 列表、手動新增、同步按鈕（API Route） |

---

## 2. 架構決策

### 2.1 所有編輯操作在 Modal 內完成

不建立 `/staff_admin/[id]` 子路由。新增與編輯都在 Dialog 內完成，操作不離開列表頁。理由：員工數量少（上限 50），Modal 流程足夠，路由更精簡。

### 2.2 節假日同步走 Next.js API Route

不實作 Supabase Edge Function + pg_cron。「同步」按鈕呼叫 `POST /api/sync-holidays`，由 Next.js API Route 抓政府 API 並 upsert。功能等價，無需 Supabase CLI 部署。

### 2.3 Client 元件與 page 共存

Client 元件（`StaffClient.tsx` 等）直接放在各自的 page 目錄下，不新增 `components/` 子目錄。這三頁的 Client 元件不跨頁複用。

---

## 3. 檔案結構

```
app/
├── staff_admin/
│   ├── layout.tsx            # 複用 AdminSidebar（與 schedule_admin/layout.tsx 相同）
│   ├── page.tsx              # Server: fetch da_profiles → StaffClient
│   └── StaffClient.tsx       # Client: 列表 + 新增/編輯 Dialog
├── settings_admin/
│   ├── layout.tsx            # 複用 AdminSidebar
│   ├── page.tsx              # Server: fetch da_shifts → SettingsClient
│   └── SettingsClient.tsx    # Client: 列表 + 新增/編輯 Dialog
├── holidays_admin/
│   ├── layout.tsx            # 複用 AdminSidebar
│   ├── page.tsx              # Server: fetch da_holidays (當年) + 年份清單 → HolidaysClient
│   └── HolidaysClient.tsx    # Client: 列表 + 手動新增 Dialog + 同步按鈕
└── api/
    ├── create-staff/
    │   └── route.ts          # service_role 建立 auth user + profile
    └── sync-holidays/
        └── route.ts          # 抓 data.gov.tw，upsert da_holidays
```

> `layout.tsx` 三份內容完全相同，直接複製 `schedule_admin/layout.tsx`。

---

## 4. 各頁功能規格

### 4.1 `/staff_admin` — 員工管理

**列表欄位**：姓名、Email、角色（admin/staff badge）、狀態（啟用/停用）、操作

**頂部**：「N / 50 人」計數 + 「新增員工」按鈕

**新增 Dialog**：
- 欄位：姓名（必填）、Email（必填）
- 送出：POST `/api/create-staff`
- 成功：更新 local state，顯示 toast
- 失敗（>50人 / email 重複）：顯示錯誤 toast

**編輯 Dialog**：
- 欄位：姓名、電話、啟用狀態（toggle）
- 直接呼叫 supabase browser client UPDATE da_profiles
- 停用（`is_active: false`）不刪資料

### 4.2 `/settings_admin` — 班次設定

**列表**：色塊 + 名稱 + 時間區間（HH:mm–HH:mm）

**新增/編輯 Dialog**：
- 欄位：名稱（必填）、開始時間、結束時間
- 顏色：12 個預設色票點選（hex value）
- 直接呼叫 supabase browser client INSERT/UPDATE da_shifts

**刪除**：
- 先查 `da_schedule_entries` 是否有關聯
- 有關聯 → block，顯示警告 toast：「此班次已有排班紀錄，無法刪除」
- 無關聯 → DELETE，更新 local state

**預設 12 色**（與現有班次色系相容）：
```
#4F81BD #70AD47 #ED7D31 #FF0000 #FFC000
#9B59B6 #3498DB #2ECC71 #E74C3C #1ABC9C
#F39C12 #888888
```

### 4.3 `/holidays_admin` — 節假日管理

**年份切換**：預設當年，下拉切換（顯示有資料的年份）

**列表**：日期、名稱、「放假 🔴 / 補班 🟡」badge

**手動新增 Dialog**：
- 欄位：日期（date input）、名稱（必填）、放假或補班（radio）
- INSERT da_holidays，衝突時覆蓋（upsert）

**同步按鈕**：
- POST `/api/sync-holidays?year=YYYY`
- 同步中：按鈕 loading 狀態
- 完成：toast 顯示「同步完成，新增 N 筆、更新 M 筆」

---

## 5. API Routes

### `POST /api/create-staff`

```ts
// Request body: { full_name: string, email: string }
// 1. 查 da_profiles is_active=true 員工數 → 超過 50 回 { error: 'STAFF_LIMIT' }
// 2. supabaseAdmin.auth.admin.createUser({ email, email_confirm: true })
// 3. insert into da_profiles(id, full_name, email, role='staff', is_active=true)
// Response: { id: string } | { error: string }
```

### `POST /api/sync-holidays`

```ts
// Query: ?year=2025
// 1. fetch data.gov.tw 人事行政局行事曆 API
// 2. 格式轉換：'20250101' → '2025-01-01'，'是' → true / '否' → false
// 3. supabase.from('da_holidays').upsert([...], { onConflict: 'date' })
// Response: { inserted: number, updated: number } | { error: string }
```

---

## 6. 資料流模式（三頁共用）

```
page.tsx (Server Component)
  → createClient() 撈首屏資料
  → 傳 props 給 *Client.tsx

*Client.tsx (Client Component)
  → useState 管理本地列表
  → 增刪改：supabase browser client 直接操作（RLS 覆蓋 admin 全部操作）
  → create-staff / sync-holidays：fetch() 呼叫 API Route
  → 成功後更新 local state
  → 失敗後 toast（sonner）顯示錯誤
```

無 optimistic update（這三頁操作頻率低，等 response 再更新即可）。

---

## 7. 其他修改

### AdminSidebar（`components/admin/AdminSidebar.tsx`）
三個 stub 項目改為 `stub: false`：
- `/staff_admin` 員工
- `/holidays_admin` 節假日
- `/settings_admin` 設定

### Middleware（`middleware.ts`）
matcher 加入三個新路由，確保未登入或非 admin 無法直接訪問：
```ts
matcher: ['/schedule_admin/:path*', '/staff_admin', '/holidays_admin', '/settings_admin', '/login']
```

### 節假日年份清單
`holidays_admin/page.tsx` 在 Server Component 中查詢 `SELECT DISTINCT year FROM da_holidays ORDER BY year DESC`，傳給 `HolidaysClient` 作為年份下拉選項。
