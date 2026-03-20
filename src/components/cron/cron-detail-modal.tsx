import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, CheckCircle2, Clock, Code2, MoreVertical, Play, RefreshCw, Settings, Timer, XCircle, Pause, Terminal } from 'lucide-react'
import { type CronJob } from '@/lib/cron-data'

interface CronDetailModalProps {
  job: CronJob | null
  open: boolean
  onClose: () => void
  onRunNow?: () => void
  onToggleStatus?: () => void
  onEdit?: () => void
}

interface JobHistory {
  id: string
  startTime: string
  endTime?: string
  status: 'running' | 'success' | 'failed'
  duration?: number
  error?: string
  output?: string
}

interface JobMetrics {
  totalRuns: number
  successfulRuns: number
  failedRuns: number
  averageDuration: number
  lastSuccess?: string
  lastFailure?: string
  successRate: number
}

export function CronDetailModal({
  job,
  open,
  onClose,
  onRunNow,
  onToggleStatus,
  onEdit
}: CronDetailModalProps) {
  const [selectedTab, setSelectedTab] = useState('overview')
  const [jobHistory, setJobHistory] = useState<JobHistory[]>([])
  const [jobMetrics, setJobMetrics] = useState<JobMetrics | null>(null)
  const [loadingHistory, setLoadingHistory] = useState(false)

  useEffect(() => {
    if (job && open) {
      loadJobHistory()
      calculateMetrics()
    }
  }, [job, open])

  const loadJobHistory = async () => {
    if (!job) return
    
    setLoadingHistory(true)
    try {
      const response = await fetch(`/api/bridge/logs?filter=${encodeURIComponent(`cron:${job.id}`)}`)
      const data = await response.json()
      
      // Transform logs to history format
      const history = data.logs?.map((log: any, index: number) => ({
        id: `${job.id}-${index}`,
        startTime: log.timestamp,
        status: log.level === 'error' ? 'failed' : 'success',
        output: log.message
      })) || []
      
      setJobHistory(history)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load job history:', error);
      }
      // Demo data if API fails
      setJobHistory([
        {
          id: '1',
          startTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() - 59 * 60 * 1000).toISOString(),
          status: 'success',
          duration: 60000,
          output: 'Job completed successfully'
        },
        {
          id: '2',
          startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() - 2 * 60 * 60 * 1000 + 30000).toISOString(),
          status: 'success',
          duration: 30000,
          output: 'Job completed successfully'
        }
      ])
    } finally {
      setLoadingHistory(false)
    }
  }

  const calculateMetrics = () => {
    if (!jobHistory.length) {
      setJobMetrics(null)
      return
    }

    const successful = jobHistory.filter(h => h.status === 'success')
    const failed = jobHistory.filter(h => h.status === 'failed')
    const durations = jobHistory
      .filter(h => h.duration)
      .map(h => h.duration!)

    setJobMetrics({
      totalRuns: jobHistory.length,
      successfulRuns: successful.length,
      failedRuns: failed.length,
      averageDuration: durations.length > 0 
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0,
      lastSuccess: successful[0]?.startTime,
      lastFailure: failed[0]?.startTime,
      successRate: (successful.length / jobHistory.length) * 100
    })
  }

  const formatDuration = (ms?: number) => {
    if (!ms) return '-'
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${Math.round(ms / 1000)}s`
    return `${Math.round(ms / 60000)}m`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <Badge className="bg-blue-100 text-blue-800">Running</Badge>
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Success</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (!job) return null

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{job.name}</span>
            <div className="flex items-center space-x-2">
              <Badge variant={job.enabled ? 'default' : 'secondary'}>
                {job.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
              {job.nextRun && (
                <Badge variant="outline">
                  Next: {new Date(job.nextRun).toLocaleString()}
                </Badge>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            {job.description}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Schedule Info */}
            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Schedule Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Schedule:</span>
                  <div className="font-medium">{job.schedule}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Run:</span>
                  <div className="font-medium">
                    {job.lastRun ? new Date(job.lastRun).toLocaleString() : 'Never'}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <div className="font-medium">{new Date(job.createdAt).toLocaleDateString()}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Updated:</span>
                  <div className="font-medium">{new Date(job.updatedAt).toLocaleDateString()}</div>
                </div>
              </div>
            </div>

            {/* Metrics */}
            {jobMetrics && (
              <div className="rounded-lg border p-4 space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Timer className="h-4 w-4" />
                  Performance Metrics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{jobMetrics.totalRuns}</div>
                    <div className="text-muted-foreground">Total Runs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{jobMetrics.successfulRuns}</div>
                    <div className="text-muted-foreground">Successful</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{jobMetrics.failedRuns}</div>
                    <div className="text-muted-foreground">Failed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{formatDuration(jobMetrics.averageDuration)}</div>
                    <div className="text-muted-foreground">Avg Duration</div>
                  </div>
                </div>
                {jobMetrics.successRate !== undefined && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Success Rate</span>
                      <span className="font-medium">{jobMetrics.successRate.toFixed(1)}%</span>
                    </div>
                    <div className="mt-2 w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${jobMetrics.successRate}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Recent Activity */}
            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Recent Activity
              </h3>
              {job.lastRun ? (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Last execution</span>
                    {job.lastStatus === 'success' ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Success
                      </Badge>
                    ) : job.lastStatus === 'failed' ? (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Failed
                      </Badge>
                    ) : (
                      <Badge variant="secondary">{job.lastStatus}</Badge>
                    )}
                  </div>
                  {job.lastError && (
                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded text-xs">
                      {job.lastError}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No executions yet</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="rounded-lg border">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Execution History</h3>
              </div>
              <ScrollArea className="h-80">
                <div className="p-4 space-y-2">
                  {loadingHistory ? (
                    <div className="text-center text-muted-foreground">Loading history...</div>
                  ) : jobHistory.length > 0 ? (
                    jobHistory.map((execution) => (
                      <div key={execution.id} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {execution.status === 'running' ? (
                            <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
                          ) : execution.status === 'success' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <div>
                            <div className="text-sm font-medium">
                              {new Date(execution.startTime).toLocaleString()}
                            </div>
                            {execution.output && (
                              <div className="text-xs text-muted-foreground">{execution.output}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(execution.status)}
                          {execution.duration && (
                            <span className="text-xs text-muted-foreground">
                              {formatDuration(execution.duration)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground">No execution history available</div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="configuration" className="space-y-4">
            <div className="rounded-lg border p-4 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Job Configuration
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Command</label>
                  <div className="mt-1 p-3 bg-muted rounded-lg font-mono text-sm">
                    {job.command}
                  </div>
                </div>

                {job.args && job.args.length > 0 && (
                  <div>
                    <label className="text-sm font-medium">Arguments</label>
                    <div className="mt-1 space-y-1">
                      {job.args.map((arg, index) => (
                        <div key={index} className="p-2 bg-muted rounded text-sm">
                          {arg}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <div className="mt-1">
                      <Badge variant="outline">{job.category}</Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Timeout</label>
                    <div className="mt-1 text-sm">
                      {job.timeout ? `${job.timeout}ms` : 'No timeout'}
                    </div>
                  </div>
                </div>

                {job.env && Object.keys(job.env).length > 0 && (
                  <div>
                    <label className="text-sm font-medium">Environment Variables</label>
                    <div className="mt-1 space-y-1">
                      {Object.entries(job.env).map(([key, value]) => (
                        <div key={key} className="p-2 bg-muted rounded text-sm font-mono">
                          <span className="text-primary">{key}</span>=
                          <span>{value as string}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {onEdit && (
              <Button variant="outline" onClick={onEdit}>
                <Settings className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {onToggleStatus && (
              <Button
                variant="outline"
                onClick={onToggleStatus}
              >
                {job.enabled ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Disable
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Enable
                  </>
                )}
              </Button>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {onRunNow && (
              <Button onClick={onRunNow} disabled={!job.enabled}>
                <Play className="h-4 w-4 mr-2" />
                Run Now
              </Button>
            )}
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}