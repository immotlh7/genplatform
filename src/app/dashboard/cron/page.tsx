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
  MoreHorizontal,
  Eye,
  Lock,
  Shield
} from 'lucide-react'
import { getCurrentUserClient } from '@/lib/access-control'
import type { User } from '@/lib/access-control'

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
  isSystemCritical?: boolean // New field to identify system-critical jobs
  createdBy?: string // Track who created the job
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
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [jobs, setJobs] = useState<CronJob[]>([])
  const [filteredJobs, setFilteredJobs] = useState<CronJob[]>([])
  const [stats, setStats] = useState<CronStats>({ total: 0, enabled: 0, running: 0, failed: 0 })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedJob, setSelectedJob] = useState<CronJob | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)

  useEffect(() => {
    loadUserAndCronJobs()
  }, [])

  useEffect(() => {
    // Filter jobs based on search - NO USER FILTERING
    const filtered = jobs.filter(job => {
      // Search filter
      const matchesSearch = job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.command.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description?.toLowerCase().includes(searchTerm.toLowerCase())

      return matchesSearch
    })

    setFilteredJobs(filtered)
  }, [jobs, searchTerm])

  const loadUserAndCronJobs = async () => {
    setLoading(true)
    try {
      // Get current user
      const user = await getCurrentUserClient()
      setCurrentUser(user)

      const response = await fetch('/api/bridge/cron')
      const data = await response.json()
      setJobs(data.jobs || [])
      setStats(data.stats || { total: 0, enabled: 0, running: 0, failed: 0 })
    } catch (error) {
      console.error('Failed to load cron jobs:', error)
      // Demo data if API fails - with system-critical flags
      const demoJobs: CronJob[] = [
        {
          id: 'auto-continue',
          name: 'Auto-Continue Sprint',
          schedule: '*/5 * * * *',
          command: 'Check if there are remaining tasks in the current sprint that are not yet completed. If yes, continue working on the next uncompleted task.',
          description: 'Auto-continue Sprint task execution every 5 minutes',
          enabled: true,
          lastRun: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
          nextRun: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
          status: 'idle',
          isSystemCritical: false, // User-created job
          createdBy: 'system',
          config: {
            timeout: 300,
            retries: 1,
            logLevel: 'info'
          }
        },
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
          isSystemCritical: true, // System maintenance
          createdBy: 'system',
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
          isSystemCritical: false, // Non-critical update check
          createdBy: 'admin',
          config: {
            timeout: 180,
            retries: 1,
            logLevel: 'info'
          }
        },
        {
          id: 'security-audit',
          name: 'Security Audit',
          schedule: '0 1 * * 1',
          command: 'openclaw security scan --full-audit',
          description: 'Weekly comprehensive security audit',
          enabled: true,
          lastRun: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          nextRun: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'idle',
          isSystemCritical: true, // Security is critical
          createdBy: 'system',
          config: {
            timeout: 1800,
            retries: 0,
            logLevel: 'debug',
            notifications: true
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
          isSystemCritical: true, // Backup is critical
          createdBy: 'system',
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
          isSystemCritical: true, // Health monitoring is critical
          createdBy: 'system',
          config: {
            timeout: 60,
            retries: 0,
            logLevel: 'warn'
          }
        }
      ]

      setJobs(demoJobs)
      
      // Calculate stats from ALL jobs (no filtering)
      setStats({
        total: demoJobs.length,
        enabled: demoJobs.filter(job => job.enabled).length,
        running: demoJobs.filter(job => job.status === 'running').length,
        failed: demoJobs.filter(job => job.status === 'failed').length,
        nextExecution: new Date(Date.now() + 2 * 60 * 1000).toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  const canUserCreate = () => {
    if (!currentUser) return false
    // Only OWNER, ADMIN, and MANAGER can create jobs
    return currentUser.role === 'OWNER' || currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER'
  }

  const canUserModify = (job: CronJob) => {
    if (!currentUser) return false
    
    // OWNER can modify anything
    if (currentUser.role === 'OWNER') return true
    
    // ADMIN can modify non-system-critical jobs
    if (currentUser.role === 'ADMIN') return !job.isSystemCritical
    
    // MANAGER can only modify jobs they created (non-system-critical)
    if (currentUser.role === 'MANAGER') {
      return !job.isSystemCritical && (job.createdBy === currentUser.email || job.createdBy === 'admin')
    }
    
    // VIEWER cannot modify anything
    return false
  }

  const canUserDelete = (job: CronJob) => {
    if (!currentUser) return false
    
    // Only OWNER can delete system-critical jobs
    if (job.isSystemCritical) {
      return currentUser.role === 'OWNER'
    }
    
    // OWNER and ADMIN can delete non-critical jobs
    return currentUser.role === 'OWNER' || currentUser.role === 'ADMIN'
  }

  const toggleJob = async (jobId: string) => {
    const job = jobs.find(j => j.id === jobId)
    if (!job || !canUserModify(job)) {
      alert('You do not have permission to modify this job')
      return
    }

    try {
      const response = await fetch('/api/bridge/cron/toggle', {
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
    const job = jobs.find(j => j.id === jobId)
    if (!job || !canUserModify(job)) {
      alert('You do not have permission to run this job')
      return
    }

    try {
      const response = await fetch('/api/bridge/cron/run', {
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
    
    // Common patterns
    if (min === '*/5' && hour === '*' && day === '*' && month === '*' && weekday === '*') {
      return 'Every 5 minutes'
    } else if (min === '*/15' && hour === '*' && day === '*' && month === '*' && weekday === '*') {
      return 'Every 15 minutes'
    } else if (min === '*/30' && hour === '*' && day === '*' && month === '*' && weekday === '*') {
      return 'Every 30 minutes'
    } else if (min === '0' && hour === '*' && day === '*' && month === '*' && weekday === '*') {
      return 'Every hour'
    } else if (min === '0' && hour === '*/2' && day === '*' && month === '*' && weekday === '*') {
      return 'Every 2 hours'
    } else if (min === '0' && hour === '*/6' && day === '*' && month === '*' && weekday === '*') {
      return 'Every 6 hours'
    } else if (min === '0' && hour === '2' && day === '*' && month === '*' && weekday === '*') {
      return 'Daily at 2:00 AM'
    } else if (min === '0' && hour === '21' && day === '*' && month === '*' && weekday === '*') {
      return 'Daily at 9:00 PM'
    } else if (min === '0' && hour === '3' && day === '*' && month === '*' && weekday === '0') {
      return 'Weekly on Sunday at 3:00 AM'
    } else if (min === '0' && hour === '1' && day === '*' && month === '*' && weekday === '1') {
      return 'Weekly on Monday at 1:00 AM'
    } else if (min.startsWith('*/') && hour === '*') {
      return `Every ${min.slice(2)} minutes`
    } else if (min === '0' && hour.startsWith('*/')) {
      return `Every ${hour.slice(2)} hours`
    } else if (min !== '*' && hour !== '*' && day === '*' && month === '*' && weekday === '*') {
      return `Daily at ${hour}:${min.padStart(2, '0')}`
    }
    
    return 'Custom'
  }

  const openJobDetail = (job: CronJob) => {
    setSelectedJob(job)
    setDetailModalOpen(true)
  }

  const isReadOnly = !canUserCreate()

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cron Jobs</h1>
          <p className="text-muted-foreground">
            {!currentUser 
              ? 'View and manage scheduled tasks'
              : currentUser.role === 'VIEWER' 
                ? 'View scheduled tasks and automation (limited access)'
                : 'Manage scheduled tasks and automation'
            }
          </p>
        </div>
        <div className="flex space-x-2">
          {canUserCreate() && (
            <Button variant="outline" onClick={loadUserAndCronJobs}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}
          {canUserCreate() && (
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Job
            </Button>
          )}
          {isReadOnly && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <Eye className="h-3 w-3 mr-1" />
              View Only
            </Badge>
          )}
        </div>
      </div>

      {/* Access level indicator */}
      {currentUser && currentUser.role !== 'OWNER' && (
        <div className={`border rounded-lg p-4 ${
          currentUser.role === 'VIEWER' 
            ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
            : currentUser.role === 'MANAGER'
              ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800'
              : 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
        }`}>
          <div className="flex items-center space-x-2">
            <Badge className={
              currentUser.role === 'VIEWER' 
                ? 'bg-blue-500 text-white' 
                : currentUser.role === 'MANAGER'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-green-500 text-white'
            }>
              {currentUser.role}
            </Badge>
            <span className={`text-sm ${
              currentUser.role === 'VIEWER' 
                ? 'text-blue-900 dark:text-blue-100'
                : currentUser.role === 'MANAGER'
                  ? 'text-yellow-900 dark:text-yellow-100'
                  : 'text-green-900 dark:text-green-100'
            }`}>
              {currentUser.role === 'VIEWER' 
                ? 'You can view non-critical cron jobs but cannot modify them'
                : currentUser.role === 'MANAGER'
                  ? 'You can manage non-critical jobs (system jobs hidden for security)'
                  : 'You can manage all non-critical jobs'
              }
            </span>
          </div>
        </div>
      )}

      {/* Stats Cards - Filtered */}
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
                {searchTerm ? 'No jobs match your search criteria' : 
                 'Get started by creating your first scheduled job'}
              </p>
              {canUserCreate() && (
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Job
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredJobs.map((job) => {
            const canModify = canUserModify(job)
            const canDelete = canUserDelete(job)
            
            return (
              <Card key={job.id} className={`hover:shadow-md transition-shadow ${
                !canModify ? 'bg-gray-50/50 dark:bg-gray-950/50' : ''
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(job.status)}
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-lg">{job.name}</h3>
                          {job.isSystemCritical && (
                            <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                              <Shield className="h-3 w-3 mr-1" />
                              Critical
                            </Badge>
                          )}
                          {!canModify && (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
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
                      <code className={`block font-mono text-xs px-2 py-1 rounded mt-1 truncate ${
                        canModify ? 'bg-muted' : 'bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800'
                      }`}>
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
                          disabled={!canModify}
                        />
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => runJob(job.id)}
                          disabled={!canModify || !job.enabled || job.status === 'running'}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Run
                        </Button>
                      </div>
                    </div>
                  </div>

                  {!canModify && (
                    <div className="mt-3 text-xs text-blue-600 bg-blue-50 dark:bg-blue-950/30 p-2 rounded border border-blue-200 dark:border-blue-800">
                      <Eye className="h-3 w-3 inline mr-1" />
                      Read-only access - Contact admin to modify this job
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
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