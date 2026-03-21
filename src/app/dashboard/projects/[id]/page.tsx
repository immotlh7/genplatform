"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { FilesViewer } from '@/components/projects/FilesViewer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ExternalLink, Settings, MessageSquare, RefreshCw, Loader2, Activity } from 'lucide-react'
import { ProjectPipeline } from '@/components/projects/ProjectPipeline'
import { ActiveAgents } from '@/components/projects/ActiveAgents'
import { ExecutionLog } from '@/components/projects/ExecutionLog'
import Link from 'next/link'

interface Project {
  id: string
  name: string
  description: string
  status: string
  progress: number
  previewUrl?: string
  deployUrl?: string
  githubUrl?: string
  techStack: string[]
  totalTasks?: number
  tasksCompleted?: number
  lastDeployedAt?: string
  pipeline?: any
}

interface LiveLogEntry {
  time: string
  message: string
  type: string
}

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.id as string
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<any[]>([])
  const [liveLog, setLiveLog] = useState<LiveLogEntry[]>([])
  const [previewKey, setPreviewKey] = useState(0)

  useEffect(() => {
    loadProject()
    loadTasks()
  }, [projectId])

  // SSE connection for live updates
  useEffect(() => {
    let es: EventSource | null = null
    try {
      es = new EventSource('/api/events')
      es.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data)
          
          // Only handle events for this project (or global events)
          if (event.data?.projectId && event.data.projectId !== projectId) return
          
          // Add to live log
          setLiveLog(prev => [{
            time: new Date().toLocaleTimeString('en', { hour12: false }),
            message: event.data?.message || event.type,
            type: event.type
          }, ...prev].slice(0, 20))
          
          // Refresh task counts if a task was completed
          if (event.type === 'task_complete') {
            loadTasks()
          }
          
          // Refresh preview on build success
          if (event.type === 'build_success' || event.type === 'app_restarted') {
            setTimeout(() => setPreviewKey(Date.now()), 2000)
          }
        } catch {}
      }
    } catch {}
    return () => { es?.close() }
  }, [projectId])

  const loadProject = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`)
      if (res.ok) {
        const data = await res.json()
        setProject(data)
      }
    } catch {} finally { setLoading(false) }
  }

  const loadTasks = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks`)
      if (res.ok) {
        const data = await res.json()
        setTasks(data.tasks || [])
      }
    } catch {}
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  )

  if (!project) return (
    <div className="p-6 text-center">
      <p className="text-muted-foreground">Project not found</p>
      <Link href="/dashboard/projects"><Button variant="outline" className="mt-4">Back to Projects</Button></Link>
    </div>
  )

  const doneTasks = tasks.filter(t => t.status === 'done').length
  const totalTasks = tasks.length || project.totalTasks || 0
  const previewUrl = project.previewUrl || project.deployUrl

  return (
    <div className="space-y-4 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
              {project.name[0]}
            </div>
            <div>
              <h1 className="text-xl font-bold">{project.name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className="capitalize text-xs">{project.status}</Badge>
                <span className="text-xs text-muted-foreground">{project.progress}% complete</span>
                {previewUrl && (
                  <a href={previewUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                    {previewUrl.replace('https://', '')}
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { loadProject(); loadTasks() }}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Link href={`/dashboard/claude`}>
            <Button size="sm" className="gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" /> Chat
            </Button>
          </Link>
        </div>
      </div>

      {/* Tech stack */}
      {project.techStack?.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {project.techStack.map(t => (
            <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
          ))}
        </div>
      )}

      <Tabs defaultValue="pipeline">
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({totalTasks})</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="live">Live Feed</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Pipeline Tab */}
        <TabsContent value="pipeline" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <ProjectPipeline
                projectId={projectId}
                progress={project.progress}
                currentPhase="development"
                tasksDone={doneTasks}
                tasksTotal={totalTasks}
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Active Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <ActiveAgents projectId={projectId} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Live Execution Log</CardTitle>
              </CardHeader>
              <CardContent>
                <ExecutionLog />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks">
          <Card>
            <CardHeader className="pb-2 flex-row items-center justify-between">
              <CardTitle className="text-sm">Tasks</CardTitle>
              <Button size="sm" variant="outline" className="text-xs h-7">+ Add Task</Button>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No tasks yet</p>
              ) : (
                <div className="space-y-2">
                  {tasks.slice(0, 30).map(task => (
                    <div key={task.id} className="flex items-center gap-3 p-2.5 rounded-lg border hover:bg-accent/30 text-sm">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        task.status === 'done' ? 'bg-green-500' :
                        task.status === 'in_progress' ? 'bg-amber-500 animate-pulse' :
                        'bg-gray-400'
                      }`} />
                      <span className="flex-1 truncate">{task.name || task.title}</span>
                      {task.department && <Badge variant="secondary" className="text-[10px]">{task.department}</Badge>}
                      <Badge variant="outline" className="text-[10px] flex-shrink-0">{task.status}</Badge>
                    </div>
                  ))}
                  {tasks.length > 30 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      +{tasks.length - 30} more tasks
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview">
          <Card>
            <CardContent className="pt-4">
              {previewUrl ? (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm text-muted-foreground">{previewUrl}</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setPreviewKey(Date.now())}>
                        <RefreshCw className="h-3 w-3" /> Refresh
                      </Button>
                      <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                          <ExternalLink className="h-3 w-3" /> Open
                        </Button>
                      </a>
                    </div>
                  </div>
                  <div className="border rounded-lg overflow-hidden bg-white" style={{ height: '500px' }}>
                    <iframe key={previewKey} src={previewUrl} className="w-full h-full" title="Preview" />
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-sm">No preview URL configured</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files">
          <Card>
            <CardContent className="pt-4">
              <FilesViewer projectId={projectId} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Live Feed Tab */}
        <TabsContent value="live">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-500" />
                Live Activity Feed
                {liveLog.length > 0 && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {liveLog.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Waiting for live events...</p>
                  <p className="text-xs text-muted-foreground mt-1">Events will appear here as agents work on the project</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {liveLog.map((entry, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded text-xs bg-muted/30">
                      <span className="text-muted-foreground font-mono flex-shrink-0">{entry.time}</span>
                      <span className={`flex-shrink-0 ${
                        entry.type === 'build_success' ? 'text-green-500' :
                        entry.type === 'build_fail' ? 'text-red-500' :
                        entry.type === 'task_complete' ? 'text-blue-500' :
                        entry.type === 'file_modified' ? 'text-yellow-500' :
                        'text-muted-foreground'
                      }`}>
                        {entry.type === 'build_success' ? '✅' :
                         entry.type === 'build_fail' ? '❌' :
                         entry.type === 'task_complete' ? '✔️' :
                         entry.type === 'file_modified' ? '📝' : '📡'}
                      </span>
                      <span className="text-foreground">{entry.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <label className="text-sm font-medium">Description</label>
                <p className="text-sm text-muted-foreground mt-1">{project.description || 'No description'}</p>
              </div>
              {project.githubUrl && (
                <div>
                  <label className="text-sm font-medium">GitHub</label>
                  <a href={project.githubUrl} target="_blank" rel="noopener noreferrer"
                    className="block text-sm text-blue-500 hover:underline mt-1">{project.githubUrl}</a>
                </div>
              )}
              <Link href={`/projects/${projectId}`}>
                <Button variant="outline" size="sm">Edit in full settings</Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
