"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Activity, 
  CheckCircle, 
  Hammer, 
  Search, 
  Shield, 
  Lightbulb,
  AlertTriangle,
  Clock,
  User,
  Bot,
  Settings,
  RefreshCw,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'

interface ActivityEvent {
  id: string
  type: 'task' | 'security' | 'improvement' | 'system'
  event_type: string
  title: string
  description: string
  actor_role?: string
  severity?: string
  status?: string
  created_at: string
  metadata?: any
}

interface ActivityStreamProps {
  supabaseUrl?: string
  refreshInterval?: number
  maxEvents?: number
}

export function ActivityStream({ 
  supabaseUrl, 
  refreshInterval = 30000, 
  maxEvents = 20 
}: ActivityStreamProps) {
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchEvents()
    
    // Auto-update every 30 seconds
    const interval = setInterval(fetchEvents, refreshInterval)
    return () => clearInterval(interval)
  }, [refreshInterval])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      setError(null)

      // In a real implementation, this would fetch from Supabase
      // For now, we'll simulate the data with realistic events
      const mockEvents = generateMockEvents()
      setEvents(mockEvents)
      
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to fetch activity events:', err);
      }
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const generateMockEvents = (): ActivityEvent[] => {
    const now = new Date()
    
    return [
      {
        id: '1',
        type: 'task' as const,
        event_type: 'task_completed',
        title: 'Task 0D-23 completed',
        description: 'Full integration test script created and verified',
        actor_role: 'development-team',
        created_at: new Date(now.getTime() - 2 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        type: 'task' as const,
        event_type: 'task_started',
        title: 'Task 0D-24 started',
        description: 'Final deployment and verification in progress',
        actor_role: 'development-team',
        created_at: new Date(now.getTime() - 5 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        type: 'security' as const,
        event_type: 'health_check',
        title: 'Security scan passed',
        description: 'All systems operational, no threats detected',
        severity: 'info',
        actor_role: 'security-officer',
        created_at: new Date(now.getTime() - 12 * 60 * 1000).toISOString()
      },
      {
        id: '4',
        type: 'task' as const,
        event_type: 'task_review_requested',
        title: 'QA reviewing Sprint 0D',
        description: 'Live monitoring system review in progress',
        actor_role: 'qa-team',
        created_at: new Date(now.getTime() - 18 * 60 * 1000).toISOString()
      },
      {
        id: '5',
        type: 'improvement' as const,
        event_type: 'proposal_created',
        title: 'New improvement suggested',
        description: 'Optimize Bridge API response caching for better performance',
        actor_role: 'self-improver',
        created_at: new Date(now.getTime() - 25 * 60 * 1000).toISOString()
      },
      {
        id: '6',
        type: 'task' as const,
        event_type: 'task_completed',
        title: 'Task 0D-22 completed',
        description: 'Supabase connection added to frontend with TypeScript types',
        actor_role: 'development-team',
        created_at: new Date(now.getTime() - 32 * 60 * 1000).toISOString()
      },
      {
        id: '7',
        type: 'system' as const,
        event_type: 'deployment',
        title: 'Production deployment successful',
        description: 'GenPlatform.ai Sprint 0D deployed to Vercel',
        actor_role: 'devops-team',
        created_at: new Date(now.getTime() - 45 * 60 * 1000).toISOString()
      },
      {
        id: '8',
        type: 'security' as const,
        event_type: 'login',
        title: 'User login successful',
        description: 'Admin user authenticated successfully',
        severity: 'info',
        created_at: new Date(now.getTime() - 60 * 60 * 1000).toISOString()
      }
    ].slice(0, maxEvents)
  }

  const getEventIcon = (event: ActivityEvent) => {
    switch (event.event_type) {
      case 'task_completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'task_started':
        return <Hammer className="h-4 w-4 text-orange-500" />
      case 'task_review_requested':
        return <Search className="h-4 w-4 text-blue-600" />
      case 'health_check':
      case 'login':
        return <Shield className="h-4 w-4 text-green-600" />
      case 'proposal_created':
        return <Lightbulb className="h-4 w-4 text-yellow-600" />
      case 'deployment':
        return <Settings className="h-4 w-4 text-purple-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getEventEmoji = (event: ActivityEvent) => {
    switch (event.event_type) {
      case 'task_completed': return '✅'
      case 'task_started': return '🔨'
      case 'task_review_requested': return '🔍'
      case 'health_check': return '🛡️'
      case 'proposal_created': return '💡'
      case 'deployment': return '🚀'
      case 'login': return '🔐'
      default: return '📝'
    }
  }

  const getRoleBadge = (role?: string) => {
    if (!role) return null
    
    const roleConfig = {
      'development-team': { label: 'Dev', color: 'bg-blue-500' },
      'qa-team': { label: 'QA', color: 'bg-green-500' },
      'security-officer': { label: 'Security', color: 'bg-red-500' },
      'self-improver': { label: 'AI', color: 'bg-purple-500' },
      'devops-team': { label: 'DevOps', color: 'bg-orange-500' }
    }

    const config = roleConfig[role as keyof typeof roleConfig] || 
                   { label: role, color: 'bg-gray-500' }

    return (
      <Badge className={`${config.color} text-white text-xs`}>
        {config.label}
      </Badge>
    )
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center space-x-2">
          <Activity className="h-5 w-5" />
          <span>Activity Stream</span>
          {loading && <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />}
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={fetchEvents} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Link href="/dashboard/analytics">
            <Button variant="ghost" size="sm">
              View All
              <ExternalLink className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-center py-4 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <p className="text-sm">Failed to load activity stream</p>
            <p className="text-xs">{error}</p>
          </div>
        )}

        <ScrollArea className="h-96">
          <div className="space-y-4">
            {events.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
              </div>
            ) : (
              events.map((event) => (
                <div key={event.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex-shrink-0 mt-0.5">
                    {getEventIcon(event)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm">
                        {getEventEmoji(event)} <span className="font-medium">{event.title}</span>
                      </span>
                      {getRoleBadge(event.actor_role)}
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">
                      {event.description}
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-xs text-muted-foreground flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatTimeAgo(event.created_at)}</span>
                      </div>
                      {event.severity && (
                        <Badge variant="outline" className="text-xs capitalize">
                          {event.severity}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Showing last {events.length} events</span>
            <span>Updates every {refreshInterval / 1000}s</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}