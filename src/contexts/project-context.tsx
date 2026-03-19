// src/contexts/project-context.tsx
'use client'

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import type { Project } from '@/types/projects'

interface ProjectContextType {
  projects: Project[]
  currentProject: Project | null
  setCurrentProject: (project: Project | null) => void
  refreshProjects: () => Promise<void>
  isLoading: boolean
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshProjects = async () => {
    try {
      setIsLoading(true)

      // Fetch from Bridge API
      try {
        const response = await fetch('/api/bridge/projects')
        if (response.ok) {
          const data = await response.json()
          if (data.projects) {
            setProjects(data.projects)
            
            // Set current project if not set
            if (!currentProject && data.projects.length > 0) {
              setCurrentProject(data.projects[0])
            }
            return
          }
        }
      } catch (error) {
        console.error('Error fetching from Bridge API:', error)
      }
      
      setProjects([])
    } catch (error) {
      console.error('Error loading projects:', error)
      setProjects([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshProjects()
  }, [])

  return (
    <ProjectContext.Provider 
      value={{ 
        projects, 
        currentProject, 
        setCurrentProject, 
        refreshProjects,
        isLoading 
      }}
    >
      {children}
    </ProjectContext.Provider>
  )
}

export function useProjects() {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider')
  }
  return context
}