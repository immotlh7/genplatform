"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Progress
} from '@/components/ui/progress'
import { 
  FileText,
  Calendar,
  BarChart3,
  PieChart,
  Target,
  CheckCircle,
  RefreshCw,
  AlertTriangle,
  Clock,
  Download,
  Eye,
  Star,
  Archive,
  Copy,
  Share2,
  MoreHorizontal,
  Users,
  Activity,
  TrendingUp,
  Zap,
  ExternalLink,
  Timer,
  Database
} from 'lucide-react'

export interface ReportData {
  id: string
  title: string
  description: string
  type: 'daily' | 'weekly' | 'monthly' | 'custom'
  status: 'generating' | 'completed' | 'failed' | 'scheduled'
  createdAt: string
  generatedAt?: string
  dataRange: {
    start: string
    end: string
  }
  metrics: {
    totalProjects: number
    completedTasks: number
    activeUsers: number
    systemHealth: number
  }
  size: string
  downloadUrl?: string
  isStarred?: boolean
  tags: string[]
  author?: {
    name: string
    avatar?: string
  }
  generationTime?: number // in seconds
  confidence?: number // 0-100
}

interface ReportCardProps {
  report: ReportData
  onView?: (report: ReportData) => void
  onDownload?: (report: ReportData) => void
  onStar?: (report: ReportData) => void
  onArchive?: (report: ReportData) => void
  onShare?: (report: ReportData) => void
  onDelete?: (report: ReportData) => void
  compact?: boolean
  showActions?: boolean
  className?: string
}

