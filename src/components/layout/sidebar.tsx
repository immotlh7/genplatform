"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { SidebarImprovementIndicator } from '@/components/layout/ImprovementsBadge'
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
  ChevronLeft,
  Folder,
  Database,
  Shield,
  Users,
  TrendingUp
} from 'lucide-react'

interface AutomationStatus {
  running_workflows: number
  waiting_approval: number
}

export function Sidebar() {
  const pathname = usePathname()
  const [automationStatus, setAutomationStatus] = useState<AutomationStatus>({ running_workflows: 0, waiting_approval: 0 })

  // Fetch automation status for badge
  useEffect(() => {
    const fetchAutomationStatus = async () => {
      try {
        const response = await fetch('/api/workflows/status')
        if (response.ok) {
          const data = await response.json()
          setAutomationStatus({
            running_workflows: data.status.running_workflows || 0,
            waiting_approval: data.status.waiting_approval || 0
          })
        }
      } catch (error) {
        console.error('Error fetching automation status:', error)
      }
    }

    fetchAutomationStatus()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchAutomationStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const getAutomationBadge = () => {
    const { running_workflows, waiting_approval } = automationStatus
    
    if (running_workflows > 0) {
      return `${running_workflows} running`
    } else if (waiting_approval > 0) {
      return `${waiting_approval} approval`
    }
    
    return null
  }

  const getAutomationBadgeVariant = () => {
    const { running_workflows, waiting_approval } = automationStatus
    
    if (running_workflows > 0) {
      return "default" // Blue for running
    } else if (waiting_approval > 0) {
      return "secondary" // Amber for approval needed
    }
    
    return "outline"
  }

  const navigation = [
    {
      name: 'Overview',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'Command Center', href: '/dashboard/command-center', icon: Terminal, badge: 'New' },
        { name: 'Chat', href: '/dashboard/chat', icon: Terminal },
      ]
    },
    {
      name: 'Core Features',
      items: [
        { name: 'Skills', href: '/dashboard/skills', icon: Zap },
        { name: 'Memory', href: '/dashboard/memory', icon: Brain },
        { name: 'Cron Jobs', href: '/dashboard/cron', icon: Clock },
        { name: 'Projects', href: '/dashboard/projects', icon: Folder },
        { 
          name: 'Automations', 
          href: '/automations', // Correct path for automations
          icon: Zap, 
          badge: getAutomationBadge(),
          badgeVariant: getAutomationBadgeVariant(),
          requiresOwnerAdmin: true // Only show to OWNER and ADMIN
        },
      ]
    },
    {
      name: 'Monitoring',
      items: [
        { name: 'System Monitor', href: '/dashboard/monitoring', icon: Activity },
        { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
        { name: 'Reports', href: '/dashboard/reports', icon: FileText, showImprovements: true },
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

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col rtl:lg:right-0 rtl:lg:left-auto">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-background border-r rtl:border-r-0 rtl:border-l px-6 pb-4">
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center">
          <Link href="/" className="flex items-center space-x-2 rtl:space-x-reverse">
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
                          <item.icon className={cn(
                            "mr-3 h-4 w-4 flex-shrink-0 rtl:mr-0 rtl:ml-3",
                            item.name === 'Automations' && automationStatus.running_workflows > 0 && "animate-pulse"
                          )} />
                          <span className="flex-1">{item.name}</span>
                          
                          {/* Show improvements badge for Reports page */}
                          {item.showImprovements && (
                            <SidebarImprovementIndicator className="mr-2 rtl:mr-0 rtl:ml-2" />
                          )}
                          
                          {/* Dynamic badge with different variants */}
                          {item.badge && (
                            <Badge 
                              variant={(item as any).badgeVariant || "secondary"} 
                              className={cn(
                                "ml-auto text-xs rtl:ml-0 rtl:mr-auto",
                                item.name === 'Automations' && automationStatus.running_workflows > 0 && "bg-blue-500 text-white",
                                item.name === 'Automations' && automationStatus.waiting_approval > 0 && "bg-amber-500 text-white"
                              )}
                            >
                              {item.badge}
                            </Badge>
                          )}
                          
                          {/* Active indicator */}
                          {isActive && (
                            <>
                              <ChevronRight className="ml-auto h-4 w-4 flex-shrink-0 rtl:hidden" />
                              <ChevronLeft className="ml-auto h-4 w-4 flex-shrink-0 hidden rtl:block" />
                            </>
                          )}
                          
                          {/* Running indicator for automations */}
                          {item.name === 'Automations' && automationStatus.running_workflows > 0 && !item.badge && (
                            <div className="ml-auto w-2 h-2 bg-green-500 rounded-full animate-pulse rtl:ml-0 rtl:mr-auto"></div>
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
              href="/help"
              className="group flex w-full items-center rounded-md px-2 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <HelpCircle className="mr-3 h-4 w-4 flex-shrink-0 rtl:mr-0 rtl:ml-3" />
              Help & Support
            </Link>
            
            {/* System Status */}
            <div className="px-2 py-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>System Status</span>
                <div className="flex items-center space-x-1 rtl:space-x-reverse">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Online</span>
                </div>
              </div>
            </div>
            
            {/* Automation Quick Status */}
            {(automationStatus.running_workflows > 0 || automationStatus.waiting_approval > 0) && (
              <div className="px-2 py-2 border-t">
                <div className="text-xs text-muted-foreground space-y-1">
                  {automationStatus.running_workflows > 0 && (
                    <div className="flex items-center justify-between">
                      <span>Workflows Running</span>
                      <div className="flex items-center space-x-1 rtl:space-x-reverse">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span>{automationStatus.running_workflows}</span>
                      </div>
                    </div>
                  )}
                  {automationStatus.waiting_approval > 0 && (
                    <div className="flex items-center justify-between">
                      <span>Need Approval</span>
                      <div className="flex items-center space-x-1 rtl:space-x-reverse">
                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                        <span>{automationStatus.waiting_approval}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </nav>
      </div>
    </div>
  )
}