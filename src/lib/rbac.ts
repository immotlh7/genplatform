/**
 * Role-Based Access Control (RBAC) System
 * Handles permissions and access control for GenPlatform.ai
 */

import { authHelpers, supabaseHelpers, TeamMember } from './supabase'
import { supabase } from '@/lib/supabase';

// Role hierarchy (higher number = more permissions)
export const ROLE_HIERARCHY = {
  'VIEWER': 1,
  'MANAGER': 2, 
  'ADMIN': 3,
  'OWNER': 4
} as const

export type Role = keyof typeof ROLE_HIERARCHY

// Permission definitions
export const PERMISSIONS = {
  // Project permissions
  'projects:read': ['OWNER', 'ADMIN', 'MANAGER', 'VIEWER'],
  'projects:create': ['OWNER', 'ADMIN', 'MANAGER'],
  'projects:update': ['OWNER', 'ADMIN', 'MANAGER'],
  'projects:delete': ['OWNER', 'ADMIN'],
  'projects:archive': ['OWNER', 'ADMIN'],
  
  // Task permissions  
  'tasks:read': ['OWNER', 'ADMIN', 'MANAGER', 'VIEWER'],
  'tasks:create': ['OWNER', 'ADMIN', 'MANAGER'],
  'tasks:update': ['OWNER', 'ADMIN', 'MANAGER'],
  'tasks:assign': ['OWNER', 'ADMIN', 'MANAGER'],
  'tasks:delete': ['OWNER', 'ADMIN'],
  
  // Team management permissions
  'team:read': ['OWNER', 'ADMIN', 'MANAGER'],
  'team:invite': ['OWNER', 'ADMIN'],
  'team:update_roles': ['OWNER'],
  'team:remove': ['OWNER'],
  'team:assign_projects': ['OWNER', 'ADMIN'],
  
  // Chat permissions
  'chat:read': ['OWNER', 'ADMIN', 'MANAGER', 'VIEWER'],
  'chat:write': ['OWNER', 'ADMIN', 'MANAGER'],
  'chat:moderate': ['OWNER', 'ADMIN'],
  
  // Ideas permissions
  'ideas:read': ['OWNER', 'ADMIN', 'MANAGER', 'VIEWER'],
  'ideas:create': ['OWNER', 'ADMIN', 'MANAGER'],
  'ideas:update': ['OWNER', 'ADMIN', 'MANAGER'],
  'ideas:approve': ['OWNER', 'ADMIN'],
  
  // Reports permissions
  'reports:read': ['OWNER', 'ADMIN', 'MANAGER'],
  'reports:generate': ['OWNER', 'ADMIN'],
  'reports:export': ['OWNER', 'ADMIN', 'MANAGER'],
  
  // System permissions
  'system:health': ['OWNER', 'ADMIN'],
  'system:logs': ['OWNER'],
  'system:security': ['OWNER']
} as const

export type Permission = keyof typeof PERMISSIONS

// User context interface
export interface UserContext {
  id: string
  email: string
  role: Role
  userType: 'owner' | 'team_member'
  teamMember?: TeamMember
}

/**
 * Get current user context from auth state
 */
export async function getCurrentUser(): Promise<UserContext | null> {
  try {
    // Check owner authentication first (server-side cookie check would be here)
    // For now, we'll check Supabase auth
    const supabaseUser = await authHelpers.getCurrentUser()
    
    if (supabaseUser) {
      // Get team member data
      const teamMember = await supabaseHelpers.getTeamMemberByEmail(supabaseUser.email!)
      
      if (!teamMember || teamMember.status !== 'active') {
        return null
      }
      
      return {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        role: teamMember.role as Role,
        userType: 'team_member',
        teamMember
      }
    }
    
    return null
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Check if user has specific permission
 */
export function hasPermission(userRole: Role, permission: Permission): boolean {
  const allowedRoles = PERMISSIONS[permission]
  return allowedRoles.includes(userRole)
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(userRole: Role, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission))
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(userRole: Role, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission))
}

/**
 * Check if user can access specific resource
 */
export function canAccess(userRole: Role, resource: string, action: string): boolean {
  const permission = `${resource}:${action}` as Permission
  return hasPermission(userRole, permission)
}

/**
 * Get user's permission level for a resource
 */
