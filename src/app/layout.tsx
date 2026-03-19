export const dynamic = 'force-dynamic'

import "./globals.css"
import { Inter } from "next/font/google"
import { Navbar } from "@/components/layout/navbar"
import { NotificationProvider } from "@/components/notifications/notification-provider"
import { ProjectProvider } from "@/contexts/project-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "GenPlatform - AI-Powered Business Intelligence",
  description: "Next-generation platform for AI-driven business operations and analytics",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ProjectProvider>
          <NotificationProvider>
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-1">{children}</main>
            </div>
          </NotificationProvider>
        </ProjectProvider>
      </body>
    </html>
  )
}