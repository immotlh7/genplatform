"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Play, 
  Pause, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Settings,
  Plus
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
}

export default function CronPage() {
  const [jobs, setJobs] = useState<CronJob[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCronJobs()
  }, [])

  const loadCronJobs = async () => {
    try {
      const response = await fetch('/api/openclaw/cron')
      const data = await response.json()
      setJobs(data.jobs || [])
    } catch (error) {
      console.error('Failed to load cron jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleJob = async (jobId: string) => {
    try {
      await fetch('/api/openclaw/cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', jobId })
      })
      
      setJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, enabled: !job.enabled, status: !job.enabled ? 'idle' : 'disabled' }
          : job
      ))
    } catch (error) {
      console.error('Failed to toggle job:', error)
    }
  }

  const runJob = async (jobId: string) => {
    try {
      await fetch('/api/openclaw/cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run', jobId })
      })
      
      setJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, status: 'running', lastRun: new Date().toISOString() }
          : job
      ))
    } catch (error) {
      console.error('Failed to run job:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Clock className="h-4 w-4 text-blue-600 animate-spin" />
      case 'idle': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />
      case 'disabled': return <AlertTriangle className="h-4 w-4 text-gray-600" />
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

  const formatTimeAgo = (timestamp?: string) => {
    if (!timestamp) return 'Never'
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const enabledJobs = jobs.filter(j => j.enabled).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cron Jobs</h1>
          <p className="text-muted-foreground">
            Schedule and manage automated tasks ({enabledJobs}/{jobs.length} enabled)
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Job
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{jobs.filter(j => j.status === 'running').length}</div>
                <div className="text-sm text-muted-foreground">Running</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{enabledJobs}</div>
                <div className="text-sm text-muted-foreground">Enabled</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <div>
                <div className="text-2xl font-bold">{jobs.filter(j => j.status === 'failed').length}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-gray-600" />
              <div>
                <div className="text-2xl font-bold">{jobs.filter(j => j.status === 'disabled').length}</div>
                <div className="text-sm text-muted-foreground">Disabled</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Jobs</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Next Run</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading cron jobs...
                  </TableCell>
                </TableRow>
              ) : jobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No cron jobs configured
                  </TableCell>
                </TableRow>
              ) : (
                jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {getStatusIcon(job.status)}
                          {job.name}
                        </div>
                        {job.description && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {job.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {job.schedule}
                      </code>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(job.status)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatTimeAgo(job.lastRun)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {job.nextRun ? formatTimeAgo(job.nextRun) : 'Not scheduled'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          checked={job.enabled}
                          onCheckedChange={() => toggleJob(job.id)}
                          size="sm"
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => runJob(job.id)}
                          disabled={!job.enabled}
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}