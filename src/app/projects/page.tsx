"use client"

import { NoProjectsEmptyState } from "@/components/ui/empty-states"
import { CardGridSkeleton } from "@/components/ui/page-skeleton"
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  FolderOpen, 
  Plus, 
  Archive, 
  Clock, 
  Calendar, 
  GitBranch,
  ExternalLink,
  MessageSquare,
  Rocket,
  Eye,
  MoreHorizontal
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Project {
  id: string
  name: string
  description: string
  status: 'active' | 'paused' | 'completed' | 'archived'
  progress: number
  priority: 'high' | 'medium' | 'low'
  githubUrl?: string
  previewUrl?: string
  techStack: string[]
  createdAt: string
  lastActivity: string
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'paused' | 'completed' | 'archived'>('all')

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/projects?archived=true')
      const data = await response.json()
      if (data.projects) {
        setProjects(data.projects)
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateProjectStatus = async (projectId: string, status: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (response.ok) {
        fetchProjects() // Refresh the list
      }
    } catch (error) {
      console.error('Failed to update project:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      archived: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
    return <Badge className={styles[status as keyof typeof styles] || ''}>{status}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const styles = {
      high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      medium: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      low: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
    return <Badge variant="outline" className={styles[priority as keyof typeof styles] || ''}>{priority}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`
    return formatDate(dateString)
  }

  const filteredProjects = filter === 'all' 
    ? projects 
    : projects.filter(p => p.status === filter)

  if (loading) {
    return (
      <div className="container max-w-7xl mx-auto p-6">
        <div className="space-y-6">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="h-64 animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-full mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-7xl mx-auto p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground">
              Manage and track your development projects
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b pb-4">
          {['all', 'active', 'paused', 'completed', 'archived'].map(status => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter(status as any)}
              className="capitalize"
            >
              {status}
              <Badge variant="secondary" className="ml-2">
                {projects.filter(p => status === 'all' || p.status === status).length}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Projects Grid */}
        {loading ? (
          <CardGridSkeleton count={6} />
        ) : filteredProjects.length === 0 ? (
          <div className="col-span-full">
            <NoProjectsEmptyState />
          </div>
        ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map(project => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <CardDescription className="mt-1 line-clamp-2">
                      {project.description}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Open Chat
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Rocket className="mr-2 h-4 w-4" />
                        Deploy
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {project.status === 'active' && (
                        <DropdownMenuItem onClick={() => updateProjectStatus(project.id, 'paused')}>
                          Pause Project
                        </DropdownMenuItem>
                      )}
                      {project.status === 'paused' && (
                        <DropdownMenuItem onClick={() => updateProjectStatus(project.id, 'active')}>
                          Resume Project
                        </DropdownMenuItem>
                      )}
                      {project.status !== 'archived' && (
                        <DropdownMenuItem onClick={() => updateProjectStatus(project.id, 'archived')}>
                          Archive Project
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Status and Priority */}
                <div className="flex gap-2 mt-3">
                  {getStatusBadge(project.status)}
                  {getPriorityBadge(project.priority)}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>

                {/* Tech Stack */}
                <div className="flex flex-wrap gap-1">
                  {project.techStack.slice(0, 3).map((tech, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                  {project.techStack.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{project.techStack.length - 3}
                    </Badge>
                  )}
                </div>

                {/* Links and Activity */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex gap-2">
                    {project.githubUrl && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                          <GitBranch className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {project.previewUrl && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <a href={project.previewUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="mr-1 h-3 w-3" />
                    {getRelativeTime(project.lastActivity)}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Eye className="mr-2 h-3 w-3" />
                    View
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <MessageSquare className="mr-2 h-3 w-3" />
                    Chat
                  </Button>
                  <Button size="sm" className="flex-1">
                    <Rocket className="mr-2 h-3 w-3" />
                    Deploy
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        )}
      </div>
    </div>
  )
}