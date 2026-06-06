'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, Users, CalendarOff, Settings } from 'lucide-react'

const navItems = [
  { href: '/schedule_admin', label: '排班', icon: CalendarDays, stub: false },
  { href: '/staff_admin',    label: '員工', icon: Users,        stub: false },
  { href: '/holidays_admin', label: '節假日', icon: CalendarOff, stub: false },
  { href: '/settings_admin', label: '設定',  icon: Settings,    stub: false },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 shrink-0 bg-zinc-900 hidden md:flex flex-col py-6 px-3">
      <div className="px-3 mb-8">
        <span className="text-white font-bold text-base tracking-tight">Hus Shift</span>
      </div>
      <nav className="flex flex-col gap-1">
        {navItems.map(({ href, label, icon: Icon, stub }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={stub ? '#' : href}
              aria-disabled={stub}
              className={[
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                active
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800',
                stub ? 'pointer-events-none opacity-40' : '',
              ].join(' ')}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
