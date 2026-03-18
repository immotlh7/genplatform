"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PriorityBadge } from '@/components/ui/priority-badge'
import { Plus, AlertTriangle, Circle, ArrowUp, Loader2 } from 'lucide-react'
import { useProject } from '@/contexts/project-context'

interface CreateProjectDialogProps {
  children?: React.ReactNode
  onSuccess?: () => void
}

export function CreateProjectDialog({ children, onSuccess }: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const { createProject } = useProject()

  const priorityOptions = [
    {
      value: 'high' as const,
      label: 'High Priority',
      description: 'Critical projects requiring immediate attention',
      icon: AlertTriangle,
      color: 'text-red-500'
    },
    {
      value: 'medium' as const,
      label: 'Medium Priority', 
      description: 'Important projects in active development',
      icon: Circle,
      color: 'text-yellow-500'
    },
    {
      value: 'low' as const,
      label: 'Low Priority',
      description: 'Background projects or maintenance tasks',
      icon: ArrowUp,
      color: 'text-green-500'
    }
  ]

  const resetForm = () => {
    setName('')
    setDescription('')
    setPriority('medium')
    setError('')
  }

  const handleClose = () => {
    setOpen(false)
    resetForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      setError('Project name is required')
      return
    }

    setCreating(true)
    setError('')

    try {
      const newProject = await createProject({
        name: name.trim(),
        description: description.trim(),
        priority
      })
      
      console.log('Project created:', newProject)
      onSuccess?.(
)
      handleClose()
    } catch (error) {
      console.error('Error creating project:', error)
      setError('Failed to create project. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Add a new project to your workspace. Projects help organize your tasks and workflows.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name *</Label>
            <Input
              id="project-name"
              placeholder="Enter project name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={creating}
              className={error && !name.trim() ? 'border-red-500' : ''}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              placeholder="Brief description of the project..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={creating}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-priority">Priority</Label>
            <Select value={priority} onValueChange={setPriority} disabled={creating}>
              <SelectTrigger id="project-priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map((option) => {
                  const Icon = option.icon
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center space-x-2">
                        <Icon className={`h-4 w-4 ${option.color}`} />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {priorityOptions.find(p => p.value === priority)?.description}
            </p>
          </div>

          {/* Preview */}
          <div className="space-y-2 p-3 bg-muted rounded-lg">
            <Label className="text-sm font-medium">Preview</Label>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 flex-1">
                <span className="text-sm font-medium">
                  {name || 'Project Name'}
                </span>
                <PriorityBadge priority={priority} size="sm" />
              </div>
            </div>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={creating}>
              Cancel
            </Button>
            <Button type="submit" disabled={creating || !name.trim()}>
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}