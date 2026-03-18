/**
 * Access Control Library
 * Handles user authentication and project access filtering for the dashboard
 */

import { authHelpers, supabaseHelpers, supabaseAdmin } from './supabase'
import { getCurrentUser, Role, hasPermission } from './rbac'

export interface User {
  id: string
  email: string
  displayName: string
  role: Role
  userType: 'owner' | 'team_member'
  isAuthenticated: boolean
}

/**
 * Get current user information for client-side use
 */
export async function getCurrentUserClient(): Promise<User | null> {
  try {
    // First check if we have an owner session (cookie-based)
    const ownerCheck = await checkOwnerSession()
    if (ownerCheck) {
      return ownerCheck
    }

    // Then check Supabase auth for team members
    const supabaseUser = await authHelpers.getCurrentUser()
    if (supabaseUser) {
      const teamMember = await supabaseHelpers.getTeamMemberByEmail(supabaseUser.email!)
      
      if (teamMember && teamMember.status === 'active') {
        return {
          id: supabaseUser.id,
          email: supabaseUser.email!,
          displayName: teamMember.full_name,
          role: teamMember.role as Role,
          userType: 'team_member',
          isAuthenticated: true
        }
      }
    }

    return null
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Check owner session from cookies (client-side approximation)
 */
async function checkOwnerSession(): Promise<User | null> {
  try {
    // Check if we can access owner-only features
    const response = await fetch('/api/auth/check', {
      method: 'GET',
      credentials: 'include'
    })

    if (response.ok) {
      const data = await response.json()
      if (data.user && data.user.role === 'OWNER') {
        return {
          id: data.user.id,
          email: data.user.email,
          displayName: data.user.displayName,
          role: 'OWNER',
          userType: 'owner',
          isAuthenticated: true
        }
      }
    }
    
    return null
  } catch (error) {
    console.error('Error checking owner session:', error)
    return null
  }
}

/**
 * Get projects accessible to the current user
 */
export async function getAccessibleProjects(userId: string, userRole?: Role): Promise<string[]> {
  try {
    if (!supabaseAdmin) {
      console.warn('Supabase admin not available, returning empty project list')
      return []
    }

    // For owner and admin, return all projects
    if (userRole === 'OWNER' || userRole === 'ADMIN') {
      const { data: projects, error } = await supabaseAdmin
        .from('projects')
        .select('id')
        .neq('status', 'deleted')

      if (error) {
        console.error('Error fetching all projects:', error)
        return []
      }

      return projects?.map(p => p.id) || []
    }

    // For other users, get assigned projects only
    const { data: assignments, error } = await supabaseAdmin
      .from('project_assignments')
      .select('project_id')
      .eq('team_member_id', userId)

    if (error) {
      console.error('Error fetching user project assignments:', error)
      return []
    }

    return assignments?.map(a => a.project_id) || []
  } catch (error) {
    console.error('Error getting accessible projects:', error)
    return []
  }
}

/**
 * Filter dashboard stats based on user access
 */
export async function getFilteredDashboardStats(user: User) {
  try {
    const accessibleProjectIds = await getAccessibleProjects(user.id, user.role)
    
    if (accessibleProjectIds.length === 0) {
      return {
        projects: { total: 0, active: 0, completed: 0 },
        tasks: { total: 0, active: 0, completed: 0, completionRate: 0 },
        accessLevel: user.role,
        projectCount: 0
      }
    }

    // Get project stats
    const [
      { count: totalProjects },
      { count: activeProjects },
      { count: completedProjects }
    ] = await Promise.all([
      supabaseAdmin!
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .in('id', accessibleProjectIds)
        .neq('status', 'deleted'),
      supabaseAdmin!
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .in('id', accessibleProjectIds)
        .eq('status', 'active'),
      supabaseAdmin!
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .in('id', accessibleProjectIds)
        .eq('status', 'completed')
    ])

    // Get task stats
    const [
      { count: activeTasks },
      { count: completedTasks }
    ] = await Promise.all([
      supabaseAdmin!
        .from('project_tasks')
        .select('*', { count: 'exact', head: true })
        .in('project_id', accessibleProjectIds)
        .eq('status', 'in_progress'),
      supabaseAdmin!
        .from('project_tasks')
        .select('*', { count: 'exact', head: true })
        .in('project_id', accessibleProjectIds)
        .eq('status', 'done')
    ])

    const totalTasks = (activeTasks || 0) + (completedTasks || 0)
    const completionRate = totalTasks > 0 ? Math.round(((completedTasks || 0) / totalTasks) * 100) : 0

    return {
      projects: {
        total: totalProjects || 0,
        active: activeProjects || 0,
        completed: completedProjects || 0
      },
      tasks: {
        total: totalTasks,
        active: activeTasks || 0,
        completed: completedTasks || 0,
        completionRate
      },
      accessLevel: user.role,
      projectCount: accessibleProjectIds.length
    }
  } catch (error) {
    console.error('Error getting filtered dashboard stats:', error)
    return {
      projects: { total: 0, active: 0, completed: 0 },
      tasks: { total: 0, active: 0, completed: 0, completionRate: 0 },
      accessLevel: user.role,
      projectCount: 0
    }
  }
}

/**
 * Check if user can access specific project
 */
export async function canUserAccessProject(userId: string, projectId: string, userRole: Role): Promise<boolean> {
  try {
    // Owner and Admin can access all projects
    if (userRole === 'OWNER' || userRole === 'ADMIN') {
      return true
    }

    // Check if user has assignment to this project
    if (!supabaseAdmin) {
      return false
    }

    const { data: assignment, error } = await supabaseAdmin
      .from('project_assignments')
      .select('id')
      .eq('team_member_id', userId)
      .eq('project_id', projectId)
      .single()

    return !error && !!assignment
  } catch (error) {
    console.error('Error checking project access:', error)
    return false
  }
}

/**
 * Get user's permission summary for dashboard display
 */
export function getUserPermissionSummary(user: User) {
  return {
    canCreateProjects: hasPermission(user.role, 'projects:create'),
    canManageTeam: hasPermission(user.role, 'team:invite'),
    canViewReports: hasPermission(user.role, 'reports:read'),
    canGenerateReports: hasPermission(user.role, 'reports:generate'),
    canViewSystem: hasPermission(user.role, 'system:health'),
    isOwner: user.role === 'OWNER',
    isAdmin: user.role === 'ADMIN' || user.role === 'OWNER',
    isManager: ['OWNER', 'ADMIN', 'MANAGER'].includes(user.role)
  }
}

/**
 * Filter menu items based on user permissions
 */
export function getAccessibleMenuItems(user: User) {
  const permissions = getUserPermissionSummary(user)
  
  const menuItems = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      href: '/dashboard',
      icon: 'BarChart3',
      visible: true
    },
    {
      id: 'projects',
      title: 'Projects',
      href: '/dashboard/projects',
      icon: 'FolderOpen',
      visible: hasPermission(user.role, 'projects:read')
    },
    {
      id: 'chat',
      title: 'Chat',
      href: '/dashboard/chat',
      icon: 'MessageCircle',
      visible: hasPermission(user.role, 'chat:read')
    },
    {
      id: 'ideas',
      title: 'Ideas Lab',
      href: '/dashboard/ideas',
      icon: 'Lightbulb',
      visible: hasPermission(user.role, 'ideas:read')
    },
    {
      id: 'reports',
      title: 'Reports',
      href: '/dashboard/reports',
      icon: 'FileText',
      visible: hasPermission(user.role, 'reports:read')
    },
    {
      id: 'team',
      title: 'Team',
      href: '/dashboard/team',
      icon: 'Users',
      visible: hasPermission(user.role, 'team:read')
    },
    {
      id: 'automations',
      title: 'Automations',
      href: '/dashboard/automations',
      icon: 'Zap',
      visible: permissions.isAdmin
    },
    {
      id: 'monitoring',
      title: 'Monitoring',
      href: '/dashboard/monitoring',
      icon: 'Activity',
      visible: hasPermission(user.role, 'system:health')
    },
    {
      id: 'command-center',
      title: 'Command Center',
      href: '/dashboard/command-center',
      icon: 'Terminal',
      visible: permissions.isManager
    }
  ]

  return menuItems.filter(item => item.visible)
}

/**
 * Create auth check API endpoint helper
 */
export const authCheckApi = {
  async handler(req: Request) {
    // This would be implemented in /api/auth/check route
    // Check both owner cookie and Supabase session
    return {
      authenticated: false,
      user: null
    }
  }
}