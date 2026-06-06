# Admin Pages Mobile UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the same mobile UX treatment from `schedule_admin` to `staff_admin`, `holidays_admin`, and `settings_admin` — bottom nav, responsive tables (hide secondary columns), and vaul Drawers replacing Dialogs on mobile.

**Architecture:** All changes use the existing `md:` Tailwind breakpoint (768 px) and the already-built `hooks/use-is-mobile.ts` + `vaul` Drawer pattern from the previous sprint. No new dependencies. Each page's layout gets `MobileBottomNav` + `pb-16 md:pb-0`; each table hides secondary columns with `hidden md:table-cell`; each Dialog becomes a responsive Drawer/Dialog pair.

**Tech Stack:** Next.js 15 App Router · Tailwind CSS · vaul ^1.1.2 · `hooks/use-is-mobile.ts` (already exists)

---

## File Map

| Action | Path | Change |
|--------|------|--------|
| Modify | `app/staff_admin/layout.tsx` | Add MobileBottomNav + pb-16 md:pb-0 |
| Modify | `app/holidays_admin/layout.tsx` | Add MobileBottomNav + pb-16 md:pb-0 |
| Modify | `app/settings_admin/layout.tsx` | Add MobileBottomNav + pb-16 md:pb-0 |
| Modify | `app/staff_admin/StaffClient.tsx` | Table col hiding + Drawer dialogs |
| Modify | `app/holidays_admin/HolidaysClient.tsx` | Two-row header + Drawer dialog |
| Modify | `app/settings_admin/SettingsClient.tsx` | Table col hiding + Drawer dialog |

---

## Task 1: Add MobileBottomNav to All Three Layouts

**Files:**
- Modify: `app/staff_admin/layout.tsx`
- Modify: `app/holidays_admin/layout.tsx`
- Modify: `app/settings_admin/layout.tsx`

All three layouts are currently identical to the old `schedule_admin` layout (no mobile nav). Apply the same fix: import `MobileBottomNav`, add `pb-16 md:pb-0` to `<main>`.

- [ ] **Step 1: Update `app/staff_admin/layout.tsx`**

```tsx
import AdminSidebar from '@/components/admin/AdminSidebar'
import MobileBottomNav from '@/components/admin/MobileBottomNav'

export default function StaffAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-zinc-100 overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  )
}
```

- [ ] **Step 2: Update `app/holidays_admin/layout.tsx`**

```tsx
import AdminSidebar from '@/components/admin/AdminSidebar'
import MobileBottomNav from '@/components/admin/MobileBottomNav'

export default function HolidaysAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-zinc-100 overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  )
}
```

- [ ] **Step 3: Update `app/settings_admin/layout.tsx`**

```tsx
import AdminSidebar from '@/components/admin/AdminSidebar'
import MobileBottomNav from '@/components/admin/MobileBottomNav'

export default function SettingsAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-zinc-100 overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  )
}
```

- [ ] **Step 4: Type-check**

```bash
npm run type-check
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/staff_admin/layout.tsx app/holidays_admin/layout.tsx app/settings_admin/layout.tsx
git commit -m "feat: add mobile bottom nav to staff, holidays, settings layouts"
```

---

## Task 2: StaffClient — Responsive Table (Hide Secondary Columns)

**Files:**
- Modify: `app/staff_admin/StaffClient.tsx`

On mobile, hide Email, 電話, and 角色 columns. Show 姓名, 狀態, and the action button. Use `hidden md:table-cell` on both `<th>` and `<td>` for each hidden column.

- [ ] **Step 1: Update table header row (lines 124–132 in StaffClient.tsx)**

Replace the `<thead>` block:
```tsx
<thead>
  <tr className="border-b border-zinc-100 text-zinc-500 text-xs">
    <th className="px-4 py-3 text-left font-medium">姓名</th>
    <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Email</th>
    <th className="px-4 py-3 text-left font-medium hidden md:table-cell">電話</th>
    <th className="px-4 py-3 text-left font-medium hidden md:table-cell">角色</th>
    <th className="px-4 py-3 text-left font-medium">狀態</th>
    <th className="px-4 py-3" />
  </tr>
</thead>
```

- [ ] **Step 2: Update table body rows (lines 135–155 in StaffClient.tsx)**

