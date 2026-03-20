"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  TrendingUp,
  Plus,
  ThumbsUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  MoreHorizontal,
  Eye,
  ArrowRight,
  Lightbulb,
  Zap,
  Users,
  Target,
  RefreshCw
} from 'lucide-react'

interface ImprovementSummary {
  id: string
  title: string
  category: 'performance' | 'usability' | 'feature' | 'bug-fix' | 'security' | 'infrastructure'
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'proposed' | 'reviewing' | 'approved' | 'in-progress' | 'completed' | 'rejected'
  votes: {
    upvotes: number
    downvotes: number
  }
  submittedAt: string
  submittedBy: string
}

interface ImprovementsWidgetData {
  stats: {
    total: number
    pending: number
    thisWeek: number
    approved: number
    completed: number
    avgTimeToApproval: number // days
  }
  recentProposals: ImprovementSummary[]
  topVoted: ImprovementSummary[]
  byCategory: Record<string, number>
  trends: {
    proposalsThisWeek: number
    proposalsLastWeek: number
    approvalRate: number
    completionRate: number
  }
}

interface ImprovementsWidgetProps {
  className?: string
  compact?: boolean
}

export function ImprovementsWidget({ className = "", compact = false }: ImprovementsWidgetProps) {
  const [data, setData] = useState<ImprovementsWidgetData | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeView, setActiveView] = useState<'overview' | 'recent' | 'popular'>('overview')

  useEffect(() => {
    loadImprovementsData()
  }, [])

  const loadImprovementsData = async () => {
    setLoading(true)
    try {
      // Mock API call - in real app, this would call /api/improvements/dashboard or similar
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const mockData: ImprovementsWidgetData = {
        stats: {
          total: 15,
          pending: 3,
          thisWeek: 2,
          approved: 4,
          completed: 5,
          avgTimeToApproval: 2.5
        },
        recentProposals: [
          {
            id: 'imp-1',
            title: 'Add Dark Mode Support for PDF Reports',
            category: 'feature',
            priority: 'medium',
            status: 'approved',
            votes: { upvotes: 8, downvotes: 1 },
            submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            submittedBy: 'Med'
          },
          {
            id: 'imp-2',
            title: 'Improve Report Generation Performance',
            category: 'performance',
            priority: 'high',
            status: 'in-progress',
            votes: { upvotes: 12, downvotes: 0 },
            submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            submittedBy: 'System Analysis'
          },
          {
            id: 'imp-3',
            title: 'Fix Memory Leak in Chart Rendering',
            category: 'bug-fix',
            priority: 'critical',
            status: 'reviewing',
            votes: { upvotes: 6, downvotes: 0 },
            submittedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            submittedBy: 'Med'
          }
        ],
        topVoted: [
          {
            id: 'imp-2',
            title: 'Improve Report Generation Performance',
            category: 'performance',
            priority: 'high',
            status: 'in-progress',
            votes: { upvotes: 12, downvotes: 0 },
            submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            submittedBy: 'System Analysis'
          },
          {
            id: 'imp-1',
            title: 'Add Dark Mode Support for PDF Reports',
            category: 'feature',
            priority: 'medium',
            status: 'approved',
            votes: { upvotes: 8, downvotes: 1 },
            submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            submittedBy: 'Med'
          }
        ],
        byCategory: {
          performance: 4,
          feature: 6,
          'bug-fix': 2,
          security: 2,
          usability: 1
        },
        trends: {
          proposalsThisWeek: 2,
          proposalsLastWeek: 1,
          approvalRate: 73,
          completionRate: 89
        }
      }
      
      setData(mockData)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading improvements data:', error);
      }
    } finally {
      setLoading(false)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance': return <Zap className="h-3 w-3 text-yellow-600" />
      case 'usability': return <Users className="h-3 w-3 text-blue-600" />
      case 'feature': return <Lightbulb className="h-3 w-3 text-purple-600" />
      case 'bug-fix': return <AlertTriangle className="h-3 w-3 text-red-600" />
      case 'security': return <Target className="h-3 w-3 text-green-600" />
      case 'infrastructure': return <Target className="h-3 w-3 text-gray-600" />
      default: return <TrendingUp className="h-3 w-3 text-blue-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const configs = {
      proposed: { label: 'Proposed', className: 'bg-blue-50 text-blue-700 border-blue-200' },
      reviewing: { label: 'Reviewing', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
      approved: { label: 'Approved', className: 'bg-green-50 text-green-700 border-green-200' },
      'in-progress': { label: 'In Progress', className: 'bg-purple-50 text-purple-700 border-purple-200' },
      completed: { label: 'Completed', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      rejected: { label: 'Rejected', className: 'bg-red-50 text-red-700 border-red-200' }
    }
    const config = configs[status as keyof typeof configs] || configs.proposed
    return <Badge variant="outline" className={`text-xs ${config.className}`}>{config.label}</Badge>
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600'
      case 'high': return 'text-orange-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const time = new Date(dateString)
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    return diffInDays === 1 ? '1d ago' : `${diffInDays}d ago`
  }

  const getTrendIndicator = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-3 w-3 text-green-600" />
    if (current < previous) return <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />
    return <div className="w-3 h-0.5 bg-gray-400" />
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>System Improvements</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return null
  }

  if (compact) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-sm">Improvements</span>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <a href="/dashboard/reports?tab=improvements">
                <ArrowRight className="h-3 w-3" />
              </a>
            </Button>
          </div>
          
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-lg font-bold text-yellow-600">{data.stats.pending}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">{data.stats.approved}</div>
              <div className="text-xs text-muted-foreground">Approved</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">{data.stats.thisWeek}</div>
              <div className="text-xs text-muted-foreground">This Week</div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>System Improvements</span>
            </CardTitle>
            <CardDescription className="mt-1">
              Community-driven enhancement proposals
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {activeView === 'overview' ? 'Overview' : 
                   activeView === 'recent' ? 'Recent' : 'Popular'}
                  <MoreHorizontal className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setActiveView('overview')}>
                  Overview
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveView('recent')}>
                  Recent Proposals
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveView('popular')}>
                  Most Popular
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href="/dashboard/reports?tab=improvements">View All</a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" asChild>
              <a href="/dashboard/reports?tab=improvements&action=create">
                <Plus className="h-3 w-3 mr-1" />
                Propose
              </a>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeView === 'overview' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-xl font-bold text-blue-600">{data.stats.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-xl font-bold text-yellow-600">{data.stats.pending}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-xl font-bold text-green-600">{data.stats.approved}</div>
                <div className="text-sm text-muted-foreground">Approved</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-xl font-bold text-purple-600">{data.stats.completed}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
            </div>

            {/* Trends */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Trends</h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">Proposals this week</span>
                  <div className="flex items-center space-x-1">
                    <span className="font-medium">{data.trends.proposalsThisWeek}</span>
                    {getTrendIndicator(data.trends.proposalsThisWeek, data.trends.proposalsLastWeek)}
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">Approval rate</span>
                  <span className="font-medium text-green-600">{data.trends.approvalRate}%</span>
                </div>
              </div>
            </div>

            {/* Top Categories */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Popular Categories</h4>
              <div className="space-y-2">
                {Object.entries(data.byCategory).slice(0, 3).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(category)}
                      <span className="text-sm capitalize">{category.replace('-', ' ')}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">{count}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeView === 'recent' && (
          <div className="space-y-3">
            {data.recentProposals.map((improvement) => (
              <div key={improvement.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="mt-0.5">
                  {getCategoryIcon(improvement.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h5 className="font-medium text-sm truncate">{improvement.title}</h5>
                    {getStatusBadge(improvement.status)}
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <span>By {improvement.submittedBy}</span>
                    <span>•</span>
                    <span>{formatTimeAgo(improvement.submittedAt)}</span>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <ThumbsUp className="h-3 w-3" />
                      <span>{improvement.votes.upvotes}</span>
                    </div>
                    <span className={`font-medium ${getPriorityColor(improvement.priority)}`}>
                      {improvement.priority}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" asChild>
                  <a href={`/dashboard/reports?tab=improvements&id=${improvement.id}`}>
                    <Eye className="h-3 w-3" />
                  </a>
                </Button>
              </div>
            ))}
          </div>
        )}

        {activeView === 'popular' && (
          <div className="space-y-3">
            {data.topVoted.map((improvement, index) => (
              <div key={improvement.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-center w-6 h-6 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h5 className="font-medium text-sm truncate">{improvement.title}</h5>
                    {getStatusBadge(improvement.status)}
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1 font-medium text-green-600">
                      <ThumbsUp className="h-3 w-3" />
                      <span>{improvement.votes.upvotes} votes</span>
                    </div>
                    <span>•</span>
                    <span>By {improvement.submittedBy}</span>
                    <span>•</span>
                    <span className={`font-medium ${getPriorityColor(improvement.priority)}`}>
                      {improvement.priority}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" asChild>
                  <a href={`/dashboard/reports?tab=improvements&id=${improvement.id}`}>
                    <Eye className="h-3 w-3" />
                  </a>
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
          <span>
            {data.stats.avgTimeToApproval} days avg. approval time
          </span>
          <Button variant="ghost" size="sm" asChild>
            <a href="/dashboard/reports?tab=improvements" className="text-blue-600 hover:text-blue-800">
              View all improvements →
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}