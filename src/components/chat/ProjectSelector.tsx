"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { 
  FolderOpen, 
  ChevronDown, 
  Plus, 
  Search, 
  CheckCircle,
  Clock,
  Pause,
  Archive,
  Star,
  Target,
  RefreshCw,
  Settings,
  ExternalLink
} from 'lucide-react'

interface Project {
  id: string
  name: string
  description?: string
  status: 'active' | 'paused' | 'completed' | 'archived'
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  tasksCount: number
  completedTasks: number
  lastActivity: string
  isStarred?: boolean
  color?: string
}

interface ProjectSelectorProps {
  selectedProject?: Project | null
  onProjectChange: (project: Project | null) => void
  onCreateProject?: () => void
  className?: string
  variant?: 'compact' | 'full'
}

export function ProjectSelector({ 
  selectedProject, 
  onProjectChange, 
  onCreateProject,
  className = "",
  variant = 'full'
}: ProjectSelectorProps) {
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
      // Mock project loading
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const mockProjects: Project[] = [
        {
          id: 'genplatform',
          name: 'GenPlatform.ai',
          description: 'Mission Control Dashboard for AI agents and automation',
          status: 'active',
          priority: 'HIGH',
          tasksCount: 23,
          completedTasks: 15,
          lastActivity: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          isStarred: true,
          color: '#3b82f6'
        },
        {
          id: 'commander-enhancement',
          name: 'Commander Enhancement',
          description: 'Arabic-to-English command translation system',
          status: 'active',
          priority: 'HIGH',
          tasksCount: 8,
          completedTasks: 6,
          lastActivity: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          isStarred: true,
          color: '#059669'
        },
        {
          id: 'agent-skills',
          name: 'Agent Skills Library',
          description: 'Collection of reusable skills for AI agents',
          status: 'active',
          priority: 'MEDIUM',
          tasksCount: 12,
          completedTasks: 8,
          lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          color: '#7c3aed'
        },
        {
          id: 'memory-system',
          name: 'Memory System',
          description: 'Distributed knowledge management',
          status: 'paused',
          priority: 'LOW',
          tasksCount: 5,
          completedTasks: 2,
          lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          color: '#dc2626'
        },
        {
          id: 'docs-portal',
          name: 'Documentation Portal',
          description: 'Comprehensive documentation and guides',
          status: 'completed',
          priority: 'MEDIUM',
          tasksCount: 15,
          completedTasks: 15,
          lastActivity: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          color: '#0891b2'
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
      console.error('Error loading projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeProjects = filteredProjects.filter(p => p.status === 'active')
  const otherProjects = filteredProjects.filter(p => p.status !== 'active')

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-3 w-3 text-green-600" />
      case 'paused': return <Pause className="h-3 w-3 text-yellow-600" />
      case 'completed': return <CheckCircle className="h-3 w-3 text-blue-600" />
      case 'archived': return <Archive className="h-3 w-3 text-gray-600" />
      default: return <Clock className="h-3 w-3 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'paused': return 'bg-yellow-500'
      case 'completed': return 'bg-blue-500'
      case 'archived': return 'bg-gray-500'
      default: return 'bg-gray-500'
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

  if (variant === 'compact') {
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
                  <span className="truncate max-w-24">{selectedProject.name}</span>
                </>
              ) : (
                <>
                  <FolderOpen className="h-3 w-3" />
                  <span>Select Project</span>
                </>
              )}
            </div>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {filteredProjects.slice(0, 5).map((project) => (
            <DropdownMenuItem
              key={project.id}
              onClick={() => onProjectChange(project)}
              className="flex items-center space-x-2 py-2"
            >
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: project.color }}
              />
              <span className="flex-1 truncate">{project.name}</span>
              {project.isStarred && <Star className="h-3 w-3 text-yellow-500" />}
            </DropdownMenuItem>
          ))}
          {onCreateProject && (
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
          <Button variant="outline" className="justify-between min-w-64">
            <div className="flex items-center space-x-3">
              {selectedProject ? (
                <>
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedProject.color }}
                  />
                  <div className="text-left">
                    <div className="font-medium">{selectedProject.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {selectedProject.completedTasks}/{selectedProject.tasksCount} tasks
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Target className="h-4 w-4" />
                  <div className="text-left">
                    <div>Select Project Context</div>
                    <div className="text-xs text-muted-foreground">Choose project for commands</div>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {selectedProject && (
                <Badge variant="outline" className="text-xs">
                  {calculateProgress(selectedProject)}%
                </Badge>
              )}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </div>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-80">
          {/* Search */}
          <div className="p-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 h-8 text-sm"
              />
            </div>
          </div>

          {/* Clear Selection */}
          {selectedProject && (
            <>
              <DropdownMenuItem 
                onClick={() => onProjectChange(null)}
                className="text-orange-600"
              >
                <Target className="h-3 w-3 mr-2" />
                Clear Project Context
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Active Projects */}
          {activeProjects.length > 0 && (
            <>
              <DropdownMenuLabel className="flex items-center space-x-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Active Projects</span>
              </DropdownMenuLabel>
              <DropdownMenuGroup>
                {activeProjects.map((project) => (
                  <DropdownMenuItem
                    key={project.id}
                    onClick={() => onProjectChange(project)}
                    className={`flex items-center justify-between py-3 ${
                      selectedProject?.id === project.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">{project.name}</span>
                          {project.isStarred && <Star className="h-3 w-3 text-yellow-500" />}
                          <span className={`text-xs ${getPriorityColor(project.priority)}`}>
                            {project.priority}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {project.completedTasks}/{project.tasksCount} tasks • {formatTimeAgo(project.lastActivity)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs">
                        {calculateProgress(project)}%
                      </Badge>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </>
          )}

          {/* Other Projects */}
          {otherProjects.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Other Projects</DropdownMenuLabel>
              <DropdownMenuGroup>
                {otherProjects.map((project) => (
                  <DropdownMenuItem
                    key={project.id}
                    onClick={() => onProjectChange(project)}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex items-center space-x-2 flex-1">
                      {getStatusIcon(project.status)}
                      <span className="text-sm text-muted-foreground">{project.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {project.status}
                    </Badge>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </>
          )}

          {/* No Results */}
          {filteredProjects.length === 0 && !loading && (
            <div className="p-4 text-center text-muted-foreground">
              <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No projects found</p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="p-4 text-center">
              <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading projects...</p>
            </div>
          )}

          {/* Actions */}
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {onCreateProject && (
              <DropdownMenuItem onClick={onCreateProject}>
                <Plus className="h-3 w-3 mr-2" />
                Create New Project
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={loadProjects}>
              <RefreshCw className="h-3 w-3 mr-2" />
              Refresh Projects
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="h-3 w-3 mr-2" />
              Project Settings
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Selected Project Info */}
      {selectedProject && variant === 'full' && (
        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="h-3 w-3 text-blue-600" />
              <span className="text-xs font-medium text-blue-900 dark:text-blue-100">
                Context: {selectedProject.name}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {calculateProgress(selectedProject)}% complete
              </Badge>
              {selectedProject.deployUrl && (
                <Button variant="ghost" size="sm" className="h-5 px-1">
                  <ExternalLink className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
          {selectedProject.description && (
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              {selectedProject.description}
            </p>
          )}
        </div>
      )}
    </div>
  )
}