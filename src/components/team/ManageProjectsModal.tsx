"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  Plus,
  X,
  Save,
  RefreshCw,
  Shield,
  Eye,
  Settings,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Project {
  id: string
  name: string
  description?: string
  status: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
}

interface Assignment {
  id?: string
  project_id: string
  access_level: 'ADMIN' | 'MANAGER' | 'VIEWER'
}

interface TeamMember {
  id: string
  email: string
  display_name: string
  role: string
}

interface ManageProjectsModalProps {
  isOpen: boolean
  onClose: () => void
  member: TeamMember | null
  onSuccess: () => void
}

export function ManageProjectsModal({ isOpen, onClose, member, onSuccess }: ManageProjectsModalProps) {
  const [allProjects, setAllProjects] = useState<Project[]>([])
  const [currentAssignments, setCurrentAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && member) {
      loadData()
    }
  }, [isOpen, member])

  const loadData = async () => {
    if (!member) return

    setLoading(true)
    setError('')

    try {
      // Load all projects
      const projectsResponse = await fetch('/api/projects')
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json()
        setAllProjects(projectsData.projects || [])
      }

      // Load current assignments for this member
      const assignmentsResponse = await fetch(`/api/team/${member.id}/projects`)
      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json()
        setCurrentAssignments(assignmentsData.assignments || [])
      }

    } catch (err) {
      setError('Failed to load project data')
      console.error('Error loading project data:', err)
    } finally {
      setLoading(false)
    }
  }

  const isProjectAssigned = (projectId: string) => {
    return currentAssignments.some(assignment => assignment.project_id === projectId)
  }

  const getAssignmentAccessLevel = (projectId: string) => {
    const assignment = currentAssignments.find(a => a.project_id === projectId)
    return assignment?.access_level || 'VIEWER'
  }

  const addProjectAssignment = (projectId: string) => {
    if (!isProjectAssigned(projectId)) {
      setCurrentAssignments(prev => [
        ...prev,
        {
          project_id: projectId,
          access_level: 'VIEWER'
        }
      ])
    }
  }

  const removeProjectAssignment = (projectId: string) => {
    setCurrentAssignments(prev => 
      prev.filter(assignment => assignment.project_id !== projectId)
    )
  }

  const updateAccessLevel = (projectId: string, accessLevel: 'ADMIN' | 'MANAGER' | 'VIEWER') => {
    setCurrentAssignments(prev =>
      prev.map(assignment =>
        assignment.project_id === projectId
          ? { ...assignment, access_level: accessLevel }
          : assignment
      )
    )
  }

  const handleSave = async () => {
    if (!member) return

    setSaving(true)
    setError('')

    try {
      const response = await fetch(`/api/team/${member.id}/projects`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignments: currentAssignments
        })
      })

      const data = await response.json()

      if (data.success) {
        onSuccess()
        onClose()
      } else {
        setError(data.error || 'Failed to save project assignments')
      }
    } catch (err) {
      setError('Failed to save changes')
      console.error('Error saving project assignments:', err)
    } finally {
      setSaving(false)
    }
  }

  const getAccessLevelIcon = (level: string) => {
    switch (level) {
      case 'ADMIN': return <Shield className="h-3 w-3" />
      case 'MANAGER': return <Settings className="h-3 w-3" />
      case 'VIEWER': return <Eye className="h-3 w-3" />
      default: return <Eye className="h-3 w-3" />
    }
  }

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'ADMIN': return 'bg-red-500 text-white'
      case 'MANAGER': return 'bg-blue-500 text-white'
      case 'VIEWER': return 'bg-gray-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (!member) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FolderOpen className="h-5 w-5" />
            <span>Manage Projects for {member.display_name}</span>
          </DialogTitle>
          <DialogDescription>
            Assign {member.display_name} to projects and set their access levels
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side: All Projects */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>All Projects</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadData}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </CardTitle>
              <CardDescription>
                Click a project to assign it to {member.display_name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="animate-pulse">
                        <div className="h-16 bg-muted rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : allProjects.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No projects available</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {allProjects.map((project) => (
                      <div
                        key={project.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          isProjectAssigned(project.id)
                            ? 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800'
                            : 'hover:bg-muted/30'
                        }`}
                        onClick={() => {
                          if (!isProjectAssigned(project.id)) {
                            addProjectAssignment(project.id)
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-medium text-sm">{project.name}</h4>
                              <Badge className={getPriorityColor(project.priority)} variant="outline">
                                {project.priority}
                              </Badge>
                            </div>
                            {project.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {project.description}
                              </p>
                            )}
                          </div>
                          {isProjectAssigned(project.id) ? (
                            <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          ) : (
                            <Plus className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Right Side: Assigned Projects */}
          <Card>
            <CardHeader>
              <CardTitle>Assigned Projects ({currentAssignments.length})</CardTitle>
              <CardDescription>
                Projects assigned to {member.display_name} with access levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {currentAssignments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No projects assigned</p>
                    <p className="text-xs">Click projects on the left to assign them</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {currentAssignments.map((assignment) => {
                      const project = allProjects.find(p => p.id === assignment.project_id)
                      if (!project) return null

                      return (
                        <div key={assignment.project_id} className="p-3 border rounded-lg bg-muted/20">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{project.name}</h4>
                              {project.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {project.description}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeProjectAssignment(assignment.project_id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-medium">Access Level:</span>
                            <Select
                              value={assignment.access_level}
                              onValueChange={(value) => 
                                updateAccessLevel(assignment.project_id, value as 'ADMIN' | 'MANAGER' | 'VIEWER')
                              }
                            >
                              <SelectTrigger className="w-32 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ADMIN">
                                  <div className="flex items-center space-x-2">
                                    <Shield className="h-3 w-3" />
                                    <span>Admin</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="MANAGER">
                                  <div className="flex items-center space-x-2">
                                    <Settings className="h-3 w-3" />
                                    <span>Manager</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="VIEWER">
                                  <div className="flex items-center space-x-2">
                                    <Eye className="h-3 w-3" />
                                    <span>Viewer</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <Badge className={getAccessLevelColor(assignment.access_level)}>
                              {getAccessLevelIcon(assignment.access_level)}
                              {assignment.access_level}
                            </Badge>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}