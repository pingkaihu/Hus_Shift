# Debug Report — Vercel 登入失敗

**日期：** 2026-06-05  
**狀態：** 已解決

---

## 問題描述

部署至 Vercel 後，使用正確帳密仍無法登入，顯示「Email 或密碼錯誤」。

---

## 調查過程

### Step 1 — 確認錯誤層級

開啟 DevTools → Network，發現 Supabase 回傳的實際錯誤並非憑證錯誤，而是：

```json
{"code": "unexpected_failure", "message": "Database error querying schema"}
```

這是 Supabase auth service 內部的 DB 查詢失敗，非使用者輸入問題。

> **教訓：** 前端 generic 錯誤訊息會遮蔽真正的錯誤，debug 時應第一時間看 Network response。

### Step 2 — 排除 Vercel 問題

在 localhost 用相同帳密嘗試，同樣失敗 → 確認問題在 Supabase 專案本身，非 Vercel 環境變數。

### Step 3 — 確認 DB 狀態

查詢 `auth.users` 與 `auth.identities`，資料結構完整（密碼雜湊、email 確認、identity 記錄皆存在）。問題不在 user 資料本身。

### Step 4 — 發現 trigger 失敗

嘗試透過 Admin API 建立新 user 時，同樣回傳 `Database error creating new user`，確認問題出在 user 建立流程。

分析 trigger `da_on_auth_user_created`：每次 `auth.users` INSERT 時，會呼叫 `da_handle_new_user()` 將資料寫入 `da_profiles`。若 trigger 執行失敗，整個 user 建立會 rollback。

### Step 5 — 根本原因

`da_handle_new_user()` 函式缺少 `SET search_path = ''`。

當 trigger 由 Supabase auth service（`supabase_auth_admin` 角色）觸發時，函式的 search_path 預設為 `auth` schema，導致 `INSERT INTO da_profiles` 找不到 `public.da_profiles`，引發例外並 rollback 整個 user 建立。

---

## 修復步驟

| # | 操作 |
|---|---|
| 1 | 修改 trigger function，加上 `SET search_path = ''` 並明確指定 `public.da_profiles` |
| 2 | 透過 Admin API 成功建立 user |
| 3 | 手動 INSERT 對應的 `da_profiles` 記錄（role = admin） |

**修正後的 function：**

```sql
CREATE OR REPLACE FUNCTION da_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.da_profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
```

---

## 後續

`supabase/migrations/001_create_profiles.sql` 已同步更新，避免未來重新部署時重現相同問題。

---

## 檢討

### 為何會犯這個錯誤？

寫 trigger function 時使用了 `SECURITY DEFINER` 但漏掉 `SET search_path = ''`。

本地開發不會暴露此問題，因為本地 PostgreSQL 的 `search_path` 預設包含 `public`，所以 `INSERT INTO da_profiles` 能正確找到表。但在 Supabase 雲端，trigger 由 `supabase_auth_admin` 角色觸發，其 search_path 是 `auth` schema，導致找不到 `da_profiles`。

**根本原因：本地與 Supabase 雲端的 search_path 不同，遮蔽了這個 bug。**

### 未來如何避免？

**1. Supabase trigger function 的標準寫法**

```sql
-- 永遠加這兩項
SECURITY DEFINER SET search_path = ''
-- 永遠用 schema 限定資料表名稱
INSERT INTO public.da_profiles ...
```

**2. 前端不應用 generic 錯誤訊息遮蔽 Supabase 錯誤**

登入的 error handler 至少在開發期間應顯示 `error.message`，否則 debug 時完全看不出問題所在。

**3. User 建立流程應使用 Admin API，不直接 INSERT `auth.users`**

直接寫 SQL 繞過了 Supabase 的建立流程（`auth.identities`、metadata 等），容易產生不一致的狀態。
