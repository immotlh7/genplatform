"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { 
  ChevronDown,
  Plus,
  Search,
  Target,
  Folder,
  CheckCircle,
  Clock,
  Pause,
  Archive,
  Star,
  RefreshCw,
  Settings,
  ExternalLink,
  AlertCircle,
  Zap,
  Users,
  Calendar
} from 'lucide-react'

interface Project {
  id: string
  name: string
  description?: string
  status: 'active' | 'paused' | 'completed' | 'archived'
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  color: string
  avatar?: string
  tasksCount: number
  completedTasks: number
  teamSize: number
  lastActivity: string
  deployUrl?: string
  githubUrl?: string
  isStarred?: boolean
  ownerId?: string
}

interface ProjectSwitcherProps {
  selectedProject?: Project | null
  onProjectChange: (project: Project | null) => void
  onCreateProject?: () => void
  className?: string
  showCreateButton?: boolean
  compact?: boolean
}

export function ProjectSwitcher({ 
  selectedProject, 
  onProjectChange, 
  onCreateProject,
  className = "",
  showCreateButton = true,
  compact = false
}: ProjectSwitcherProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    setLoading(true)
    try {
      // Mock project loading - in real app, this would call /api/projects
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const mockProjects: Project[] = [
        {
          id: 'genplatform',
          name: 'GenPlatform.ai',
          description: 'Mission Control Dashboard for AI agents and automation',
          status: 'active',
          priority: 'HIGH',
          color: '#3b82f6',
          tasksCount: 23,
          completedTasks: 15,
          teamSize: 3,
          lastActivity: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          deployUrl: 'https://genplatform-six.vercel.app',
          githubUrl: 'https://github.com/immotlh7/genplatform',
          isStarred: true
        },
        {
          id: 'commander-enhancement',
          name: 'Commander Enhancement',
          description: 'Arabic-to-English command translation system',
          status: 'active',
          priority: 'HIGH',
          color: '#059669',
          tasksCount: 8,
          completedTasks: 6,
          teamSize: 2,
          lastActivity: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          isStarred: true
        },
        {
          id: 'agent-skills',
          name: 'Agent Skills Library',
          description: 'Collection of reusable skills for AI agents',
          status: 'active',
          priority: 'MEDIUM',
          color: '#7c3aed',
          tasksCount: 12,
          completedTasks: 8,
          teamSize: 1,
          lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'memory-system',
          name: 'Memory System',
          description: 'Distributed knowledge management',
          status: 'paused',
          priority: 'LOW',
          color: '#dc2626',
          tasksCount: 5,
          completedTasks: 2,
          teamSize: 1,
          lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'docs-portal',
          name: 'Documentation Portal',
          description: 'Comprehensive documentation and guides',
          status: 'completed',
          priority: 'MEDIUM',
          color: '#0891b2',
          tasksCount: 15,
          completedTasks: 15,
          teamSize: 2,
          lastActivity: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          deployUrl: 'https://docs.genplatform.ai'
        },
        {
          id: 'legacy-migration',
          name: 'Legacy Migration',
          description: 'Migrating old systems to new platform',
          status: 'archived',
          priority: 'LOW',
          color: '#6b7280',
          tasksCount: 20,
          completedTasks: 20,
          teamSize: 4,
          lastActivity: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
      
      setProjects(mockProjects)
      
      // Auto-select first active project if none selected
      if (!selectedProject) {
        const firstActive = mockProjects.find(p => p.status === 'active')
        if (firstActive) {
          onProjectChange(firstActive)
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading projects:', error);
      }
    } finally {
      setLoading(false)
    }
  }

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeProjects = filteredProjects.filter(p => p.status === 'active')
  const recentProjects = filteredProjects.filter(p => p.status !== 'archived').slice(0, 5)
  const starredProjects = filteredProjects.filter(p => p.isStarred)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-3 w-3 text-green-600" />
      case 'paused': return <Pause className="h-3 w-3 text-yellow-600" />
      case 'completed': return <CheckCircle className="h-3 w-3 text-blue-600" />
      case 'archived': return <Archive className="h-3 w-3 text-gray-600" />
      default: return <Clock className="h-3 w-3 text-gray-600" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'text-red-600'
      case 'MEDIUM': return 'text-yellow-600'
      case 'LOW': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const calculateProgress = (project: Project) => {
    return project.tasksCount > 0 ? Math.round((project.completedTasks / project.tasksCount) * 100) : 0
  }

  const getProjectInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
  }

  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={`justify-between min-w-32 ${className}`}>
            <div className="flex items-center space-x-2">
              {selectedProject ? (
                <>
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: selectedProject.color }}
                  />
                  <span className="truncate max-w-20">{selectedProject.name}</span>
                </>
              ) : (
                <>
                  <Target className="h-3 w-3" />
                  <span>Projects</span>
                </>
              )}
            </div>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          {activeProjects.slice(0, 4).map((project) => (
            <DropdownMenuItem
              key={project.id}
              onClick={() => onProjectChange(project)}
              className="flex items-center space-x-3 py-2"
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={project.avatar} />
                <AvatarFallback 
                  className="text-xs text-white"
                  style={{ backgroundColor: project.color }}
                >
                  {getProjectInitials(project.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1">
                  <span className="truncate font-medium text-sm">{project.name}</span>
                  {project.isStarred && <Star className="h-3 w-3 text-yellow-500" />}
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                {calculateProgress(project)}%
              </Badge>
            </DropdownMenuItem>
          ))}
          {showCreateButton && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onCreateProject}>
                <Plus className="h-3 w-3 mr-2" />
                New Project
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="justify-between min-w-80">
            <div className="flex items-center space-x-3">
              {selectedProject ? (
                <>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={selectedProject.avatar} />
                    <AvatarFallback 
                      className="text-sm text-white font-medium"
                      style={{ backgroundColor: selectedProject.color }}
                    >
                      {getProjectInitials(selectedProject.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <div className="font-medium truncate">{selectedProject.name}</div>
                      {selectedProject.isStarred && (
                        <Star className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center space-x-2">
                      <span>{selectedProject.completedTasks}/{selectedProject.tasksCount} tasks</span>
                      <span>•</span>
                      <span className={getPriorityColor(selectedProject.priority)}>
                        {selectedProject.priority}
                      </span>
                      <span>•</span>
                      <span>{formatTimeAgo(selectedProject.lastActivity)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-muted">
                      <Target className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <div>Select Project</div>
                    <div className="text-xs text-muted-foreground">Choose your workspace</div>
                  </div>
                </>
              )}
            </div>
            <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-96">
          {/* Search */}
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>

          {/* Clear Selection */}
          {selectedProject && (
            <>
              <DropdownMenuItem 
                onClick={() => onProjectChange(null)}
                className="text-orange-600 mx-2"
              >
                <Target className="h-4 w-4 mr-2" />
                Clear Project Selection
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Starred Projects */}
          {starredProjects.length > 0 && (
            <>
              <DropdownMenuLabel className="flex items-center space-x-2 px-3">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>Starred</span>
              </DropdownMenuLabel>
              <DropdownMenuGroup className="mx-2">
                {starredProjects.map((project) => (
                  <DropdownMenuItem
                    key={`starred-${project.id}`}
                    onClick={() => onProjectChange(project)}
                    className={`flex items-center justify-between py-3 rounded ${
                      selectedProject?.id === project.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={project.avatar} />
                        <AvatarFallback 
                          className="text-xs text-white font-medium"
                          style={{ backgroundColor: project.color }}
                        >
                          {getProjectInitials(project.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm truncate">{project.name}</span>
                          {getStatusIcon(project.status)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {project.completedTasks}/{project.tasksCount} tasks • {project.teamSize} team
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <Badge variant="outline" className="text-xs">
                        {calculateProgress(project)}%
                      </Badge>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Active Projects */}
          <DropdownMenuLabel className="flex items-center space-x-2 px-3">
            <Zap className="h-4 w-4 text-green-500" />
            <span>Active Projects</span>
          </DropdownMenuLabel>
          <DropdownMenuGroup className="mx-2 max-h-60 overflow-y-auto">
            {activeProjects.map((project) => (
              <DropdownMenuItem
                key={project.id}
                onClick={() => onProjectChange(project)}
                className={`flex items-center justify-between py-3 rounded ${
                  selectedProject?.id === project.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center space-x-3 flex-1">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={project.avatar} />
                    <AvatarFallback 
                      className="text-xs text-white font-medium"
                      style={{ backgroundColor: project.color }}
                    >
                      {getProjectInitials(project.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm truncate">{project.name}</span>
                      <span className={`text-xs ${getPriorityColor(project.priority)}`}>
                        {project.priority}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {project.completedTasks}/{project.tasksCount} tasks • {formatTimeAgo(project.lastActivity)}
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 flex items-center space-x-2">
                  {project.deployUrl && (
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {calculateProgress(project)}%
                  </Badge>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>

          {/* No Results */}
          {filteredProjects.length === 0 && !loading && (
            <div className="p-6 text-center text-muted-foreground">
              <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No projects found</p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="p-6 text-center">
              <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading projects...</p>
            </div>
          )}

          {/* Actions */}
          <DropdownMenuSeparator />
          <DropdownMenuGroup className="mx-2">
            {showCreateButton && onCreateProject && (
              <DropdownMenuItem onClick={onCreateProject}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Project
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={loadProjects}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Projects
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="h-4 w-4 mr-2" />
              Project Settings
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}