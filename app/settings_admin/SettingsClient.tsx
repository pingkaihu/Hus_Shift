'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { Shift } from '@/lib/types'

const PRESET_COLORS = [
  '#4F81BD', '#70AD47', '#ED7D31', '#FF0000', '#FFC000',
  '#9B59B6', '#3498DB', '#2ECC71', '#E74C3C', '#1ABC9C',
  '#F39C12', '#888888',
]

interface Props {
  initialShifts: Shift[]
}

export default function SettingsClient({ initialShifts }: Props) {
  const supabase = createClient()
  const [shifts, setShifts] = useState<Shift[]>(initialShifts)
  const [dialog, setDialog] = useState<{ mode: 'add' } | { mode: 'edit'; shift: Shift } | null>(null)
  const [loading, setLoading] = useState(false)

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

  const handleDelete = async (shift: Shift) => {
    const { count } = await supabase
      .from('da_schedule_entries')
      .select('*', { count: 'exact', head: true })
      .eq('shift_id', shift.id)
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
              <th className="px-4 py-3 text-left font-medium">時間</th>
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
                <td className="px-4 py-3 text-zinc-500">
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

      <Dialog open={dialog !== null} onOpenChange={open => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog?.mode === 'add' ? '新增班次' : '編輯班次'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="shift-name">名稱</Label>
              <input
                id="shift-name"
                className="h-8 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
                  className="h-8 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="shift-end">結束時間</Label>
                <input
                  id="shift-end"
                  type="time"
                  className="h-8 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
    </div>
  )
}
