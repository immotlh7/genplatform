"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { CronDetailModal } from '@/components/cron/cron-detail-modal'
import { 
  Clock, 
  Play, 
  Pause, 
  Settings, 
  Plus,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Calendar,
  MoreHorizontal
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
}

interface CronStats {
  total: number
  enabled: number
  running: number
  failed: number
  nextExecution?: string
}

export default function CronPage() {
  const [jobs, setJobs] = useState<CronJob[]>([])
  const [stats, setStats] = useState<CronStats>({ total: 0, enabled: 0, running: 0, failed: 0 })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedJob, setSelectedJob] = useState<CronJob | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)

  useEffect(() => {
    loadCronJobs()
  }, [])

  const loadCronJobs = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/openclaw/cron')
      const data = await response.json()
      setJobs(data.jobs || [])
      setStats(data.stats || { total: 0, enabled: 0, running: 0, failed: 0 })
    } catch (error) {
      console.error('Failed to load cron jobs:', error)
      // Demo data if API fails
      setJobs([
        {
          id: 'memory-cleanup',
          name: 'Memory Cleanup',
          schedule: '0 2 * * *',
          command: 'openclaw memory clean --older-than=30d',
          description: 'Clean up old memory files older than 30 days',
          enabled: true,
          lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          nextRun: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
          status: 'idle',
          config: {
            timeout: 300,
            retries: 2,
            logLevel: 'info',
            notifications: true
          }
        },
        {
          id: 'skill-update',
          name: 'Skill Update Check',
          schedule: '0 */6 * * *',
          command: 'openclaw skills update --check-all',
          description: 'Check for updates to installed skills every 6 hours',
          enabled: true,
          lastRun: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          nextRun: new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString(),
          status: 'idle',
          config: {
            timeout: 180,
            retries: 1,
            logLevel: 'info'
          }
        },
        {
          id: 'backup-config',
          name: 'Configuration Backup',
          schedule: '0 3 * * 0',
          command: 'openclaw backup create --type=config',
          description: 'Weekly backup of OpenClaw configuration',
          enabled: true,
          lastRun: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          nextRun: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'idle',
          config: {
            timeout: 600,
            retries: 3,
            logLevel: 'debug',
            notifications: true
          }
        },
        {
          id: 'health-check',
          name: 'System Health Check',
          schedule: '*/15 * * * *',
          command: 'openclaw status --health-check',
          description: 'Monitor system health every 15 minutes',
          enabled: true,
          lastRun: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          nextRun: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          status: 'running',
          config: {
            timeout: 60,
            retries: 0,
            logLevel: 'warn'
          }
        },
        {
          id: 'log-rotation',
          name: 'Log Rotation',
          schedule: '0 1 * * *',
          command: 'openclaw logs rotate --keep=7',
          description: 'Rotate logs daily, keep last 7 days',
          enabled: false,
          lastRun: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
          status: 'disabled',
          config: {
            timeout: 120,
            retries: 1,
            logLevel: 'info'
          }
        }
      ])
      setStats({
        total: 5,
        enabled: 4,
        running: 1,
        failed: 0,
        nextExecution: new Date(Date.now() + 10 * 60 * 1000).toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleJob = async (jobId: string) => {
    try {
      const response = await fetch('/api/openclaw/cron/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId })
      })

      if (response.ok) {
        setJobs(prev => prev.map(job => 
          job.id === jobId 
            ? { ...job, enabled: !job.enabled, status: !job.enabled ? 'idle' : 'disabled' }
            : job
        ))
        
        // Update stats
        setStats(prev => {
          const job = jobs.find(j => j.id === jobId)
          if (job) {
            return {
              ...prev,
              enabled: job.enabled ? prev.enabled - 1 : prev.enabled + 1
            }
          }
          return prev
        })
      }
    } catch (error) {
      console.error('Failed to toggle job:', error)
    }
  }

  const runJob = async (jobId: string) => {
    try {
      const response = await fetch('/api/openclaw/cron/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId })
      })

      if (response.ok) {
        setJobs(prev => prev.map(job => 
          job.id === jobId 
            ? { ...job, status: 'running', lastRun: new Date().toISOString() }
            : job
        ))

        // Simulate job completion after a few seconds
        setTimeout(() => {
          setJobs(prev => prev.map(job => 
            job.id === jobId 
              ? { ...job, status: 'idle' }
              : job
          ))
        }, 3000)
      }
    } catch (error) {
      console.error('Failed to run job:', error)
    }
  }

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
      disabled: 'bg-gray-100 text-gray-800'
    }
    return (
      <Badge variant="secondary" className={colors[status as keyof typeof colors]}>
        {status}
      </Badge>
    )
  }

  const formatNextRun = (timestamp?: string) => {
    if (!timestamp) return 'Not scheduled'
    const now = new Date()
    const next = new Date(timestamp)
    const diffInMinutes = Math.floor((next.getTime() - now.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) return `${diffInMinutes}m`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`
    return `${Math.floor(diffInMinutes / 1440)}d`
  }

  const parseSchedule = (schedule: string) => {
    const parts = schedule.split(' ')
    if (parts.length !== 5) return 'Custom'
    
    const [min, hour, day, month, weekday] = parts
    
    if (min === '0' && hour === '2' && day === '*' && month === '*' && weekday === '*') {
      return 'Daily at 2 AM'
    } else if (min === '0' && hour.startsWith('*/')) {
      return `Every ${hour.slice(2)}h`
    } else if (min.startsWith('*/') && hour === '*') {
      return `Every ${min.slice(2)}m`
    }
    
    return 'Custom'
  }

  const filteredJobs = jobs.filter(job =>
    job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.command.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const openJobDetail = (job: CronJob) => {
    setSelectedJob(job)
    setDetailModalOpen(true)
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cron Jobs</h1>
          <p className="text-muted-foreground">
            Manage scheduled tasks and automation
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadCronJobs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Job
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.enabled} enabled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.running}</div>
            <p className="text-xs text-muted-foreground">
              Currently executing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Today</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <p className="text-xs text-muted-foreground">
              Needs attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Job</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNextRun(stats.nextExecution)}</div>
            <p className="text-xs text-muted-foreground">
              Until next execution
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search cron jobs..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {loading ? (
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-6 bg-muted rounded mb-4 w-1/3"></div>
                    <div className="h-4 bg-muted rounded mb-2 w-2/3"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No cron jobs found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'No jobs match your search criteria' : 'Get started by creating your first scheduled job'}
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Job
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredJobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(job.status)}
                    <div>
                      <h3 className="font-semibold text-lg">{job.name}</h3>
                      <p className="text-sm text-muted-foreground">{job.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(job.status)}
                    <Button variant="ghost" size="sm" onClick={() => openJobDetail(job)}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Schedule:</span>
                    <div className="font-medium">{parseSchedule(job.schedule)}</div>
                    <code className="text-xs text-muted-foreground">{job.schedule}</code>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground">Command:</span>
                    <code className="block font-mono text-xs bg-muted px-2 py-1 rounded mt-1 truncate">
                      {job.command}
                    </code>
                  </div>

                  <div>
                    <span className="text-muted-foreground">Last Run:</span>
                    <div className="font-medium">
                      {job.lastRun ? new Date(job.lastRun).toLocaleDateString() : 'Never'}
                    </div>
                    {job.lastRun && (
                      <div className="text-xs text-muted-foreground">
                        {new Date(job.lastRun).toLocaleTimeString()}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-muted-foreground">Next Run:</span>
                      <div className="font-medium">{formatNextRun(job.nextRun)}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={job.enabled}
                        onCheckedChange={() => toggleJob(job.id)}
                      />
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => runJob(job.id)}
                        disabled={!job.enabled || job.status === 'running'}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Run
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Detail Modal */}
      <CronDetailModal
        job={selectedJob}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onToggle={toggleJob}
        onRun={runJob}
      />
    </div>
  )
}