Replace the `{profiles.map(p => (...))}` block:
```tsx
{profiles.map(p => (
  <tr key={p.id} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50">
    <td className="px-4 py-3 font-medium text-zinc-900">{p.full_name}</td>
    <td className="px-4 py-3 text-zinc-500 hidden md:table-cell">{p.email}</td>
    <td className="px-4 py-3 text-zinc-500 hidden md:table-cell">{p.phone ?? '—'}</td>
    <td className="px-4 py-3 hidden md:table-cell">
      <Badge variant={p.role === 'admin' ? 'default' : 'outline'}>
        {p.role === 'admin' ? '管理員' : '員工'}
      </Badge>
    </td>
    <td className="px-4 py-3">
      <Badge variant={p.is_active ? 'secondary' : 'outline'}>
        {p.is_active ? '啟用' : '停用'}
      </Badge>
    </td>
    <td className="px-4 py-3 text-right">
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}>
        <Pencil className="h-3.5 w-3.5" />
      </Button>
    </td>
  </tr>
))}
```

- [ ] **Step 3: Type-check + commit**

```bash
npm run type-check
git add app/staff_admin/StaffClient.tsx
git commit -m "feat: hide secondary columns in staff table on mobile"
```

---

## Task 3: StaffClient — Responsive Dialogs (Drawer on Mobile)

**Files:**
- Modify: `app/staff_admin/StaffClient.tsx`

Replace the two Dialogs (Add + Edit) with responsive wrappers: vaul Drawer on mobile, Dialog on desktop. Extract a shared `StaffFormBody` component within the file to avoid duplicating the form fields JSX.

- [ ] **Step 1: Add imports at top of StaffClient.tsx**

After the existing imports, add:
```tsx
import { Drawer } from 'vaul'
import { useIsMobile } from '@/hooks/use-is-mobile'
```

- [ ] **Step 2: Add `useIsMobile()` call inside the component**

After `const [loading, setLoading] = useState(false)` (line 23), add:
```tsx
const isMobile = useIsMobile()
```

- [ ] **Step 3: Add `StaffFormBody` helper above the `StaffClient` export**

Insert this component definition before `export default function StaffClient`:

```tsx
const INPUT_CLASS = 'h-8 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

function StaffFormBody({
  mode,
  fullName, setFullName,
  email, setEmail,
  phone, setPhone,
  isActive, setIsActive,
}: {
  mode: 'add' | 'edit'
  fullName: string; setFullName: (v: string) => void
  email: string; setEmail: (v: string) => void
  phone: string; setPhone: (v: string) => void
  isActive: boolean; setIsActive: (v: boolean) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${mode}-name`}>姓名</Label>
        <input
          id={`${mode}-name`}
          className={INPUT_CLASS}
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          placeholder={mode === 'add' ? '王小明' : undefined}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${mode}-email`}>Email</Label>
        <input
          id={`${mode}-email`}
          type="email"
          className={INPUT_CLASS}
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder={mode === 'add' ? 'staff@example.com' : undefined}
        />
      </div>
      {mode === 'edit' && (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-phone">電話</Label>
            <input
              id="edit-phone"
              className={INPUT_CLASS}
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="0912-345-678"
            />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={e => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded"
            />
            啟用帳號
          </label>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Replace Add Dialog block**

Replace the entire `{/* Add Dialog */}` section (lines 168–202) with:

```tsx
{/* Add Dialog / Drawer */}
{isMobile ? (
  <Drawer.Root open={dialog?.mode === 'add'} onOpenChange={(o) => !o && setDialog(null)}>
    <Drawer.Portal>
      <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
      <Drawer.Content className="bg-white flex flex-col rounded-t-2xl fixed bottom-0 left-0 right-0 z-50 max-h-[90dvh] outline-none">
        <div className="mx-auto mt-3 mb-2 w-12 h-1.5 rounded-full bg-zinc-300 flex-shrink-0" />
        <div className="overflow-y-auto flex-1 px-5 pb-8">
          <p className="text-base font-semibold text-zinc-900 mb-4">新增員工</p>
          <StaffFormBody
            mode="add"
            fullName={fullName} setFullName={setFullName}
            email={email} setEmail={setEmail}
            phone={phone} setPhone={setPhone}
            isActive={isActive} setIsActive={setIsActive}
          />
          <div className="flex gap-2 pt-4">
            <Button
              className="flex-1"
              onClick={handleAdd}
              disabled={loading || !fullName.trim() || !email.trim()}
            >
              {loading ? '新增中...' : '新增'}
            </Button>
            <Button variant="outline" onClick={() => setDialog(null)}>取消</Button>
          </div>
        </div>
      </Drawer.Content>
    </Drawer.Portal>
  </Drawer.Root>
) : (
  <Dialog open={dialog?.mode === 'add'} onOpenChange={(open) => !open && setDialog(null)}>
    <DialogContent>
      <DialogHeader><DialogTitle>新增員工</DialogTitle></DialogHeader>
      <StaffFormBody
        mode="add"
        fullName={fullName} setFullName={setFullName}
        email={email} setEmail={setEmail}
        phone={phone} setPhone={setPhone}
        isActive={isActive} setIsActive={setIsActive}
      />
      <DialogFooter>
        <Button variant="outline" onClick={() => setDialog(null)}>取消</Button>
        <Button onClick={handleAdd} disabled={loading || !fullName.trim() || !email.trim()}>
          {loading ? '新增中...' : '新增'}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)}
