'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, LogOut } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { Shift } from '@/lib/types'
import { Drawer } from 'vaul'
import { useIsMobile } from '@/hooks/use-is-mobile'

const PRESET_COLORS = [
  '#4F81BD', '#70AD47', '#ED7D31', '#FF0000', '#FFC000',
  '#9B59B6', '#3498DB', '#2ECC71', '#E74C3C', '#1ABC9C',
  '#F39C12', '#888888',
]

interface Props {
  initialShifts: Shift[]
}

const INPUT_CLASS = 'h-8 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

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

export default function SettingsClient({ initialShifts }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [shifts, setShifts] = useState<Shift[]>(initialShifts)
  const [dialog, setDialog] = useState<{ mode: 'add' } | { mode: 'edit'; shift: Shift } | null>(null)
  const [loading, setLoading] = useState(false)
  const isMobile = useIsMobile()

  const [name, setName] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [color, setColor] = useState(PRESET_COLORS[0])

  const openAdd = () => {
    setName(''); setStartTime('09:00'); setEndTime('17:00'); setColor(PRESET_COLORS[0])
    setDialog({ mode: 'add' })
  }

  const openEdit = (shift: Shift) => {
    setName(shift.name)
    setStartTime(shift.start_time.slice(0, 5))
    setEndTime(shift.end_time.slice(0, 5))
    setColor(shift.color)
    setDialog({ mode: 'edit', shift })
  }

  const handleAdd = async () => {
    if (!name.trim()) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('da_shifts')
        .insert({ name: name.trim(), start_time: startTime, end_time: endTime, color })
        .select()
        .single()
      if (error) { toast.error('新增失敗'); return }
      setShifts(prev => [...prev, data].sort((a, b) => a.start_time.localeCompare(b.start_time)))
      toast.success(`已新增班次 ${name.trim()}`)
      setDialog(null)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async () => {
    if (dialog?.mode !== 'edit') return
    if (!name.trim()) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from('da_shifts')
        .update({ name: name.trim(), start_time: startTime, end_time: endTime, color })
        .eq('id', dialog.shift.id)
      if (error) { toast.error('更新失敗'); return }
      setShifts(prev =>
        prev.map(s =>
          s.id === dialog.shift.id
            ? { ...s, name: name.trim(), start_time: startTime + ':00', end_time: endTime + ':00', color }
            : s
        )
      )
      toast.success('已更新班次')
      setDialog(null)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleDelete = async (shift: Shift) => {
    const { count, error: countError } = await supabase
      .from('da_schedule_entries')
      .select('*', { count: 'exact', head: true })
      .eq('shift_id', shift.id)
    if (countError) { toast.error('檢查失敗，請再試一次'); return }
    if ((count ?? 0) > 0) {
      toast.error('此班次已有排班紀錄，無法刪除')
      return
    }
    const { error } = await supabase.from('da_shifts').delete().eq('id', shift.id)
    if (error) { toast.error('刪除失敗'); return }
    setShifts(prev => prev.filter(s => s.id !== shift.id))
    toast.success(`已刪除班次 ${shift.name}`)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">班次設定</h1>
        <Button onClick={openAdd} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          新增班次
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-zinc-500 text-xs">
              <th className="px-4 py-3 text-left font-medium">顏色</th>
              <th className="px-4 py-3 text-left font-medium">名稱</th>
              <th className="px-4 py-3 text-left font-medium hidden md:table-cell">時間</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
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
            {shifts.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-zinc-400 text-sm">
                  尚無班次資料
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 bg-zinc-50 rounded-xl border border-zinc-200 p-5 text-sm text-zinc-600">
        <p className="font-semibold text-zinc-800 mb-4">操作說明</p>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="font-medium text-zinc-700 mb-1.5">排班管理</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>點擊日期格選取單日，再點其他日期可多選。</li>
              <li>長按日期進入多選模式，批次選取後指派班次與員工。</li>
              <li>點擊已排班員工名稱可快速刪除該筆排班。</li>
              <li>右上角可切換員工篩選，只顯示特定人員的排班。</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-zinc-700 mb-1.5">員工管理</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>點擊「新增員工」輸入姓名與 Email，系統自動建立帳號。</li>
              <li>員工可使用 Email Magic Link 登入查看公開行程。</li>
              <li>編輯員工時可修改姓名、電話，並切換帳號啟用狀態。</li>
              <li>停用帳號後該員工仍保留歷史排班紀錄，不會出現在新排班選單中。</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-zinc-700 mb-1.5">節假日管理</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>點擊「同步政府資料」可自動匯入台灣官方國定假日。</li>
              <li>點擊「新增週末」可一次將全年週六、週日加入清單。</li>
              <li>節假日會在排班月曆中以標示顯示，補班日亦同。</li>
              <li>若官方假日有調整，重新同步即可覆蓋舊資料。</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-zinc-700 mb-1.5">班次設定（本頁）</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>點擊「新增班次」建立班次，設定名稱、時段與顯示顏色。</li>
              <li>點擊編輯圖示可修改現有班次資訊。</li>
              <li>有排班紀錄的班次無法刪除，需先清除相關排班。</li>
              <li>建議每個班次選用不同顏色，方便在月曆上快速辨識。</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-xl border border-zinc-200 p-5">
        <p className="font-semibold text-zinc-800 mb-4 text-sm">帳號</p>
        <Button
          variant="outline"
          size="sm"
          className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-1.5" />
          登出
        </Button>
      </div>

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
        <Dialog open={dialog !== null} onOpenChange={open => !open && setDialog(null)}>
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
    </div>
  )
}
