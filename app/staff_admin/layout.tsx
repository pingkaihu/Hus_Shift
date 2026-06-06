import AdminSidebar from '@/components/admin/AdminSidebar'
import MobileBottomNav from '@/components/admin/MobileBottomNav'

export default function StaffAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-zinc-100 overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  )
}
