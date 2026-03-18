"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { 
  Users, 
  UserPlus, 
  Mail, 
  Shield, 
  Clock, 
  MoreVertical,
  Search,
  Filter,
  Crown,
  Settings,
  Trash2,
  Edit
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TeamMember, supabaseHelpers } from '@/lib/supabase'
import { Role, hasPermission, checkOwnerAuth } from '@/lib/rbac'

interface TeamMemberWithProjects extends TeamMember {
  projectCount?: number
  lastProject?: string
}

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMemberWithProjects[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ role: Role; isOwner: boolean } | null>(null)

  useEffect(() => {
    loadTeamMembers()
    checkUserPermissions()
  }, [])

  const checkUserPermissions = async () => {
    // Check if current user is owner (would need to implement proper auth context)
    // For now, assume owner permissions
    setCurrentUser({ role: 'OWNER', isOwner: true })
  }

  const loadTeamMembers = async () => {
    setLoading(true)
    try {
      const members = await supabaseHelpers.getTeamMembers()
      
      // Enhance with project assignments count
      const enhancedMembers = await Promise.all(
        members.map(async (member) => {
          try {
            const { data: assignments } = await supabaseHelpers.supabase
              .from('project_assignments')
              .select('project_id, projects(name)')
              .eq('team_member_id', member.id)
            
            return {
              ...member,
              projectCount: assignments?.length || 0,
              lastProject: assignments?.[0]?.projects?.name || 'None'
            }
          } catch (error) {
            return {
              ...member,
              projectCount: 0,
              lastProject: 'None'
            }
          }
        })
      )
      
      setTeamMembers(enhancedMembers)
    } catch (error) {
      console.error('Error loading team members:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || member.role === roleFilter
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter
    
    return matchesSearch && matchesRole && matchesStatus
  })

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'OWNER': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'ADMIN': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'MANAGER': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'VIEWER': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'invited': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'disabled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const canManageTeam = currentUser?.role && hasPermission(currentUser.role, 'team:invite')
  const canUpdateRoles = currentUser?.role && hasPermission(currentUser.role, 'team:update_roles')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground">
            Manage team members, roles, and project access
          </p>
        </div>
        {canManageTeam && (
          <Button onClick={() => setShowInviteModal(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{teamMembers.length}</p>
                <p className="text-xs text-muted-foreground">Total Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  {teamMembers.filter(m => m.status === 'active').length}
                </p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Mail className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">
                  {teamMembers.filter(m => m.status === 'invited').length}
                </p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Crown className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">
                  {teamMembers.filter(m => ['OWNER', 'ADMIN'].includes(m.role)).length}
                </p>
                <p className="text-xs text-muted-foreground">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="OWNER">Owner</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MANAGER">Manager</SelectItem>
                <SelectItem value="VIEWER">Viewer</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="invited">Invited</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Team Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members ({filteredMembers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">Loading team members...</div>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <div className="text-muted-foreground">
                  {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' 
                    ? 'No members match your filters'
                    : 'No team members yet'
                  }
                </div>
              </div>
            ) : (
              filteredMembers.map((member, index) => (
                <div key={member.id}>
                  {index > 0 && <Separator className="my-4" />}
                  <div className="flex items-center justify-between p-4 hover:bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {getInitials(member.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">{member.full_name}</p>
                          {member.role === 'OWNER' && (
                            <Crown className="h-4 w-4 text-yellow-600" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                        <div className="flex items-center space-x-2">
                          <Badge className={getRoleBadgeColor(member.role)}>
                            {member.role}
                          </Badge>
                          <Badge className={getStatusBadgeColor(member.status)}>
                            {member.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right text-sm">
                        <p className="font-medium">{member.projectCount || 0} projects</p>
                        <p className="text-muted-foreground">
                          Joined {formatDate(member.created_at)}
                        </p>
                        {member.last_active && (
                          <p className="text-xs text-muted-foreground">
                            Last active {formatDate(member.last_active)}
                          </p>
                        )}
                      </div>
                      
                      {canManageTeam && member.role !== 'OWNER' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Role
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Settings className="h-4 w-4 mr-2" />
                              Manage Projects
                            </DropdownMenuItem>
                            {member.status === 'active' && (
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Disable Account
                              </DropdownMenuItem>
                            )}
                            {member.status === 'disabled' && (
                              <DropdownMenuItem className="text-green-600">
                                <Shield className="h-4 w-4 mr-2" />
                                Enable Account
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}