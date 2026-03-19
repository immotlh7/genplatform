'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Project {
  id: string
  name: string
  description?: string
  status: 'active' | 'paused' | 'completed'
  priority: number
  createdAt?: string
  updatedAt?: string
}

interface ProjectContextType {
  projects: Project[]
  currentProject: Project | null
  setCurrentProject: (project: Project | null) => void
  loading: boolean
  refreshProjects: () => Promise<void>
}

const MOCK_PROJECTS: Project[] = [
  {
    id: '001',
    name: 'GenPlatform.ai',
    description: 'Main development project for GenPlatform.ai mission control dashboard',
    status: 'active',
    priority: 10,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: '002',
    name: 'AI Agent Framework',
    description: 'Core framework for managing and orchestrating AI agents',
    status: 'active',
    priority: 8,
    createdAt: '2024-01-20T14:30:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: '003',
    name: 'Documentation Site',
    description: 'Public documentation and API reference',
    status: 'paused',
    priority: 5,
    createdAt: '2024-02-01T09:15:00Z',
    updatedAt: new Date().toISOString()
  }
]

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

export function useProjects() {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider')
  }
  return context
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProjects = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('priority', { ascending: false })
        .order('updated_at', { ascending: false })

      if (error) {
        console.log('Loading projects from hardcoded data:', error.message)
        setProjects(MOCK_PROJECTS)
        setCurrentProject(MOCK_PROJECTS[0])
        return
      }

      if (data && data.length > 0) {
        const formattedProjects: Project[] = data.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          status: p.status,
          priority: p.priority,
          createdAt: p.created_at,
          updatedAt: p.updated_at
        }))
        
        setProjects(formattedProjects)
        
        // Set first active project as current
        const activeProject = formattedProjects.find(p => p.status === 'active')
        setCurrentProject(activeProject || formattedProjects[0] || null)
      } else {
        setProjects(MOCK_PROJECTS)
        setCurrentProject(MOCK_PROJECTS[0])
      }
    } catch (error) {
      console.error('Error loading projects:', error)
      setProjects(MOCK_PROJECTS)
      setCurrentProject(MOCK_PROJECTS[0])
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    loadProjects()
  }, [])

  const refreshProjects = async () => {
    await loadProjects()
  }

  // Listen for project changes
  useEffect(() => {
    const subscription = supabase
      .channel('projects-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'projects'
      }, () => {
        refreshProjects()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <ProjectContext.Provider value={{
      projects,
      currentProject,
      setCurrentProject,
      loading,
      refreshProjects
    }}>
      {children}
    </ProjectContext.Provider>
  )
}