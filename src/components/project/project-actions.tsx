"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  MoreHorizontal,
  Archive,
  RotateCcw,
  Trash2,
  Settings,
  AlertTriangle
} from 'lucide-react'
import { useProjects, type Project } from '@/contexts/project-context'

interface ProjectActionsProps {
  project: Project
  onActionComplete?: () => void
  trigger?: React.ReactNode
}

export function ProjectActions({ project, onActionComplete, trigger }: ProjectActionsProps) {
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { archiveProject, deleteProject, updateProject } = useProjects()

  const handleArchive = async () => {
    try {
      setLoading(true)
      await archiveProject(project.id)
      onActionComplete?.()
    } catch (error) {
      console.error('Error archiving project:', error)
    } finally {
      setLoading(false)
      setArchiveDialogOpen(false)
    }
  }

  const handleRestore = async () => {
    try {
      setLoading(true)
      await updateProject(project.id, { status: 'active' })
      onActionComplete?.()
    } catch (error) {
      console.error('Error restoring project:', error)
    } finally {
      setLoading(false)
      setRestoreDialogOpen(false)
    }
  }

  const handleDelete = async () => {
    try {
      setLoading(true)
      await deleteProject(project.id)
      onActionComplete?.()
    } catch (error) {
      console.error('Error deleting project:', error)
    } finally {
      setLoading(false)
      setDeleteDialogOpen(false)
    }
  }

  const isArchived = project.status === 'archived'
  const isDeleted = project.status === 'deleted'

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {trigger || (
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{project.name}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Settings/Edit */}
          <DropdownMenuItem
            onClick={() => {
              // Navigate to project settings
              window.location.href = `/projects/${project.id}/settings`
            }}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Status-specific actions */}
          {!isArchived && !isDeleted && (
            <DropdownMenuItem
              onClick={() => setArchiveDialogOpen(true)}
              className="text-orange-600 focus:text-orange-600"
            >
              <Archive className="h-4 w-4 mr-2" />
              Archive Project
            </DropdownMenuItem>
          )}

          {isArchived && (
            <DropdownMenuItem
              onClick={() => setRestoreDialogOpen(true)}
              className="text-green-600 focus:text-green-600"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restore Project
            </DropdownMenuItem>
          )}

          {(isArchived || isDeleted) && (
            <DropdownMenuItem
              onClick={() => setDeleteDialogOpen(true)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Permanently
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive "{project.name}"? This will hide it from your active projects list, but you can restore it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchive}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
              ) : (
                <Archive className="h-4 w-4 mr-2" />
              )}
              Archive Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore "{project.name}"? This will make it active again and show it in your projects list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestore}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-2" />
              )}
              Restore Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              Delete Project Permanently
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete "{project.name}"? This action cannot be undone. All project data will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

interface QuickArchiveButtonProps {
  project: Project
  onActionComplete?: () => void
}

export function QuickArchiveButton({ project, onActionComplete }: QuickArchiveButtonProps) {
  const [loading, setLoading] = useState(false)
  const { archiveProject, updateProject } = useProjects()

  const isArchived = project.status === 'archived'

  const handleToggleArchive = async () => {
    try {
      setLoading(true)
      if (isArchived) {
        await updateProject(project.id, { status: 'active' })
      } else {
        await archiveProject(project.id)
      }
      onActionComplete?.()
    } catch (error) {
      console.error('Error toggling archive:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={isArchived ? "default" : "outline"}
      size="sm"
      onClick={handleToggleArchive}
      disabled={loading}
    >
      {loading ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
      ) : isArchived ? (
        <RotateCcw className="h-4 w-4 mr-2" />
      ) : (
        <Archive className="h-4 w-4 mr-2" />
      )}
      {isArchived ? 'Restore' : 'Archive'}
    </Button>
  )
}