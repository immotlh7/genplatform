import { Sidebar } from '@/components/layout/sidebar'
import { Navbar } from '@/components/layout/navbar'
import { NotificationProvider, NotificationToast } from '@/components/notifications/notification-system'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <NotificationProvider>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <div className="lg:pl-72">
          <Navbar />
          <main className="py-4">
            {children}
          </main>
        </div>
        <NotificationToast />
      </div>
    </NotificationProvider>
  )
}