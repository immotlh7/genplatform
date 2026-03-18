"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

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
  createdAt?: string
  updatedAt?: string
  metadata?: {
    framework?: string
    language?: string
    environment?: string
    [key: string]: any
  }
}

interface ProjectContextType {
  // Current project state
  currentProject: Project | null
  setCurrentProject: (project: Project | null) => void
  
  // All projects
  projects: Project[]
  setProjects: (projects: Project[]) => void
  
  // Loading states
  loading: boolean
  setLoading: (loading: boolean) => void
  
  // Project operations
  createProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Project>
  updateProject: (id: string, updates: Partial<Project>) => Promise<Project | null>
  deleteProject: (id: string) => Promise<boolean>
  archiveProject: (id: string) => Promise<boolean>
  starProject: (id: string) => Promise<boolean>
  
  // Project queries
  getProjectById: (id: string) => Project | null
  getActiveProjects: () => Project[]
  getStarredProjects: () => Project[]
  searchProjects: (query: string) => Project[]
  
  // Project statistics
  getProjectStats: (id: string) => {
    completionPercentage: number
    overdueTasks: number
    activeTasks: number
    recentActivity: boolean
  } | null
  
  // Project filters
  filterByStatus: (status: Project['status']) => Project[]
  filterByPriority: (priority: Project['priority']) => Project[]
  
  // Utility functions
  refreshProjects: () => Promise<void>
  clearCache: () => void
  
  // Project switching
  switchToProject: (project: Project | null) => void
  switchToPreviousProject: () => void
  recentProjects: Project[]
}

const ProjectContext = createContext<ProjectContextType | null>(null)

interface ProjectProviderProps {
  children: ReactNode
  initialProject?: Project | null
}

