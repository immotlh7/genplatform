import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/layout/sidebar'
import { Navbar } from '@/components/layout/navbar'
import { NotificationProvider, NotificationToast } from '@/components/notifications/notification-system'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GenPlatform.ai - Mission Control Dashboard',
  description: 'AI Agent Management Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
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
      </body>
    </html>
  )
}