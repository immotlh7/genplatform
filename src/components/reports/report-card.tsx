"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  FileText,
  Download,
  Eye,
  MoreHorizontal,
  Calendar,
  BarChart3,
  Trash2,
  Share
} from 'lucide-react'

export interface Report {
  id: string
  title: string
  type: 'daily' | 'weekly' | 'monthly' | 'custom'
  description?: string
  createdAt: string
  updatedAt?: string
  status: 'generating' | 'completed' | 'failed' | 'scheduled'
  size?: string
  insights?: number
  metrics?: Record<string, any>
  tags?: string[]
  author?: string
  project?: string
}

interface ReportCardProps {
  report: Report
  onView?: (report: Report) => void
  onDownload?: (report: Report) => void
  onDelete?: (report: Report) => void
  onShare?: (report: Report) => void
  compact?: boolean
}

export function ReportCard({ 
  report, 
  onView, 
  onDownload, 
  onDelete, 
  onShare, 
  compact = false 
}: ReportCardProps) {
  const [loading, setLoading] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusConfig = (status: Report['status']) => {
    switch (status) {
      case 'completed':
        return {
          color: 'bg-green-500/20 text-green-500 border-green-500/30',
          label: 'Completed',
          icon: '✓'
        }
      case 'generating':
        return {
          color: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
          label: 'Generating',
          icon: '⏳'
        }
      case 'failed':
        return {
          color: 'bg-red-500/20 text-red-500 border-red-500/30',
          label: 'Failed',
          icon: '⚠️'
        }
      case 'scheduled':
        return {
          color: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
          label: 'Scheduled',
          icon: '📅'
        }
      default:
        return {
          color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
          label: 'Unknown',
          icon: '❓'
        }
    }
  }

  const getTypeConfig = (type: Report['type']) => {
    switch (type) {
      case 'daily':
        return { label: 'Daily', color: 'bg-blue-500/20 text-blue-500' }
      case 'weekly':
        return { label: 'Weekly', color: 'bg-purple-500/20 text-purple-500' }
      case 'monthly':
        return { label: 'Monthly', color: 'bg-green-500/20 text-green-500' }
      case 'custom':
        return { label: 'Custom', color: 'bg-orange-500/20 text-orange-500' }
      default:
        return { label: 'Report', color: 'bg-zinc-500/20 text-zinc-400' }
    }
  }

  const statusConfig = getStatusConfig(report.status)
  const typeConfig = getTypeConfig(report.type)

  const handleAction = async (action: () => void) => {
    setLoading(true)
    try {
      await action()
    } finally {
      setLoading(false)
    }
  }

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className={`text-xs ${typeConfig.color}`}>
                  {typeConfig.label}
                </Badge>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-medium truncate">{report.title}</h4>
                <p className="text-xs text-muted-foreground">
                  {formatDate(report.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className={`text-xs ${statusConfig.color}`}>
                {statusConfig.icon} {statusConfig.label}
              </Badge>
              {report.status === 'completed' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onView?.(report)}
                  disabled={loading}
                >
                  <Eye className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-md transition-shadow group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className={`text-xs ${typeConfig.color}`}>
                {typeConfig.label}
              </Badge>
              <Badge variant="outline" className={`text-xs ${statusConfig.color}`}>
                {statusConfig.icon} {statusConfig.label}
              </Badge>
            </div>
            <CardTitle className="text-base leading-tight pr-2">{report.title}</CardTitle>
            {report.description && (
              <CardDescription className="text-sm">{report.description}</CardDescription>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {report.status === 'completed' && (
                <>
                  <DropdownMenuItem onClick={() => handleAction(() => onView?.(report))}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Report
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAction(() => onDownload?.(report))}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAction(() => onShare?.(report))}>
                    <Share className="h-4 w-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem 
                onClick={() => handleAction(() => onDelete?.(report))}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Metadata */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-1">
            <div className="flex items-center text-muted-foreground">
              <Calendar className="h-3 w-3 mr-1" />
              Created
            </div>
            <div className="font-medium">{formatDate(report.createdAt)}</div>
          </div>
          {report.insights && (
            <div className="space-y-1">
              <div className="flex items-center text-muted-foreground">
                <BarChart3 className="h-3 w-3 mr-1" />
                Insights
              </div>
              <div className="font-medium">{report.insights}</div>
            </div>
          )}
        </div>

        {/* Additional Info */}
        {(report.size || report.project || report.author) && (
          <div className="space-y-2 text-sm border-t pt-3">
            {report.size && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Size:</span>
                <span className="font-medium">{report.size}</span>
              </div>
            )}
            {report.project && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Project:</span>
                <span className="font-medium">{report.project}</span>
              </div>
            )}
            {report.author && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Author:</span>
                <span className="font-medium">{report.author}</span>
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {report.tags && report.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {report.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Key Metrics Preview */}
        {report.metrics && Object.keys(report.metrics).length > 0 && (
          <div className="space-y-2 border-t pt-3">
            <h4 className="text-sm font-medium text-muted-foreground">Key Metrics</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(report.metrics).slice(0, 4).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-muted-foreground capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                  </span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-2 pt-2">
          {report.status === 'completed' ? (
            <>
              <Button 
                variant="default" 
                size="sm" 
                className="flex-1"
                onClick={() => handleAction(() => onView?.(report))}
                disabled={loading}
              >
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleAction(() => onDownload?.(report))}
                disabled={loading}
              >
                <Download className="h-3 w-3" />
              </Button>
            </>
          ) : report.status === 'generating' ? (
            <Button variant="outline" size="sm" className="flex-1" disabled>
              <div className="h-3 w-3 mr-1 animate-spin rounded-full border border-current border-t-transparent" />
              Generating...
            </Button>
          ) : report.status === 'failed' ? (
            <Button variant="outline" size="sm" className="flex-1 text-red-600">
              ⚠️ Failed - Retry
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="flex-1" disabled>
              📅 Scheduled
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}