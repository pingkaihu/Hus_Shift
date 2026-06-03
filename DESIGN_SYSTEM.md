# Hus Shift — 設計系統

> 版本：1.1  
> 風格基調：公開視圖 — 溫暖輕鬆（Style B）／Admin — 沉穩中性  
> 底座：shadcn/ui + Tailwind CSS  
> 修改此文件後，同步更新 `tailwind.config.ts` 與 `globals.css` 的 CSS variables

---

## 1. 色彩系統

### 1.1 Accent（品牌主色）

靛藍系列，貫穿按鈕、focus ring、今日高亮、active 狀態。

| Token | Hex | Tailwind | 用途 |
|-------|-----|----------|------|
| `accent-50` | `#eef2ff` | `indigo-50` | 淡底色、hover 背景 |
| `accent-100` | `#e0e7ff` | `indigo-100` | 選取狀態底色 |
| `accent-200` | `#c7d2fe` | `indigo-200` | 邊框 hover 色 |
| `accent-500` | `#6366f1` | `indigo-500` | **主要 Accent** — 按鈕、今日圓圈 |
| `accent-600` | `#4f46e5` | `indigo-600` | 按鈕 hover / pressed |
| `accent-700` | `#4338ca` | `indigo-700` | 深色強調（少用） |

### 1.2 Neutral（中性色）

暖灰系列（帶微微黃調，與 accent 靛藍形成溫暖對比）。

| Token | Hex | Tailwind | 用途 |
|-------|-----|----------|------|
| `neutral-0` | `#ffffff` | `white` | 卡片底色、Modal 背景 |
| `neutral-50` | `#fafaf8` | `stone-50` | 頁面底色 |
| `neutral-100` | `#f5f4f0` | `stone-100` | 輸入框底色、禁用狀態 |
| `neutral-200` | `#ebe9e4` | `stone-200` | 卡片邊框、分隔線 |
| `neutral-300` | `#d6d3cc` | `stone-300` | 次要邊框 |
| `neutral-500` | `#78716c` | `stone-500` | 輔助文字 |
| `neutral-700` | `#44403c` | `stone-700` | 次要標題、label |
| `neutral-900` | `#1a1917` | `stone-900` | 主要文字 |

### 1.3 語意色

| Token | Hex | Tailwind | 用途 |
|-------|-----|----------|------|
| `success` | `#10b981` | `emerald-500` | 成功 toast、已排班標記 |
| `warning` | `#f59e0b` | `amber-500` | 補班日背景、警告 |
| `danger` | `#ef4444` | `red-500` | 假日日期、錯誤提示、刪除 |
| `danger-bg` | `#fef2f2` | `red-50` | 錯誤狀態底色 |
| `holiday-bg` | `#fff7ed` | `orange-50` | 補班日格子背景 |

### 1.4 班次色（可在 Admin Settings 修改）

| 班次 | Hex | 說明 |
|------|-----|------|
| 早班 | `#4F81BD` | 藍色 |
| 午班 | `#70AD47` | 綠色 |
| 晚班 | `#ED7D31` | 橘色 |

---

## 2. 字型系統

### 2.1 字型家族

```css
--font-sans: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
--font-mono: 'SF Mono', 'Fira Code', 'Menlo', monospace;  /* 時間顯示用 */
```

