"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useProjects } from '@/contexts/ProjectContext'
import { 
  MoreHorizontal,
  Archive,
  Trash2,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Edit,
  Star,
  ExternalLink,
  Copy,
  Download,
  Settings,
  Pause,
  Play,
  History,
  FileText,
  X,
  ArchiveRestore
} from 'lucide-react'

interface Project {
  id: string
  name: string
  description?: string
  status: 'active' | 'paused' | 'completed' | 'archived'
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  color: string
  tasksCount: number
  completedTasks: number
  teamSize: number
  lastActivity: string
  deployUrl?: string
  githubUrl?: string
  isStarred?: boolean
  ownerId?: string
}

interface ProjectActionsProps {
  project: Project
  onProjectUpdated?: (project: Project) => void
  onProjectDeleted?: (projectId: string) => void
  compact?: boolean
  className?: string
}

export function ProjectActions({ 
  project, 
  onProjectUpdated, 
  onProjectDeleted,
  compact = false,
  className = ""
}: ProjectActionsProps) {
  const { updateProject, deleteProject, archiveProject, starProject, currentProject, setCurrentProject } = useProjects()
  
  const [loading, setLoading] = useState('')
  const [showArchiveDialog, setShowArchiveDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [archiveReason, setArchiveReason] = useState('')

  const handleArchive = async () => {
    setLoading('archive')
    try {
      const success = await archiveProject(project.id)
      if (success) {
        const updatedProject = { ...project, status: 'archived' as const }
        onProjectUpdated?.(updatedProject)
        
        // Clear current project if it's the one being archived
        if (currentProject?.id === project.id) {
          setCurrentProject(null)
        }
        
        setShowArchiveDialog(false)
        setArchiveReason('')
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error archiving project:', error);
      }
    } finally {
      setLoading('')
    }
  }

  const handleRestore = async () => {
    setLoading('restore')
    try {
      const updatedProject = await updateProject(project.id, { status: 'active' })
      if (updatedProject) {
        onProjectUpdated?.(updatedProject)
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error restoring project:', error);
      }
    } finally {
      setLoading('')
    }
  }

  const handleDelete = async () => {
    setLoading('delete')
    try {
      const success = await deleteProject(project.id)
      if (success) {
        onProjectDeleted?.(project.id)
        
        // Clear current project if it's the one being deleted
        if (currentProject?.id === project.id) {
          setCurrentProject(null)
        }
        
        setShowDeleteDialog(false)
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error deleting project:', error);
      }
    } finally {
      setLoading('')
    }
  }

  const handleStarToggle = async () => {
    setLoading('star')
    try {
      await starProject(project.id)
      const updatedProject = { ...project, isStarred: !project.isStarred }
      onProjectUpdated?.(updatedProject)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error toggling star:', error);
      }
    } finally {
      setLoading('')
    }
  }

  const handleStatusToggle = async () => {
    const newStatus = project.status === 'active' ? 'paused' : 'active'
    setLoading('status')
    try {
      const updatedProject = await updateProject(project.id, { status: newStatus })
      if (updatedProject) {
        onProjectUpdated?.(updatedProject)
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error updating status:', error);
      }
    } finally {
      setLoading('')
    }
  }

  const copyProjectId = () => {
    navigator.clipboard.writeText(project.id)
  }

  const openInNewTab = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const getStatusIcon = () => {
    switch (project.status) {
      case 'active': return <Play className="h-3 w-3 text-green-600" />
      case 'paused': return <Pause className="h-3 w-3 text-yellow-600" />
      case 'completed': return <CheckCircle className="h-3 w-3 text-blue-600" />
      case 'archived': return <Archive className="h-3 w-3 text-gray-600" />
      default: return null
    }
  }

  const canDelete = project.status === 'archived' || project.tasksCount === 0
  const canArchive = project.status !== 'archived'
  const canRestore = project.status === 'archived'

  if (compact) {
    return (
      <div className={`flex items-center space-x-1 ${className}`}>
        {/* Star Toggle */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={handleStarToggle}
                disabled={loading === 'star'}
              >
                {loading === 'star' ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Star className={`h-3 w-3 ${project.isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {project.isStarred ? 'Remove from starred' : 'Add to starred'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Status Toggle */}
        {project.status !== 'archived' && project.status !== 'completed' && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={handleStatusToggle}
                  disabled={loading === 'status'}
                >
                  {loading === 'status' ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : project.status === 'active' ? (
                    <Pause className="h-3 w-3 text-yellow-600" />
                  ) : (
                    <Play className="h-3 w-3 text-green-600" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {project.status === 'active' ? 'Pause project' : 'Resume project'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* More Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={copyProjectId}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Project ID
              </DropdownMenuItem>
              {project.deployUrl && (
                <DropdownMenuItem onClick={() => openInNewTab(project.deployUrl!)}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Deploy
                </DropdownMenuItem>
              )}
              {project.githubUrl && (
                <DropdownMenuItem onClick={() => openInNewTab(project.githubUrl!)}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open GitHub
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {canRestore ? (
              <DropdownMenuItem onClick={handleRestore} disabled={loading === 'restore'}>
                <ArchiveRestore className="h-4 w-4 mr-2" />
                Restore Project
              </DropdownMenuItem>
            ) : canArchive && (
              <DropdownMenuItem onClick={() => setShowArchiveDialog(true)}>
                <Archive className="h-4 w-4 mr-2" />
                Archive Project
              </DropdownMenuItem>
            )}
            {canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Project
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: project.color }}
            />
            <span className="truncate">{project.name}</span>
            {getStatusIcon()}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={handleStarToggle} disabled={loading === 'star'}>
              {loading === 'star' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Star className={`h-4 w-4 mr-2 ${project.isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
              )}
              {project.isStarred ? 'Remove from starred' : 'Add to starred'}
            </DropdownMenuItem>
            
            {project.status !== 'archived' && project.status !== 'completed' && (
              <DropdownMenuItem onClick={handleStatusToggle} disabled={loading === 'status'}>
                {loading === 'status' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : project.status === 'active' ? (
                  <Pause className="h-4 w-4 mr-2" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                {project.status === 'active' ? 'Pause project' : 'Resume project'}
              </DropdownMenuItem>
            )}
            
            <DropdownMenuItem>
              <Edit className="h-4 w-4 mr-2" />
              Edit Project
            </DropdownMenuItem>
            
            <DropdownMenuItem>
              <Settings className="h-4 w-4 mr-2" />
              Project Settings
            </DropdownMenuItem>
          </DropdownMenuGroup>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={copyProjectId}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Project ID
            </DropdownMenuItem>
            
            <DropdownMenuItem>
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </DropdownMenuItem>
            
            {project.deployUrl && (
              <DropdownMenuItem onClick={() => openInNewTab(project.deployUrl!)}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Deploy
              </DropdownMenuItem>
            )}
            
            {project.githubUrl && (
              <DropdownMenuItem onClick={() => openInNewTab(project.githubUrl!)}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Open GitHub
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
          
          <DropdownMenuSeparator />
          
          {canRestore ? (
            <DropdownMenuItem onClick={handleRestore} disabled={loading === 'restore'}>
              {loading === 'restore' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ArchiveRestore className="h-4 w-4 mr-2" />
              )}
              Restore Project
            </DropdownMenuItem>
          ) : canArchive && (
            <DropdownMenuItem onClick={() => setShowArchiveDialog(true)}>
              <Archive className="h-4 w-4 mr-2" />
              Archive Project
            </DropdownMenuItem>
          )}
          
          {canDelete && (
            <DropdownMenuItem 
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Project
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Archive Confirmation Dialog */}
      <Dialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Archive className="h-5 w-5 text-orange-500" />
              <span>Archive Project</span>
            </DialogTitle>
            <DialogDescription>
              This will archive "{project.name}" and remove it from your active projects.
              You can restore it later if needed.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-orange-800">What happens when you archive?</p>
                  <ul className="text-sm text-orange-700 mt-1 space-y-1 list-disc list-inside ml-2">
                    <li>Project becomes read-only</li>
                    <li>Removed from active project lists</li>
                    <li>Tasks and data are preserved</li>
                    <li>Can be restored at any time</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="archive-reason">Reason for archiving (optional)</Label>
              <Textarea
                id="archive-reason"
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
                placeholder="e.g., Project completed, On hold, No longer needed..."
                className="resize-none"
                rows={2}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowArchiveDialog(false)} disabled={loading === 'archive'}>
              Cancel
            </Button>
            <Button onClick={handleArchive} disabled={loading === 'archive'} className="bg-orange-600 hover:bg-orange-700">
              {loading === 'archive' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Archive className="h-4 w-4 mr-2" />
              )}
              Archive Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              <span>Delete Project</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-3">
                <p>
                  This will permanently delete "{project.name}" and all associated data.
                  This action cannot be undone.
                </p>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-800">What will be deleted:</p>
                      <ul className="text-sm text-red-700 mt-1 space-y-1 list-disc list-inside ml-2">
                        <li>All project tasks and data</li>
                        <li>File uploads and attachments</li>
                        <li>Project history and logs</li>
                        <li>Team member assignments</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    💡 Consider archiving instead if you might need this data later.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading === 'delete'}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={loading === 'delete'}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading === 'delete' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}