export function getPermissionLevel(userRole: Role, resource: string): {
  canRead: boolean
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
} {
  return {
    canRead: canAccess(userRole, resource, 'read'),
    canCreate: canAccess(userRole, resource, 'create'), 
    canUpdate: canAccess(userRole, resource, 'update'),
    canDelete: canAccess(userRole, resource, 'delete')
  }
}

/**
 * Role comparison utilities
 */
export function isHigherRole(role1: Role, role2: Role): boolean {
  return ROLE_HIERARCHY[role1] > ROLE_HIERARCHY[role2]
}

export function isEqualOrHigherRole(role1: Role, role2: Role): boolean {
  return ROLE_HIERARCHY[role1] >= ROLE_HIERARCHY[role2]
}

/**
 * Filter data based on user permissions
 */
export function filterByPermission<T extends { id: string }>(
  data: T[],
  userRole: Role,
  permission: Permission
): T[] {
  if (hasPermission(userRole, permission)) {
    return data
  }
  return []
}

/**
 * Project-specific access control
 */
export async function canAccessProject(
  userId: string, 
  projectId: string, 
  requiredAccess: 'read' | 'write' | 'admin' = 'read'
): Promise<boolean> {
  try {
    // Get user context
    const user = await getCurrentUser()
    if (!user) return false
    
    // Owner can access everything
    if (user.role === 'OWNER') return true
    
    // Check if user has project assignment
    const { data: assignment } = await supabaseHelpers.supabase
      .from('project_assignments')
      .select('role')
      .eq('project_id', projectId)
      .eq('team_member_id', userId)
      .single()
    
    if (!assignment) {
      // No specific assignment - check general permissions
      const permission = `projects:${requiredAccess === 'write' ? 'update' : requiredAccess === 'admin' ? 'delete' : 'read'}` as Permission
      return hasPermission(user.role, permission)
    }
    
    // Check project-specific role
    const projectRole = assignment.role
    switch (requiredAccess) {
      case 'read':
        return ['lead', 'member', 'viewer'].includes(projectRole)
      case 'write':
        return ['lead', 'member'].includes(projectRole)
      case 'admin':
        return projectRole === 'lead'
      default:
        return false
    }
  } catch (error) {
    console.error('Error checking project access:', error)
    return false
  }
}

/**
 * Middleware helper for API routes
 */
export async function requirePermission(permission: Permission): Promise<{
  authorized: boolean
  user: UserContext | null
  error?: string
}> {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return {
        authorized: false,
        user: null,
        error: 'Authentication required'
      }
    }
    
    if (!hasPermission(user.role, permission)) {
      return {
        authorized: false,
        user,
        error: 'Insufficient permissions'
      }
    }
    
    return {
      authorized: true,
      user
    }
  } catch (error) {
    return {
      authorized: false,
      user: null,
      error: 'Authorization check failed'
    }
  }
}

/**
 * Owner authentication helper (for server-side)
 */
export function checkOwnerAuth(authToken?: string): {
  isOwner: boolean
  user: UserContext | null
} {
  if (!authToken) {
    return { isOwner: false, user: null }
  }
  
  try {
    const sessionData = JSON.parse(Buffer.from(authToken, 'base64').toString())
    
    if (sessionData.role === 'OWNER' && sessionData.exp > Math.floor(Date.now() / 1000)) {
      return {
        isOwner: true,
        user: {
          id: sessionData.userId,
          email: sessionData.email,
          role: 'OWNER',
          userType: 'owner'
        }
      }
    }
  } catch (error) {
    console.error('Invalid owner auth token:', error)
  }
  
  return { isOwner: false, user: null }
}

/**
 * React hook for permission checking (to be used in components)
 */
export function usePermissions(userRole: Role) {
  return {
    hasPermission: (permission: Permission) => hasPermission(userRole, permission),
    hasAnyPermission: (permissions: Permission[]) => hasAnyPermission(userRole, permissions),
    hasAllPermissions: (permissions: Permission[]) => hasAllPermissions(userRole, permissions),
    canAccess: (resource: string, action: string) => canAccess(userRole, resource, action),
    getPermissionLevel: (resource: string) => getPermissionLevel(userRole, resource),
    isOwner: () => userRole === 'OWNER',
    isAdmin: () => ['OWNER', 'ADMIN'].includes(userRole),
    isManager: () => ['OWNER', 'ADMIN', 'MANAGER'].includes(userRole)
  }
}