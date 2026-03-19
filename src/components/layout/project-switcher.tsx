"use client"

import { useState } from 'react'
import { Check, ChevronsUpDown, FolderOpen, Plus, Settings, Archive } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { PriorityBadge, PriorityIndicator } from '@/components/ui/priority-badge'
import { CreateProjectDialog } from '@/components/project/create-project-dialog'
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
import { useProjects, type Project } from '@/contexts/project-context'

interface ProjectSwitcherProps {
  className?: string
}

export function ProjectSwitcher({ className }: ProjectSwitcherProps) {
  const [open, setOpen] = useState(false)
  const { currentProject, projects, setCurrentProject, loading, refreshProjects } = useProjects()

  // Sort projects by priority (high -> medium -> low), then by name
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  const sortedProjects = [...projects].sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (priorityDiff !== 0) return priorityDiff
    return a.name.localeCompare(b.name)
  })

  const activeProjects = sortedProjects.filter(p => p.status === 'active')
  const archivedProjects = sortedProjects.filter(p => p.status === 'archived')

  const handleSelectProject = (project: Project) => {
    setCurrentProject(project)
    setOpen(false)
  }

  const handleProjectCreated = async () => {
    await refreshProjects()
    setOpen(false)
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
            className="h-8 justify-between min-w-[200px]"
          >
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <FolderOpen className="h-4 w-4 shrink-0" />
              {currentProject && (
                <PriorityIndicator priority={currentProject.priority} className="shrink-0" />
              )}
              <span className="truncate text-sm">
                {currentProject?.name || 'Select project'}
              </span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
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
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <Check
                          className={cn(
                            "h-4 w-4 shrink-0",
                            currentProject?.id === project.id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        <PriorityIndicator priority={project.priority} className="shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{project.name}</div>
                          {project.description && (
                            <div className="truncate text-xs text-muted-foreground">
                              {project.description}
                            </div>
                          )}
                        </div>
                      </div>
                      <PriorityBadge 
                        priority={project.priority}
                        size="sm"
                        className="ml-2 shrink-0"
                      />
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
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <Archive className="h-4 w-4 shrink-0" />
                          <PriorityIndicator priority={project.priority} className="shrink-0 opacity-50" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate">{project.name}</div>
                            {project.description && (
                              <div className="truncate text-xs text-muted-foreground">
                                {project.description}
                              </div>
                            )}
                          </div>
                        </div>
                        <PriorityBadge 
                          priority={project.priority}
                          size="sm"
                          className="ml-2 shrink-0 opacity-50"
                        />
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            <CommandSeparator />
            <CommandGroup>
              <CreateProjectDialog onSuccess={handleProjectCreated}>
                <CommandItem
                  onSelect={(e) => e.preventDefault()}
                  className="text-sm cursor-pointer"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </CommandItem>
              </CreateProjectDialog>
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