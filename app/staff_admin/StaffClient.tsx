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
import { Drawer } from 'vaul'
import { useIsMobile } from '@/hooks/use-is-mobile'
import type { Profile } from '@/lib/types'

interface Props {
  initialProfiles: Profile[]
}

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

export default function StaffClient({ initialProfiles }: Props) {
  const supabase = createClient()
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles)
  const [dialog, setDialog] = useState<{ mode: 'add' } | { mode: 'edit'; profile: Profile } | null>(null)
  const [loading, setLoading] = useState(false)
  const isMobile = useIsMobile()

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
    setEmail(profile.email)
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
    if (!fullName.trim() || !email.trim()) return
    setLoading(true)
    try {
      const profileId = dialog.profile.id
      const emailChanged = email.trim() !== dialog.profile.email

      if (emailChanged) {
        const res = await fetch('/api/update-staff-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: profileId, email: email.trim() }),
        })
        const data = await res.json()
        if (!res.ok) { toast.error(data.error ?? 'Email 更新失敗'); return }
      }

      const { error } = await supabase
        .from('da_profiles')
        .update({ full_name: fullName.trim(), phone: phone.trim() || null, is_active: isActive })
        .eq('id', profileId)
      if (error) { toast.error('更新失敗'); return }

      setProfiles(prev => prev.map(p =>
        p.id === profileId
          ? { ...p, full_name: fullName.trim(), email: email.trim(), phone: phone.trim() || null, is_active: isActive }
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
              <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Email</th>
              <th className="px-4 py-3 text-left font-medium hidden md:table-cell">電話</th>
              <th className="px-4 py-3 text-left font-medium hidden md:table-cell">角色</th>
              <th className="px-4 py-3 text-left font-medium">狀態</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
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
            {profiles.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-400 text-sm">
                  尚無員工資料
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
                  <Button className="flex-1" onClick={handleAdd} disabled={loading || !fullName.trim() || !email.trim()}>
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
                  <Button className="flex-1" onClick={handleEdit} disabled={loading || !fullName.trim() || !email.trim()}>
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
    </div>
  )
}