export function ProjectProvider({ children, initialProject = null }: ProjectProviderProps) {
  const [currentProject, setCurrentProjectState] = useState<Project | null>(initialProject)
  const [projects, setProjectsState] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [recentProjects, setRecentProjects] = useState<Project[]>([])
  const [previousProject, setPreviousProject] = useState<Project | null>(null)

  // Load projects on mount
  useEffect(() => {
    loadProjects()
    loadRecentProjects()
    loadSavedProject()
  }, [])

  // Save current project to localStorage
  useEffect(() => {
    if (currentProject) {
      localStorage.setItem('genplatform-current-project', JSON.stringify(currentProject))
      updateRecentProjects(currentProject)
    } else {
      localStorage.removeItem('genplatform-current-project')
    }
  }, [currentProject])

  const loadProjects = async () => {
    setLoading(true)
    try {
      // Mock API call - in real app, this would call /api/projects
      await new Promise(resolve => setTimeout(resolve, 500))
      
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
          isStarred: true,
          ownerId: 'user-1',
          createdAt: '2026-03-15T10:00:00Z',
          updatedAt: new Date().toISOString(),
          metadata: {
            framework: 'Next.js',
            language: 'TypeScript',
            environment: 'production'
          }
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
          isStarred: true,
          ownerId: 'user-1',
          createdAt: '2026-03-16T14:00:00Z',
          updatedAt: new Date().toISOString(),
          metadata: {
            framework: 'Node.js',
            language: 'JavaScript',
            environment: 'development'
          }
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
          lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          ownerId: 'user-1',
          createdAt: '2026-03-14T09:00:00Z',
          updatedAt: new Date().toISOString()
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
          lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          ownerId: 'user-1',
          createdAt: '2026-03-10T16:00:00Z',
          updatedAt: new Date().toISOString()
        }
      ]
      
      setProjectsState(mockProjects)
      
      // Auto-select first active project if none selected
      if (!currentProject && mockProjects.length > 0) {
        const firstActive = mockProjects.find(p => p.status === 'active')
        if (firstActive) {
          setCurrentProject(firstActive)
        }
      }
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadRecentProjects = () => {
    try {
      const saved = localStorage.getItem('genplatform-recent-projects')
      if (saved) {
        const parsed = JSON.parse(saved)
        setRecentProjects(Array.isArray(parsed) ? parsed : [])
      }
    } catch (error) {
      console.error('Error loading recent projects:', error)
    }
  }

  const loadSavedProject = () => {
    try {
      const saved = localStorage.getItem('genplatform-current-project')
      if (saved && !currentProject) {
        const parsed = JSON.parse(saved)
        setCurrentProjectState(parsed)
      }
    } catch (error) {
      console.error('Error loading saved project:', error)
    }
  }

  const updateRecentProjects = (project: Project) => {
    setRecentProjects(prev => {
      const filtered = prev.filter(p => p.id !== project.id)
      const updated = [project, ...filtered].slice(0, 5) // Keep last 5
      localStorage.setItem('genplatform-recent-projects', JSON.stringify(updated))
      return updated
    })
  }

  const setCurrentProject = (project: Project | null) => {
    if (currentProject && project?.id !== currentProject.id) {
      setPreviousProject(currentProject)
    }
    setCurrentProjectState(project)
  }

  // Project operations
  const createProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> => {
    try {
      const newProject: Project = {
        ...projectData,
        id: `project-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 800))
      
      setProjectsState(prev => [newProject, ...prev])
      return newProject
    } catch (error) {
      console.error('Error creating project:', error)
      throw error
    }
  }

  const updateProject = async (id: string, updates: Partial<Project>): Promise<Project | null> => {
    try {
      const updatedProject = {
        ...updates,
        updatedAt: new Date().toISOString()
      }

      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setProjectsState(prev => 
        prev.map(project => 
          project.id === id 
            ? { ...project, ...updatedProject }
            : project
        )
      )

      // Update current project if it's the one being updated
      if (currentProject?.id === id) {
        setCurrentProject({ ...currentProject, ...updatedProject })
      }

      return projects.find(p => p.id === id) || null
    } catch (error) {
      console.error('Error updating project:', error)
      throw error
    }
  }

  const deleteProject = async (id: string): Promise<boolean> => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setProjectsState(prev => prev.filter(project => project.id !== id))
      
      // Clear current project if it's the one being deleted
      if (currentProject?.id === id) {
        setCurrentProject(null)
      }

      return true
    } catch (error) {
      console.error('Error deleting project:', error)
      return false
    }
  }

  const archiveProject = async (id: string): Promise<boolean> => {
    try {
      await updateProject(id, { status: 'archived' })
      return true
    } catch (error) {
      console.error('Error archiving project:', error)
      return false
    }
  }

  const starProject = async (id: string): Promise<boolean> => {
    try {
      const project = projects.find(p => p.id === id)
      if (project) {
        await updateProject(id, { isStarred: !project.isStarred })
        return true
      }
      return false
    } catch (error) {
      console.error('Error starring project:', error)
      return false
    }
  }

  // Project queries
  const getProjectById = (id: string): Project | null => {
    return projects.find(project => project.id === id) || null
  }

  const getActiveProjects = (): Project[] => {
    return projects.filter(project => project.status === 'active')
  }

  const getStarredProjects = (): Project[] => {
    return projects.filter(project => project.isStarred === true)
  }

  const searchProjects = (query: string): Project[] => {
    if (!query.trim()) return projects
    
    const lowercaseQuery = query.toLowerCase()
    return projects.filter(project =>
      project.name.toLowerCase().includes(lowercaseQuery) ||
      project.description?.toLowerCase().includes(lowercaseQuery) ||
      project.metadata?.framework?.toLowerCase().includes(lowercaseQuery) ||
      project.metadata?.language?.toLowerCase().includes(lowercaseQuery)
    )
  }

  const getProjectStats = (id: string) => {
    const project = getProjectById(id)
    if (!project) return null

    const completionPercentage = project.tasksCount > 0 
      ? Math.round((project.completedTasks / project.tasksCount) * 100)
      : 0
    
    const lastActivityTime = new Date(project.lastActivity).getTime()
    const recentActivity = Date.now() - lastActivityTime < 24 * 60 * 60 * 1000 // Within 24 hours

    return {
      completionPercentage,
      overdueTasks: 0, // Would calculate from actual task data
      activeTasks: project.tasksCount - project.completedTasks,
      recentActivity
    }
  }

  // Project filters
  const filterByStatus = (status: Project['status']): Project[] => {
    return projects.filter(project => project.status === status)
  }

  const filterByPriority = (priority: Project['priority']): Project[] => {
    return projects.filter(project => project.priority === priority)
  }

  // Utility functions
  const refreshProjects = async (): Promise<void> => {
    await loadProjects()
  }

  const clearCache = (): void => {
    localStorage.removeItem('genplatform-current-project')
    localStorage.removeItem('genplatform-recent-projects')
    setRecentProjects([])
  }

  // Project switching
  const switchToProject = (project: Project | null): void => {
    setCurrentProject(project)
  }

  const switchToPreviousProject = (): void => {
    if (previousProject) {
      const temp = currentProject
      setCurrentProject(previousProject)
      setPreviousProject(temp)
    }
  }

  const contextValue: ProjectContextType = {
    // State
    currentProject,
    setCurrentProject,
    projects,
    setProjects: setProjectsState,
    loading,
    setLoading,
    
    // Operations
    createProject,
    updateProject,
    deleteProject,
    archiveProject,
    starProject,
    
    // Queries
    getProjectById,
    getActiveProjects,
    getStarredProjects,
    searchProjects,
    getProjectStats,
    
    // Filters
    filterByStatus,
    filterByPriority,
    
    // Utilities
    refreshProjects,
    clearCache,
    
    // Switching
    switchToProject,
    switchToPreviousProject,
    recentProjects
  }

  return (
    <ProjectContext.Provider value={contextValue}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProject() {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider')
  }
  return context
}

// Additional helper hooks
export function useCurrentProject() {
  const { currentProject } = useProject()
  return currentProject
}

export function useProjectStats(projectId?: string) {
  const { getProjectStats, currentProject } = useProject()
  const targetId = projectId || currentProject?.id
  return targetId ? getProjectStats(targetId) : null
}

export function useProjectOperations() {
  const { 
    createProject, 
    updateProject, 
    deleteProject, 
    archiveProject, 
    starProject,
    refreshProjects 
  } = useProject()
  
  return {
    createProject,
    updateProject,
    deleteProject,
    archiveProject,
    starProject,
    refreshProjects
  }
}

export function useProjectFilters() {
  const { 
    getActiveProjects,
    getStarredProjects,
    searchProjects,
    filterByStatus,
    filterByPriority 
  } = useProject()
  
  return {
    getActiveProjects,
    getStarredProjects,
    searchProjects,
    filterByStatus,
    filterByPriority
  }
}