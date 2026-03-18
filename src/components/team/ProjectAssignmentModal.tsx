"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  FolderOpen, 
  UserCheck, 
  AlertCircle, 
  CheckCircle,
  Eye,
  Users,
  Crown
} from 'lucide-react'
import { TeamMember } from '@/lib/supabase'

interface Project {
  id: string
  name: string
  status: string
  progress: number
}

interface ProjectAssignment {
  id: string
  project_id: string
  team_member_id: string
  role: 'lead' | 'member' | 'viewer'
  assigned_at: string
  projects?: Project
}

interface ProjectAssignmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teamMember: TeamMember | null
  onAssignmentSuccess?: () => void
}

export default function ProjectAssignmentModal({
  open,
  onOpenChange,
  teamMember,
  onAssignmentSuccess
}: ProjectAssignmentModalProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [assignments, setAssignments] = useState<ProjectAssignment[]>([])
  const [selectedAssignments, setSelectedAssignments] = useState<{[projectId: string]: 'lead' | 'member' | 'viewer' | null}>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (open && teamMember) {
      loadProjectsAndAssignments()
    }
  }, [open, teamMember])

  const loadProjectsAndAssignments = async () => {
    if (!teamMember) return

    setLoading(true)
    setError('')

    try {
      // Load all projects
      const projectsResponse = await fetch('/api/projects?limit=100')
      const projectsData = await projectsResponse.json()
      
      if (!projectsResponse.ok) {
        throw new Error(projectsData.message || 'Failed to load projects')
      }

      // Load current assignments for this team member
      const assignmentsResponse = await fetch(`/api/team/${teamMember.id}/assignments`)
      const assignmentsData = await assignmentsResponse.json()
      
      if (!assignmentsResponse.ok && assignmentsResponse.status !== 404) {
        throw new Error(assignmentsData.message || 'Failed to load assignments')
      }

      const allProjects = projectsData.data?.projects || []
      const currentAssignments = assignmentsData.data?.assignments || []

      setProjects(allProjects)
      setAssignments(currentAssignments)

      // Initialize selected assignments state
      const initialSelections: {[projectId: string]: 'lead' | 'member' | 'viewer' | null} = {}
      
      // Set current assignments
      currentAssignments.forEach((assignment: ProjectAssignment) => {
        initialSelections[assignment.project_id] = assignment.role
      })
      
      // Set unassigned projects to null
      allProjects.forEach((project: Project) => {
        if (!(project.id in initialSelections)) {
          initialSelections[project.id] = null
        }
      })

      setSelectedAssignments(initialSelections)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleAssignmentChange = (projectId: string, role: 'lead' | 'member' | 'viewer' | null) => {
    setSelectedAssignments(prev => ({
      ...prev,
      [projectId]: role
    }))
  }

  const handleSave = async () => {
    if (!teamMember) return

    setSaving(true)
    setError('')

    try {
      const response = await fetch(`/api/team/${teamMember.id}/assignments`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignments: selectedAssignments
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update assignments')
      }

      setSuccess(true)
      
      // Reset and close after success
      setTimeout(() => {
        setSuccess(false)
        onOpenChange(false)
        onAssignmentSuccess?.()
      }, 2000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save assignments')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setSelectedAssignments({})
    setError('')
    setSuccess(false)
    onOpenChange(false)
  }

  const getProjectRoleIcon = (role: string) => {
    switch (role) {
      case 'lead': return <Crown className="h-4 w-4" />
      case 'member': return <Users className="h-4 w-4" />
      case 'viewer': return <Eye className="h-4 w-4" />
      default: return null
    }
  }

  const getProjectRoleColor = (role: string) => {
    switch (role) {
      case 'lead': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'member': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'viewer': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'planning': return 'bg-blue-100 text-blue-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-purple-100 text-purple-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const hasChanges = () => {
    const currentAssignmentMap: {[projectId: string]: string | null} = {}
    assignments.forEach(assignment => {
      currentAssignmentMap[assignment.project_id] = assignment.role
    })

    return Object.keys(selectedAssignments).some(projectId => {
      const current = currentAssignmentMap[projectId] || null
      const selected = selectedAssignments[projectId]
      return current !== selected
    })
  }

  if (success) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center space-y-4 py-8">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <DialogTitle className="text-xl mb-2">Assignments Updated!</DialogTitle>
              <DialogDescription className="text-base">
                Project assignments for <span className="font-medium">{teamMember?.full_name}</span> have been saved successfully.
              </DialogDescription>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FolderOpen className="h-5 w-5" />
            <span>Manage Project Assignments</span>
          </DialogTitle>
          <DialogDescription>
            Assign <span className="font-medium">{teamMember?.full_name}</span> to projects with appropriate access levels
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground">Loading projects and assignments...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Current Team Member Info */}
            <div className="flex items-center space-x-3 p-4 bg-muted/30 rounded-lg">
              <UserCheck className="h-8 w-8 text-blue-600" />
              <div>
                <p className="font-medium">{teamMember?.full_name}</p>
                <p className="text-sm text-muted-foreground">{teamMember?.email}</p>
                <Badge className="mt-1">
                  {teamMember?.role}
                </Badge>
              </div>
            </div>

            {/* Projects List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Project Assignments</Label>
                <div className="text-sm text-muted-foreground">
                  {projects.length} projects available
                </div>
              </div>

              {projects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No projects available for assignment
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {projects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-medium truncate">{project.name}</p>
                          <Badge className={getStatusColor(project.status)}>
                            {project.status}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <span>{project.progress}% complete</span>
                          {selectedAssignments[project.id] && (
                            <>
                              <span>•</span>
                              <div className="flex items-center space-x-1">
                                {getProjectRoleIcon(selectedAssignments[project.id]!)}
                                <span className="capitalize">{selectedAssignments[project.id]}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Select
                          value={selectedAssignments[project.id] || 'none'}
                          onValueChange={(value) => 
                            handleAssignmentChange(
                              project.id, 
                              value === 'none' ? null : value as 'lead' | 'member' | 'viewer'
                            )
                          }
                          disabled={saving}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Not assigned</SelectItem>
                            <SelectItem value="viewer">
                              <div className="flex items-center space-x-2">
                                <Eye className="h-4 w-4" />
                                <span>Viewer</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="member">
                              <div className="flex items-center space-x-2">
                                <Users className="h-4 w-4" />
                                <span>Member</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="lead">
                              <div className="flex items-center space-x-2">
                                <Crown className="h-4 w-4" />
                                <span>Lead</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Role Descriptions */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Eye className="h-5 w-5 text-gray-600" />
                </div>
                <p className="font-medium text-sm">Viewer</p>
                <p className="text-xs text-muted-foreground">Can view project details and progress</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <p className="font-medium text-sm">Member</p>
                <p className="text-xs text-muted-foreground">Can contribute and update tasks</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Crown className="h-5 w-5 text-yellow-600" />
                </div>
                <p className="font-medium text-sm">Lead</p>
                <p className="text-xs text-muted-foreground">Full project management access</p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center space-x-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            {/* Footer */}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel} disabled={saving}>
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={handleSave}
                disabled={saving || !hasChanges()}
              >
                {saving ? 'Saving...' : 'Save Assignments'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}