```

- [ ] **Step 5: Replace Edit Dialog block**

Replace the entire `{/* Edit Dialog */}` section (lines 204–255) with:

```tsx
{/* Edit Dialog / Drawer */}
{isMobile ? (
  <Drawer.Root open={dialog?.mode === 'edit'} onOpenChange={(o) => !o && setDialog(null)}>
    <Drawer.Portal>
      <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
      <Drawer.Content className="bg-white flex flex-col rounded-t-2xl fixed bottom-0 left-0 right-0 z-50 max-h-[90dvh] outline-none">
        <div className="mx-auto mt-3 mb-2 w-12 h-1.5 rounded-full bg-zinc-300 flex-shrink-0" />
        <div className="overflow-y-auto flex-1 px-5 pb-8">
          <p className="text-base font-semibold text-zinc-900 mb-4">編輯員工</p>
          <StaffFormBody
            mode="edit"
            fullName={fullName} setFullName={setFullName}
            email={email} setEmail={setEmail}
            phone={phone} setPhone={setPhone}
            isActive={isActive} setIsActive={setIsActive}
          />
          <div className="flex gap-2 pt-4">
            <Button
              className="flex-1"
              onClick={handleEdit}
              disabled={loading || !fullName.trim() || !email.trim()}
            >
              {loading ? '儲存中...' : '儲存'}
            </Button>
            <Button variant="outline" onClick={() => setDialog(null)}>取消</Button>
          </div>
        </div>
      </Drawer.Content>
    </Drawer.Portal>
  </Drawer.Root>
) : (
  <Dialog open={dialog?.mode === 'edit'} onOpenChange={(open) => !open && setDialog(null)}>
    <DialogContent>
      <DialogHeader><DialogTitle>編輯員工</DialogTitle></DialogHeader>
      <StaffFormBody
        mode="edit"
        fullName={fullName} setFullName={setFullName}
        email={email} setEmail={setEmail}
        phone={phone} setPhone={setPhone}
        isActive={isActive} setIsActive={setIsActive}
      />
      <DialogFooter>
        <Button variant="outline" onClick={() => setDialog(null)}>取消</Button>
        <Button onClick={handleEdit} disabled={loading || !fullName.trim() || !email.trim()}>
          {loading ? '儲存中...' : '儲存'}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)}
```

- [ ] **Step 6: Type-check**

```bash
npm run type-check
```
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add app/staff_admin/StaffClient.tsx
git commit -m "feat: responsive staff dialogs — vaul Drawer on mobile"
```

---

## Task 4: HolidaysClient — Two-Row Header on Mobile

**Files:**
- Modify: `app/holidays_admin/HolidaysClient.tsx`

On mobile, the header (title + year select + 3 buttons) wraps into two rows. Change the outer `flex` div to `flex-col` on mobile, `flex-row` on `md:`.

- [ ] **Step 1: Update the header wrapper div (line 121 in HolidaysClient.tsx)**

