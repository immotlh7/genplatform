import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requirePermission, checkOwnerAuth } from '@/lib/rbac'
import { logSecurityEvent } from '@/lib/security-logger'

interface RouteParams {
  params: {
    id: string
  }
}

interface UpdateAssignmentsRequest {
  assignments: {
    [projectId: string]: 'lead' | 'member' | 'viewer' | null
  }
}

/**
 * GET /api/team/[id]/assignments
 * Get project assignments for a team member
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = params
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

  try {
    if (!id || id === 'undefined') {
      return NextResponse.json(
        { success: false, message: 'Team member ID is required' },
        { status: 400 }
      )
    }

    // Check authentication and permissions
    const authCookie = req.cookies.get('auth-token')?.value
    let authorized = false

    const ownerAuth = checkOwnerAuth(authCookie)
    if (ownerAuth.isOwner) {
      authorized = true
    } else {
      const permissionCheck = await requirePermission('team:read')
      if (permissionCheck.authorized) {
        authorized = true
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
        { success: false, message: 'Service unavailable' },
        { status: 503 }
      )
    }

    // Get team member's project assignments
    const { data: assignments, error } = await supabaseAdmin
      .from('project_assignments')
      .select(`
        id,
        project_id,
        team_member_id,
        role,
        assigned_at,
        projects (
          id,
          name,
          status,
          progress
        )
      `)
      .eq('team_member_id', id)
      .order('assigned_at', { ascending: false })

    if (error) {
      console.error('Error fetching project assignments:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch assignments' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        assignments: assignments || []
      }
    })

  } catch (error) {
    console.error('Assignments fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/team/[id]/assignments
 * Update project assignments for a team member
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const { id } = params
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  const userAgent = req.headers.get('user-agent') || 'unknown'

  try {
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

    const ownerAuth = checkOwnerAuth(authCookie)
    if (ownerAuth.isOwner) {
      authorized = true
      requestorInfo = ownerAuth.user
    } else {
      const permissionCheck = await requirePermission('team:assign_projects')
      if (permissionCheck.authorized) {
        authorized = true
        requestorInfo = permissionCheck.user
      }
    }

    if (!authorized) {
      await logSecurityEvent(ip, 'unauthorized_assignment_update_attempt', 'warning', {
        targetMemberId: id,
        userAgent,
        timestamp: new Date().toISOString()
      })

      return NextResponse.json(
        { success: false, message: 'Insufficient permissions to manage project assignments' },
        { status: 403 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, message: 'Service unavailable' },
        { status: 503 }
      )
    }

    // Parse request body
    const body: UpdateAssignmentsRequest = await req.json()
    const { assignments } = body

    if (!assignments || typeof assignments !== 'object') {
      return NextResponse.json(
        { success: false, message: 'Invalid assignments data' },
        { status: 400 }
      )
    }

    // Verify team member exists
    const { data: teamMember, error: memberError } = await supabaseAdmin
      .from('team_members')
      .select('id, email, full_name, role')
      .eq('id', id)
      .single()

    if (memberError || !teamMember) {
      return NextResponse.json(
        { success: false, message: 'Team member not found' },
        { status: 404 }
      )
    }

    // Get current assignments
    const { data: currentAssignments, error: currentError } = await supabaseAdmin
      .from('project_assignments')
      .select('id, project_id, role')
      .eq('team_member_id', id)

    if (currentError) {
      console.error('Error fetching current assignments:', currentError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch current assignments' },
        { status: 500 }
      )
    }

    // Process assignment changes
    const currentAssignmentMap = new Map()
    currentAssignments?.forEach(assignment => {
      currentAssignmentMap.set(assignment.project_id, {
        id: assignment.id,
        role: assignment.role
      })
    })

    const toAdd: Array<{ project_id: string, role: string }> = []
    const toUpdate: Array<{ id: string, role: string }> = []
    const toRemove: string[] = []
    const changes: string[] = []

    // Process requested assignments
    for (const [projectId, newRole] of Object.entries(assignments)) {
      const current = currentAssignmentMap.get(projectId)

      if (newRole === null) {
        // Remove assignment
        if (current) {
          toRemove.push(current.id)
          changes.push(`Removed from project ${projectId}`)
        }
      } else {
        // Add or update assignment
        if (!current) {
          toAdd.push({ project_id: projectId, role: newRole })
          changes.push(`Added to project ${projectId} as ${newRole}`)
        } else if (current.role !== newRole) {
          toUpdate.push({ id: current.id, role: newRole })
          changes.push(`Changed role in project ${projectId}: ${current.role} → ${newRole}`)
        }
      }
    }

    // Check for assignments to remove (if project not in new assignments but exists in current)
    for (const [projectId, current] of currentAssignmentMap) {
      if (!(projectId in assignments)) {
        toRemove.push(current.id)
        changes.push(`Removed from project ${projectId}`)
      }
    }

    // Execute changes in transaction-like manner
    const errors: string[] = []

    try {
      // Remove assignments
      if (toRemove.length > 0) {
        const { error: removeError } = await supabaseAdmin
          .from('project_assignments')
          .delete()
          .in('id', toRemove)

        if (removeError) {
          errors.push(`Failed to remove assignments: ${removeError.message}`)
        }
      }

      // Update assignments
      for (const update of toUpdate) {
        const { error: updateError } = await supabaseAdmin
          .from('project_assignments')
          .update({ role: update.role })
          .eq('id', update.id)

        if (updateError) {
          errors.push(`Failed to update assignment ${update.id}: ${updateError.message}`)
        }
      }

      // Add new assignments
      if (toAdd.length > 0) {
        const assignmentsToInsert = toAdd.map(assignment => ({
          team_member_id: id,
          project_id: assignment.project_id,
          role: assignment.role,
          assigned_at: new Date().toISOString()
        }))

        const { error: addError } = await supabaseAdmin
          .from('project_assignments')
          .insert(assignmentsToInsert)

        if (addError) {
          errors.push(`Failed to add new assignments: ${addError.message}`)
        }
      }

      if (errors.length > 0) {
        return NextResponse.json(
          { success: false, message: 'Some assignment updates failed', errors },
          { status: 500 }
        )
      }

      // Log successful update
      await supabaseAdmin
        .from('security_events')
        .insert({
          event_type: 'audit',
          severity: 'info',
          description: `Project assignments updated for ${teamMember.email}`,
          details: {
            target_member_id: id,
            target_member_email: teamMember.email,
            changes: changes,
            updated_by: requestorInfo?.email,
            updater_role: requestorInfo?.role,
            assignments_added: toAdd.length,
            assignments_updated: toUpdate.length,
            assignments_removed: toRemove.length,
            timestamp: new Date().toISOString()
          },
          resolved: true
        })

      await logSecurityEvent(ip, 'project_assignments_updated', 'info', {
        targetMemberEmail: teamMember.email,
        targetMemberId: id,
        changesCount: changes.length,
        changes: changes,
        updaterEmail: requestorInfo?.email,
        updaterRole: requestorInfo?.role,
        userAgent
      })

      return NextResponse.json({
        success: true,
        message: 'Project assignments updated successfully',
        data: {
          member: {
            id: teamMember.id,
            email: teamMember.email,
            full_name: teamMember.full_name
          },
          changes: changes,
          summary: {
            added: toAdd.length,
            updated: toUpdate.length,
            removed: toRemove.length
          }
        }
      })

    } catch (transactionError) {
      console.error('Error during assignment transaction:', transactionError)
      return NextResponse.json(
        { success: false, message: 'Failed to update assignments' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Assignment update error:', error)
    
    await logSecurityEvent(ip, 'assignment_update_system_error', 'critical', {
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