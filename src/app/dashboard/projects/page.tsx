"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ProjectDetailModal } from '@/components/projects/project-detail-modal'
import { NewProjectModal } from '@/components/projects/new-project-modal'
import { 
  Github, 
  ExternalLink, 
  Play, 
  Pause, 
  Settings,
  Plus,
  Eye,
  Lock,
  Edit,
  MessageSquare,
  AlertCircle
} from 'lucide-react'
import { getCurrentUserClient, canAccessProject, getAccessLevel } from '@/lib/access-control'
import type { User } from '@/lib/access-control'
import { supabase } from '@/lib/supabase'

interface Project {
  id: string
  name: string
  description: string
  status: 'active' | 'paused' | 'completed' | 'archived'
  progress: number
  githubUrl?: string
  deployUrl?: string
  lastActivity: string
  technologies: string[]
  createdAt?: string
  team?: string[]
  commits?: number
}

interface ProjectFormData {
  name: string
  description: string
  githubUrl: string
  deployUrl: string
  technologies: string[]
}

interface ProjectAccess {
  projectId: string
  canAccess: boolean
  accessLevel: 'ADMIN' | 'MANAGER' | 'VIEWER' | null
}

export default function ProjectsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [projectAccess, setProjectAccess] = useState<ProjectAccess[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showNewProject, setShowNewProject] = useState(false)

  useEffect(() => {
    loadProjectsAndAccess()
  }, [])

  const loadProjectsAndAccess = async () => {
    setLoading(true)

    try {
      // Get current user
      let user = await getCurrentUserClient().catch(() => null)
      if (!user) {
        user = { id: '1', name: 'Med', email: 'owner@genplatform.ai', role: 'OWNER' as any, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      }
      setCurrentUser(user)

      if (!user) {
        setLoading(false)
        return
      }

      // Load projects from Supabase or demo data
      let allProjects: Project[]
      
      try {
        const { data: supabaseProjects, error } = await supabase
          .from('projects')
          .select('*')
          .neq('status', 'deleted')
          .order('created_at', { ascending: false })

        if (error) throw error

        // Convert Supabase data to Project interface
        allProjects = supabaseProjects?.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          status: p.status,
          progress: p.progress,
          githubUrl: p.github_repo,
          deployUrl: p.vercel_url,
          lastActivity: p.updated_at,
          technologies: Array.isArray(p.tech_stack) ? p.tech_stack : [],
          createdAt: p.created_at,
          commits: 0 // Will be populated from GitHub API later
        })) || []
      } catch (supabaseError) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Failed to load projects from Supabase, using demo data:', supabaseError);
        }
        
        // Fallback to demo data
        allProjects = [
          {
            id: 'genplatform',
            name: 'GenPlatform.ai',
            description: 'Mission Control Dashboard for AI agents and automation',
            status: 'active',
            progress: 75,
            githubUrl: 'https://github.com/immotlh7/genplatform',
            deployUrl: 'https://genplatform-six.vercel.app',
            lastActivity: new Date().toISOString(),
            technologies: ['Next.js', 'TypeScript', 'Tailwind', 'shadcn/ui'],
            createdAt: '2026-03-18T03:00:00Z',
            commits: 47
          },
          {
            id: 'agent-skills',
            name: 'Agent Skills Library',
            description: 'Collection of reusable skills for AI agents',
            status: 'active',
            progress: 45,
            githubUrl: 'https://github.com/openclaw/skills',
            lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            technologies: ['Python', 'TypeScript', 'CLI'],
            createdAt: '2026-03-15T10:00:00Z',
            commits: 23
          },
          {
            id: 'memory-system',
            name: 'Distributed Memory System',
            description: 'Scalable memory and knowledge management for AI',
            status: 'paused',
            progress: 20,
            lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            technologies: ['Node.js', 'PostgreSQL', 'Vector DB'],
            createdAt: '2026-03-10T15:00:00Z',
            commits: 12
          }
        ]
      }

      // Get access levels for each project
      const accessPromises = allProjects.map(async (project) => {
        if (user.role === 'OWNER' || user.role === 'ADMIN') {
          return {
            projectId: project.id,
            canAccess: true,
            accessLevel: 'ADMIN' as const
          }
        }

        const canAccess = await canAccessProject(user.id, project.id)
        const accessLevel = canAccess ? await getAccessLevel(user.id, project.id) : null

        return {
          projectId: project.id,
          canAccess,
          accessLevel
        }
      })

      const access = await Promise.all(accessPromises)
      setProjectAccess(access)

      // Filter projects based on access
      const accessibleProjects = allProjects.filter(project =>
        access.find(a => a.projectId === project.id)?.canAccess
      )

      setProjects(accessibleProjects)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading projects:', error);
      }
    } finally {
      setLoading(false)
    }
  }

  const getProjectAccess = (projectId: string) => {
    return projectAccess.find(a => a.projectId === projectId)
  }

  const canUserEdit = (projectId: string) => {
    if (!currentUser) return false
    if (currentUser.role === 'OWNER') return true

    const access = getProjectAccess(projectId)
    return access?.accessLevel === 'ADMIN' || access?.accessLevel === 'MANAGER'
  }

  const canUserDelete = (projectId: string) => {
    if (!currentUser) return false
    return currentUser.role === 'OWNER'
  }

  const canUserSendCommand = (projectId: string) => {
    if (!currentUser) return false
    if (currentUser.role === 'OWNER') return true

    const access = getProjectAccess(projectId)
    return access?.accessLevel === 'ADMIN' || access?.accessLevel === 'MANAGER'
  }

  const handleProjectClick = (project: Project) => {
    router.push(`/dashboard/projects/${project.id}`)
    return; // below kept for reference only
    setSelectedProject(project)
    setShowDetail(true)
  }

  const handleNewProject = (formData: ProjectFormData) => {
    const newProject: Project = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description,
      status: 'active',
      progress: 0,
      githubUrl: formData.githubUrl || undefined,
      deployUrl: formData.deployUrl || undefined,
      lastActivity: new Date().toISOString(),
      technologies: formData.technologies,
      createdAt: new Date().toISOString(),
      commits: 0
    }

    setProjects(prev => [newProject, ...prev])
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

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    return `${Math.floor(diffInHours / 24)}d ago`
  }

  const getAccessIcon = (projectId: string) => {
    const access = getProjectAccess(projectId)
    if (!access?.accessLevel) return <Lock className="h-3 w-3" />
    
    switch (access.accessLevel) {
      case 'ADMIN': return <Settings className="h-3 w-3" />
      case 'MANAGER': return <Edit className="h-3 w-3" />
      case 'VIEWER': return <Eye className="h-3 w-3" />
      default: return <Lock className="h-3 w-3" />
    }
  }

  const getAccessColor = (projectId: string) => {
    const access = getProjectAccess(projectId)
    if (!access?.accessLevel) return 'text-gray-500'
    
    switch (access.accessLevel) {
      case 'ADMIN': return 'text-red-500'
      case 'MANAGER': return 'text-blue-500'
      case 'VIEWER': return 'text-green-500'
      default: return 'text-gray-500'
    }
  }

  // Show access denied if user has no accessible projects and not owner/admin
  if (!loading && currentUser && currentUser.role !== 'OWNER' && currentUser.role !== 'ADMIN' && projects.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-muted-foreground">
              Your assigned projects
            </p>
          </div>
        </div>

        <Card className="text-center py-12">
          <CardContent>
            <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Projects Assigned</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              You haven't been assigned to any projects yet. Contact your platform owner to request access to projects.
            </p>
            <Badge variant="outline" className="mb-4">
              {currentUser.role} Access
            </Badge>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">
            {currentUser?.role === 'OWNER' || currentUser?.role === 'ADMIN' 
              ? 'Manage and monitor all development projects'
              : `Your assigned projects (${projects.length})`
            }
          </p>
        </div>
        {/* Only OWNER and ADMIN can create new projects */}
        {currentUser && (currentUser.role === 'OWNER' || currentUser.role === 'ADMIN') && (
          <Button onClick={() => setShowNewProject(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        )}
      </div>

      {/* Access level indicator for non-owners */}
      {currentUser && currentUser.role !== 'OWNER' && projects.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Badge className="bg-blue-500 text-white">
              {currentUser.role}
            </Badge>
            <span className="text-sm text-blue-900 dark:text-blue-100">
              You have {currentUser.role.toLowerCase()} access to {projects.length} project{projects.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-muted rounded w-2/3"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const access = getProjectAccess(project.id)
            const isReadOnly = access?.accessLevel === 'VIEWER'
            
            return (
              <Card 
                key={project.id} 
                className={`hover:shadow-lg transition-shadow cursor-pointer ${
                  isReadOnly ? 'border-blue-200 bg-blue-50/30 dark:border-blue-800 dark:bg-blue-950/20' : ''
                }`}
                onClick={() => handleProjectClick(project)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        {isReadOnly && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            <Eye className="h-3 w-3 mr-1" />
                            Read-only
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {project.description}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`} />
                      <Badge variant="secondary" className="text-xs">
                        {project.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Access Level Indicator */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <span className={`${getAccessColor(project.id)}`}>
                        {getAccessIcon(project.id)}
                      </span>
                      <span className="text-xs font-medium">
                        {access?.accessLevel || 'No Access'}
                      </span>
                    </div>
                    {access?.accessLevel && (
                      <Badge variant="outline" className="text-xs">
                        {access.accessLevel}
                      </Badge>
                    )}
                  </div>

                  {/* Progress */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span>Progress</span>
                      <span>{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>

                  {/* Technologies */}
                  <div>
                    <div className="text-sm font-medium mb-2">Technologies</div>
                    <div className="flex flex-wrap gap-1">
                      {project.technologies.slice(0, 3).map((tech) => (
                        <Badge key={tech} variant="outline" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                      {project.technologies.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{project.technologies.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Last Activity */}
                  <div className="text-xs text-muted-foreground">
                    Last activity: {formatTimeAgo(project.lastActivity)}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex space-x-2">
                      {project.githubUrl && (
                        <a 
                          href={project.githubUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                        >
                          <Github className="h-3 w-3" />
                        </a>
                      )}
                      {project.deployUrl && (
                        <a 
                          href={project.deployUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>

                    {/* Role-specific action buttons */}
                    <div className="flex space-x-1">
                      {canUserSendCommand(project.id) && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            // TODO: Open command center for this project
                          }}
                        >
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Command
                        </Button>
                      )}
                      {canUserEdit(project.id) && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            // TODO: Open edit modal
                          }}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Read-only notice */}
                  {isReadOnly && (
                    <div className="text-xs text-blue-600 bg-blue-50 dark:bg-blue-950/30 p-2 rounded border border-blue-200 dark:border-blue-800">
                      👁️ Read-only access. Contact owner to request edit access.
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modals */}
      <ProjectDetailModal 
        project={selectedProject}
        open={showDetail}
        onOpenChange={setShowDetail}
      />

      {/* Only show new project modal for OWNER/ADMIN */}
      {currentUser && (currentUser.role === 'OWNER' || currentUser.role === 'ADMIN') && (
        <NewProjectModal 
          open={showNewProject}
          onOpenChange={setShowNewProject}
          onSubmit={handleNewProject}
        />
      )}
    </div>
  )
}