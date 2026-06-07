import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminHeader from '@/components/admin/AdminHeader'
import MobileBottomNav from '@/components/admin/MobileBottomNav'

export default function SettingsAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-zinc-100 overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        <AdminHeader />
        {children}
      </main>
      <MobileBottomNav />
    </div>
  )
}