> 未來若要換字型：推薦 [Inter](https://fonts.google.com/specimen/Inter)（已內建 Next.js `next/font`）

### 2.2 字型比例

| Token | Size | Line Height | Weight | 用途 |
|-------|------|-------------|--------|------|
| `text-xs` | 10px | 1.4 | 400 | 班次姓氏、圖例說明 |
| `text-sm` | 12px | 1.5 | 400/500 | 假日名稱、輔助資訊 |
| `text-base` | 14px | 1.5 | 400 | 一般內文、表單 label |
| `text-lg` | 16px | 1.4 | 600 | 品牌名稱、Modal 標題 |
| `text-xl` | 18px | 1.3 | 700 | 頁面大標題 |
| `text-2xl` | 24px | 1.2 | 800 | （目前未使用） |

---

## 3. 間距系統

使用 Tailwind 預設 4px 基準，以下為常用值。

| Token | Value | 用途 |
|-------|-------|------|
| `space-1` | 4px | 元素內部最小間距 |
| `space-2` | 8px | chip 內 padding、小元素間距 |
| `space-3` | 12px | 卡片內 padding（小）|
| `space-4` | 16px | 標準 padding、區塊間距 |
| `space-5` | 20px | 卡片 padding（標準） |
| `space-6` | 24px | 區段間距 |
| `space-8` | 32px | 頁面頂部留白 |

---

## 4. 圓角系統

風格 B 使用較大圓角，傳達輕鬆感。

| Token | Value | Tailwind | 用途 |
|-------|-------|----------|------|
| `radius-sm` | 6px | `rounded` | 色條、小標籤 |
| `radius-md` | 10px | `rounded-xl` | DayCell 格子 |
| `radius-lg` | 12px | `rounded-2xl` | 卡片、Modal |
| `radius-xl` | 20px | `rounded-[20px]` | 主容器、App 外框 |
| `radius-full` | 9999px | `rounded-full` | Pill chip、今日圓圈、按鈕 |

---

## 5. 陰影系統

| Token | Value | 用途 |
|-------|-------|------|
| `shadow-card` | `0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)` | 一般卡片 |
| `shadow-modal` | `0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)` | Modal、Sheet |
| `shadow-hover` | `0 4px 12px rgba(99,102,241,0.15)` | 卡片 hover（accent 色投影） |
| `shadow-focus` | `0 0 0 3px rgba(99,102,241,0.25)` | Focus ring（無障礙） |

---

## 6. 動態 / 過場

| 場景 | Duration | Easing | 說明 |
|------|----------|--------|------|
| 按鈕 hover | 120ms | `ease-out` | 背景色、邊框色變化 |
| 卡片 hover | 150ms | `ease-out` | 邊框色 + 陰影 |
| Modal 開啟 | 200ms | `ease-out` | opacity + scale(0.97 → 1) |
| Bottom Sheet 滑入 | 300ms | `cubic-bezier(0.32,0.72,0,1)` | vaul 預設，不需自訂 |
| 頁面切換 | 無動畫 | — | Next.js router push，不加 transition |
| Toast 出現 | 250ms | `ease-out` | 從底部滑入 |

---

## 7. 元件 Token

### DayCell（公開月曆）

```
背景：neutral-0
邊框：neutral-200（1.5px）
圓角：radius-md（10px）
Hover 邊框：accent-200
Hover 背景：accent-50
假日格子背景：holiday-bg
最小高度：70px
```

### Pill Chip（班次標籤）

```
背景：班次色（不透明）
文字：white
圓角：radius-full
Padding：2px 6px
Font：text-xs / weight-500
```

### 今日圓圈

```
背景：accent-500
文字：white
尺寸：22×22px
圓角：radius-full
```

### Bottom Sheet（DayDetailSheet）

```
實作：vaul Drawer
背景：neutral-0
圓角頂部：radius-xl
最大高度：90dvh
Handle 顏色：neutral-200
```

### Modal（Admin DayModal）

```
背景：neutral-0
圓角：radius-lg
陰影：shadow-modal
最大寬度：480px
Overlay：rgba(0,0,0,0.4)
```

### 主要按鈕

```
背景：accent-500
文字：white
圓角：radius-full
Padding：8px 20px
Hover 背景：accent-600
Font：text-base / weight-600
```

### 次要按鈕

```
背景：neutral-0
文字：neutral-700
邊框：neutral-200（1.5px）
圓角：radius-md
Hover 背景：neutral-50
```

---

## 8. CSS Variables（globals.css）

```css
:root {
  /* Accent */
  --accent-50:  #eef2ff;
  --accent-100: #e0e7ff;
  --accent-200: #c7d2fe;
  --accent-500: #6366f1;
  --accent-600: #4f46e5;
  --accent-700: #4338ca;

  /* Neutral (warm gray) */
  --neutral-0:   #ffffff;
  --neutral-50:  #fafaf8;
  --neutral-100: #f5f4f0;
  --neutral-200: #ebe9e4;
  --neutral-300: #d6d3cc;
  --neutral-500: #78716c;
  --neutral-700: #44403c;
  --neutral-900: #1a1917;

  /* Semantic */
  --success:     #10b981;
  --warning:     #f59e0b;
  --danger:      #ef4444;
  --danger-bg:   #fef2f2;
  --holiday-bg:  #fff7ed;

  /* Radius */
  --radius-sm:   6px;
  --radius-md:   10px;
  --radius-lg:   12px;
  --radius-xl:   20px;

  /* Shadow */
  --shadow-card:  0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-modal: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06);
  --shadow-hover: 0 4px 12px rgba(99,102,241,0.15);
  --shadow-focus: 0 0 0 3px rgba(99,102,241,0.25);
}
```

---

## 9. 雙介面視覺分區

公開月曆與 Admin 後台刻意使用不同的視覺調性，讓使用者不會搞混「現在在哪個介面」。

### 公開月曆（`/schedule/*`）— 溫暖

| 屬性 | 值 |
|------|----|
| 頁面底色 | `neutral-50`（`#fafaf8`，暖白） |
| 卡片背景 | `neutral-0`（white） |
| 卡片邊框 | `neutral-200`（暖灰，`#ebe9e4`） |
| Hover 邊框 | `accent-200`（靛藍淡） |
| 圓角 | `radius-md`（10px）— 較圓 |
| Header 背景 | `neutral-0`（white） |

### Admin 後台（`/admin/*`）— 沉穩

| 屬性 | 值 |
|------|----|
| 頁面底色 | `#f4f4f5`（zinc-100，冷灰，比 `neutral-50` 更冷） |
| 卡片背景 | `neutral-0`（white） |
| 卡片邊框 | `#e4e4e7`（zinc-200，冷灰） |
| Sidebar 背景 | `#18181b`（zinc-900，深色側欄） |
| Sidebar 文字 | `#a1a1aa`（zinc-400），active：white |
| 圓角 | `radius-sm` 至 `radius-md`（6–10px）— 較方正 |
| Header 背景 | `neutral-0`，底部邊框 `#e4e4e7` |

### 共用

Accent color（`accent-500` `#6366f1`）在兩個介面都使用，作為跨介面的品牌識別錨點。

---

## 10. 未來修改指引

| 想改什麼 | 改哪裡 |
|----------|--------|
| 換 Accent 主色 | §1.1 + `globals.css` 的 `--accent-*` |
| 換成深色模式 | 新增 `[data-theme="dark"]` block，覆蓋 neutral 系列 |
| 換字型 | §2.1 + `layout.tsx` 的 `next/font` |
| 調整圓角大小 | §4 + `globals.css` 的 `--radius-*` |
| 新增班次顏色 | §1.4 + `shifts` table |
