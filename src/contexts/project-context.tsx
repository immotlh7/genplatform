"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export interface Project {
  id: string
  name: string
  description?: string
  status: 'active' | 'archived' | 'deleted'
  priority: 'high' | 'medium' | 'low'
  createdAt: string
  updatedAt: string
}

export interface ProjectContextType {
  currentProject: Project | null
  projects: Project[]
  loading: boolean
  setCurrentProject: (project: Project | null) => void
  refreshProjects: () => Promise<void>
  createProject: (data: { name: string; description?: string; priority?: 'high' | 'medium' | 'low' }) => Promise<Project>
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>
  archiveProject: (id: string) => Promise<void>
  deleteProject: (id: string) => Promise<void>
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

export function useProject() {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider')
  }
  return context
}

interface ProjectProviderProps {
  children: ReactNode
}

// Mock projects for development
const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'GenPlatform.ai',
    description: 'AI-powered development platform',
    status: 'active',
    priority: 'high',
    createdAt: '2026-03-18T00:00:00Z',
    updatedAt: '2026-03-18T22:50:00Z'
  },
  {
    id: '2', 
    name: 'Personal Dashboard',
    description: 'OpenClaw personal control dashboard',
    status: 'active',
    priority: 'medium',
    createdAt: '2026-03-18T10:00:00Z',
    updatedAt: '2026-03-18T22:50:00Z'
  },
  {
    id: '3',
    name: 'Mobile App',
    description: 'React Native companion app',
    status: 'archived',
    priority: 'low',
    createdAt: '2026-03-10T00:00:00Z',
    updatedAt: '2026-03-15T12:00:00Z'
  }
]

export function ProjectProvider({ children }: ProjectProviderProps) {
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      setLoading(true)
      
      // Try to fetch from database first
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('priority', { ascending: false })
        .order('updated_at', { ascending: false })

      if (error) {
        console.log('Using mock projects (database not available):', error.message)
        // Use mock data when database is not available
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
        // Use mock data when no projects in database
        setProjects(MOCK_PROJECTS)
        setCurrentProject(MOCK_PROJECTS[0])
      }
    } catch (error) {
      console.error('Error loading projects:', error)
      // Fallback to mock data
      setProjects(MOCK_PROJECTS)
      setCurrentProject(MOCK_PROJECTS[0])
    } finally {
      setLoading(false)
    }
  }

  const refreshProjects = async () => {
    await loadProjects()
  }

  const createProject = async (data: { name: string; description?: string; priority?: 'high' | 'medium' | 'low' }): Promise<Project> => {
    try {
      const newProject = {
        name: data.name,
        description: data.description || '',
        status: 'active',
        priority: data.priority || 'medium'
      }

      const { data: project, error } = await supabase
        .from('projects')
        .insert([newProject])
        .select()
        .single()

      if (error) throw error

      const formattedProject: Project = {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        priority: project.priority,
        createdAt: project.created_at,
        updatedAt: project.updated_at
      }

      setProjects(prev => [formattedProject, ...prev])
      
      return formattedProject
    } catch (error) {
      console.error('Error creating project:', error)
      
      // Mock creation for development
      const mockProject: Project = {
        id: Date.now().toString(),
        name: data.name,
        description: data.description || '',
        status: 'active',
        priority: data.priority || 'medium',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      setProjects(prev => [mockProject, ...prev])
      return mockProject
    }
  }

  const updateProject = async (id: string, updates: Partial<Project>): Promise<void> => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          name: updates.name,
          description: updates.description,
          status: updates.status,
          priority: updates.priority,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      setProjects(prev => prev.map(p => 
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      ))

      if (currentProject?.id === id) {
        setCurrentProject(prev => prev ? { ...prev, ...updates, updatedAt: new Date().toISOString() } : null)
      }
    } catch (error) {
      console.error('Error updating project:', error)
      
      // Mock update for development
      setProjects(prev => prev.map(p => 
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      ))

      if (currentProject?.id === id) {
        setCurrentProject(prev => prev ? { ...prev, ...updates, updatedAt: new Date().toISOString() } : null)
      }
    }
  }

  const archiveProject = async (id: string): Promise<void> => {
    await updateProject(id, { status: 'archived' })
  }

  const deleteProject = async (id: string): Promise<void> => {
    await updateProject(id, { status: 'deleted' })
  }

  const value: ProjectContextType = {
    currentProject,
    projects,
    loading,
    setCurrentProject,
    refreshProjects,
    createProject,
    updateProject,
    archiveProject,
    deleteProject
  }

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  )
}