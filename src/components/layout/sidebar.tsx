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
  Folder,
  Database,
  Shield,
  Users,
  TrendingUp,
  MessageSquare,
  Lightbulb,
  CheckSquare,
  Bot,
  Wifi,
  WifiOff
} from 'lucide-react'

interface AutomationStatus {
  running_workflows: number
  waiting_approval: number
}

interface SystemStatus {
  isOnline: boolean
  lastChecked: Date
}

export function Sidebar() {
  const pathname = usePathname()
  const [automationStatus, setAutomationStatus] = useState<AutomationStatus>({ running_workflows: 0, waiting_approval: 0 })
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({ isOnline: true, lastChecked: new Date() })
  const [taskCount, setTaskCount] = useState(0)
  const [reportCount, setReportCount] = useState(0)
  const [ideaCount, setIdeaCount] = useState(0)

  // Fetch system health status
  useEffect(() => {
    const checkSystemHealth = async () => {
      try {
        const response = await fetch('/api/bridge/health', { 
          method: 'GET',
          cache: 'no-cache'
        })
        setSystemStatus({
          isOnline: response.ok,
          lastChecked: new Date()
        })
      } catch (error) {
        setSystemStatus({
          isOnline: false,
          lastChecked: new Date()
        })
      }
    }

    checkSystemHealth()
    const interval = setInterval(checkSystemHealth, 60000) // Every 60 seconds
    return () => clearInterval(interval)
  }, [])

  // Fetch task count
  useEffect(() => {
    const fetchTaskCount = async () => {
      try {
        const response = await fetch('/api/tasks')
        if (response.ok) {
          const data = await response.json()
          const inProgressTasks = data.tasks?.filter((t: any) => t.status === 'in_progress').length || 0
          setTaskCount(inProgressTasks)
        }
      } catch (error) {
        console.error('Error fetching task count:', error)
      }
    }

    fetchTaskCount()
    const interval = setInterval(fetchTaskCount, 30000)
    return () => clearInterval(interval)
  }, [])

  // Fetch report count
  useEffect(() => {
    const fetchReportCount = async () => {
      try {
        const response = await fetch('/api/reports')
        if (response.ok) {
          const data = await response.json()
          setReportCount(data.reports?.length || 0)
        }
      } catch (error) {
        console.error('Error fetching report count:', error)
      }
    }

    fetchReportCount()
    const interval = setInterval(fetchReportCount, 30000)
    return () => clearInterval(interval)
  }, [])

  // Fetch ideas count
  useEffect(() => {
    const fetchIdeaCount = async () => {
      try {
        const response = await fetch('/api/ideas')
        if (response.ok) {
          const data = await response.json()
          const pendingIdeas = data.stats?.pending || 0
          setIdeaCount(pendingIdeas)
        }
      } catch (error) {
        console.error('Error fetching idea count:', error)
      }
    }

    fetchIdeaCount()
    const interval = setInterval(fetchIdeaCount, 30000)
    return () => clearInterval(interval)
  }, [])

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
        { name: 'Command Center', href: '/dashboard/command-center', icon: Terminal },
        { name: 'Chat', href: '/dashboard/chat', icon: MessageSquare },
      ]
    },
    {
      name: 'Core Features',
      items: [
        { name: 'Skills', href: '/dashboard/skills', icon: Zap },
        { name: 'Memory', href: '/dashboard/memory', icon: Brain },
        { name: 'Cron Jobs', href: '/dashboard/cron', icon: Clock },
        { name: 'Projects', href: '/projects', icon: Folder },
        { 
          name: 'Tasks', 
          href: '/dashboard/tasks', 
          icon: CheckSquare,
          badge: taskCount > 0 ? taskCount.toString() : undefined,
          badgeVariant: 'default'
        },
        { 
          name: 'Ideas', 
          href: '/ideas', 
          icon: Lightbulb,
          badge: ideaCount > 0 ? ideaCount.toString() : undefined,
          badgeVariant: 'secondary'
        },
        { 
          name: 'Automations', 
          href: '/automations',
          icon: Zap, 
          badge: getAutomationBadge(),
          badgeVariant: getAutomationBadgeVariant(),
        },
        { 
          name: 'Agents', 
          href: '/agents', 
          icon: Bot,
          badge: 'Soon',
          badgeVariant: 'outline'
        },
      ]
    },
    {
      name: 'Monitoring',
      items: [
        { name: 'System Monitor', href: '/dashboard/monitoring', icon: Activity },
        { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
        { 
          name: 'Reports', 
          href: '/dashboard/reports', 
          icon: FileText, 
          showImprovements: true,
          badge: reportCount > 0 ? reportCount.toString() : undefined,
          badgeVariant: 'outline'
        },
      ]
    },
    {
      name: 'Administration',
      items: [
        { name: 'Settings', href: '/dashboard/settings', icon: Settings },
        { name: 'Users', href: '/dashboard/users', icon: Users },
        { name: 'Security', href: '/dashboard/security', icon: Shield },
        { name: 'Help', href: '/help', icon: HelpCircle },
      ]
    }
  ]

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-background border-r px-6 pb-4">
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center">
          <Link href="/" className="flex items-center space-x-2">
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
                            "mr-3 h-4 w-4 flex-shrink-0",
                            item.name === 'Automations' && automationStatus.running_workflows > 0 && "animate-pulse",
                            item.name === 'Tasks' && taskCount > 0 && "text-blue-500",
                            item.name === 'Ideas' && ideaCount > 0 && "text-yellow-500"
                          )} />
                          <span className="flex-1">{item.name}</span>
                          
                          {/* Show improvements badge for Reports page */}
                          {item.showImprovements && (
                            <SidebarImprovementIndicator className="mr-2" />
                          )}
                          
                          {/* Dynamic badge with different variants */}
                          {item.badge && (
                            <Badge 
                              variant={(item as any).badgeVariant || "secondary"} 
                              className={cn(
                                "ml-auto text-xs",
                                item.name === 'Automations' && automationStatus.running_workflows > 0 && "bg-blue-500 text-white",
                                item.name === 'Automations' && automationStatus.waiting_approval > 0 && "bg-amber-500 text-white",
                                item.name === 'Tasks' && taskCount > 0 && "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
                                item.name === 'Ideas' && ideaCount > 0 && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                              )}
                            >
                              {item.badge}
                            </Badge>
                          )}
                          
                          {/* Active indicator */}
                          {isActive && (
                            <ChevronRight className="ml-auto h-4 w-4 flex-shrink-0" />
                          )}
                          
                          {/* Running indicator for automations */}
                          {item.name === 'Automations' && automationStatus.running_workflows > 0 && !item.badge && (
                            <div className="ml-auto w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Bottom section - System Status */}
          <div className="mt-auto pt-4 border-t">
            <div className="px-2 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">System Status</span>
                <div className="flex items-center space-x-2">
                  {systemStatus.isOnline ? (
                    <>
                      <Wifi className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600 dark:text-green-400">Online</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-4 h-4 text-red-500 animate-pulse" />
                      <span className="text-sm text-red-600 dark:text-red-400">Offline</span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Last checked: {systemStatus.lastChecked.toLocaleTimeString()}
              </div>
            </div>
            
            {/* Automation Quick Status */}
            {(automationStatus.running_workflows > 0 || automationStatus.waiting_approval > 0) && (
              <div className="px-2 py-3 border-t">
                <div className="text-xs text-muted-foreground space-y-2">
                  {automationStatus.running_workflows > 0 && (
                    <div className="flex items-center justify-between">
                      <span>Workflows Running</span>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="font-medium">{automationStatus.running_workflows}</span>
                      </div>
                    </div>
                  )}
                  {automationStatus.waiting_approval > 0 && (
                    <div className="flex items-center justify-between">
                      <span>Need Approval</span>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                        <span className="font-medium">{automationStatus.waiting_approval}</span>
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