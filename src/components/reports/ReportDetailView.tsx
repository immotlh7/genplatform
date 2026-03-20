"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { ReportData } from './ReportCard'
import { 
  FileText,
  Download,
  Star,
  Share2,
  Calendar,
  Clock,
  Users,
  Target,
  CheckCircle,
  Activity,
  BarChart3,
  PieChart,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Copy,
  Archive,
  Eye,
  Timer,
  Database,
  Zap,
  MoreHorizontal,
  X,
  ArrowLeft,
  Settings
} from 'lucide-react'

interface ReportDetailViewProps {
  report: ReportData | null
  isOpen: boolean
  onClose: () => void
  onDownload?: (report: ReportData) => void
  onStar?: (report: ReportData) => void
  onShare?: (report: ReportData) => void
  onArchive?: (report: ReportData) => void
}

interface MetricCard {
  label: string
  value: string | number
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  icon: React.ReactNode
  color: string
}

export function ReportDetailView({
  report,
  isOpen,
  onClose,
  onDownload,
  onStar,
  onShare,
  onArchive
}: ReportDetailViewProps) {
  const [loading, setLoading] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  if (!report) return null

  const handleAction = async (action: string, callback?: (report: ReportData) => void) => {
    if (!callback) return
    
    setLoading(action)
    try {
      await callback(report)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`Error performing ${action}:`, error);
      }
    } finally {
      setLoading('')
    }
  }

  const getStatusConfig = (status: ReportData['status']) => {
    switch (status) {
      case 'completed':
        return {
          icon: <CheckCircle className="h-5 w-5" />,
          badge: { label: 'Completed', className: 'bg-green-50 text-green-700 border-green-200' },
          color: 'text-green-600'
        }
      case 'generating':
        return {
          icon: <RefreshCw className="h-5 w-5 animate-spin" />,
          badge: { label: 'Generating', className: 'bg-blue-50 text-blue-700 border-blue-200' },
          color: 'text-blue-600'
        }
      case 'failed':
        return {
          icon: <AlertTriangle className="h-5 w-5" />,
          badge: { label: 'Failed', className: 'bg-red-50 text-red-700 border-red-200' },
          color: 'text-red-600'
        }
      case 'scheduled':
        return {
          icon: <Clock className="h-5 w-5" />,
          badge: { label: 'Scheduled', className: 'bg-orange-50 text-orange-700 border-orange-200' },
          color: 'text-orange-600'
        }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatGenerationTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
  }

  const statusConfig = getStatusConfig(report.status)

  const metricCards: MetricCard[] = [
    {
      label: 'Total Projects',
      value: report.metrics.totalProjects,
      change: 12,
      trend: 'up',
      icon: <Target className="h-5 w-5" />,
      color: 'text-blue-600'
    },
    {
      label: 'Completed Tasks',
      value: report.metrics.completedTasks,
      change: 8,
      trend: 'up',
      icon: <CheckCircle className="h-5 w-5" />,
      color: 'text-green-600'
    },
    {
      label: 'Active Users',
      value: report.metrics.activeUsers,
      change: 5,
      trend: 'neutral',
      icon: <Users className="h-5 w-5" />,
      color: 'text-purple-600'
    },
    {
      label: 'System Health',
      value: `${report.metrics.systemHealth}%`,
      change: 2,
      trend: 'up',
      icon: <Activity className="h-5 w-5" />,
      color: report.metrics.systemHealth >= 95 ? 'text-green-600' : report.metrics.systemHealth >= 80 ? 'text-yellow-600' : 'text-red-600'
    }
  ]

  const copyReportId = () => {
    navigator.clipboard.writeText(report.id)
  }

  const getProgressForGenerating = () => {
    if (report.status !== 'generating') return 0
    const elapsed = Date.now() - new Date(report.createdAt).getTime()
    return Math.min(Math.floor((elapsed / 1000) / 3), 95)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <DialogTitle className="flex items-center space-x-3 text-xl">
                <FileText className="h-6 w-6 text-blue-600" />
                <span className="truncate">{report.title}</span>
                {report.isStarred && (
                  <Star className="h-5 w-5 text-yellow-500 fill-current" />
                )}
              </DialogTitle>
              <DialogDescription className="mt-2 text-base">
                {report.description}
              </DialogDescription>
            </div>
            <div className="flex items-center space-x-2 ml-4">
              {report.status === 'completed' && report.downloadUrl && (
                <Button
                  onClick={() => handleAction('download', onDownload)}
                  disabled={loading === 'download'}
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleAction('star', onStar)}>
                    <Star className="h-4 w-4 mr-2" />
                    {report.isStarred ? 'Unstar' : 'Star'} Report
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAction('share', onShare)}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Report
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={copyReportId}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Report ID
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleAction('archive', onArchive)}>
                    <Archive className="h-4 w-4 mr-2" />
                    Archive Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Status and Meta Info */}
          <div className="flex flex-wrap items-center gap-4">
            <Badge variant="outline" className={statusConfig.badge.className}>
              <span className={`mr-2 ${statusConfig.color}`}>
                {statusConfig.icon}
              </span>
              {statusConfig.badge.label}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {report.type} Report
            </Badge>
            {report.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {report.confidence && (
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                <span>{report.confidence}% confidence</span>
              </div>
            )}
          </div>

          {/* Generation Progress */}
          {report.status === 'generating' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-600">Generating Report...</span>
                <span className="text-xs text-muted-foreground">
                  {getProgressForGenerating()}%
                </span>
              </div>
              <Progress value={getProgressForGenerating()} className="h-2" />
            </div>
          )}
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Key Metrics */}
            {report.status === 'completed' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {metricCards.map((metric, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className={metric.color}>
                          {metric.icon}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">{metric.label}</p>
                          <p className="text-2xl font-bold">{metric.value}</p>
                          {metric.change && (
                            <div className="flex items-center space-x-1">
                              <TrendingUp className={`h-3 w-3 ${
                                metric.trend === 'up' ? 'text-green-500' : 
                                metric.trend === 'down' ? 'text-red-500' : 'text-gray-500'
                              }`} />
                              <span className="text-xs text-muted-foreground">
                                {metric.change > 0 ? '+' : ''}{metric.change}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Report Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Report Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose prose-sm max-w-none">
                  <p>
                    This {report.type} report covers the period from{' '}
                    <strong>{formatDate(report.dataRange.start)}</strong> to{' '}
                    <strong>{formatDate(report.dataRange.end)}</strong>.
                  </p>
                  
                  {report.status === 'completed' ? (
                    <>
                      <p>
                        During this period, we tracked {report.metrics.totalProjects} projects,
                        completed {report.metrics.completedTasks} tasks, and maintained a
                        system health score of {report.metrics.systemHealth}%.
                      </p>
                      <p>
                        Key highlights include improved task completion rates and consistent
                        system performance across all monitored metrics.
                      </p>
                    </>
                  ) : report.status === 'generating' ? (
                    <p>
                      The report is currently being generated. This includes data collection,
                      analysis, and formatting. The process typically takes 2-5 minutes depending
                      on the report scope and system load.
                    </p>
                  ) : report.status === 'failed' ? (
                    <p className="text-red-600">
                      Report generation failed due to data collection issues.
                      Please try regenerating or contact support if the problem persists.
                    </p>
                  ) : (
                    <p>
                      This report is scheduled for generation. It will automatically
                      start processing at the designated time.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Projects Chart Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle>Project Status Distribution</CardTitle>
                  <CardDescription>Breakdown of projects by current status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-center justify-center bg-muted rounded-lg">
                    <div className="text-center text-muted-foreground">
                      <PieChart className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Chart visualization would appear here</p>
                      <p className="text-xs">Active: 4, Completed: 1, Paused: 1</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tasks Chart Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle>Task Completion Trend</CardTitle>
                  <CardDescription>Daily task completion over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-center justify-center bg-muted rounded-lg">
                    <div className="text-center text-muted-foreground">
                      <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Time series chart would appear here</p>
                      <p className="text-xs">Avg: {Math.round(report.metrics.completedTasks / 7)} tasks/day</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Metrics Table */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Metrics</CardTitle>
                <CardDescription>Complete breakdown of all collected metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metricCards.map((metric, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className={metric.color}>
                          {metric.icon}
                        </div>
                        <span className="font-medium">{metric.label}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{metric.value}</div>
                        {metric.change && (
                          <div className="text-xs text-muted-foreground">
                            {metric.change > 0 ? '+' : ''}{metric.change}% from last period
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-6 mt-6">
            {/* Technical Details */}
            <Card>
              <CardHeader>
                <CardTitle>Technical Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Report ID</label>
                    <p className="text-sm font-mono bg-muted px-2 py-1 rounded">{report.id}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">File Size</label>
                    <p className="text-sm">{report.size}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Format</label>
                    <p className="text-sm uppercase">{report.fileFormat || 'PDF'}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Author</label>
                    <p className="text-sm">{report.author?.name || 'System'}</p>
                  </div>
                  {report.generationTime && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Generation Time</label>
                      <p className="text-sm">{formatGenerationTime(report.generationTime)}</p>
                    </div>
                  )}
                  {report.viewCount !== undefined && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">View Count</label>
                      <p className="text-sm">{report.viewCount} views</p>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Data Range</label>
                  <div className="text-sm space-y-1">
                    <p><strong>Start:</strong> {formatDate(report.dataRange.start)}</p>
                    <p><strong>End:</strong> {formatDate(report.dataRange.end)}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {report.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Report Timeline</CardTitle>
                <CardDescription>Key events and milestones for this report</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium">Report Created</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(report.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  {report.generatedAt && (
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium">Report Generated</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(report.generatedAt)}
                          {report.generationTime && (
                            <span> • Took {formatGenerationTime(report.generationTime)}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {report.lastAccessed && (
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium">Last Accessed</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(report.lastAccessed)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}