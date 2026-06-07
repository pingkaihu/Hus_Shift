import { Lock } from 'lucide-react'

export default function AdminHeader() {
  return (
    <header className="sticky top-0 z-10 md:hidden bg-zinc-900 border-b border-zinc-700 px-4 py-3 flex items-center justify-between">
      <span className="text-base font-bold text-white">Hus Shift</span>
      <span className="flex items-center gap-1.5 bg-zinc-700 rounded-full px-2.5 py-1 text-xs text-zinc-300">
        <Lock size={11} strokeWidth={2.5} />
        管理模式
      </span>
    </header>
  )
}
