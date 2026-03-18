"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Lightbulb, 
  Plus, 
  Search,
  Filter,
  TrendingUp,
  Clock,
  User,
  Zap,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lock,
  Shield,
  Sparkles
} from 'lucide-react'
import { getCurrentUserClient, getUserPermissionSummary } from '@/lib/access-control'
import type { User } from '@/lib/access-control'

interface Idea {
  id: string
  title: string
  description: string
  status: 'new' | 'reviewing' | 'approved' | 'rejected' | 'implementing'
  priority: 'low' | 'medium' | 'high'
  category: string
  author: string
  created_at: string
  votes: number
  comments: number
  tags: string[]
  workflow_status?: string
}

export default function IdeasPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userPermissions, setUserPermissions] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showNewIdeaForm, setShowNewIdeaForm] = useState(false)
  const [newIdea, setNewIdea] = useState({
    title: '',
    description: '',
    category: '',
    tags: ''
  })

  useEffect(() => {
    checkUserAccess()
  }, [])

  useEffect(() => {
    if (currentUser && userPermissions?.canRead) {
      loadIdeas()
    }
  }, [currentUser, userPermissions])

  const checkUserAccess = async () => {
    setAuthLoading(true)
    try {
      const user = await getCurrentUserClient()
      setCurrentUser(user)

      if (user) {
        const permissions = getUserPermissionSummary(user)
        setUserPermissions({
          canRead: permissions.isManager || permissions.isAdmin || user.role === 'VIEWER', // Ideas viewable by all authenticated users
          canCreate: permissions.isManager || permissions.isAdmin, // Creating ideas requires MANAGER+
          canApprove: permissions.isAdmin, // Approving ideas requires ADMIN+
          canImplement: permissions.isManager || permissions.isAdmin
        })
      }
    } catch (error) {
      console.error('Error checking user access:', error)
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
        if (data.ideas) {
          setIdeas(data.ideas)
        }
      } else {
        // Use demo data for now
        const demoIdeas: Idea[] = [
          {
            id: '1',
            title: 'AI-Powered Code Review Assistant',
            description: 'An AI assistant that automatically reviews code changes and provides intelligent suggestions for improvements, security issues, and best practices.',
            status: 'approved',
            priority: 'high',
            category: 'AI/ML',
            author: currentUser?.displayName || 'Med',
            created_at: '2026-03-18T10:30:00Z',
            votes: 12,
            comments: 5,
            tags: ['ai', 'code-review', 'automation'],
            workflow_status: 'implementing'
          },
          {
            id: '2',
            title: 'Real-time Collaboration Dashboard',
            description: 'A dashboard where team members can see who is working on what in real-time, with live code editing indicators and communication features.',
            status: 'reviewing',
            priority: 'medium',
            category: 'Collaboration',
            author: 'Team Lead',
            created_at: '2026-03-18T14:20:00Z',
            votes: 8,
            comments: 3,
            tags: ['realtime', 'collaboration', 'dashboard']
          },
          {
            id: '3',
            title: 'Automated Testing Pipeline',
            description: 'Set up comprehensive automated testing that runs on every commit, including unit tests, integration tests, and security scans.',
            status: 'new',
            priority: 'medium',
            category: 'DevOps',
            author: 'QA Engineer',
            created_at: '2026-03-18T16:15:00Z',
            votes: 6,
            comments: 2,
            tags: ['testing', 'automation', 'ci-cd']
          }
        ]
        setIdeas(demoIdeas)
      }
    } catch (error) {
      console.error('Error loading ideas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateIdea = async () => {
    if (!userPermissions?.canCreate) return

    try {
      const response = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...newIdea,
          tags: newIdea.tags.split(',').map(tag => tag.trim()).filter(Boolean),
          author: currentUser?.displayName
        })
      })

      if (response.ok) {
        const data = await response.json()
        setIdeas(prev => [data.idea, ...prev])
        setNewIdea({ title: '', description: '', category: '', tags: '' })
        setShowNewIdeaForm(false)
      }
    } catch (error) {
      console.error('Error creating idea:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-blue-100 text-blue-800"><Sparkles className="h-3 w-3 mr-1" />New</Badge>
      case 'reviewing':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Reviewing</Badge>
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
      case 'implementing':
        return <Badge className="bg-purple-100 text-purple-800"><Zap className="h-3 w-3 mr-1" />Implementing</Badge>
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

  const filteredIdeas = ideas.filter(idea => {
    const matchesSearch = idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         idea.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || idea.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Show loading state during auth check
  if (authLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  // Show access denied state
  if (!currentUser || !userPermissions?.canRead) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-2">
              <Lightbulb className="h-8 w-8 text-yellow-600" />
              <span>Ideas Lab</span>
            </h1>
            <p className="text-muted-foreground">Innovation and idea management</p>
          </div>
        </div>

        <Card className="flex-1 flex items-center justify-center py-12">
          <CardContent className="text-center space-y-6 max-w-md">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
              <Lock className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Access Required</h3>
              <p className="text-muted-foreground mb-4">
                You need to be signed in to access the Ideas Lab.
              </p>
              {currentUser ? (
                <Badge variant="outline">
                  Current Role: {currentUser.role}
                </Badge>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Please sign in to view and create ideas.
                </p>
              )}
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
            <span>Ideas Lab</span>
          </h1>
          <p className="text-muted-foreground">
            Innovation hub for new features and improvements
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {userPermissions?.canCreate && (
            <Button onClick={() => setShowNewIdeaForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Idea
            </Button>
          )}
        </div>
      </div>

      {/* Permission indicator */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 text-blue-600" />
            <span className="font-medium">Ideas Lab Access:</span>
            <Badge variant="outline" className={userPermissions?.canCreate ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}>
              {userPermissions?.canCreate ? 'Create & View' : 'View Only'}
            </Badge>
            {userPermissions?.canApprove && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700">
                Can Approve
              </Badge>
            )}
          </div>
          <Badge className="bg-blue-500 text-white">
            {currentUser.role}
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Ideas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ideas.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{ideas.filter(i => i.status === 'approved').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{ideas.filter(i => i.status === 'reviewing').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Implementing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{ideas.filter(i => i.status === 'implementing').length}</div>
          </CardContent>
        </Card>
      </div>

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
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="reviewing">Reviewing</option>
              <option value="approved">Approved</option>
              <option value="implementing">Implementing</option>
            </select>
          </div>
        </CardHeader>
      </Card>

      {/* New Idea Form */}
      {showNewIdeaForm && userPermissions?.canCreate && (
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
            <Input
              placeholder="Category (e.g., AI/ML, Frontend, Backend)"
              value={newIdea.category}
              onChange={(e) => setNewIdea(prev => ({ ...prev, category: e.target.value }))}
            />
            <Input
              placeholder="Tags (comma separated)"
              value={newIdea.tags}
              onChange={(e) => setNewIdea(prev => ({ ...prev, tags: e.target.value }))}
            />
            <div className="flex space-x-2">
              <Button onClick={handleCreateIdea} disabled={!newIdea.title || !newIdea.description}>
                Submit Idea
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
          <div className="text-center py-8">Loading ideas...</div>
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
            {userPermissions?.canCreate && !showNewIdeaForm && (
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
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span className="flex items-center">
                      <User className="h-3 w-3 mr-1" />
                      {idea.author}
                    </span>
                    <span className="flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {idea.votes} votes
                    </span>
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(idea.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    {idea.workflow_status && (
                      <Badge className="bg-orange-100 text-orange-800">
                        🤖 {idea.workflow_status}
                      </Badge>
                    )}
                    {userPermissions?.canApprove && idea.status === 'reviewing' && (
                      <>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                          <XCircle className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                {idea.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {idea.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}