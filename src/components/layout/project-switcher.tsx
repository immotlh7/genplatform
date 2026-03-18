"use client"

import { useState } from 'react'
import { Check, ChevronsUpDown, FolderOpen, Plus, Settings, Archive } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useProject, type Project } from '@/contexts/project-context'

interface ProjectSwitcherProps {
  className?: string
}

export function ProjectSwitcher({ className }: ProjectSwitcherProps) {
  const [open, setOpen] = useState(false)
  const { currentProject, projects, setCurrentProject, loading } = useProject()

  const activeProjects = projects.filter(p => p.status === 'active')
  const archivedProjects = projects.filter(p => p.status === 'archived')

  const handleSelectProject = (project: Project) => {
    setCurrentProject(project)
    setOpen(false)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-500'
      case 'medium': return 'bg-yellow-500/20 text-yellow-500'  
      case 'low': return 'bg-green-500/20 text-green-500'
      default: return 'bg-zinc-500/20 text-zinc-400'
    }
  }

  if (loading) {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        <div className="h-8 w-8 rounded bg-muted animate-pulse" />
        <div className="h-4 w-32 rounded bg-muted animate-pulse hidden sm:block" />
      </div>
    )
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select project"
            className="h-8 justify-between"
          >
            <div className="flex items-center space-x-2 min-w-0">
              <FolderOpen className="h-4 w-4 shrink-0" />
              <span className="truncate text-sm">
                {currentProject?.name || 'Select project'}
              </span>
              {currentProject && (
                <Badge 
                  variant="outline" 
                  className={`text-xs px-1.5 py-0.5 ${getPriorityColor(currentProject.priority)}`}
                >
                  {currentProject.priority}
                </Badge>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search projects..." />
            <CommandEmpty>No projects found.</CommandEmpty>
            
            {/* Active Projects */}
            {activeProjects.length > 0 && (
              <CommandGroup heading="Active Projects">
                {activeProjects.map((project) => (
                  <CommandItem
                    key={project.id}
                    onSelect={() => handleSelectProject(project)}
                    className="text-sm"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <Check
                          className={cn(
                            "h-4 w-4",
                            currentProject?.id === project.id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{project.name}</div>
                          {project.description && (
                            <div className="truncate text-xs text-muted-foreground">
                              {project.description}
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-xs px-1.5 py-0.5 ml-2 ${getPriorityColor(project.priority)}`}
                      >
                        {project.priority}
                      </Badge>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Archived Projects */}
            {archivedProjects.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Archived">
                  {archivedProjects.map((project) => (
                    <CommandItem
                      key={project.id}
                      onSelect={() => handleSelectProject(project)}
                      className="text-sm opacity-60"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <Archive className="h-4 w-4" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate">{project.name}</div>
                            {project.description && (
                              <div className="truncate text-xs text-muted-foreground">
                                {project.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false)
                  // TODO: Open new project dialog
                  console.log('Create new project')
                }}
                className="text-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  setOpen(false)
                  // Navigate to projects page
                  window.location.href = '/projects'
                }}
                className="text-sm"
              >
                <Settings className="h-4 w-4 mr-2" />
                Manage Projects
              </CommandItem>
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}