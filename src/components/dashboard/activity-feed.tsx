"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  GitCommit, 
  Play, 
  FileText, 
  AlertCircle, 
  CheckCircle,
  Clock
} from 'lucide-react'

interface ActivityEvent {
  id: string
  type: 'commit' | 'deploy' | 'cron' | 'memory' | 'error' | 'info'
  title: string
  description: string
  timestamp: string
  status?: 'success' | 'error' | 'warning' | 'info'
}

export function ActivityFeed() {
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActivityData()
  }, [])

  const loadActivityData = async () => {
    // Demo activity data - in production would read from memory files
    const demoEvents: ActivityEvent[] = [
      {
        id: '1',
        type: 'deploy',
        title: 'Deployment Successful',
        description: 'GenPlatform.ai deployed to production',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        status: 'success'
      },
      {
        id: '2', 
        type: 'commit',
        title: 'Code Commit',
        description: 'Tasks 13-16: OpenClaw API integration routes',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        status: 'info'
      },
      {
        id: '3',
        type: 'cron',
        title: 'Memory Cleanup',
        description: 'Daily memory file cleanup completed',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        status: 'success'
      },
      {
        id: '4',
        type: 'memory',
        title: 'Memory Updated',
        description: 'Daily memory log updated with new entries',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        status: 'info'
      },
      {
        id: '5',
        type: 'error',
        title: 'Authentication Failed',
        description: 'Failed login attempt from unknown IP',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        status: 'warning'
      }
    ]

    setEvents(demoEvents)
    setLoading(false)
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'commit': return GitCommit
      case 'deploy': return Play
      case 'cron': return Clock
      case 'memory': return FileText
      case 'error': return AlertCircle
      default: return CheckCircle
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success': return 'text-green-600'
      case 'error': return 'text-red-600'
      case 'warning': return 'text-yellow-600'
      default: return 'text-blue-600'
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          <div className="p-6 space-y-4">
            {loading ? (
              <div className="text-center text-muted-foreground">Loading activity...</div>
            ) : events.length === 0 ? (
              <div className="text-center text-muted-foreground">No recent activity</div>
            ) : (
              events.map((event) => {
                const Icon = getEventIcon(event.type)
                return (
                  <div key={event.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`flex-shrink-0 ${getStatusColor(event.status)}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">{event.title}</p>
                        <div className="flex items-center space-x-2">
                          {event.status && (
                            <Badge 
                              variant={event.status === 'success' ? 'default' : 
                                     event.status === 'error' ? 'destructive' : 'secondary'} 
                              className="text-xs"
                            >
                              {event.status}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(event.timestamp)}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {event.description}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}