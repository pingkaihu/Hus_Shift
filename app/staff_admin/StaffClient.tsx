'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Plus, Pencil } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import type { Profile } from '@/lib/types'

interface Props {
  initialProfiles: Profile[]
}

export default function StaffClient({ initialProfiles }: Props) {
  const supabase = createClient()
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles)
  const [dialog, setDialog] = useState<{ mode: 'add' } | { mode: 'edit'; profile: Profile } | null>(null)
  const [loading, setLoading] = useState(false)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isActive, setIsActive] = useState(true)

  const openAdd = () => {
    setFullName(''); setEmail(''); setPhone(''); setIsActive(true)
    setDialog({ mode: 'add' })
  }

  const openEdit = (profile: Profile) => {
    setFullName(profile.full_name)
    setPhone(profile.phone ?? '')
    setIsActive(profile.is_active)
    setDialog({ mode: 'edit', profile })
  }

  const handleAdd = async () => {
    if (!fullName.trim() || !email.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/create-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName.trim(), email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error === 'STAFF_LIMIT' ? '員工人數已達上限（50 人）' : (data.error ?? '新增失敗'))
        return
      }
      const { data: newProfile } = await supabase
        .from('da_profiles').select('*').eq('id', data.id).single()
      if (newProfile) {
        setProfiles(prev => [...prev, newProfile])
        toast.success(`已新增員工 ${fullName.trim()}`)
        setDialog(null)
      } else {
        toast.error('新增成功，但資料載入失敗，請重新整理頁面')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async () => {
    if (dialog?.mode !== 'edit') return
    if (!fullName.trim()) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from('da_profiles')
        .update({ full_name: fullName.trim(), phone: phone.trim() || null, is_active: isActive })
        .eq('id', dialog.profile.id)
      if (error) { toast.error('更新失敗'); return }
      setProfiles(prev => prev.map(p =>
        p.id === (dialog as { mode: 'edit'; profile: Profile }).profile.id
          ? { ...p, full_name: fullName.trim(), phone: phone.trim() || null, is_active: isActive }
          : p
      ))
      toast.success('已更新員工資料')
      setDialog(null)
    } finally {
      setLoading(false)
    }
  }

  const activeCount = profiles.filter(p => p.is_active).length

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">員工管理</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{activeCount} / 50 人</p>
        </div>
        <Button onClick={openAdd} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          新增員工
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-zinc-500 text-xs">
              <th className="px-4 py-3 text-left font-medium">姓名</th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">角色</th>
              <th className="px-4 py-3 text-left font-medium">狀態</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {profiles.map(p => (
              <tr key={p.id} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50">
                <td className="px-4 py-3 font-medium text-zinc-900">{p.full_name}</td>
                <td className="px-4 py-3 text-zinc-500">{p.email}</td>
                <td className="px-4 py-3">
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
            {profiles.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-400 text-sm">
                  尚無員工資料
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Dialog */}
      <Dialog open={dialog?.mode === 'add'} onOpenChange={open => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>新增員工</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="add-name">姓名</Label>
              <input
                id="add-name"
                className="h-8 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="王小明"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="add-email">Email</Label>
              <input
                id="add-email"
                type="email"
                className="h-8 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="staff@example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>取消</Button>
            <Button onClick={handleAdd} disabled={loading || !fullName.trim() || !email.trim()}>
              {loading ? '新增中...' : '新增'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={dialog?.mode === 'edit'} onOpenChange={open => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>編輯員工</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-name">姓名</Label>
              <input
                id="edit-name"
                className="h-8 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-phone">電話</Label>
              <input
                id="edit-phone"
                className="h-8 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>取消</Button>
            <Button onClick={handleEdit} disabled={loading || !fullName.trim()}>
              {loading ? '儲存中...' : '儲存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
