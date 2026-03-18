"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  FileText, 
  Calendar, 
  Clock, 
  Download, 
  Plus,
  RefreshCw,
  Settings,
  Trash2,
  Play,
  Pause,
  Eye,
  Edit,
  BarChart3,
  TrendingUp,
  Activity
} from 'lucide-react'

interface Report {
  id: string
  title: string
  description: string
  type: 'performance' | 'usage' | 'security' | 'custom'
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'
    time: string
    dayOfWeek?: number
    dayOfMonth?: number
    enabled: boolean
  }
  recipients: string[]
  lastGenerated?: string
  nextScheduled?: string
  status: 'active' | 'paused' | 'error'
  config: {
    period: string
    metrics: string[]
    format: 'pdf' | 'json' | 'csv' | 'xlsx'
    includeCharts: boolean
    includeInsights: boolean
  }
}

interface ScheduledReport {
  id: string
  reportId: string
  title: string
  generatedAt: string
  status: 'completed' | 'failed' | 'generating'
  size?: string
  downloadUrl?: string
  errorMessage?: string
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [history, setHistory] = useState<ScheduledReport[]>([])
  const [loading, setLoading] = useState(true)
  const [newReportOpen, setNewReportOpen] = useState(false)

  useEffect(() => {
    loadReports()
    loadReportHistory()
  }, [])

