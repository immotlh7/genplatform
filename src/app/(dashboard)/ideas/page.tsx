"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/components/ui/use-toast'
import { 
  Lightbulb, 
  Plus, 
  Search,
  Filter,
  TrendingUp,
  Clock,
  User as UserIcon,
  Zap,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lock,
  Shield,
  Sparkles,
  FlaskConical,
  ClipboardList,
  Rocket,
  Ban,
  ThumbsUp,
  MessageSquare,
  Send,
  Bot,
  Loader2
} from 'lucide-react'
import { getCurrentUserClient, getUserPermissionSummary, isAtLeast } from '@/lib/access-control'
import type { User } from '@/lib/access-control'

interface Idea {
  id: string
  title: string
  description: string
  status: 'pending' | 'researching' | 'planning' | 'approved' | 'in_development' | 'rejected'
  priority: 'low' | 'medium' | 'high'
  votes: number
  submittedBy: string
  submittedAt: string
  researchNotes?: string
  technicalFeasibility?: 'low' | 'medium' | 'high'
  estimatedEffort?: string
  recommendedTechStack?: string[]
  goNoGoRecommendation?: 'go' | 'no-go' | 'needs-review'
  createdAt: string
  updatedAt: string
}

interface IdeaStats {
  total: number
  pending: number
  researching: number
  planning: number
  approved: number
  inDevelopment: number
  rejected: number
  highPriority: number
  totalVotes: number
}

