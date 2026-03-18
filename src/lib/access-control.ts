"use client"

import { headers } from 'next/headers'
import { supabase } from '@/lib/supabase'

// User interface for type safety
export interface User {
  id: string
  email: string
  displayName: string
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'VIEWER'
  isOwner: boolean
  authMethod?: 'cookie' | 'supabase'
}

// Role hierarchy for permission checks
const ROLE_HIERARCHY = {
  OWNER: 4,
  ADMIN: 3,
  MANAGER: 2,
  VIEWER: 1
}

/**
 * Get current user information from request headers (set by middleware)
 * Works in server components and API routes
 */
export function getCurrentUser(): User | null {
  try {
    const headersList = headers()
    
    const id = headersList.get('x-user-id')
    const email = headersList.get('x-user-email')
    const displayName = headersList.get('x-user-name')
    const role = headersList.get('x-user-role') as 'OWNER' | 'ADMIN' | 'MANAGER' | 'VIEWER'
    const isOwner = headersList.get('x-user-is-owner') === 'true'
    const authMethod = headersList.get('x-auth-method') as 'cookie' | 'supabase'

    if (!id || !email || !displayName || !role) {
      return null
    }

    return {
      id,
      email,
      displayName,
      role,
      isOwner,
      authMethod
    }
  } catch (error) {
    console.error('Failed to get current user from headers:', error)
    return null
  }
}

/**
 * Get current user information from client-side (React components)
 * Uses Supabase Auth for team members, localStorage check for owner
 */
export async function getCurrentUserClient(): Promise<User | null> {
  try {
    // Check if owner is logged in (cookie-based)
    const response = await fetch('/api/auth/verify', { credentials: 'include' })
    if (response.ok) {
      const data = await response.json()
      if (data.authenticated && data.user) {
        return data.user
      }
    }

    // Check Supabase Auth for team members
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (user && !error) {
      // Get team member details
      const { data: teamMember, error: memberError } = await supabase
        .from('team_members')
        .select('id, email, display_name, role, is_active')
        .eq('email', user.email)
        .eq('is_active', true)
        .single()

      if (teamMember && !memberError) {
        return {
          id: teamMember.id,
          email: teamMember.email,
          displayName: teamMember.display_name,
          role: teamMember.role as 'OWNER' | 'ADMIN' | 'MANAGER' | 'VIEWER',
          isOwner: teamMember.role === 'OWNER',
          authMethod: 'supabase'
        }
      }
    }

    return null
  } catch (error) {
    console.error('Failed to get current user from client:', error)
    return null
  }
}

/**
 * Check if user can access a specific project
 * OWNER/ADMIN: always true
 * MANAGER/VIEWER: checks project_assignments table
 */
export async function canAccessProject(userId: string, projectId: string): Promise<boolean> {
  try {
    const user = getCurrentUser()
    
    // Owner and Admin have access to all projects
    if (user && (user.role === 'OWNER' || user.role === 'ADMIN')) {
      return true
    }

    // For MANAGER and VIEWER, check project assignments
    const { data: assignment, error } = await supabase
      .from('project_assignments')
      .select('id')
      .eq('member_id', userId)
      .eq('project_id', projectId)
      .single()

    return !error && assignment !== null
  } catch (error) {
    console.error('Error checking project access:', error)
    return false
  }
}

/**
 * Get user's access level for a specific project
 * Returns the access level (ADMIN/MANAGER/VIEWER) or null if no access
 */
export async function getAccessLevel(
  userId: string, 
  projectId: string
): Promise<'ADMIN' | 'MANAGER' | 'VIEWER' | null> {
  try {
    const user = getCurrentUser()
    
    // Owner has ADMIN access to all projects
    if (user && user.role === 'OWNER') {
      return 'ADMIN'
    }

    // Global Admin has ADMIN access to all projects
    if (user && user.role === 'ADMIN') {
      return 'ADMIN'
    }

    // For MANAGER and VIEWER, check project assignments
    const { data: assignment, error } = await supabase
      .from('project_assignments')
      .select('access_level')
      .eq('member_id', userId)
      .eq('project_id', projectId)
      .single()

    if (error || !assignment) {
      return null
    }

    return assignment.access_level as 'ADMIN' | 'MANAGER' | 'VIEWER'
  } catch (error) {
    console.error('Error getting access level:', error)
    return null
  }
}

/**
 * Check if user's role is at least the required role level
 * Role hierarchy: OWNER > ADMIN > MANAGER > VIEWER
 * Examples:
 * - isAtLeast('MANAGER', 'VIEWER') = true
 * - isAtLeast('VIEWER', 'ADMIN') = false
 */
export function isAtLeast(
  userRole: 'OWNER' | 'ADMIN' | 'MANAGER' | 'VIEWER',
  requiredRole: 'OWNER' | 'ADMIN' | 'MANAGER' | 'VIEWER'
): boolean {
  const userLevel = ROLE_HIERARCHY[userRole] || 0
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0
  
  return userLevel >= requiredLevel
}

/**
 * Check if user has permission to perform a specific action
 * Actions can be: 'read', 'write', 'admin', 'delete'
 */
export function hasPermission(
  userRole: 'OWNER' | 'ADMIN' | 'MANAGER' | 'VIEWER',
  action: 'read' | 'write' | 'admin' | 'delete'
): boolean {
  switch (action) {
    case 'read':
      return isAtLeast(userRole, 'VIEWER')
    case 'write':
      return isAtLeast(userRole, 'MANAGER')
    case 'admin':
      return isAtLeast(userRole, 'ADMIN')
    case 'delete':
      return userRole === 'OWNER'
    default:
      return false
  }
}

/**
 * Get all projects accessible to the current user
 * OWNER/ADMIN: all projects
 * MANAGER/VIEWER: only assigned projects
 */
export async function getAccessibleProjects(userId: string): Promise<string[]> {
  try {
    const user = getCurrentUser()
    
    // Owner and Admin see all projects
    if (user && (user.role === 'OWNER' || user.role === 'ADMIN')) {
      const { data: projects, error } = await supabase
        .from('projects')
        .select('id')
        .neq('status', 'deleted')

      if (error) {
        console.error('Error fetching all projects:', error)
        return []
      }

      return projects.map(p => p.id)
    }

    // MANAGER and VIEWER see only assigned projects
    const { data: assignments, error } = await supabase
      .from('project_assignments')
      .select('project_id')
      .eq('member_id', userId)

    if (error) {
      console.error('Error fetching user projects:', error)
      return []
    }

    return assignments.map(a => a.project_id)
  } catch (error) {
    console.error('Error getting accessible projects:', error)
    return []
  }
}

/**
 * Format role for display with appropriate styling
 */
export function getRoleDisplay(role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'VIEWER') {
  const roleConfig = {
    OWNER: { label: 'Owner', color: 'bg-gradient-to-r from-yellow-500 to-orange-500', icon: '👑' },
    ADMIN: { label: 'Admin', color: 'bg-blue-500', icon: '⚡' },
    MANAGER: { label: 'Manager', color: 'bg-green-500', icon: '📊' },
    VIEWER: { label: 'Viewer', color: 'bg-gray-500', icon: '👁️' }
  }

  return roleConfig[role] || roleConfig.VIEWER
}