  const loadReports = async () => {
    setLoading(true)
    try {
      // In production, fetch from API
      // For demo, use mock data
      setReports([
        {
          id: 'report-1',
          title: 'Weekly Performance Summary',
          description: 'Comprehensive performance metrics and trends analysis',
          type: 'performance',
          schedule: {
            frequency: 'weekly',
            time: '09:00',
            dayOfWeek: 1, // Monday
            enabled: true
          },
          recipients: ['admin@genplatform.ai', 'team@genplatform.ai'],
          lastGenerated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          nextScheduled: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          config: {
            period: '7d',
            metrics: ['sessions', 'skills', 'performance'],
            format: 'pdf',
            includeCharts: true,
            includeInsights: true
          }
        },
        {
          id: 'report-2',
          title: 'Daily Usage Analytics',
          description: 'Daily breakdown of system usage and skill execution',
          type: 'usage',
          schedule: {
            frequency: 'daily',
            time: '08:00',
            enabled: true
          },
          recipients: ['analytics@genplatform.ai'],
          lastGenerated: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          nextScheduled: new Date(Date.now() + 19 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          config: {
            period: '24h',
            metrics: ['sessions', 'skills'],
            format: 'json',
            includeCharts: false,
            includeInsights: true
          }
        },
        {
          id: 'report-3',
          title: 'Monthly System Health',
          description: 'Comprehensive monthly health and security review',
          type: 'security',
          schedule: {
            frequency: 'monthly',
            time: '10:00',
            dayOfMonth: 1,
            enabled: false
          },
          recipients: ['security@genplatform.ai', 'ops@genplatform.ai'],
          lastGenerated: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
          nextScheduled: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'paused',
          config: {
            period: '30d',
            metrics: ['performance', 'security', 'system'],
            format: 'pdf',
            includeCharts: true,
            includeInsights: true
          }
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const loadReportHistory = async () => {
    try {
      setHistory([
        {
          id: 'hist-1',
          reportId: 'report-1',
          title: 'Weekly Performance Summary - Week 11',
          generatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'completed',
          size: '2.4 MB',
          downloadUrl: '/downloads/performance-week11.pdf'
        },
        {
          id: 'hist-2',
          reportId: 'report-2',
          title: 'Daily Usage Analytics - March 17',
          generatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          status: 'completed',
          size: '156 KB',
          downloadUrl: '/downloads/usage-mar17.json'
        },
        {
          id: 'hist-3',
          reportId: 'report-2',
          title: 'Daily Usage Analytics - March 16',
          generatedAt: new Date(Date.now() - 29 * 60 * 60 * 1000).toISOString(),
          status: 'completed',
          size: '142 KB'
        },
        {
          id: 'hist-4',
          reportId: 'report-1',
          title: 'Weekly Performance Summary - Week 10',
          generatedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'failed',
          errorMessage: 'Data source temporarily unavailable'
        }
      ])
    } catch (error) {
      console.error('Failed to load report history:', error)
    }
  }

  const generateReport = async (reportId: string) => {
    try {
      const response = await fetch('/api/openclaw/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'generate_report',
          reportConfig: { reportId }
        })
      })

      if (response.ok) {
        console.log('Report generation initiated')
        await loadReportHistory()
      }
    } catch (error) {
      console.error('Failed to generate report:', error)
    }
  }

  const toggleReportSchedule = async (reportId: string) => {
    setReports(prev => prev.map(report => 
      report.id === reportId 
        ? { 
            ...report, 
            schedule: { ...report.schedule, enabled: !report.schedule.enabled },
            status: !report.schedule.enabled ? 'active' : 'paused' as const
          }
        : report
    ))
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800'
    }
    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {status}
      </Badge>
    )
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'performance': return <BarChart3 className="h-4 w-4" />
      case 'usage': return <Activity className="h-4 w-4" />
      case 'security': return <Settings className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const formatSchedule = (schedule: Report['schedule']) => {
    const { frequency, time, dayOfWeek, dayOfMonth } = schedule
    
    switch (frequency) {
      case 'daily':
        return `Daily at ${time}`
      case 'weekly':
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        return `Weekly on ${days[dayOfWeek || 0]} at ${time}`
      case 'monthly':
        return `Monthly on the ${dayOfMonth}${getOrdinalSuffix(dayOfMonth || 1)} at ${time}`
      case 'quarterly':
        return `Quarterly at ${time}`
      default:
        return 'Custom schedule'
    }
  }

  const getOrdinalSuffix = (num: number) => {
    const j = num % 10
    const k = num % 100
    if (j === 1 && k !== 11) return 'st'
    if (j === 2 && k !== 12) return 'nd'
    if (j === 3 && k !== 13) return 'rd'
    return 'th'
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const formatNextRun = (timestamp?: string) => {
    if (!timestamp) return 'Not scheduled'
    
    const now = new Date()
    const next = new Date(timestamp)
    const diffInMinutes = Math.floor((next.getTime() - now.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) return `in ${diffInMinutes}m`
    if (diffInMinutes < 1440) return `in ${Math.floor(diffInMinutes / 60)}h`
    return `in ${Math.floor(diffInMinutes / 1440)}d`
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Automated report generation and scheduling
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => loadReports()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={newReportOpen} onOpenChange={setNewReportOpen}>
            <Button onClick={() => setNewReportOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Report
            </Button>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Report</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Report Title</Label>
                  <Input id="title" placeholder="e.g., Weekly Performance Summary" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Brief description of the report" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Report Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="usage">Usage Analytics</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setNewReportOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setNewReportOpen(false)}>
                    Create Report
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Scheduled Reports */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Scheduled Reports</h2>
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
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {reports.map((report) => (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getTypeIcon(report.type)}
                      <div>
                        <h3 className="font-semibold text-lg">{report.title}</h3>
                        <p className="text-sm text-muted-foreground">{report.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(report.status)}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => generateReport(report.id)}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Run Now
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Schedule:</span>
                      <div className="font-medium">{formatSchedule(report.schedule)}</div>
                    </div>
                    
                    <div>
                      <span className="text-muted-foreground">Last Generated:</span>
                      <div className="font-medium">
                        {report.lastGenerated ? formatTimeAgo(report.lastGenerated) : 'Never'}
                      </div>
                    </div>

                    <div>
                      <span className="text-muted-foreground">Next Run:</span>
                      <div className="font-medium">{formatNextRun(report.nextScheduled)}</div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-muted-foreground">Recipients:</span>
                        <div className="font-medium">{report.recipients.length} emails</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          checked={report.schedule.enabled}
                          onCheckedChange={() => toggleReportSchedule(report.id)}
                        />
                        <Button size="sm" variant="ghost">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Report Config */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span>Period: {report.config.period}</span>
                      <span>Format: {report.config.format.toUpperCase()}</span>
                      <span>Metrics: {report.config.metrics.join(', ')}</span>
                      {report.config.includeCharts && <Badge variant="outline">Charts</Badge>}
                      {report.config.includeInsights && <Badge variant="outline">Insights</Badge>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Report History */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Recent Reports</h2>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {history.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{item.title}</div>
                      <div className="text-sm text-muted-foreground">
                        Generated {formatTimeAgo(item.generatedAt)}
                        {item.size && ` • ${item.size}`}
                      </div>
                      {item.errorMessage && (
                        <div className="text-sm text-red-600">{item.errorMessage}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={item.status === 'completed' ? 'default' : 
                              item.status === 'failed' ? 'destructive' : 'secondary'}
                    >
                      {item.status}
                    </Badge>
                    {item.downloadUrl && (
                      <Button size="sm" variant="outline">
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    )}
                    <Button size="sm" variant="ghost">
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}