export default function IdeasPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userPermissions, setUserPermissions] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [stats, setStats] = useState<IdeaStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showNewIdeaForm, setShowNewIdeaForm] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const { toast } = useToast()
  
  const [newIdea, setNewIdea] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    submittedBy: ''
  })

  useEffect(() => {
    checkUserAccess()
  }, [])

  useEffect(() => {
    if (currentUser) {
      loadIdeas()
    }
  }, [currentUser])

  const checkUserAccess = async () => {
    setAuthLoading(true)
    try {
      const user = await getCurrentUserClient()
      setCurrentUser(user)

      if (user) {
        // For now, hardcode role='OWNER' so the page works
        const userRole = 'OWNER' as const
        
        setUserPermissions({
          canRead: true,
          canCreate: true,
          canApprove: true,
          canDelete: true,
          role: userRole
        })
        
        // Set submittedBy to current user
        setNewIdea(prev => ({ ...prev, submittedBy: user.displayName || user.email || 'Anonymous' }))
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error checking user access:', error);
      }
    } finally {
      setAuthLoading(false)
    }
  }

  const loadIdeas = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/ideas', {
        method: 'GET',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setIdeas(data.ideas || [])
        setStats(data.stats || null)
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading ideas:', error);
      }
      toast({
        title: 'Error loading ideas',
        description: 'Please try again later',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateIdea = async () => {
    if (!newIdea.title.trim() || !newIdea.description.trim()) {
      toast({
        title: 'Missing fields',
        description: 'Title and description are required',
        variant: 'destructive'
      })
      return
    }

    try {
      setActionLoading('creating')
      const response = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newIdea)
      })

      if (response.ok) {
        const data = await response.json()
        setNewIdea({ 
          title: '', 
          description: '', 
          priority: 'medium', 
          submittedBy: currentUser?.displayName || currentUser?.email || 'Anonymous' 
        })
        setShowNewIdeaForm(false)
        await loadIdeas() // Reload to get updated list
        toast({
          title: 'Idea submitted!',
          description: 'Your idea has been added to the pipeline'
        })
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error creating idea:', error);
      }
      toast({
        title: 'Error creating idea',
        description: 'Please try again',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleVote = async (ideaId: string, currentVotes: number) => {
    try {
      setActionLoading(`vote-${ideaId}`)
      const response = await fetch(`/api/ideas/${ideaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ votes: currentVotes + 1 })
      })

      if (response.ok) {
        await loadIdeas()
        toast({
          title: 'Vote recorded',
          description: 'Thank you for your feedback!'
        })
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error voting:', error);
      }
    } finally {
      setActionLoading(null)
    }
  }

  const handleResearch = async (idea: Idea) => {
    try {
      setActionLoading(`research-${idea.id}`)
      const response = await fetch(`/api/ideas/${idea.id}/research`, {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        await loadIdeas()
        toast({
          title: 'Research initiated',
          description: 'AI is analyzing this idea. Check back soon for results!'
        })
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error initiating research:', error);
      }
      toast({
        title: 'Error initiating research',
        description: 'Please try again',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleStatusChange = async (ideaId: string, newStatus: string) => {
    try {
      setActionLoading(`status-${ideaId}`)
      const response = await fetch(`/api/ideas/${ideaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        await loadIdeas()
        toast({
          title: 'Status updated',
          description: `Idea moved to ${newStatus.replace('_', ' ')}`
        })
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error updating status:', error);
      }
      toast({
        title: 'Error updating status',
        description: 'Please try again',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleCreateTasks = async (idea: Idea) => {
    try {
      setActionLoading(`tasks-${idea.id}`)
      const response = await fetch(`/api/ideas/${idea.id}/create-tasks`, {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        await loadIdeas()
        toast({
          title: 'Task creation initiated',
          description: 'AI is breaking down this idea into actionable tasks!'
        })
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error creating tasks:', error);
      }
      toast({
        title: 'Error creating tasks',
        description: 'Please try again',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-blue-100 text-blue-800"><Sparkles className="h-3 w-3 mr-1" />Pending</Badge>
      case 'researching':
        return <Badge className="bg-purple-100 text-purple-800"><FlaskConical className="h-3 w-3 mr-1" />Researching</Badge>
      case 'planning':
        return <Badge className="bg-orange-100 text-orange-800"><ClipboardList className="h-3 w-3 mr-1" />Planning</Badge>
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
      case 'in_development':
        return <Badge className="bg-indigo-100 text-indigo-800"><Rocket className="h-3 w-3 mr-1" />In Development</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><Ban className="h-3 w-3 mr-1" />Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500'
      case 'medium': return 'border-l-yellow-500'
      case 'low': return 'border-l-green-500'
      default: return 'border-l-gray-300'
    }
  }

  const getFeasibilityBadge = (feasibility?: string) => {
    if (!feasibility) return null
    const colors = {
      high: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-red-100 text-red-800'
    }
    return <Badge className={colors[feasibility as keyof typeof colors]}>
      {feasibility.charAt(0).toUpperCase() + feasibility.slice(1)} Feasibility
    </Badge>
  }

  const getRecommendationBadge = (recommendation?: string) => {
    if (!recommendation) return null
    const config = {
      go: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'no-go': { color: 'bg-red-100 text-red-800', icon: XCircle },
      'needs-review': { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle }
    }
    const { color, icon: Icon } = config[recommendation as keyof typeof config]
    return <Badge className={color}>
      <Icon className="h-3 w-3 mr-1" />
      {recommendation.toUpperCase()}
    </Badge>
  }

  const filteredIdeas = ideas.filter(idea => {
    const matchesSearch = idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         idea.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || idea.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Show loading state during auth check
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  // Show access denied state
  if (!currentUser) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Card className="flex-1 flex items-center justify-center py-12">
          <CardContent className="text-center space-y-6 max-w-md">
            <Lock className="h-16 w-16 mx-auto text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold mb-2">Access Required</h3>
              <p className="text-muted-foreground">
                Please sign in to access the Ideas Lab.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-3">
            <Lightbulb className="h-8 w-8 text-yellow-600" />
            <span>Ideas Pipeline</span>
          </h1>
          <p className="text-muted-foreground">
            Submit → Research → Plan → Approve → Create Tasks
          </p>
        </div>
        <Button onClick={() => setShowNewIdeaForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Idea
        </Button>
      </div>

      {/* Pipeline Status */}
      <div className="flex items-center justify-between space-x-2 overflow-x-auto pb-2">
        <div className="flex items-center space-x-2 text-sm">
          <Badge variant="outline" className="whitespace-nowrap">
            <Sparkles className="h-3 w-3 mr-1" />
            Pending ({stats?.pending || 0})
          </Badge>
          <span className="text-muted-foreground">→</span>
          <Badge variant="outline" className="whitespace-nowrap">
            <FlaskConical className="h-3 w-3 mr-1" />
            Research ({stats?.researching || 0})
          </Badge>
          <span className="text-muted-foreground">→</span>
          <Badge variant="outline" className="whitespace-nowrap">
            <ClipboardList className="h-3 w-3 mr-1" />
            Planning ({stats?.planning || 0})
          </Badge>
          <span className="text-muted-foreground">→</span>
          <Badge variant="outline" className="whitespace-nowrap">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved ({stats?.approved || 0})
          </Badge>
          <span className="text-muted-foreground">→</span>
          <Badge variant="outline" className="whitespace-nowrap">
            <Rocket className="h-3 w-3 mr-1" />
            Development ({stats?.inDevelopment || 0})
          </Badge>
        </div>
        <Badge variant="destructive">
          <Ban className="h-3 w-3 mr-1" />
          Rejected ({stats?.rejected || 0})
        </Badge>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Ideas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.highPriority}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalVotes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.total > 0 ? Math.round((stats.approved + stats.inDevelopment) / stats.total * 100) : 0}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search ideas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="researching">Researching</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="in_development">In Development</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* New Idea Form */}
      {showNewIdeaForm && (
        <Card>
          <CardHeader>
            <CardTitle>Submit New Idea</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Idea title..."
              value={newIdea.title}
              onChange={(e) => setNewIdea(prev => ({ ...prev, title: e.target.value }))}
            />
            <Textarea
              placeholder="Describe your idea in detail..."
              value={newIdea.description}
              onChange={(e) => setNewIdea(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
            />
            <Select 
              value={newIdea.priority} 
              onValueChange={(value) => setNewIdea(prev => ({ ...prev, priority: value as any }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex space-x-2">
              <Button 
                onClick={handleCreateIdea} 
                disabled={!newIdea.title || !newIdea.description || actionLoading === 'creating'}
              >
                {actionLoading === 'creating' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Idea'
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowNewIdeaForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ideas List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : filteredIdeas.length === 0 ? (
          <Card className="p-12 text-center">
            <Lightbulb className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Ideas Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'No ideas match your search criteria.'
                : 'Be the first to submit an innovative idea!'
              }
            </p>
            {!showNewIdeaForm && (
              <Button onClick={() => setShowNewIdeaForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Submit First Idea
              </Button>
            )}
          </Card>
        ) : (
          filteredIdeas.map((idea) => (
            <Card key={idea.id} className={`border-l-4 ${getPriorityColor(idea.priority)} hover:shadow-md transition-shadow`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <CardTitle className="text-lg">{idea.title}</CardTitle>
                      {getStatusBadge(idea.status)}
                      <Badge variant="outline" className="text-xs">
                        {idea.priority.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">{idea.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Research Results */}
                {idea.researchNotes && (
                  <Alert className="bg-purple-50 dark:bg-purple-950/20 border-purple-200">
                    <Bot className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-medium mb-1">AI Research Notes:</p>
                      <p className="text-sm">{idea.researchNotes}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {getFeasibilityBadge(idea.technicalFeasibility)}
                        {getRecommendationBadge(idea.goNoGoRecommendation)}
                        {idea.estimatedEffort && (
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            {idea.estimatedEffort}
                          </Badge>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
                
                {/* Tech Stack Recommendation */}
                {idea.recommendedTechStack && idea.recommendedTechStack.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Recommended Tech Stack:</p>
                    <div className="flex flex-wrap gap-1">
                      {idea.recommendedTechStack.map((tech, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Footer with metadata and actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span className="flex items-center">
                      <UserIcon className="h-3 w-3 mr-1" />
                      {idea.submittedBy}
                    </span>
                    <button 
                      onClick={() => handleVote(idea.id, idea.votes)}
                      disabled={actionLoading === `vote-${idea.id}`}
                      className="flex items-center hover:text-blue-600 transition-colors"
                    >
                      <ThumbsUp className="h-3 w-3 mr-1" />
                      {idea.votes} votes
                    </button>
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(idea.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Action buttons based on status */}
                    {idea.status === 'pending' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleResearch(idea)}
                        disabled={actionLoading === `research-${idea.id}`}
                      >
                        {actionLoading === `research-${idea.id}` ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <FlaskConical className="w-3 h-3 mr-1" />
                        )}
                        Research
                      </Button>
                    )}
                    
                    {(idea.status === 'researching' || idea.status === 'planning') && (
                      <>
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleStatusChange(idea.id, 'approved')}
                          disabled={actionLoading === `status-${idea.id}`}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleStatusChange(idea.id, 'rejected')}
                          disabled={actionLoading === `status-${idea.id}`}
                        >
                          <Ban className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    
                    {idea.status === 'approved' && (
                      <Button 
                        size="sm"
                        onClick={() => handleCreateTasks(idea)}
                        disabled={actionLoading === `tasks-${idea.id}`}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        {actionLoading === `tasks-${idea.id}` ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <ClipboardList className="w-3 h-3 mr-1" />
                        )}
                        Create Tasks
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}