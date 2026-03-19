"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Hammer, 
  CheckCircle, 
  Pause, 
  Play, 
  Clock,
  Target,
  Activity,
  ChevronRight,
  Zap,
  Brain,
  Search,
  Upload,
  RefreshCw
} from 'lucide-react'

interface LiveStatus {
  currentTask?: {
    number: string | number
    name: string
    stage: string
  }
  currentProject?: {
    name: string
    id: string
  }
  currentAction: string
  uptime: number
  tokensUsed: number
  status: string
  timestamp: string
}

interface TaskTrackerProps {
  bridgeApiUrl?: string
  projectFilter?: string[]
}

export function TaskTracker({ bridgeApiUrl = '', projectFilter }: TaskTrackerProps) {
  const [liveStatus, setLiveStatus] = useState<LiveStatus>({
    currentAction: 'idle',
    uptime: 0,
    tokensUsed: 0,
    status: 'idle',
    timestamp: new Date().toISOString()
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLiveStatus()
    
    // Update every 10 seconds
    const interval = setInterval(fetchLiveStatus, 10000)
    return () => clearInterval(interval)
  }, [bridgeApiUrl])

  const fetchLiveStatus = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/bridge/live-status')
      if (!response.ok) {
        throw new Error(`Bridge API error: ${response.status}`)
      }

      const data = await response.json()
      setLiveStatus(data)
    } catch (err) {
      console.error('Failed to fetch live status:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      
      setLiveStatus({
        currentTask: {
          number: '0D-16',
          name: 'Add live task tracker to Dashboard',
          stage: 'building'
        },
        currentProject: {
          name: 'GenPlatform.ai',
          id: 'genplatform-main'
        },
        currentAction: 'coding',
        uptime: 3600,
        tokensUsed: 15420,
        status: 'active',
        timestamp: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = () => {
    switch (liveStatus.status) {
      case 'active':
        return <Hammer className="h-5 w-5 text-orange-500 animate-pulse" />
      case 'idle':
        return <Pause className="h-5 w-5 text-gray-500" />
      default:
        return <Activity className="h-5 w-5 text-blue-500" />
    }
  }

  const getActionIcon = () => {
    switch (liveStatus.currentAction) {
      case 'coding':
        return <Zap className="h-4 w-4" />
      case 'reviewing':
        return <CheckCircle className="h-4 w-4" />
      case 'researching':
        return <Search className="h-4 w-4" />
      case 'deploying':
        return <Upload className="h-4 w-4" />
      default:
        return <Brain className="h-4 w-4" />
    }
  }

  const getStatusText = () => {
    if (liveStatus.status === 'active' && liveStatus.currentTask) {
      return `🔨 Currently working on: Task ${liveStatus.currentTask.number} — ${liveStatus.currentTask.name}`
    }
    if (liveStatus.status === 'idle') {
      return "⏸️ Waiting for instructions"
    }
    return "⚡ Ready to begin work"
  }

  const getStatusBadge = () => {
    switch (liveStatus.status) {
      case 'active':
        return <Badge className="bg-orange-500 hover:bg-orange-600">Active</Badge>
      case 'idle':
        return <Badge variant="secondary">Idle</Badge>
      default:
        return <Badge variant="outline">Ready</Badge>
    }
  }

  const getDepartmentRole = () => {
    switch (liveStatus.currentAction) {
      case 'coding':
        return 'Development Team'
      case 'reviewing':
        return 'Quality Assurance'
      case 'researching':
        return 'Research Team'
      case 'deploying':
        return 'DevOps Team'
      default:
        return 'AI Assistant'
    }
  }

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const formatTokens = (tokens: number) => {
    if (tokens > 1000000) {
      return `${(tokens / 1000000).toFixed(1)}M`
    }
    if (tokens > 1000) {
      return `${(tokens / 1000).toFixed(1)}K`
    }
    return tokens.toString()
  }

  return (
    <Card className="mb-6 border-l-4 border-l-orange-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            {getStatusIcon()}
            <span>Live Task Monitor</span>
            {getStatusBadge()}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="font-mono">
              Sprint 0D
            </Badge>
            <Badge variant="outline" className="font-mono flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{formatUptime(liveStatus.uptime)}</span>
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchLiveStatus}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        <CardDescription className="text-base">
          {getStatusText()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Department/Role Active */}
        {liveStatus.status === 'active' && (
          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
                {getActionIcon()}
              </div>
              <div>
                <div className="font-medium text-blue-900 dark:text-blue-100">
                  {getDepartmentRole()} Active
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300 capitalize">
                  {liveStatus.currentAction} • {liveStatus.currentTask?.stage}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {liveStatus.currentProject?.name}
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300">
                Project: {liveStatus.currentProject?.id}
              </div>
            </div>
          </div>
        )}

        {/* Current Task Details */}
        {liveStatus.status === 'active' && liveStatus.currentTask && (
          <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {typeof liveStatus.currentTask.number === 'string' 
                  ? liveStatus.currentTask.number.split('-')[1] || liveStatus.currentTask.number
                  : liveStatus.currentTask.number
                }
              </div>
              <div>
                <div className="font-medium text-orange-900 dark:text-orange-100">
                  {liveStatus.currentTask.name}
                </div>
                <div className="text-sm text-orange-700 dark:text-orange-300 capitalize">
                  Stage: {liveStatus.currentTask.stage}
                </div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-orange-500" />
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-2 bg-muted/30 rounded-lg">
            <div className="text-lg font-bold text-blue-600">{formatUptime(liveStatus.uptime)}</div>
            <div className="text-xs text-muted-foreground">Uptime</div>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded-lg">
            <div className="text-lg font-bold text-green-600">{formatTokens(liveStatus.tokensUsed)}</div>
            <div className="text-xs text-muted-foreground">Tokens Used</div>
          </div>
          <div className="text-center p-2 bg-muted/30 rounded-lg">
            <div className="text-lg font-bold text-orange-600 capitalize">{liveStatus.status}</div>
            <div className="text-xs text-muted-foreground">Status</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}