Replace:
```tsx
<div className="flex items-center justify-between mb-6">
```
With:
```tsx
<div className="flex flex-col gap-3 mb-6 md:flex-row md:items-center md:justify-between">
```

- [ ] **Step 2: Add `flex-wrap` to the buttons div (line 135)**

Replace:
```tsx
<div className="flex gap-2">
```
With:
```tsx
<div className="flex flex-wrap gap-2">
```

- [ ] **Step 3: Type-check + commit**

```bash
npm run type-check
git add app/holidays_admin/HolidaysClient.tsx
git commit -m "feat: two-row holidays header on mobile"
```

---

## Task 5: HolidaysClient — Responsive Dialog (Drawer on Mobile)

**Files:**
- Modify: `app/holidays_admin/HolidaysClient.tsx`

Convert the single "手動新增節假日" Dialog to a vaul Drawer on mobile.

- [ ] **Step 1: Add imports**

Add after the existing imports in `HolidaysClient.tsx`:
```tsx
import { Drawer } from 'vaul'
import { useIsMobile } from '@/hooks/use-is-mobile'
```

- [ ] **Step 2: Add `useIsMobile()` call inside the component**

After `const [addingWeekends, setAddingWeekends] = useState(false)` (line 32), add:
```tsx
const isMobile = useIsMobile()
```

- [ ] **Step 3: Extract `HolidayFormBody` above the export**

Insert before `export default function HolidaysClient`:

```tsx
const INPUT_CLASS = 'h-8 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

function HolidayFormBody({
  date, setDate,
  name, setName,
  isHoliday, setIsHoliday,
}: {
  date: string; setDate: (v: string) => void
  name: string; setName: (v: string) => void
  isHoliday: boolean; setIsHoliday: (v: boolean) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="hol-date">日期</Label>
        <input
          id="hol-date"
          type="date"
          className={INPUT_CLASS}
          value={date}
          onChange={e => setDate(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="hol-name">名稱</Label>
        <input
          id="hol-name"
          className={INPUT_CLASS}
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="元旦"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>類型</Label>
        <div className="flex gap-4">
          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <input type="radio" checked={isHoliday} onChange={() => setIsHoliday(true)} className="h-4 w-4" />
            放假
          </label>
          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <input type="radio" checked={!isHoliday} onChange={() => setIsHoliday(false)} className="h-4 w-4" />
            補班
          </label>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Replace the Dialog block**

Replace the entire `<Dialog open={dialogOpen} ...>` block (lines 206–251) with:

```tsx
{isMobile ? (
  <Drawer.Root open={dialogOpen} onOpenChange={setDialogOpen}>
    <Drawer.Portal>
      <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
      <Drawer.Content className="bg-white flex flex-col rounded-t-2xl fixed bottom-0 left-0 right-0 z-50 max-h-[90dvh] outline-none">
        <div className="mx-auto mt-3 mb-2 w-12 h-1.5 rounded-full bg-zinc-300 flex-shrink-0" />
        <div className="overflow-y-auto flex-1 px-5 pb-8">
          <p className="text-base font-semibold text-zinc-900 mb-4">手動新增節假日</p>
          <HolidayFormBody
            date={date} setDate={setDate}
            name={name} setName={setName}
            isHoliday={isHoliday} setIsHoliday={setIsHoliday}
          />
          <div className="flex gap-2 pt-4">
            <Button
              className="flex-1"
              onClick={handleAdd}
              disabled={loading || !date || !name.trim()}
            >
              {loading ? '新增中...' : '新增'}
            </Button>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
          </div>
        </div>
      </Drawer.Content>
    </Drawer.Portal>
  </Drawer.Root>
) : (
  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
    <DialogContent>
      <DialogHeader><DialogTitle>手動新增節假日</DialogTitle></DialogHeader>
      <HolidayFormBody
        date={date} setDate={setDate}
        name={name} setName={setName}
        isHoliday={isHoliday} setIsHoliday={setIsHoliday}
      />
      <DialogFooter>
        <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
        <Button onClick={handleAdd} disabled={loading || !date || !name.trim()}>
          {loading ? '新增中...' : '新增'}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)}
