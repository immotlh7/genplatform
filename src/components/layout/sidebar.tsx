"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { 
  Home,
  Zap,
  Brain,
  Clock,
  Activity,
  BarChart3,
  FileText,
  Terminal,
  Settings,
  HelpCircle,
  ChevronRight,
  Folder,
  Database,
  Shield,
  Users
} from 'lucide-react'

const navigation = [
  {
    name: 'Overview',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: Home },
      { name: 'Command Center', href: '/dashboard/command-center', icon: Terminal, badge: 'New' },
    ]
  },
  {
    name: 'Core Features',
    items: [
      { name: 'Skills', href: '/dashboard/skills', icon: Zap },
      { name: 'Memory', href: '/dashboard/memory', icon: Brain },
      { name: 'Cron Jobs', href: '/dashboard/cron', icon: Clock },
    ]
  },
  {
    name: 'Monitoring',
    items: [
      { name: 'System Monitor', href: '/dashboard/monitoring', icon: Activity },
      { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
      { name: 'Reports', href: '/dashboard/reports', icon: FileText },
    ]
  },
  {
    name: 'Administration',
    items: [
      { name: 'Settings', href: '/dashboard/settings', icon: Settings },
      { name: 'Users', href: '/dashboard/users', icon: Users },
      { name: 'Security', href: '/dashboard/security', icon: Shield },
    ]
  }
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-background border-r px-6 pb-4">
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">GP</span>
            </div>
            <span className="font-bold text-lg">GenPlatform.ai</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col">
          <ScrollArea className="flex-1">
            <div className="space-y-8">
              {navigation.map((group) => (
                <div key={group.name}>
                  <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {group.name}
                  </h3>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                      
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={cn(
                            'group flex w-full items-center rounded-md px-2 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors',
                            isActive
                              ? 'bg-accent text-accent-foreground'
                              : 'text-muted-foreground'
                          )}
                        >
                          <item.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                          <span className="flex-1">{item.name}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="ml-auto text-xs">
                              {item.badge}
                            </Badge>
                          )}
                          {isActive && (
                            <ChevronRight className="ml-auto h-4 w-4 flex-shrink-0" />
                          )}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Bottom section */}
          <div className="mt-auto space-y-2 pt-4 border-t">
            <Link
              href="/dashboard/help"
              className="group flex w-full items-center rounded-md px-2 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <HelpCircle className="mr-3 h-4 w-4 flex-shrink-0" />
              Help & Support
            </Link>
            
            {/* System Status */}
            <div className="px-2 py-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>System Status</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Online</span>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </div>
  )
}