import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requirePermission, checkOwnerAuth, Role } from '@/lib/rbac'
import { logSecurityEvent } from '@/lib/security-logger'

interface UpdateTeamMemberRequest {
  full_name?: string
  role?: Role
  status?: 'active' | 'disabled'
}

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * PUT /api/team/[id]
 * Update team member information (role, status, name)
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const { id } = params
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  const userAgent = req.headers.get('user-agent') || 'unknown'

  try {
    // Validate team member ID
    if (!id || id === 'undefined') {
      return NextResponse.json(
        { success: false, message: 'Team member ID is required' },
        { status: 400 }
      )
    }

    // Check authentication and permissions
    const authCookie = req.cookies.get('auth-token')?.value
    let authorized = false
    let requestorInfo = null
    let requiredPermission: string

    // Parse request body to determine required permission
    const body: UpdateTeamMemberRequest = await req.json()
    const { full_name, role, status } = body

    // Determine required permission based on what's being updated
    if (role && role !== undefined) {
      requiredPermission = 'team:update_roles'  // Only owner can change roles
    } else {
      requiredPermission = 'team:invite'  // Admins can update other fields
    }

    // Check owner authentication first
    const ownerAuth = checkOwnerAuth(authCookie)
    if (ownerAuth.isOwner) {
      authorized = true
      requestorInfo = ownerAuth.user
    } else if (requiredPermission === 'team:invite') {
      // Check team member permissions for non-role updates
      const permissionCheck = await requirePermission('team:invite')
      if (permissionCheck.authorized) {
        authorized = true
        requestorInfo = permissionCheck.user
      }
    }

    if (!authorized) {
      await logSecurityEvent(ip, 'unauthorized_team_update_attempt', 'warning', {
        targetMemberId: id,
        attemptedChanges: Object.keys(body),
        userAgent,
        timestamp: new Date().toISOString()
      })

      return NextResponse.json(
        { success: false, message: 'Insufficient permissions to update team members' },
        { status: 403 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, message: 'Team service unavailable' },
        { status: 503 }
      )
    }

    // Get current team member data
    const { data: currentMember, error: fetchError } = await supabaseAdmin
      .from('team_members')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !currentMember) {
      return NextResponse.json(
        { success: false, message: 'Team member not found' },
        { status: 404 }
      )
    }

    // Prevent updating owner role or status (unless requestor is owner)
    if (currentMember.role === 'OWNER' && !ownerAuth.isOwner) {
      return NextResponse.json(
        { success: false, message: 'Cannot modify owner account' },
        { status: 403 }
      )
    }

    // Validate role if being updated
    if (role && !['ADMIN', 'MANAGER', 'VIEWER'].includes(role)) {
      return NextResponse.json(
        { success: false, message: 'Invalid role. Must be ADMIN, MANAGER, or VIEWER' },
        { status: 400 }
      )
    }

    // Validate status if being updated
    if (status && !['active', 'disabled'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status. Must be active or disabled' },
        { status: 400 }
      )
    }

    // Build update object
    const updateData: any = {}
    const changes: string[] = []

    if (full_name && full_name !== currentMember.full_name) {
      updateData.full_name = full_name.trim()
      changes.push(`name: ${currentMember.full_name} → ${full_name}`)
    }

    if (role && role !== currentMember.role) {
      updateData.role = role
      changes.push(`role: ${currentMember.role} → ${role}`)
    }

    if (status && status !== currentMember.status) {
      updateData.status = status
      changes.push(`status: ${currentMember.status} → ${status}`)

      // Update last_active if activating account
      if (status === 'active') {
        updateData.last_active = new Date().toISOString()
      }
    }

    // Check if there are any changes
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, message: 'No changes detected' },
        { status: 400 }
      )
    }

    // Perform update
    const { data: updatedMember, error: updateError } = await supabaseAdmin
      .from('team_members')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating team member:', updateError)
      return NextResponse.json(
        { success: false, message: 'Failed to update team member' },
        { status: 500 }
      )
    }

    // Log the update in security events
    await supabaseAdmin
      .from('security_events')
      .insert({
        event_type: 'audit',
        severity: 'info',
        description: `Team member updated: ${currentMember.email}`,
        details: {
          target_member_id: id,
          target_member_email: currentMember.email,
          changes: changes,
          updated_by: requestorInfo?.email,
          updater_role: requestorInfo?.role,
          timestamp: new Date().toISOString()
        },
        resolved: true
      })

    // Log security event
    await logSecurityEvent(ip, 'team_member_updated', 'info', {
      targetMemberEmail: currentMember.email,
      targetMemberId: id,
      changes: changes,
      updaterEmail: requestorInfo?.email,
      updaterRole: requestorInfo?.role,
      userAgent
    })

    return NextResponse.json({
      success: true,
      message: 'Team member updated successfully',
      data: {
        member: {
          id: updatedMember.id,
          email: updatedMember.email,
          full_name: updatedMember.full_name,
          role: updatedMember.role,
          status: updatedMember.status,
          last_active: updatedMember.last_active,
          created_at: updatedMember.created_at
        },
        changes: changes
      }
    })

  } catch (error) {
    console.error('Team update error:', error)
    
    await logSecurityEvent(ip, 'team_update_system_error', 'critical', {
      targetMemberId: id,
      error: error instanceof Error ? error.message : 'Unknown error',
      userAgent,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/team/[id]
 * Remove team member from the platform (owner only)
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { id } = params
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  const userAgent = req.headers.get('user-agent') || 'unknown'

  try {
    // Validate team member ID
    if (!id || id === 'undefined') {
      return NextResponse.json(
        { success: false, message: 'Team member ID is required' },
        { status: 400 }
      )
    }

    // Check authentication and permissions (owner only)
    const authCookie = req.cookies.get('auth-token')?.value
    const ownerAuth = checkOwnerAuth(authCookie)
    
    if (!ownerAuth.isOwner) {
      await logSecurityEvent(ip, 'unauthorized_team_delete_attempt', 'warning', {
        targetMemberId: id,
        userAgent,
        timestamp: new Date().toISOString()
      })

      return NextResponse.json(
        { success: false, message: 'Only platform owner can remove team members' },
        { status: 403 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, message: 'Team service unavailable' },
        { status: 503 }
      )
    }

    // Get team member details before deletion
    const { data: memberToDelete, error: fetchError } = await supabaseAdmin
      .from('team_members')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !memberToDelete) {
      return NextResponse.json(
        { success: false, message: 'Team member not found' },
        { status: 404 }
      )
    }

    // Prevent deleting the owner account
    if (memberToDelete.role === 'OWNER') {
      return NextResponse.json(
        { success: false, message: 'Cannot delete owner account' },
        { status: 403 }
      )
    }

    // Check if member has active project assignments
    const { data: activeAssignments, error: assignmentError } = await supabaseAdmin
      .from('project_assignments')
      .select('id, projects(name)')
      .eq('team_member_id', id)

    if (assignmentError) {
      console.error('Error checking project assignments:', assignmentError)
      return NextResponse.json(
        { success: false, message: 'Failed to check project assignments' },
        { status: 500 }
      )
    }

    const hasActiveProjects = activeAssignments && activeAssignments.length > 0

    // Parse query parameter for force deletion
    const url = new URL(req.url)
    const forceDelete = url.searchParams.get('force') === 'true'

    if (hasActiveProjects && !forceDelete) {
      return NextResponse.json({
        success: false,
        message: 'Team member has active project assignments',
        data: {
          requiresConfirmation: true,
          activeProjects: activeAssignments?.map(a => a.projects?.name).filter(Boolean),
          memberInfo: {
            email: memberToDelete.email,
            full_name: memberToDelete.full_name,
            role: memberToDelete.role
          }
        }
      }, { status: 409 })
    }

    // Begin transaction-like operations
    try {
      // 1. Remove project assignments
      if (hasActiveProjects) {
        const { error: removeAssignmentsError } = await supabaseAdmin
          .from('project_assignments')
          .delete()
          .eq('team_member_id', id)

        if (removeAssignmentsError) {
          throw new Error('Failed to remove project assignments')
        }
      }

      // 2. Remove from Supabase Auth if they have an auth account
      if (memberToDelete.status === 'active') {
        try {
          await supabaseAdmin.auth.admin.deleteUser(id)
        } catch (authError) {
          console.warn('Failed to delete user from Supabase Auth (may not exist):', authError)
          // Continue with team member deletion even if auth deletion fails
        }
      }

      // 3. Remove team member record
      const { error: deleteError } = await supabaseAdmin
        .from('team_members')
        .delete()
        .eq('id', id)

      if (deleteError) {
        throw new Error('Failed to delete team member record')
      }

      // Log the deletion in security events
      await supabaseAdmin
        .from('security_events')
        .insert({
          event_type: 'audit',
          severity: 'warning',
          description: `Team member removed: ${memberToDelete.email}`,
          details: {
            deleted_member_id: id,
            deleted_member_email: memberToDelete.email,
            deleted_member_name: memberToDelete.full_name,
            deleted_member_role: memberToDelete.role,
            had_active_projects: hasActiveProjects,
            force_delete: forceDelete,
            deleted_by: ownerAuth.user?.email,
            timestamp: new Date().toISOString()
          },
          resolved: true
        })

      // Log security event
      await logSecurityEvent(ip, 'team_member_deleted', 'warning', {
        deletedMemberEmail: memberToDelete.email,
        deletedMemberRole: memberToDelete.role,
        hadActiveProjects: hasActiveProjects,
        forceDelete,
        deletedBy: ownerAuth.user?.email,
        userAgent
      })

      return NextResponse.json({
        success: true,
        message: 'Team member removed successfully',
        data: {
          deletedMember: {
            email: memberToDelete.email,
            full_name: memberToDelete.full_name,
            role: memberToDelete.role
          },
          removedProjects: hasActiveProjects ? activeAssignments?.length : 0
        }
      })

    } catch (deletionError) {
      console.error('Error during team member deletion:', deletionError)
      return NextResponse.json(
        { success: false, message: 'Failed to remove team member completely' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Team delete error:', error)
    
    await logSecurityEvent(ip, 'team_delete_system_error', 'critical', {
      targetMemberId: id,
      error: error instanceof Error ? error.message : 'Unknown error',
      userAgent,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/team/[id]
 * Get individual team member details
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = params
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  const userAgent = req.headers.get('user-agent') || 'unknown'

  try {
    // Validate team member ID
    if (!id || id === 'undefined') {
      return NextResponse.json(
        { success: false, message: 'Team member ID is required' },
        { status: 400 }
      )
    }

    // Check authentication and permissions
    const authCookie = req.cookies.get('auth-token')?.value
    let authorized = false
    let requestorInfo = null

    // Check owner authentication first
    const ownerAuth = checkOwnerAuth(authCookie)
    if (ownerAuth.isOwner) {
      authorized = true
      requestorInfo = ownerAuth.user
    } else {
      // Check team member permissions
      const permissionCheck = await requirePermission('team:read')
      if (permissionCheck.authorized) {
        authorized = true
        requestorInfo = permissionCheck.user
      }
    }

    if (!authorized) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, message: 'Team service unavailable' },
        { status: 503 }
      )
    }

    // Get team member details with project assignments
    const { data: member, error: fetchError } = await supabaseAdmin
      .from('team_members')
      .select(`
        id,
        email,
        full_name,
        role,
        status,
        invited_by,
        joined_at,
        last_active,
        created_at,
        project_assignments (
          id,
          role,
          assigned_at,
          projects (
            id,
            name,
            status,
            progress
          )
        )
      `)
      .eq('id', id)
      .single()

    if (fetchError || !member) {
      return NextResponse.json(
        { success: false, message: 'Team member not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { member }
    })

  } catch (error) {
    console.error('Team member fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}