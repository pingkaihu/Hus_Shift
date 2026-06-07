# Hus Shift

小型規模的排班管理網站。店長可在後台建立與管理每週班表；員工及訪客無需登入，透過公開月曆查看班表。

## 線上網址

| 頁面 | URL |
|------|-----|
| 公開月曆（訪客） | https://hus-shift.vercel.app/schedule/ |
| 後台管理（Admin） | https://hus-shift.vercel.app/schedule_admin/ |

## 技術棧

| 層次 | 技術 |
|------|------|
| 前端框架 | Next.js 16 (App Router) |
| 後端 / 資料庫 | Supabase (Auth + PostgreSQL + RLS) |
| 樣式 | shadcn/ui + Tailwind CSS |
| 部署 | Vercel |

## 本地開發

**1. 設定環境變數**

複製 `.env.local.example`（或手動建立 `.env.local`），填入以下三個值：

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # server only，絕不放前端
```

> Supabase schema、RLS 設定詳見 [PRD.md](./PRD.md)。

**2. 安裝與啟動**

```bash
npm install
npm run dev   # http://localhost:3000
```

## 常用指令

```bash
npm run dev         # 啟動開發伺服器
npm run build       # 生產環境建置
npm run lint        # ESLint 檢查
npm run type-check  # TypeScript 型別檢查
```
