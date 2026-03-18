'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Zap, Activity, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface WorkflowStatus {
  total_workflows: number
  active_workflows: number
  running_workflows: number
  waiting_approval: number
  completed_today: number
  failed_today: number
}

interface RunningWorkflow {
  id: string
  name: string
  status: string
  current_step: string
  steps_completed: number
  steps_total: number
  started_at: string
}

export default function AutomationsCard() {
  const [status, setStatus] = useState<WorkflowStatus | null>(null)
  const [runningWorkflows, setRunningWorkflows] = useState<RunningWorkflow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWorkflowStatus()
    // Refresh every 30 seconds
    const interval = setInterval(fetchWorkflowStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchWorkflowStatus = async () => {
    try {
      // Fetch workflow summary statistics
      const statusResponse = await fetch('/api/workflows/status')
      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        setStatus(statusData.status)
      }

      // Fetch currently running workflows
      const runningResponse = await fetch('/api/workflows/running')
      if (runningResponse.ok) {
        const runningData = await runningResponse.json()
        setRunningWorkflows(runningData.workflows || [])
      }

      // If API not available, use mock data
      if (!statusResponse.ok) {
        setStatus({
          total_workflows: 5,
          active_workflows: 3,
          running_workflows: 1,
          waiting_approval: 1,
          completed_today: 4,
          failed_today: 0
        })
        
        setRunningWorkflows([
          {
            id: 'run-1',
            name: 'Idea to MVP',
            status: 'running',
            current_step: 'Code Generation',
            steps_completed: 3,
            steps_total: 8,
            started_at: new Date(Date.now() - 25 * 60 * 1000).toISOString() // 25 min ago
          }
        ])
      }

      setLoading(false)
    } catch (error) {
      console.error('Error fetching workflow status:', error)
      // Use fallback mock data
      setStatus({
        total_workflows: 5,
        active_workflows: 3,
        running_workflows: 1,
        waiting_approval: 1,
        completed_today: 4,
        failed_today: 0
      })
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-100 text-blue-800'
      case 'waiting_approval': return 'bg-amber-100 text-amber-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDuration = (startTime: string) => {
    const start = new Date(startTime).getTime()
    const now = Date.now()
    const diffMinutes = Math.floor((now - start) / (1000 * 60))
    
    if (diffMinutes < 60) {
      return `${diffMinutes}m`
    } else {
      const hours = Math.floor(diffMinutes / 60)
      const minutes = diffMinutes % 60
      return `${hours}h ${minutes}m`
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">⚡ Automations</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  if (!status) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">⚡ Automations</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">No Data</div>
          <p className="text-xs text-muted-foreground">Unable to load workflow status</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium">⚡ Automations</CardTitle>
          {status.running_workflows > 0 && (
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          )}
        </div>
        <Zap className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Main status line */}
          <div className="text-2xl font-bold">
            {status.active_workflows} active
          </div>
          
          {/* Status breakdown */}
          <div className="flex items-center gap-4 text-sm">
            {status.running_workflows > 0 && (
              <div className="flex items-center gap-1 text-blue-600">
                <Activity className="h-3 w-3" />
                <span>{status.running_workflows} running</span>
              </div>
            )}
            
            {status.waiting_approval > 0 && (
              <div className="flex items-center gap-1 text-amber-600">
                <Clock className="h-3 w-3" />
                <span>{status.waiting_approval} approval</span>
              </div>
            )}
            
            {status.completed_today > 0 && (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-3 w-3" />
                <span>{status.completed_today} today</span>
              </div>
            )}
            
            {status.failed_today > 0 && (
              <div className="flex items-center gap-1 text-red-600">
                <AlertTriangle className="h-3 w-3" />
                <span>{status.failed_today} failed</span>
              </div>
            )}
          </div>
          
          {/* Currently running workflows */}
          {runningWorkflows.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                Currently Running
              </div>
              {runningWorkflows.slice(0, 2).map((workflow) => (
                <div key={workflow.id} className="flex items-center justify-between p-2 bg-blue-50 rounded border">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {workflow.name}
                    </div>
                    <div className="text-xs text-gray-600 truncate">
                      {workflow.current_step}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-2">
                    <div className="text-xs text-gray-500">
                      {workflow.steps_completed}/{workflow.steps_total}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {formatDuration(workflow.started_at)}
                    </Badge>
                  </div>
                </div>
              ))}
              
              {runningWorkflows.length > 2 && (
                <div className="text-xs text-gray-500 text-center">
                  +{runningWorkflows.length - 2} more workflows running
                </div>
              )}
            </div>
          )}
          
          {/* No active workflows message */}
          {status.active_workflows === 0 && (
            <div className="text-sm text-gray-500">
              No automations currently active
            </div>
          )}
          
          {/* Summary stats */}
          <div className="pt-2 border-t">
            <div className="flex justify-between items-center text-xs text-gray-600">
              <span>Total workflows: {status.total_workflows}</span>
              {status.completed_today > 0 && (
                <span className="text-green-600">
                  {status.completed_today} completed today
                </span>
              )}
            </div>
          </div>
          
          {/* Action button */}
          <Link href="/automations">
            <Button variant="outline" size="sm" className="w-full">
              <Zap className="h-4 w-4 mr-2" />
              View All Automations
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}export { AutomationsCard }
