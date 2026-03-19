"use client"

import { useProjects } from '@/contexts/project-context'
import { CreateProjectDialog } from '@/components/project/create-project-dialog'
import { ProjectActions } from '@/components/project/project-actions'
import { PriorityBadge, PriorityIndicator } from '@/components/ui/priority-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FolderOpen, Plus, Archive, Clock, Calendar } from 'lucide-react'

export default function ProjectsPage() {
  const { projects, currentProject, setCurrentProject, loading, refreshProjects } = useProjects()

  // Sort projects by priority and status
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  const sortedProjects = [...projects].sort((a, b) => {
    // Active projects first
    if (a.status === 'active' && b.status !== 'active') return -1
    if (b.status === 'active' && a.status !== 'active') return 1
    
    // Then by priority
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (priorityDiff !== 0) return priorityDiff
    
    // Finally by name
    return a.name.localeCompare(b.name)
  })

  const activeProjects = sortedProjects.filter(p => p.status === 'active')
  const archivedProjects = sortedProjects.filter(p => p.status === 'archived')

  const handleProjectAction = async () => {
    await refreshProjects()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto p-6">
        <div className="space-y-6">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-muted-foreground">
            Manage your projects and organize your workflow
          </p>
        </div>
        <CreateProjectDialog onSuccess={handleProjectAction}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </CreateProjectDialog>
      </div>

      {/* Current Project Indicator */}
      {currentProject && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <FolderOpen className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Current Project</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <PriorityIndicator priority={currentProject.priority} />
                <div>
                  <h3 className="font-medium">{currentProject.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {currentProject.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <PriorityBadge priority={currentProject.priority} showIcon />
                <Badge variant={currentProject.status === 'active' ? 'default' : 'secondary'}>
                  {currentProject.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Projects */}
      <section>
        <div className="flex items-center space-x-2 mb-4">
          <h2 className="text-xl font-semibold">Active Projects</h2>
          <Badge variant="outline">{activeProjects.length}</Badge>
        </div>
        {activeProjects.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No active projects</h3>
              <p className="text-muted-foreground mb-4">
                Create your first project to get started
              </p>
              <CreateProjectDialog onSuccess={handleProjectAction}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              </CreateProjectDialog>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <PriorityIndicator priority={project.priority} />
                      <CardTitle className="text-base truncate">{project.name}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-1">
                      <PriorityBadge priority={project.priority} size="sm" />
                      <ProjectActions project={project} onActionComplete={handleProjectAction} />
                    </div>
                  </div>
                  {project.description && (
                    <CardDescription className="text-sm">
                      {project.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>Updated {formatDate(project.updatedAt)}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentProject(project)}
                      className={currentProject?.id === project.id ? 'bg-primary/10 text-primary' : ''}
                    >
                      {currentProject?.id === project.id ? 'Current' : 'Switch'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Archived Projects */}
      {archivedProjects.length > 0 && (
        <section>
          <div className="flex items-center space-x-2 mb-4">
            <Archive className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Archived Projects</h2>
            <Badge variant="outline">{archivedProjects.length}</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {archivedProjects.map((project) => (
              <Card key={project.id} className="opacity-75 hover:opacity-100 transition-opacity">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <Archive className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-base truncate">{project.name}</CardTitle>
                    </div>
                    <ProjectActions project={project} onActionComplete={handleProjectAction} />
                  </div>
                  {project.description && (
                    <CardDescription className="text-sm">
                      {project.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>Archived {formatDate(project.updatedAt)}</span>
                    </div>
                    <Badge variant="secondary">Archived</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}