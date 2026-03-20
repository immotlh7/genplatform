"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { 
  Crown,
  UserPlus,
  Settings,
  Mail,
  Calendar,
  MapPin,
  Activity,
  FolderOpen,
  CheckCircle,
  MoreHorizontal,
  Edit,
  Shield,
  UserX,
  Trash2
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getCurrentUserClient, getRoleDisplay } from '@/lib/access-control'
import { InviteMemberModal } from '@/components/team/InviteMemberModal'
import type { User } from '@/lib/access-control'

interface TeamMember {
  id: string
  email: string
  display_name: string
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'VIEWER'
  is_active: boolean
  avatar_url?: string
  invited_by?: string
  invited_at: string
  last_login_at?: string
  project_count: number
}

export default function TeamManagementPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [editingProfile, setEditingProfile] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [showInviteModal, setShowInviteModal] = useState(false)

  useEffect(() => {
    loadUserAndTeam()
  }, [])

  const loadUserAndTeam = async () => {
    try {
      setLoading(true)
      
      // Get current user
      let user = await getCurrentUserClient().catch(() => null)
      if (!user) {
        user = { id: '1', name: 'Med', email: 'owner@genplatform.ai', role: 'OWNER' as any, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      }
      setCurrentUser(user)
      setDisplayName(user?.displayName || '')

      // Load team members (only for OWNER/ADMIN)
      if (user && (user.role === 'OWNER' || user.role === 'ADMIN')) {
        const response = await fetch('/api/team')
        if (response.ok) {
          const data = await response.json()
          setTeamMembers(data.members || [])
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load team data:', error);
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async () => {
    if (!currentUser || !displayName.trim()) return

    try {
      const response = await fetch(`/api/team/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: displayName.trim() })
      })

      if (response.ok) {
        setCurrentUser(prev => prev ? { ...prev, displayName: displayName.trim() } : null)
        setEditingProfile(false)
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to update profile:', error);
      }
    }
  }

  const handleInviteSuccess = () => {
    // Reload team members after successful invitation
    loadUserAndTeam()
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Unable to load user information</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Team Management</h1>
          <p className="text-muted-foreground">
            Manage your team and project access levels.
          </p>
        </div>
        {currentUser.role === 'OWNER' && (
          <div className="flex items-center space-x-2">
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button onClick={() => setShowInviteModal(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </div>
        )}
      </div>

      {/* Section 1: Your Profile */}
      <Card className={`border-l-4 ${currentUser.role === 'OWNER' ? 'border-l-yellow-500 bg-gradient-to-br from-yellow-50 to-orange-50 dark:border-l-yellow-400 dark:from-yellow-950/20 dark:to-orange-950/20' : 'border-l-blue-500'}`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {currentUser.role === 'OWNER' ? (
              <Crown className="h-6 w-6 text-yellow-500" />
            ) : (
              <Shield className="h-6 w-6 text-blue-500" />
            )}
            <span>Your Profile</span>
          </CardTitle>
          <CardDescription>
            {currentUser.role === 'OWNER' 
              ? 'Platform owner with full administrative access'
              : 'Team member profile and permissions'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={undefined} />
                <AvatarFallback className={`text-lg font-semibold ${
                  currentUser.role === 'OWNER' 
                    ? 'bg-gradient-to-br from-yellow-500 to-orange-500 text-white'
                    : 'bg-blue-500 text-white'
                }`}>
                  {currentUser.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  {editingProfile ? (
                    <div className="flex items-center space-x-2">
                      <Input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-48"
                        placeholder="Display name"
                      />
                      <Button size="sm" onClick={handleUpdateProfile}>
                        Save
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          setEditingProfile(false)
                          setDisplayName(currentUser.displayName)
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-xl font-semibold">{currentUser.displayName}</h3>
                      <Badge className={getRoleDisplay(currentUser.role).color + ' text-white'}>
                        {getRoleDisplay(currentUser.role).icon} {getRoleDisplay(currentUser.role).label}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => setEditingProfile(true)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Mail className="h-3 w-3" />
                    <span>{currentUser.email}</span>
                  </div>
                </div>
                
                <div className="text-sm">
                  {currentUser.role === 'OWNER' ? (
                    <span className="text-green-600 font-medium">Full access to all features</span>
                  ) : (
                    <span className="text-blue-600 font-medium">
                      {currentUser.role === 'ADMIN' ? 'Administrative access' :
                       currentUser.role === 'MANAGER' ? 'Project management access' :
                       'Read-only access'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Team Members */}
      {(currentUser.role === 'OWNER' || currentUser.role === 'ADMIN') && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <FolderOpen className="h-5 w-5" />
                <span>Team Members</span>
                <Badge variant="outline">{teamMembers.length}</Badge>
              </CardTitle>
              <CardDescription>
                Manage team member access and project assignments
              </CardDescription>
            </div>
            {currentUser.role === 'OWNER' && (
              <Button onClick={() => setShowInviteModal(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {teamMembers.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No team members yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Invite your first team member to start collaborating on projects.
                </p>
                {currentUser.role === 'OWNER' && (
                  <Button onClick={() => setShowInviteModal(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Team Member
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Projects</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Status</TableHead>
                      {currentUser.role === 'OWNER' && (
                        <TableHead className="w-[50px]">Actions</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarImage src={member.avatar_url} />
                              <AvatarFallback>
                                {member.display_name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{member.display_name}</div>
                              <div className="text-sm text-muted-foreground">{member.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRoleDisplay(member.role).color + ' text-white'}>
                            {getRoleDisplay(member.role).icon} {getRoleDisplay(member.role).label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {member.project_count} {member.project_count === 1 ? 'project' : 'projects'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {member.last_login_at ? (
                            <span className="text-sm">
                              {formatTimeAgo(member.last_login_at)}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">Never</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {member.is_active ? (
                            <div className="flex items-center space-x-1">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-green-600">Active</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1">
                              <UserX className="h-4 w-4 text-gray-600" />
                              <span className="text-sm text-gray-600">Inactive</span>
                            </div>
                          )}
                        </TableCell>
                        {currentUser.role === 'OWNER' && (
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Role
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <FolderOpen className="h-4 w-4 mr-2" />
                                  Manage Projects
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <UserX className="h-4 w-4 mr-2" />
                                  Deactivate
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Invite Member Modal */}
      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInviteSuccess={handleInviteSuccess}
      />
    </div>
  )
}