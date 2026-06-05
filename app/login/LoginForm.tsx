'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getISOWeek, getISOWeekYear } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export default function LoginForm({ error }: { error?: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setAuthError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setAuthError('Email 或密碼錯誤，請重新確認')
      setLoading(false)
      return
    }

    const now = new Date()
    const week = `${getISOWeekYear(now)}-W${String(getISOWeek(now)).padStart(2, '0')}`
    router.push(`/schedule_admin/${week}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--neutral-50)]">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl p-8 shadow-[var(--shadow-modal)] max-w-sm w-full mx-4 flex flex-col gap-5"
      >
        <h1 className="text-lg font-bold text-[var(--neutral-900)]">Hus Shift</h1>
        {(error === 'auth_failed' || authError) && (
          <p className="text-sm text-[var(--danger)] bg-[var(--danger-bg)] rounded-lg px-3 py-2">
            {authError || '登入連結無效或已過期，請重新嘗試。'}
          </p>
        )}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email" className="text-[var(--neutral-700)]">Email</Label>
          <input
            id="email"
            type="email"
            placeholder="admin@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={loading}
            className="flex h-9 w-full rounded-lg border border-[var(--neutral-200)] bg-transparent px-3 py-1 text-sm transition-colors placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)] focus:ring-offset-0 disabled:opacity-50"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password" className="text-[var(--neutral-700)]">密碼</Label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={loading}
            className="flex h-9 w-full rounded-lg border border-[var(--neutral-200)] bg-transparent px-3 py-1 text-sm transition-colors placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)] focus:ring-offset-0 disabled:opacity-50"
          />
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-white rounded-full"
        >
          {loading ? '登入中...' : '登入'}
        </Button>
      </form>
    </div>
  )
}