export function ReportCard({ 
  report,
  onView,
  onDownload,
  onStar,
  onArchive,
  onShare,
  onDelete,
  compact = false,
  showActions = true,
  className = ""
}: ReportCardProps) {
  const [loading, setLoading] = useState('')

  const getTypeIcon = (type: ReportData['type']) => {
    const iconClass = "h-4 w-4"
    switch (type) {
      case 'daily': return <Calendar className={iconClass} />
      case 'weekly': return <BarChart3 className={iconClass} />
      case 'monthly': return <PieChart className={iconClass} />
      case 'custom': return <Target className={iconClass} />
      default: return <FileText className={iconClass} />
    }
  }

  const getStatusConfig = (status: ReportData['status']) => {
    switch (status) {
      case 'completed':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          badge: { label: 'Completed', className: 'bg-green-50 text-green-700 border-green-200' },
          color: 'text-green-600'
        }
      case 'generating':
        return {
          icon: <RefreshCw className="h-4 w-4 animate-spin" />,
          badge: { label: 'Generating', className: 'bg-blue-50 text-blue-700 border-blue-200' },
          color: 'text-blue-600'
        }
      case 'failed':
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          badge: { label: 'Failed', className: 'bg-red-50 text-red-700 border-red-200' },
          color: 'text-red-600'
        }
      case 'scheduled':
        return {
          icon: <Clock className="h-4 w-4" />,
          badge: { label: 'Scheduled', className: 'bg-orange-50 text-orange-700 border-orange-200' },
          color: 'text-orange-600'
        }
      default:
        return {
          icon: <FileText className="h-4 w-4" />,
          badge: { label: 'Unknown', className: 'bg-gray-50 text-gray-700 border-gray-200' },
          color: 'text-gray-600'
        }
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m ago`
    }
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  const formatGenerationTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
  }

  const getProgressForGenerating = () => {
    if (report.status !== 'generating') return 0
    // Mock progress based on time elapsed since creation
    const elapsed = Date.now() - new Date(report.createdAt).getTime()
    const progress = Math.min(Math.floor((elapsed / 1000) / 3), 95) // Simulate 3 second per 1% progress
    return progress
  }

  const handleAction = async (action: string, callback?: (report: ReportData) => void) => {
    if (!callback) return
    
    setLoading(action)
    try {
      await callback(report)
    } catch (error) {
      console.error(`Error performing ${action}:`, error)
    } finally {
      setLoading('')
    }
  }

  const copyReportId = () => {
    navigator.clipboard.writeText(report.id)
  }

  const statusConfig = getStatusConfig(report.status)

  if (compact) {
    return (
      <Card className={`hover:shadow-md transition-all duration-200 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="flex-shrink-0">
                {getTypeIcon(report.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-semibold text-sm truncate">{report.title}</h3>
                  {report.isStarred && (
                    <Star className="h-3 w-3 text-yellow-500 fill-current flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <span>{formatDate(report.createdAt)}</span>
                  <span>•</span>
                  <Badge variant="outline" className={`text-xs ${statusConfig.badge.className}`}>
                    {statusConfig.badge.label}
                  </Badge>
                  <span>•</span>
                  <span>{report.size}</span>
                </div>
              </div>
            </div>
            {showActions && (
              <div className="flex items-center space-x-1 flex-shrink-0">
                {report.status === 'completed' && report.downloadUrl && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handleAction('download', onDownload)}
                          disabled={loading === 'download'}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Download</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleAction('view', onView)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAction('star', onStar)}>
                      <Star className="h-4 w-4 mr-2" />
                      {report.isStarred ? 'Unstar' : 'Star'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={copyReportId}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy ID
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`hover:shadow-md transition-all duration-200 ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            <div className="mt-1 flex-shrink-0">
              {getTypeIcon(report.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="font-semibold text-lg truncate">{report.title}</h3>
                {report.isStarred && (
                  <Star className="h-4 w-4 text-yellow-500 fill-current flex-shrink-0" />
                )}
                <div className={`flex items-center space-x-1 ${statusConfig.color}`}>
                  {statusConfig.icon}
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {report.description}
              </p>

              {/* Status and Type Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge variant="outline" className={statusConfig.badge.className}>
                  {statusConfig.badge.label}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {report.type}
                </Badge>
                {report.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {report.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{report.tags.length - 3} more
                  </Badge>
                )}
              </div>

              {/* Progress bar for generating reports */}
              {report.status === 'generating' && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-600">Generating...</span>
                    <span className="text-xs text-muted-foreground">
                      {getProgressForGenerating()}%
                    </span>
                  </div>
                  <Progress value={getProgressForGenerating()} className="h-2" />
                </div>
              )}

              {/* Metrics Grid */}
              {report.status === 'completed' && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <Target className="h-3 w-3 text-blue-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Projects</p>
                      <p className="text-sm font-medium">{report.metrics.totalProjects}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Tasks</p>
                      <p className="text-sm font-medium">{report.metrics.completedTasks}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-3 w-3 text-purple-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Users</p>
                      <p className="text-sm font-medium">{report.metrics.activeUsers}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Activity className="h-3 w-3 text-green-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Health</p>
                      <p className="text-sm font-medium">{report.metrics.systemHealth}%</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>Created: {formatDate(report.createdAt)}</span>
                </div>
                {report.generatedAt && (
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3" />
                    <span>Generated: {formatDate(report.generatedAt)}</span>
                  </div>
                )}
                {report.generationTime && (
                  <div className="flex items-center space-x-1">
                    <Timer className="h-3 w-3" />
                    <span>Time: {formatGenerationTime(report.generationTime)}</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <Database className="h-3 w-3" />
                  <span>Size: {report.size}</span>
                </div>
                {report.confidence && (
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="h-3 w-3" />
                    <span>Confidence: {report.confidence}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
              {report.status === 'completed' && report.downloadUrl && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction('download', onDownload)}
                        disabled={loading === 'download'}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Download Report</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction('view', onView)}
                disabled={loading === 'view'}
              >
                <Eye className="h-4 w-4 mr-2" />
                View
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="flex items-center space-x-2">
                    <FileText className="h-3 w-3" />
                    <span className="truncate">{report.title}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={() => handleAction('star', onStar)}>
                    <Star className="h-4 w-4 mr-2" />
                    {report.isStarred ? 'Remove from starred' : 'Add to starred'}
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => handleAction('share', onShare)}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Report
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={copyReportId}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Report ID
                  </DropdownMenuItem>
                  
                  {report.downloadUrl && report.status === 'completed' && (
                    <DropdownMenuItem>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open in New Tab
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={() => handleAction('archive', onArchive)}>
                    <Archive className="h-4 w-4 mr-2" />
                    Archive Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}