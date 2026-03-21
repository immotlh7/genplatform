"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Github, ExternalLink, Plus, Folder, Loader2, RefreshCw
} from 'lucide-react'
import Link from 'next/link'

interface Project {
  id: string
  name: string
  description: string
  status: string
  progress: number
  githubUrl?: string
  deployUrl?: string
  previewUrl?: string
  lastActivity: string
  techStack?: string[]
  technologies?: string[]
  createdAt?: string
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/projects')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const raw = data.projects || data || []
      setProjects(raw.map((p: any) => ({
        id: p.id,
        name: p.name || 'Untitled',
        description: p.description || '',
        status: p.status || 'active',
        progress: p.progress || 0,
        githubUrl: p.githubUrl,
        deployUrl: p.deployUrl || p.previewUrl,
        previewUrl: p.previewUrl,
        lastActivity: p.lastActivity || p.createdAt || new Date().toISOString(),
        techStack: p.techStack || p.technologies || [],
        createdAt: p.createdAt,
      })))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    if (status === 'active') return 'bg-green-500'
    if (status === 'paused') return 'bg-yellow-500'
    if (status === 'completed') return 'bg-blue-500'
    return 'bg-gray-500'
  }

  const formatTimeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime()
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">
            {projects.length} project{projects.length !== 1 ? 's' : ''} managed
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadProjects} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" /> New Project
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-sm text-red-700 dark:text-red-300">
          Failed to load projects: {error}
          <Button variant="outline" size="sm" className="ml-4" onClick={loadProjects}>Retry</Button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20">
          <Folder className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
          <p className="text-muted-foreground">Create your first project to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
              <Card className="hover:shadow-lg transition-all cursor-pointer hover:border-blue-500/50 h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{project.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {project.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`} />
                      <Badge variant="secondary" className="text-xs capitalize">
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
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>

                  {/* Tech Stack */}
                  {(project.techStack || []).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {(project.techStack || []).slice(0, 4).map((tech) => (
                        <Badge key={tech} variant="outline" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(project.lastActivity)}
                    </span>
                    <div className="flex gap-1.5">
                      {project.githubUrl && (
                        <a href={project.githubUrl} target="_blank" rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-md border hover:bg-accent">
                          <Github className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {(project.deployUrl || project.previewUrl) && (
                        <a href={project.deployUrl || project.previewUrl} target="_blank" rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-md border hover:bg-accent">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
