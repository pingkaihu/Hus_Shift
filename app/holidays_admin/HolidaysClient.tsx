'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { CalendarDays, Plus, RefreshCw } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@/components/ui/select'
import type { Holiday } from '@/lib/types'

interface Props {
  initialHolidays: Holiday[]
  initialYear: number
  availableYears: number[]
}

export default function HolidaysClient({ initialHolidays, initialYear, availableYears }: Props) {
  const supabase = createClient()
  const [holidays, setHolidays] = useState<Holiday[]>(initialHolidays)
  const [year, setYear] = useState(initialYear)
  const [years, setYears] = useState(availableYears)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [addingWeekends, setAddingWeekends] = useState(false)
  const [filter, setFilter] = useState<'official' | 'all'>('official')

  const [date, setDate] = useState('')
  const [name, setName] = useState('')
  const [isHoliday, setIsHoliday] = useState(true)

  const fetchYear = async (y: number) => {
    const { data, error } = await supabase
      .from('da_holidays')
      .select('*')
      .eq('year', y)
      .order('date')
    if (error) { toast.error('載入失敗'); return }
    setHolidays(data ?? [])
  }

  const handleYearChange = async (val: string | null) => {
    if (!val) return
    const y = parseInt(val)
    setYear(y)
    setHolidays([])
    await fetchYear(y)
  }

  const openAdd = () => {
    setDate(''); setName(''); setIsHoliday(true)
    setDialogOpen(true)
  }

  const handleAdd = async () => {
    if (!date || !name.trim()) return
    setLoading(true)
    try {
      const yearNum = parseInt(date.slice(0, 4))
      const { data, error } = await supabase
        .from('da_holidays')
        .upsert(
          { date, name: name.trim(), is_holiday: isHoliday, year: yearNum, description: null, source: 'manual' },
          { onConflict: 'date' }
        )
        .select()
        .single()
      if (error) { toast.error('新增失敗'); return }
      if (yearNum === year) {
        setHolidays(prev =>
          [...prev.filter(h => h.date !== date), data].sort((a, b) => a.date.localeCompare(b.date))
        )
      }
      if (!years.includes(yearNum)) {
        setYears(prev => [yearNum, ...prev].sort((a, b) => b - a))
      }
      toast.success(`已新增 ${date}`)
      setDialogOpen(false)
    } finally {
      setLoading(false)
    }
  }

  const handleAddWeekends = async () => {
    setAddingWeekends(true)
    try {
      const res = await fetch(`/api/add-weekends?year=${year}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? '新增週末失敗'); return }
      toast.success(`已新增 ${data.inserted} 筆，跳過 ${data.skipped} 筆重複`)
      await fetchYear(year)
    } finally {
      setAddingWeekends(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await fetch(`/api/sync-holidays?year=${year}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? '同步失敗'); return }
      toast.success(`同步完成，新增 ${data.inserted} 筆、更新 ${data.updated} 筆`)
      await fetchYear(year)
    } finally {
      setSyncing(false)
    }
  }

  const displayedHolidays = filter === 'official' ? holidays.filter(h => h.source !== 'weekend') : holidays

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-zinc-900">節假日管理</h1>
          <Select value={String(year)} onValueChange={handleYearChange}>
            <SelectTrigger size="sm" className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => (
                <SelectItem key={y} value={String(y)}>{y} 年</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleAddWeekends} disabled={addingWeekends}>
            <CalendarDays className="h-4 w-4 mr-1" />
            {addingWeekends ? '新增中...' : '新增週末'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`h-4 w-4 mr-1 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? '同步中...' : '同步政府資料'}
          </Button>
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-1" />
            手動新增
          </Button>
        </div>
      </div>

      <div className="flex gap-1 mb-4 border-b border-zinc-200">
        <button
          onClick={() => setFilter('official')}
          className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            filter === 'official'
              ? 'border-zinc-900 text-zinc-900'
              : 'border-transparent text-zinc-500 hover:text-zinc-700'
          }`}
        >
          節日
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            filter === 'all'
              ? 'border-zinc-900 text-zinc-900'
              : 'border-transparent text-zinc-500 hover:text-zinc-700'
          }`}
        >
          全部
        </button>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-zinc-500 text-xs">
              <th className="px-4 py-3 text-left font-medium">日期</th>
              <th className="px-4 py-3 text-left font-medium">名稱</th>
              <th className="px-4 py-3 text-left font-medium">類型</th>
            </tr>
          </thead>
          <tbody>
            {displayedHolidays.map(h => (
              <tr key={h.date} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50">
                <td className="px-4 py-3 font-medium text-zinc-900">{h.date}</td>
                <td className="px-4 py-3 text-zinc-700">{h.name}</td>
                <td className="px-4 py-3">
                  <Badge variant={h.is_holiday ? 'destructive' : 'outline'}>
                    {h.is_holiday ? '放假' : '補班'}
                  </Badge>
                </td>
              </tr>
            ))}
            {displayedHolidays.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-zinc-400 text-sm">
                  本年尚無節假日資料，可點擊「同步政府資料」匯入
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>手動新增節假日</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="hol-date">日期</Label>
              <input
                id="hol-date"
                type="date"
                className="h-8 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="hol-name">名稱</Label>
              <input
                id="hol-name"
                className="h-8 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleAdd} disabled={loading || !date || !name.trim()}>
              {loading ? '新增中...' : '新增'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
