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

// Client-side function to get current user
export async function getCurrentUserClient(): Promise<User | null> {
  try {
    const response = await fetch('/api/auth/verify', {
      credentials: 'include'
    })
    
    if (response.ok) {
      const userData = await response.json()
      return {
        id: userData.id,
        email: userData.email,
        displayName: userData.displayName || userData.email,
        role: userData.role,
        isOwner: userData.role === 'OWNER',
        authMethod: userData.authMethod || 'cookie'
      }
    }
    
    return null
  } catch (error) {
    console.error('Error getting current user (client):', error)
    return null
  }
}

// Check if user has required role or higher
export function hasRole(user: User | null, requiredRole: 'OWNER' | 'ADMIN' | 'MANAGER' | 'VIEWER'): boolean {
  if (!user) return false
  
  const userLevel = ROLE_HIERARCHY[user.role] || 0
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0
  
  return userLevel >= requiredLevel
}

// Role display helper
export function getRoleDisplay(role: string): { label: string; color: string; description: string } {
  switch (role) {
    case 'OWNER':
      return {
        label: 'Owner',
        color: 'bg-red-500 text-white',
        description: 'Full platform access and control'
      }
    case 'ADMIN':
      return {
        label: 'Admin',
        color: 'bg-orange-500 text-white',
        description: 'Administrative access to all projects'
      }
    case 'MANAGER':
      return {
        label: 'Manager',
        color: 'bg-blue-500 text-white',
        description: 'Manage assigned projects and tasks'
      }
    case 'VIEWER':
      return {
        label: 'Viewer',
        color: 'bg-gray-500 text-white',
        description: 'Read-only access to assigned projects'
      }
    default:
      return {
        label: 'Unknown',
        color: 'bg-gray-500 text-white',
        description: 'Unknown role'
      }
  }
}

// Check if user can access a specific project
export async function canAccessProject(userId: string, projectId: string): Promise<boolean> {
  try {
    // Get user info first
    const { data: user, error: userError } = await supabase
      .from('team_members')
      .select('role')
      .eq('id', userId)
      .single()

    if (userError || !user) return false

    // OWNER and ADMIN have access to all projects
    if (user.role === 'OWNER' || user.role === 'ADMIN') {
      return true
    }

    // Check project assignments for MANAGER and VIEWER
    const { data: assignment, error: assignmentError } = await supabase
      .from('project_assignments')
      .select('access_level')
      .eq('member_id', userId)
      .eq('project_id', projectId)
      .single()

    return !assignmentError && !!assignment
  } catch (error) {
    console.error('Error checking project access:', error)
    return false
  }
}

// Get user's access level for a project
export async function getAccessLevel(userId: string, projectId: string): Promise<'ADMIN' | 'MANAGER' | 'VIEWER' | null> {
  try {
    // Get user info first
    const { data: user, error: userError } = await supabase
      .from('team_members')
      .select('role')
      .eq('id', userId)
      .single()

    if (userError || !user) return null

    // OWNER gets ADMIN access to all projects
    if (user.role === 'OWNER') return 'ADMIN'
    
    // ADMIN gets ADMIN access to all projects
    if (user.role === 'ADMIN') return 'ADMIN'

    // Check specific project assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('project_assignments')
      .select('access_level')
      .eq('member_id', userId)
      .eq('project_id', projectId)
      .single()

    if (assignmentError || !assignment) return null

    return assignment.access_level
  } catch (error) {
    console.error('Error getting access level:', error)
    return null
  }
}

// Get list of accessible project IDs for a user
export async function getAccessibleProjects(userId: string): Promise<string[]> {
  try {
    // Get user info first
    const { data: user, error: userError } = await supabase
      .from('team_members')
      .select('role')
      .eq('id', userId)
      .single()

    if (userError || !user) return []

    // OWNER and ADMIN see all projects
    if (user.role === 'OWNER' || user.role === 'ADMIN') {
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id')
        .neq('status', 'deleted')

      if (projectsError) return []
      return projects.map(p => p.id)
    }

    // MANAGER and VIEWER see only assigned projects
    const { data: assignments, error: assignmentsError } = await supabase
      .from('project_assignments')
      .select('project_id')
      .eq('member_id', userId)

    if (assignmentsError) return []
    return assignments.map(a => a.project_id)
  } catch (error) {
    console.error('Error getting accessible projects:', error)
    return []
  }
}

// Permission check functions
export function canManageTeam(user: User | null): boolean {
  return hasRole(user, 'OWNER')
}

export function canManageProjects(user: User | null): boolean {
  return hasRole(user, 'ADMIN')
}

export function canManageTasks(user: User | null): boolean {
  return hasRole(user, 'MANAGER')
}

export function canViewReports(user: User | null): boolean {
  return hasRole(user, 'VIEWER')
}

// Project-specific permission checks
export async function canEditProject(userId: string, projectId: string): Promise<boolean> {
  const accessLevel = await getAccessLevel(userId, projectId)
  return accessLevel === 'ADMIN' || accessLevel === 'MANAGER'
}

export async function canDeleteProject(userId: string, projectId: string): Promise<boolean> {
  const accessLevel = await getAccessLevel(userId, projectId)
  return accessLevel === 'ADMIN'
}

export async function canViewProject(userId: string, projectId: string): Promise<boolean> {
  return await canAccessProject(userId, projectId)
}