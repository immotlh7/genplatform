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
  Plus
} from 'lucide-react'

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

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showNewProject, setShowNewProject] = useState(false)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    // Demo project data
    const demoProjects: Project[] = [
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

    setProjects(demoProjects)
    setLoading(false)
  }

  const handleProjectClick = (project: Project) => {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">
            Manage and monitor your development projects
          </p>
        </div>
        <Button onClick={() => setShowNewProject(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

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
          {projects.map((project) => (
            <Card 
              key={project.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleProjectClick(project)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
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
                      <Button 
                        size="sm" 
                        variant="outline" 
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                          <Github className="h-3 w-3" />
                        </a>
                      </Button>
                    )}
                    {project.deployUrl && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <a href={project.deployUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      <ProjectDetailModal 
        project={selectedProject}
        open={showDetail}
        onOpenChange={setShowDetail}
      />

      <NewProjectModal 
        open={showNewProject}
        onOpenChange={setShowNewProject}
        onSubmit={handleNewProject}
      />
    </div>
  )
}