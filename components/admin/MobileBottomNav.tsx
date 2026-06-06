'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, Users, CalendarOff, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/schedule_admin', label: '排班',  icon: CalendarDays },
  { href: '/staff_admin',    label: '員工',  icon: Users },
  { href: '/holidays_admin', label: '節假日', icon: CalendarOff },
  { href: '/settings_admin', label: '設定',  icon: Settings },
]

export default function MobileBottomNav() {
  const pathname = usePathname()
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-zinc-200 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center py-2 gap-1 text-xs',
                active ? 'text-indigo-600' : 'text-zinc-400'
              )}
            >
              <Icon size={22} />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
