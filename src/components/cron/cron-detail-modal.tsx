"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Clock, 
  Play, 
  Settings, 
  History,
  AlertCircle,
  CheckCircle,
  XCircle,
  Calendar,
  Terminal,
  FileText
} from 'lucide-react'

interface CronJob {
  id: string
  name: string
  schedule: string
  command: string
  description?: string
  enabled: boolean
  lastRun?: string
  nextRun?: string
  status: 'running' | 'idle' | 'failed' | 'disabled'
  config?: {
    timeout?: number
    retries?: number
    environment?: Record<string, string>
    workingDirectory?: string
    logLevel?: string
    notifications?: boolean
  }
  history?: JobRun[]
}

interface JobRun {
  id: string
  startTime: string
  endTime?: string
  status: 'running' | 'success' | 'failed' | 'timeout'
  exitCode?: number
  output?: string
  error?: string
  duration?: number
}

interface CronDetailModalProps {
  job: CronJob | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onToggle: (jobId: string) => void
  onRun: (jobId: string) => void
}

export function CronDetailModal({ job, open, onOpenChange, onToggle, onRun }: CronDetailModalProps) {
  const [jobHistory, setJobHistory] = useState<JobRun[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  useEffect(() => {
    if (job && open) {
      loadJobHistory()
    }
  }, [job, open])

  const loadJobHistory = async () => {
    if (!job) return
    
    setLoadingHistory(true)
    try {
      const response = await fetch(`/api/openclaw/cron/history/${job.id}`)
      const data = await response.json()
      setJobHistory(data.history || [])
    } catch (error) {
      console.error('Failed to load job history:', error)
      // Demo data if API fails
      setJobHistory([
        {
          id: '1',
          startTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() - 59 * 60 * 1000).toISOString(),
          status: 'success',
          exitCode: 0,
          duration: 60000,
          output: 'Job completed successfully\nProcessed 42 items'
        },
        {
          id: '2',
          startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5000).toISOString(),
          status: 'failed',
          exitCode: 1,
          duration: 5000,
          error: 'Connection timeout to external service'
        }
      ])
    } finally {
      setLoadingHistory(false)
    }
  }

  if (!job) return null

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Clock className="h-4 w-4 text-blue-600 animate-spin" />
      case 'idle': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />
      case 'disabled': return <AlertCircle className="h-4 w-4 text-gray-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      running: 'bg-blue-100 text-blue-800',
      idle: 'bg-green-100 text-green-800', 
      failed: 'bg-red-100 text-red-800',
      disabled: 'bg-gray-100 text-gray-800',
      success: 'bg-green-100 text-green-800',
      timeout: 'bg-yellow-100 text-yellow-800'
    }
    return (
      <Badge variant="secondary" className={colors[status as keyof typeof colors]}>
        {status}
      </Badge>
    )
  }

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A'
    const seconds = Math.floor(ms / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    return `${minutes}m ${seconds % 60}s`
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const parseSchedule = (schedule: string) => {
    // Simple cron parser for common patterns
    const parts = schedule.split(' ')
    if (parts.length !== 5) return 'Custom schedule'
    
    const [min, hour, day, month, weekday] = parts
    
    if (min === '0' && hour === '0' && day === '*' && month === '*' && weekday === '*') {
      return 'Daily at midnight'
    } else if (min === '0' && hour === '0' && day === '*' && month === '*' && weekday === '0') {
      return 'Weekly on Sunday at midnight'
    } else if (min.startsWith('*/') && hour === '*') {
      return `Every ${min.slice(2)} minutes`
    } else if (min === '0' && hour.startsWith('*/')) {
      return `Every ${hour.slice(2)} hours`
    }
    
    return `At ${hour}:${min.padStart(2, '0')} daily`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon(job.status)}
              <DialogTitle className="text-2xl">{job.name}</DialogTitle>
              {getStatusBadge(job.status)}
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                checked={job.enabled}
                onCheckedChange={() => onToggle(job.id)}
              />
              <Button size="sm" onClick={() => onRun(job.id)} disabled={!job.enabled}>
                <Play className="h-4 w-4 mr-1" />
                Run Now
              </Button>
            </div>
          </div>
          {job.description && (
            <p className="text-muted-foreground">{job.description}</p>
          )}
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-4">
            {/* Schedule Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Schedule</span>
                </div>
                <div className="space-y-1">
                  <code className="text-xs bg-muted px-2 py-1 rounded">{job.schedule}</code>
                  <p className="text-sm text-muted-foreground">{parseSchedule(job.schedule)}</p>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Terminal className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Command</span>
                </div>
                <code className="text-xs bg-muted px-2 py-1 rounded break-all">
                  {job.command}
                </code>
              </div>
            </div>

            {/* Execution Times */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-sm font-medium mb-2">Last Execution</div>
                <p className="text-lg font-bold">
                  {job.lastRun ? formatTimeAgo(job.lastRun) : 'Never'}
                </p>
                {job.lastRun && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(job.lastRun).toLocaleString()}
                  </p>
                )}
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="text-sm font-medium mb-2">Next Execution</div>
                <p className="text-lg font-bold">
                  {job.nextRun ? formatTimeAgo(job.nextRun) : 'Not scheduled'}
                </p>
                {job.nextRun && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(job.nextRun).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            {/* Recent Runs Summary */}
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-3">Recent Performance</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {jobHistory.filter(r => r.status === 'success').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Successful</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {jobHistory.filter(r => r.status === 'failed').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {jobHistory.length > 0 ? formatDuration(
                      jobHistory.filter(r => r.duration).reduce((sum, r) => sum + (r.duration || 0), 0) / 
                      jobHistory.filter(r => r.duration).length
                    ) : 'N/A'}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Duration</div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="config" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-sm font-medium mb-2">Basic Settings</div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Job ID</span>
                    <code className="text-xs">{job.id}</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Enabled</span>
                    <Badge variant={job.enabled ? "default" : "secondary"}>
                      {job.enabled ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Timeout</span>
                    <span className="text-xs">{job.config?.timeout || 300}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Max Retries</span>
                    <span className="text-xs">{job.config?.retries || 0}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="text-sm font-medium mb-2">Environment</div>
                <div className="space-y-2">
                  {job.config?.environment ? (
                    Object.entries(job.config.environment).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-xs">
                        <code>{key}</code>
                        <code className="text-muted-foreground">{value}</code>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-muted-foreground">No custom environment variables</div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="text-sm font-medium mb-2">Advanced Settings</div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Working Directory:</span>
                  <div className="font-mono text-xs mt-1">
                    {job.config?.workingDirectory || '/default'}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Log Level:</span>
                  <div className="mt-1">
                    <Badge variant="outline">{job.config?.logLevel || 'info'}</Badge>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Execution History</h4>
              <Button variant="outline" size="sm" onClick={loadJobHistory}>
                Refresh
              </Button>
            </div>
            
            <ScrollArea className="h-96">
              {loadingHistory ? (
                <div className="text-center p-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-4"></div>
                  <div className="text-sm text-muted-foreground">Loading history...</div>
                </div>
              ) : jobHistory.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  <History className="h-8 w-8 mx-auto mb-4" />
                  <div>No execution history available</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {jobHistory.map((run) => (
                    <div key={run.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(run.status)}
                          <span className="text-sm font-medium">
                            {new Date(run.startTime).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Duration: {formatDuration(run.duration)}
                        </div>
                      </div>
                      
                      {run.output && (
                        <div className="mt-2">
                          <div className="text-xs text-muted-foreground mb-1">Output:</div>
                          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                            {run.output}
                          </pre>
                        </div>
                      )}
                      
                      {run.error && (
                        <div className="mt-2">
                          <div className="text-xs text-red-600 mb-1">Error:</div>
                          <pre className="text-xs bg-red-50 text-red-800 p-2 rounded overflow-x-auto">
                            {run.error}
                          </pre>
                        </div>
                      )}
                      
                      {run.exitCode !== undefined && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Exit code: {run.exitCode}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4 mt-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <FileText className="h-4 w-4" />
                <span className="font-medium">Live Logs</span>
              </div>
              <div className="bg-black text-green-400 p-4 rounded font-mono text-xs h-64 overflow-y-auto">
                <div>[{new Date().toISOString()}] Job '{job.name}' status: {job.status}</div>
                <div>[{new Date().toISOString()}] Schedule: {job.schedule}</div>
                <div>[{new Date().toISOString()}] Next run: {job.nextRun || 'Not scheduled'}</div>
                <div>[{new Date().toISOString()}] Log streaming would appear here...</div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}