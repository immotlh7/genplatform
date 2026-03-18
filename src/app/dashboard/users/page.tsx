"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Users,
  UserPlus,
  Crown,
  Shield,
  Eye,
  Settings,
  Mail,
  Calendar,
  MapPin,
  Activity,
  Projects,
  Zap,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreHorizontal
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TeamMember {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'MANAGER' | 'VIEWER'
  assignedProjects: string[]
  avatar?: string
  lastActive: string
  joinedDate: string
  status: 'active' | 'inactive' | 'pending'
}

interface AccessLevel {
  level: 'ADMIN' | 'MANAGER' | 'VIEWER'
  label: string
  description: string
  permissions: string[]
  icon: React.ReactNode
  color: string
}

const accessLevels: AccessLevel[] = [
  {
    level: 'ADMIN',
    label: 'Admin',
    description: 'Full access to everything',
    permissions: [
      'View all projects',
      'Edit all projects',
      'Create new projects',
      'Send commands',
      'Manage team members',
      'Access system settings'
    ],
    icon: <Crown className="h-4 w-4" />,
    color: 'bg-yellow-500'
  },
  {
    level: 'MANAGER',
    label: 'Manager', 
    description: 'Can manage assigned projects',
    permissions: [
      'View all projects',
      'Edit assigned projects',
      'Send commands',
      'Monitor project progress'
    ],
    icon: <Shield className="h-4 w-4" />,
    color: 'bg-blue-500'
  },
  {
    level: 'VIEWER',
    label: 'Viewer',
    description: 'Read-only access to assigned projects',
    permissions: [
      'View assigned projects',
      'Read project reports',
      'Monitor progress (read-only)'
    ],
    icon: <Eye className="h-4 w-4" />,
    color: 'bg-green-500'
  }
]

export default function UsersPage() {
  const [teamMembers] = useState<TeamMember[]>([]) // Empty for now - Sprint 0E
  
  // Owner profile data
  const owner = {
    name: 'Med',
    email: 'medtlh1@example.com',
    role: 'OWNER' as const,
    joinedDate: '2024-03-01T00:00:00Z',
    lastActive: '2024-03-18T07:00:00Z',
    totalProjects: 3,
    activeProjects: 2,
    totalSkills: 27,
    timezone: 'Africa/Casablanca'
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER': return <Crown className="h-4 w-4 text-yellow-500" />
      case 'ADMIN': return <Crown className="h-4 w-4 text-yellow-500" />
      case 'MANAGER': return <Shield className="h-4 w-4 text-blue-500" />
      case 'VIEWER': return <Eye className="h-4 w-4 text-green-500" />
      default: return <Users className="h-4 w-4" />
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'OWNER': return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
      case 'ADMIN': return 'bg-yellow-500 text-white'
      case 'MANAGER': return 'bg-blue-500 text-white'
      case 'VIEWER': return 'bg-green-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatLastActive = (dateString: string) => {
    const now = new Date()
    const time = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
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
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Team Member
          </Button>
        </div>
      </div>

      {/* Section 1: Owner Profile Card */}
      <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50 dark:border-yellow-800 dark:from-yellow-950/20 dark:to-orange-950/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Crown className="h-6 w-6 text-yellow-500" />
            <span>Platform Owner</span>
          </CardTitle>
          <CardDescription>
            Full administrative access to all platform features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src="/avatar-placeholder.jpg" />
                <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
                  {owner.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <h3 className="text-xl font-semibold">{owner.name}</h3>
                  <Badge className={getRoleBadgeColor('OWNER')}>
                    <Crown className="h-3 w-3 mr-1" />
                    OWNER
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Mail className="h-3 w-3" />
                    <span>{owner.email}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3" />
                    <span>{owner.timezone}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Joined {formatDate(owner.joinedDate)}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-green-600">
                    <Activity className="h-3 w-3" />
                    <span>Active {formatLastActive(owner.lastActive)}</span>
                  </div>
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Mail className="h-4 w-4 mr-2" />
                  Change Email
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Shield className="h-4 w-4 mr-2" />
                  Security Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Owner Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-yellow-200 dark:border-yellow-800">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Projects className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Projects</span>
              </div>
              <div className="text-lg font-semibold">{owner.totalProjects}</div>
              <div className="text-xs text-muted-foreground">{owner.activeProjects} active</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Skills</span>
              </div>
              <div className="text-lg font-semibold">{owner.totalSkills}</div>
              <div className="text-xs text-muted-foreground">installed</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Team</span>
              </div>
              <div className="text-lg font-semibold">{teamMembers.length}</div>
              <div className="text-xs text-muted-foreground">members</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Status</span>
              </div>
              <div className="text-lg font-semibold text-green-600">Active</div>
              <div className="text-xs text-muted-foreground">online now</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Access Levels Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Access Levels</span>
          </CardTitle>
          <CardDescription>
            Understanding team member permissions and capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {accessLevels.map((level) => (
              <div key={level.level} className="border rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <div className={`p-2 rounded-lg text-white ${level.color}`}>
                    {level.icon}
                  </div>
                  <div>
                    <h4 className="font-medium">{level.label}</h4>
                    <p className="text-xs text-muted-foreground">{level.description}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h5 className="text-sm font-medium">Permissions:</h5>
                  <ul className="space-y-1">
                    {level.permissions.map((permission, index) => (
                      <li key={index} className="flex items-center space-x-2 text-sm">
                        <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                        <span>{permission}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Team Members List (Empty for now) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Team Members</span>
              <Badge variant="outline">{teamMembers.length}</Badge>
            </div>
            <Button size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </CardTitle>
          <CardDescription>
            Manage team member access and project assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No team members yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Team collaboration features are coming in <strong>Sprint 0E</strong>. You'll be able to invite team members, assign projects, and manage access levels.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4">
                <Button disabled className="w-full sm:w-auto">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Coming in Sprint 0E
                </Button>
                <Button variant="outline" disabled className="w-full sm:w-auto">
                  <Mail className="h-4 w-4 mr-2" />
                  Bulk Invite (Soon)
                </Button>
              </div>
              
              <div className="mt-8 p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium mb-2">🚀 Coming Features:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-3 w-3" />
                    <span>Team member invitations</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-3 w-3" />
                    <span>Project assignment system</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-3 w-3" />
                    <span>Role-based access control</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-3 w-3" />
                    <span>Activity monitoring</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // This will be implemented in Sprint 0E
            <div className="space-y-4">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback>{member.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{member.name}</span>
                        <Badge className={getRoleBadgeColor(member.role)}>
                          {getRoleIcon(member.role)}
                          {member.role}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">{member.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {member.assignedProjects.length} projects
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}