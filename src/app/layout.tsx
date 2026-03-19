import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/layout/sidebar'
import { Navbar } from '@/components/layout/navbar'
import { NotificationProvider, NotificationToast } from '@/components/notifications/notification-system'
import { ProjectProvider } from '@/contexts/project-context'

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
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Set dir and lang from localStorage before React hydration
              (function() {
                const locale = localStorage.getItem('locale') || 'en';
                document.documentElement.lang = locale;
                document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
                if (locale === 'ar') {
                  document.documentElement.classList.add('rtl');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <NotificationProvider>
          <ProjectProvider>
            <div className="min-h-screen bg-background">
              <Sidebar />
              <div className="lg:pl-72 rtl:lg:pr-72 rtl:lg:pl-0">
                <Navbar />
                <main className="py-4">
                  {children}
                </main>
              </div>
              <NotificationToast />
            </div>
          </ProjectProvider>
        </NotificationProvider>
      </body>
    </html>
  )
}