"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp,
  Plus,
  Search,
  Filter,
  ThumbsUp,
  ThumbsDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lightbulb,
  Target,
  Zap,
  Users,
  Calendar,
  MessageSquare,
  MoreHorizontal,
  Eye,
  Edit,
  Archive,
  Star,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Minus,
  Flag
} from 'lucide-react'

export interface Improvement {
  id: string
  title: string
  description: string
  category: 'performance' | 'usability' | 'feature' | 'bug-fix' | 'security' | 'infrastructure'
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'proposed' | 'reviewing' | 'approved' | 'in-progress' | 'completed' | 'rejected'
  impact: 'low' | 'medium' | 'high'
  effort: 'small' | 'medium' | 'large'
  submittedBy: {
    id: string
    name: string
    avatar?: string
  }
  assignedTo?: {
    id: string
    name: string
    avatar?: string
  }
  submittedAt: string
  updatedAt: string
  completedAt?: string
  votes: {
    upvotes: number
    downvotes: number
    userVote?: 'up' | 'down' | null
  }
  comments: number
  tags: string[]
  estimatedHours?: number
  actualHours?: number
  roi?: number // Return on Investment percentage
  dependencies?: string[]
}

interface ImprovementsTabProps {
  className?: string
}

export function ImprovementsTab({ className = "" }: ImprovementsTabProps) {
  const [improvements, setImprovements] = useState<Improvement[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priority' | 'votes' | 'impact'>('newest')
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    loadImprovements()
  }, [])

  const loadImprovements = async () => {
    setLoading(true)
    try {
      // Mock API call - in real app, this would call /api/improvements
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const mockImprovements: Improvement[] = [
        {
          id: 'imp-1',
          title: 'Add Dark Mode Support for PDF Reports',
          description: 'Implement dark mode theme option for PDF exports to improve readability in low-light environments and provide consistency with the dashboard theme.',
          category: 'feature',
          priority: 'medium',
          status: 'approved',
          impact: 'medium',
          effort: 'medium',
          submittedBy: {
            id: 'user-1',
            name: 'Med',
            avatar: undefined
          },
          assignedTo: {
            id: 'agent-1',
            name: 'Claude Agent'
          },
          submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          votes: {
            upvotes: 8,
            downvotes: 1,
            userVote: 'up'
          },
          comments: 3,
          tags: ['pdf', 'dark-mode', 'accessibility'],
          estimatedHours: 16,
          roi: 15
        },
        {
          id: 'imp-2',
          title: 'Improve Report Generation Performance',
          description: 'Optimize report generation algorithms and implement caching to reduce generation time for large datasets. Current reports with >1000 tasks take too long.',
          category: 'performance',
          priority: 'high',
          status: 'in-progress',
          impact: 'high',
          effort: 'large',
          submittedBy: {
            id: 'system',
            name: 'System Analysis'
          },
          assignedTo: {
            id: 'agent-1',
            name: 'Claude Agent'
          },
          submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          votes: {
            upvotes: 12,
            downvotes: 0,
            userVote: 'up'
          },
          comments: 7,
          tags: ['performance', 'optimization', 'caching'],
          estimatedHours: 40,
          actualHours: 24,
          roi: 35
        },
        {
          id: 'imp-3',
          title: 'Add Real-time Collaboration Features',
          description: 'Enable real-time collaboration on reports with live editing, comments, and notifications when multiple team members are working on the same project.',
          category: 'feature',
          priority: 'low',
          status: 'proposed',
          impact: 'high',
          effort: 'large',
          submittedBy: {
            id: 'user-2',
            name: 'Team Member'
          },
          submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          votes: {
            upvotes: 5,
            downvotes: 2,
            userVote: null
          },
          comments: 4,
          tags: ['collaboration', 'real-time', 'team'],
          estimatedHours: 80,
          roi: 25
        },
        {
          id: 'imp-4',
          title: 'Fix Memory Leak in Chart Rendering',
          description: 'Address memory leak issue when rendering multiple charts in weekly/monthly reports. Browser becomes unresponsive after generating several reports.',
          category: 'bug-fix',
          priority: 'critical',
          status: 'reviewing',
          impact: 'high',
          effort: 'small',
          submittedBy: {
            id: 'user-1',
            name: 'Med'
          },
          submittedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          votes: {
            upvotes: 6,
            downvotes: 0,
            userVote: 'up'
          },
          comments: 2,
          tags: ['bug', 'memory', 'charts', 'performance'],
          estimatedHours: 8,
          roi: 40
        },
        {
          id: 'imp-5',
          title: 'Enhanced Security Audit Reports',
          description: 'Expand security audit reports to include compliance checks, vulnerability scanning results, and automated recommendations.',
          category: 'security',
          priority: 'medium',
          status: 'completed',
          impact: 'medium',
          effort: 'medium',
          submittedBy: {
            id: 'security-team',
            name: 'Security Team'
          },
          assignedTo: {
            id: 'agent-1',
            name: 'Claude Agent'
          },
          submittedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          votes: {
            upvotes: 10,
            downvotes: 1,
            userVote: 'up'
          },
          comments: 8,
          tags: ['security', 'compliance', 'audit'],
          estimatedHours: 32,
          actualHours: 28,
          roi: 30
        }
      ]
      
      setImprovements(mockImprovements)
    } catch (error) {
      console.error('Error loading improvements:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredImprovements = improvements.filter(improvement => {
    const matchesSearch = improvement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         improvement.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         improvement.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || improvement.category === selectedCategory
    const matchesStatus = selectedStatus === 'all' || improvement.status === selectedStatus
    const matchesPriority = selectedPriority === 'all' || improvement.priority === selectedPriority
    
    return matchesSearch && matchesCategory && matchesStatus && matchesPriority
  })

  const sortedImprovements = [...filteredImprovements].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      case 'oldest':
        return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
      case 'priority':
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      case 'votes':
        return (b.votes.upvotes - b.votes.downvotes) - (a.votes.upvotes - a.votes.downvotes)
      case 'impact':
        const impactOrder = { high: 3, medium: 2, low: 1 }
        return impactOrder[b.impact] - impactOrder[a.impact]
      default:
        return 0
    }
  })

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
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const configs = {
      critical: { label: 'Critical', className: 'bg-red-100 text-red-700 border-red-300' },
      high: { label: 'High', className: 'bg-orange-100 text-orange-700 border-orange-300' },
      medium: { label: 'Medium', className: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
      low: { label: 'Low', className: 'bg-green-100 text-green-700 border-green-300' }
    }
    const config = configs[priority as keyof typeof configs] || configs.medium
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance': return <Zap className="h-4 w-4 text-yellow-600" />
      case 'usability': return <Users className="h-4 w-4 text-blue-600" />
      case 'feature': return <Lightbulb className="h-4 w-4 text-purple-600" />
      case 'bug-fix': return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'security': return <Target className="h-4 w-4 text-green-600" />
      case 'infrastructure': return <Target className="h-4 w-4 text-gray-600" />
      default: return <TrendingUp className="h-4 w-4 text-blue-600" />
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'large': return 'text-red-600'
      case 'medium': return 'text-yellow-600'
      case 'small': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleVote = (improvementId: string, vote: 'up' | 'down') => {
    setImprovements(prev => prev.map(imp => 
      imp.id === improvementId 
        ? {
            ...imp,
            votes: {
              ...imp.votes,
              upvotes: vote === 'up' && imp.votes.userVote !== 'up' 
                ? imp.votes.upvotes + 1 
                : vote === 'up' && imp.votes.userVote === 'up'
                ? imp.votes.upvotes - 1
                : imp.votes.userVote === 'down' && vote === 'up'
                ? imp.votes.upvotes + 1
                : imp.votes.upvotes,
              downvotes: vote === 'down' && imp.votes.userVote !== 'down'
                ? imp.votes.downvotes + 1
                : vote === 'down' && imp.votes.userVote === 'down'
                ? imp.votes.downvotes - 1
                : imp.votes.userVote === 'up' && vote === 'down'
                ? imp.votes.downvotes + 1
                : imp.votes.downvotes,
              userVote: imp.votes.userVote === vote ? null : vote
            }
          }
        : imp
    ))
  }

  const getImprovementStats = () => {
    const total = improvements.length
    const byStatus = improvements.reduce((acc, imp) => {
      acc[imp.status] = (acc[imp.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return {
      total,
      proposed: byStatus.proposed || 0,
      inProgress: byStatus['in-progress'] || 0,
      completed: byStatus.completed || 0,
      approved: byStatus.approved || 0
    }
  }

  const stats = getImprovementStats()

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center space-x-2">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            <span>System Improvements</span>
          </h2>
          <p className="text-muted-foreground">
            Track and manage system enhancement proposals
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Propose Improvement
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Proposals</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.proposed}</div>
            <p className="text-sm text-muted-foreground">Proposed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-sm text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.inProgress}</div>
            <p className="text-sm text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-emerald-600">{stats.completed}</div>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search improvements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="performance">Performance</SelectItem>
            <SelectItem value="usability">Usability</SelectItem>
            <SelectItem value="feature">Feature</SelectItem>
            <SelectItem value="bug-fix">Bug Fix</SelectItem>
            <SelectItem value="security">Security</SelectItem>
            <SelectItem value="infrastructure">Infrastructure</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="proposed">Proposed</SelectItem>
            <SelectItem value="reviewing">Reviewing</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="votes">Most Voted</SelectItem>
            <SelectItem value="impact">Impact</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Improvements List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading improvements...</p>
          </div>
        ) : sortedImprovements.length > 0 ? (
          sortedImprovements.map((improvement) => (
            <Card key={improvement.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="mt-1">
                      {getCategoryIcon(improvement.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-lg truncate">{improvement.title}</h3>
                        {getStatusBadge(improvement.status)}
                        {getPriorityBadge(improvement.priority)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {improvement.description}
                      </p>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        {improvement.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {improvement.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{improvement.tags.length - 3} more
                          </Badge>
                        )}
                      </div>
                      
                      {/* Metadata */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Flag className="h-3 w-3" />
                          <span className={`font-medium ${getImpactColor(improvement.impact)}`}>
                            {improvement.impact} impact
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span className={`font-medium ${getEffortColor(improvement.effort)}`}>
                            {improvement.effort} effort
                          </span>
                        </div>
                        {improvement.estimatedHours && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{improvement.estimatedHours}h estimated</span>
                          </div>
                        )}
                        {improvement.roi && (
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="h-3 w-3" />
                            <span className="text-green-600 font-medium">{improvement.roi}% ROI</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Footer */}
                      <div className="flex items-center justify-between mt-4 pt-3 border-t">
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span>By {improvement.submittedBy.name}</span>
                          <span>•</span>
                          <span>{formatDate(improvement.submittedAt)}</span>
                          {improvement.assignedTo && (
                            <>
                              <span>•</span>
                              <span>Assigned to {improvement.assignedTo.name}</span>
                            </>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-7 px-2 ${improvement.votes.userVote === 'up' ? 'text-green-600' : ''}`}
                              onClick={() => handleVote(improvement.id, 'up')}
                            >
                              <ThumbsUp className="h-3 w-3 mr-1" />
                              {improvement.votes.upvotes}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-7 px-2 ${improvement.votes.userVote === 'down' ? 'text-red-600' : ''}`}
                              onClick={() => handleVote(improvement.id, 'down')}
                            >
                              <ThumbsDown className="h-3 w-3 mr-1" />
                              {improvement.votes.downvotes}
                            </Button>
                          </div>
                          
                          <Button variant="ghost" size="sm" className="h-7 px-2">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            {improvement.comments}
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Star className="h-4 w-4 mr-2" />
                                Add to Favorites
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Archive className="h-4 w-4 mr-2" />
                                Archive
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No improvements found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all' 
                ? 'Try adjusting your filters or search query.'
                : 'Be the first to propose a system improvement!'}
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Propose Improvement
            </Button>
          </div>
        )}
      </div>

      {/* Create Improvement Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Lightbulb className="h-5 w-5 text-purple-600" />
              <span>Propose Improvement</span>
            </DialogTitle>
            <DialogDescription>
              Submit a new improvement proposal for review
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" placeholder="Brief, descriptive title for the improvement" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea 
                id="description" 
                placeholder="Detailed description of the proposed improvement..."
                className="resize-none"
                rows={4}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select defaultValue="feature">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="usability">Usability</SelectItem>
                    <SelectItem value="feature">Feature</SelectItem>
                    <SelectItem value="bug-fix">Bug Fix</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="infrastructure">Infrastructure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select defaultValue="medium">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Expected Impact</Label>
                <Select defaultValue="medium">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Implementation Effort</Label>
                <Select defaultValue="medium">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (1-2 weeks)</SelectItem>
                    <SelectItem value="medium">Medium (3-4 weeks)</SelectItem>
                    <SelectItem value="large">Large (1-2 months)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowCreateDialog(false)}>
              <Plus className="h-4 w-4 mr-2" />
              Submit Proposal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}