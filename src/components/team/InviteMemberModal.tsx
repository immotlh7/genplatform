"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  UserPlus, 
  Mail, 
  User, 
  Shield, 
  Eye, 
  Settings,
  FolderOpen,
  CheckCircle,
  X
} from 'lucide-react'
import { getRoleDisplay } from '@/lib/access-control'

interface Project {
  id: string
  name: string
  description?: string
  status: string
}

interface ProjectAssignment {
  projectId: string
  accessLevel: 'ADMIN' | 'MANAGER' | 'VIEWER'
}

interface InviteMemberModalProps {
  isOpen: boolean
  onClose: () => void
  onInviteSuccess: () => void
}

export function InviteMemberModal({ isOpen, onClose, onInviteSuccess }: InviteMemberModalProps) {
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState<'ADMIN' | 'MANAGER' | 'VIEWER'>('VIEWER')
  const [projects, setProjects] = useState<Project[]>([])
  const [projectAssignments, setProjectAssignments] = useState<ProjectAssignment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)

  useEffect(() => {
    if (isOpen) {
      loadProjects()
      resetForm()
    }
  }, [isOpen])

  const resetForm = () => {
    setEmail('')
    setDisplayName('')
    setRole('VIEWER')
    setProjectAssignments([])
    setError('')
    setStep(1)
  }

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load projects:', error);
      }
    }
  }

  const handleProjectToggle = (projectId: string, checked: boolean) => {
    if (checked) {
      setProjectAssignments(prev => [
        ...prev,
        { projectId, accessLevel: 'VIEWER' }
      ])
    } else {
      setProjectAssignments(prev => 
        prev.filter(assignment => assignment.projectId !== projectId)
      )
    }
  }

  const handleAccessLevelChange = (projectId: string, accessLevel: 'ADMIN' | 'MANAGER' | 'VIEWER') => {
    setProjectAssignments(prev => 
      prev.map(assignment => 
        assignment.projectId === projectId 
          ? { ...assignment, accessLevel }
          : assignment
      )
    )
  }

  const handleSubmit = async () => {
    if (!email || !displayName || !role) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          displayName,
          role,
          projectAssignments
        })
      })

      const data = await response.json()

      if (data.success) {
        onInviteSuccess()
        onClose()
      } else {
        setError(data.error || 'Failed to send invitation')
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getRoleDescription = (roleType: string) => {
    switch (roleType) {
      case 'ADMIN':
        return 'Can manage all projects, view system settings, and manage other team members'
      case 'MANAGER':
        return 'Can manage assigned projects, send commands, and view project analytics'
      case 'VIEWER':
        return 'Can view assigned projects and read project information (read-only access)'
      default:
        return ''
    }
  }

  const isProjectAssigned = (projectId: string) => {
    return projectAssignments.some(assignment => assignment.projectId === projectId)
  }

  const getProjectAccessLevel = (projectId: string) => {
    const assignment = projectAssignments.find(a => a.projectId === projectId)
    return assignment?.accessLevel || 'VIEWER'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5" />
            <span>Invite Team Member</span>
          </DialogTitle>
          <DialogDescription>
            Add a new team member and configure their access levels.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-blue-600' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground'
              }`}>
                1
              </div>
              <span className="text-sm font-medium">Basic Info</span>
            </div>
            <div className="w-12 h-px bg-border"></div>
            <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-blue-600' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground'
              }`}>
                2
              </div>
              <span className="text-sm font-medium">Project Access</span>
            </div>
            <div className="w-12 h-px bg-border"></div>
            <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-blue-600' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 3 ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground'
              }`}>
                3
              </div>
              <span className="text-sm font-medium">Review</span>
            </div>
          </div>

          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Basic Information</span>
                  </CardTitle>
                  <CardDescription>
                    Enter the team member's email and display name
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="teammate@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name *</Label>
                    <Input
                      id="displayName"
                      placeholder="John Doe"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Global Role *</Label>
                    <Select value={role} onValueChange={(value) => setRole(value as 'ADMIN' | 'MANAGER' | 'VIEWER')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">
                          <div className="flex items-center space-x-2">
                            <Shield className="h-4 w-4 text-blue-500" />
                            <span>Admin</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="MANAGER">
                          <div className="flex items-center space-x-2">
                            <Settings className="h-4 w-4 text-green-500" />
                            <span>Manager</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="VIEWER">
                          <div className="flex items-center space-x-2">
                            <Eye className="h-4 w-4 text-gray-500" />
                            <span>Viewer</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {getRoleDescription(role)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => setStep(2)}
                  disabled={!email || !displayName || !role}
                >
                  Next: Project Access
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Project Assignments */}
          {step === 2 && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FolderOpen className="h-5 w-5" />
                    <span>Project Access</span>
                  </CardTitle>
                  <CardDescription>
                    Choose which projects this team member can access and their permission level
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {projects.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No projects available</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {projects.map((project) => (
                        <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              id={project.id}
                              checked={isProjectAssigned(project.id)}
                              onCheckedChange={(checked) => 
                                handleProjectToggle(project.id, checked as boolean)
                              }
                            />
                            <div>
                              <Label htmlFor={project.id} className="font-medium">
                                {project.name}
                              </Label>
                              {project.description && (
                                <p className="text-xs text-muted-foreground">
                                  {project.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {isProjectAssigned(project.id) && (
                            <Select
                              value={getProjectAccessLevel(project.id)}
                              onValueChange={(value) => 
                                handleAccessLevelChange(project.id, value as 'ADMIN' | 'MANAGER' | 'VIEWER')
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                                <SelectItem value="MANAGER">Manager</SelectItem>
                                <SelectItem value="VIEWER">Viewer</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button onClick={() => setStep(3)}>
                  Next: Review
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Review and Submit */}
          {step === 3 && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5" />
                    <span>Review Invitation</span>
                  </CardTitle>
                  <CardDescription>
                    Review the invitation details before sending
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-sm text-muted-foreground">{email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Display Name</Label>
                      <p className="text-sm text-muted-foreground">{displayName}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Global Role</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={getRoleDisplay(role).color + ' text-white'}>
                        {getRoleDisplay(role).icon} {getRoleDisplay(role).label}
                      </Badge>
                    </div>
                  </div>

                  {projectAssignments.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Project Access ({projectAssignments.length})</Label>
                      <div className="space-y-2 mt-2">
                        {projectAssignments.map((assignment) => {
                          const project = projects.find(p => p.id === assignment.projectId)
                          return project ? (
                            <div key={assignment.projectId} className="flex items-center justify-between p-2 bg-muted rounded">
                              <span className="text-sm font-medium">{project.name}</span>
                              <Badge variant="outline">{assignment.accessLevel}</Badge>
                            </div>
                          ) : null
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Sending Invitation...' : 'Send Invitation'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}