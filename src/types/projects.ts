export interface Project {
  id: string
  name: string
  description?: string
  slug?: string
  status: string
  progress: number
  priority?: string
  color?: string
  initials?: string
  techStack?: string[]
  technologies?: string[]
  deployUrl?: string
  previewUrl?: string
  subdomain?: string
  repoPath?: string
  githubUrl?: string
  pipeline?: Record<string, any>
  agents?: any[]
  createdAt?: string
  lastActivity?: string
  totalTasks?: number
  tasksCompleted?: number
}
