'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

type UIState = 'idle' | 'loading' | 'sent'

export default function LoginForm({ error }: { error?: string }) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<UIState>('idle')
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState('loading')
    await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    setState('sent')
  }

  if (state === 'sent') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--neutral-50)]">
        <div className="bg-white rounded-2xl p-8 shadow-[var(--shadow-modal)] text-center max-w-sm w-full mx-4">
          <h1 className="text-lg font-bold text-[var(--neutral-900)] mb-2">Hus Shift</h1>
          <p className="text-base text-[var(--neutral-900)] font-medium mb-1">請檢查您的信箱</p>
          <p className="text-sm text-[var(--neutral-500)]">已傳送登入連結至 {email}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--neutral-50)]">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl p-8 shadow-[var(--shadow-modal)] max-w-sm w-full mx-4 flex flex-col gap-5"
      >
        <h1 className="text-lg font-bold text-[var(--neutral-900)]">Hus Shift</h1>
        {error === 'auth_failed' && (
          <p className="text-sm text-[var(--danger)] bg-[var(--danger-bg)] rounded-lg px-3 py-2">
            登入連結無效或已過期，請重新嘗試。
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
            disabled={state === 'loading'}
            className="flex h-9 w-full rounded-lg border border-[var(--neutral-200)] bg-transparent px-3 py-1 text-sm transition-colors placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)] focus:ring-offset-0 disabled:opacity-50"
          />
        </div>
        <Button
          type="submit"
          disabled={state === 'loading'}
          className="bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-white rounded-full"
        >
          {state === 'loading' ? '傳送中...' : '傳送登入連結'}
        </Button>
      </form>
    </div>
  )
}