```

- [ ] **Step 5: Type-check + commit**

```bash
npm run type-check
git add app/holidays_admin/HolidaysClient.tsx
git commit -m "feat: responsive holidays dialog — vaul Drawer on mobile"
```

---

## Task 6: SettingsClient — Responsive Table (Hide 時間 Column)

**Files:**
- Modify: `app/settings_admin/SettingsClient.tsx`

On mobile, hide the 時間 column. Show 顏色, 名稱, and the actions column.

- [ ] **Step 1: Update table header (lines 119–125)**

Replace the `<thead>` block:
```tsx
<thead>
  <tr className="border-b border-zinc-100 text-zinc-500 text-xs">
    <th className="px-4 py-3 text-left font-medium">顏色</th>
    <th className="px-4 py-3 text-left font-medium">名稱</th>
    <th className="px-4 py-3 text-left font-medium hidden md:table-cell">時間</th>
    <th className="px-4 py-3" />
  </tr>
</thead>
```

- [ ] **Step 2: Update table body (lines 128–154)**

Replace the `{shifts.map(shift => (...))}` block:
```tsx
{shifts.map(shift => (
  <tr key={shift.id} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50">
    <td className="px-4 py-3">
      <span
        className="w-4 h-4 rounded inline-block"
        style={{ backgroundColor: shift.color }}
      />
    </td>
    <td className="px-4 py-3 font-medium text-zinc-900">{shift.name}</td>
    <td className="px-4 py-3 text-zinc-500 hidden md:table-cell">
      {shift.start_time.slice(0, 5)}–{shift.end_time.slice(0, 5)}
    </td>
    <td className="px-4 py-3">
      <div className="flex gap-1 justify-end">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(shift)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost" size="icon"
          className="h-7 w-7 text-zinc-400 hover:text-red-500"
          onClick={() => handleDelete(shift)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </td>
  </tr>
))}
```

- [ ] **Step 3: Type-check + commit**

```bash
npm run type-check
git add app/settings_admin/SettingsClient.tsx
git commit -m "feat: hide time column in settings table on mobile"
```

---

## Task 7: SettingsClient — Responsive Dialog (Drawer on Mobile)

**Files:**
- Modify: `app/settings_admin/SettingsClient.tsx`

Convert the shared Add/Edit Dialog to a vaul Drawer on mobile. The single Dialog currently handles both modes (`dialog?.mode === 'add'` or `'edit'`); preserve this with a shared form body.

- [ ] **Step 1: Add imports**

Add after the existing imports in `SettingsClient.tsx`:
```tsx
import { Drawer } from 'vaul'
import { useIsMobile } from '@/hooks/use-is-mobile'
```

- [ ] **Step 2: Add `useIsMobile()` call inside the component**

After `const [loading, setLoading] = useState(false)` (line 30), add:
```tsx
const isMobile = useIsMobile()
```

- [ ] **Step 3: Add `ShiftFormBody` helper above the export**

Insert before `export default function SettingsClient`:

```tsx
const INPUT_CLASS = 'h-8 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

const PRESET_COLORS = [
  '#4F81BD', '#70AD47', '#ED7D31', '#FF0000', '#FFC000',
  '#9B59B6', '#3498DB', '#2ECC71', '#E74C3C', '#1ABC9C',
  '#F39C12', '#888888',
]

function ShiftFormBody({
  name, setName,
  startTime, setStartTime,
  endTime, setEndTime,
  color, setColor,
}: {
  name: string; setName: (v: string) => void
  startTime: string; setStartTime: (v: string) => void
  endTime: string; setEndTime: (v: string) => void
  color: string; setColor: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="shift-name">名稱</Label>
        <input
          id="shift-name"
          className={INPUT_CLASS}
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="早班"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="shift-start">開始時間</Label>
          <input
            id="shift-start"
            type="time"
            className={INPUT_CLASS}
            value={startTime}
            onChange={e => setStartTime(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="shift-end">結束時間</Label>
          <input
            id="shift-end"
            type="time"
            className={INPUT_CLASS}
            value={endTime}
            onChange={e => setEndTime(e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>顏色</Label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              type="button"
              className={cn(
                'w-6 h-6 rounded-full border-2 transition-transform hover:scale-110',
                color === c ? 'border-zinc-900 scale-110' : 'border-transparent'
              )}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
```

**Important:** The `PRESET_COLORS` constant that was previously inside `SettingsClient.tsx` (lines 15–19) must be **removed** from there to avoid a duplicate declaration. Delete these lines from `SettingsClient.tsx`:
```tsx
const PRESET_COLORS = [
  '#4F81BD', '#70AD47', '#ED7D31', '#FF0000', '#FFC000',
  '#9B59B6', '#3498DB', '#2ECC71', '#E74C3C', '#1ABC9C',
  '#F39C12', '#888888',
]
```

- [ ] **Step 4: Replace the Dialog block**

Replace the entire `<Dialog open={dialog !== null} ...>` block (lines 167–233) with:

```tsx
{isMobile ? (
  <Drawer.Root open={dialog !== null} onOpenChange={(o) => !o && setDialog(null)}>
    <Drawer.Portal>
      <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
      <Drawer.Content className="bg-white flex flex-col rounded-t-2xl fixed bottom-0 left-0 right-0 z-50 max-h-[90dvh] outline-none">
        <div className="mx-auto mt-3 mb-2 w-12 h-1.5 rounded-full bg-zinc-300 flex-shrink-0" />
        <div className="overflow-y-auto flex-1 px-5 pb-8">
          <p className="text-base font-semibold text-zinc-900 mb-4">
            {dialog?.mode === 'add' ? '新增班次' : '編輯班次'}
          </p>
          <ShiftFormBody
            name={name} setName={setName}
            startTime={startTime} setStartTime={setStartTime}
            endTime={endTime} setEndTime={setEndTime}
            color={color} setColor={setColor}
          />
          <div className="flex gap-2 pt-4">
            <Button
              className="flex-1"
              onClick={dialog?.mode === 'add' ? handleAdd : handleEdit}
              disabled={loading || !name.trim()}
            >
              {loading ? '儲存中...' : '儲存'}
            </Button>
            <Button variant="outline" onClick={() => setDialog(null)}>取消</Button>
          </div>
        </div>
      </Drawer.Content>
    </Drawer.Portal>
  </Drawer.Root>
) : (
  <Dialog open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{dialog?.mode === 'add' ? '新增班次' : '編輯班次'}</DialogTitle>
      </DialogHeader>
      <ShiftFormBody
        name={name} setName={setName}
        startTime={startTime} setStartTime={setStartTime}
        endTime={endTime} setEndTime={setEndTime}
        color={color} setColor={setColor}
      />
      <DialogFooter>
        <Button variant="outline" onClick={() => setDialog(null)}>取消</Button>
        <Button
          onClick={dialog?.mode === 'add' ? handleAdd : handleEdit}
          disabled={loading || !name.trim()}
        >
          {loading ? '儲存中...' : '儲存'}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)}
```

- [ ] **Step 5: Type-check + lint**

```bash
npm run type-check && npm run lint
```
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/settings_admin/SettingsClient.tsx
git commit -m "feat: responsive settings dialog — vaul Drawer on mobile"
```

---

## Self-Review

### Spec Coverage

| Decision | Task |
|----------|------|
| MobileBottomNav added to all 3 layouts | Task 1 |
| Staff table: hide Email, 電話, 角色 on mobile | Task 2 |
| Staff dialogs (Add + Edit) → Drawer on mobile | Task 3 |
| Holidays header: two-row on mobile | Task 4 |
| Holidays dialog → Drawer on mobile | Task 5 |
| Settings table: hide 時間 on mobile | Task 6 |
| Settings dialog (Add + Edit) → Drawer on mobile | Task 7 |

All grill-me decisions covered. ✓

### Placeholder Scan

No TBDs or incomplete steps. Every step has complete code. ✓

### Type Consistency

- `StaffFormBody` props: `mode: 'add' | 'edit'` matches usage in Tasks 3 steps 4 and 5 ✓
- `HolidayFormBody` props match `HolidaysClient` state variables exactly ✓
- `ShiftFormBody` props match `SettingsClient` state variables exactly ✓
- `PRESET_COLORS` moved out of `SettingsClient` into module scope — no duplicate declaration ✓
- `INPUT_CLASS` defined once per file (Tasks 3, 5, 7 each define it in their own file) ✓
- `cn` import already exists in `SettingsClient.tsx` (line 12) — `ShiftFormBody` uses it ✓
