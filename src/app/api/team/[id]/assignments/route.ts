import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requirePermission, checkOwnerAuth } from '@/lib/rbac'
import { logSecurityEvent } from '@/lib/security-logger'

interface UpdateAssignmentsRequest {
  assignments: {
    [projectId: string]: 'lead' | 'member' | 'viewer' | null
  }
}

/**
 * GET /api/team/[id]/assignments
 * Get project assignments for a team member
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check permissions - only admin/owner can view assignments
    const isOwner = await checkOwnerAuth(req)
    if (!isOwner) {
      const permissionCheck = await requirePermission(req, 'admin')
      if (!permissionCheck.authorized) {
        return NextResponse.json(
          { success: false, message: permissionCheck.message },
          { status: 403 }
        )
      }
    }

    // Get project assignments for the team member
    const { data: assignments, error } = await supabaseAdmin
      .from('project_assignments')
      .select(`
        *,
        projects!project_assignments_project_id_fkey (
          id,
          name,
          status
        )
      `)
      .eq('user_id', id)

    if (error) {
      console.error('Error fetching assignments:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch project assignments' },
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
    console.error('Error in GET /api/team/[id]/assignments:', error)
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
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check permissions - only owner can update assignments
    const ownerCheck = await checkOwnerAuth(req)
    if (!ownerCheck) {
      return NextResponse.json(
        { success: false, message: 'Only the owner can update project assignments' },
        { status: 403 }
      )
    }

    const body: UpdateAssignmentsRequest = await req.json()
    const { assignments } = body

    if (!assignments || typeof assignments !== 'object') {
      return NextResponse.json(
        { success: false, message: 'Invalid assignments data' },
        { status: 400 }
      )
    }

    // Start a transaction-like operation
    const updatePromises = []
    const removals = []
    const additions = []

    // Process each assignment
    for (const [projectId, role] of Object.entries(assignments)) {
      if (role === null) {
        // Remove assignment
        removals.push(projectId)
        updatePromises.push(
          supabaseAdmin
            .from('project_assignments')
            .delete()
            .eq('user_id', id)
            .eq('project_id', projectId)
        )
      } else {
        // Check if assignment exists
        const { data: existing } = await supabaseAdmin
          .from('project_assignments')
          .select('id, role')
          .eq('user_id', id)
          .eq('project_id', projectId)
          .single()

        if (existing) {
          // Update existing assignment
          if (existing.role !== role) {
            updatePromises.push(
              supabaseAdmin
                .from('project_assignments')
                .update({ 
                  role, 
                  updated_at: new Date().toISOString() 
                })
                .eq('id', existing.id)
            )
          }
        } else {
          // Create new assignment
          additions.push({ projectId, role })
          updatePromises.push(
            supabaseAdmin
              .from('project_assignments')
              .insert({
                user_id: id,
                project_id: projectId,
                role,
                assigned_at: new Date().toISOString()
              })
          )
        }
      }
    }

    // Execute all updates
    const results = await Promise.allSettled(updatePromises)
    
    // Check for errors
    const failedOperations = results.filter(r => r.status === 'rejected')
    if (failedOperations.length > 0) {
      console.error('Some assignment updates failed:', failedOperations)
      return NextResponse.json(
        { 
          success: false, 
          message: 'Some assignment updates failed',
          errors: failedOperations 
        },
        { status: 500 }
      )
    }

    // Log security event
    await logSecurityEvent(
      'project_assignments_updated',
      req,
      'info',
      {
        targetUserId: id,
        removedProjects: removals,
        addedProjects: additions.map(a => a.projectId),
        totalUpdates: updatePromises.length
      }
    )

    // Get updated assignments
    const { data: updatedAssignments } = await supabaseAdmin
      .from('project_assignments')
      .select(`
        *,
        projects!project_assignments_project_id_fkey (
          id,
          name,
          status
        )
      `)
      .eq('user_id', id)

    return NextResponse.json({
      success: true,
      message: 'Project assignments updated successfully',
      data: {
        assignments: updatedAssignments || [],
        updates: {
          removed: removals.length,
          added: additions.length,
          modified: updatePromises.length - removals.length - additions.length
        }
      }
    })

  } catch (error) {
    console.error('Error in PUT /api/team/[id]/assignments:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/team/[id]/assignments
 * Remove all project assignments for a team member
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check permissions - only owner can remove all assignments
    const ownerCheck = await checkOwnerAuth(req)
    if (!ownerCheck) {
      return NextResponse.json(
        { success: false, message: 'Only the owner can remove all project assignments' },
        { status: 403 }
      )
    }

    // Get current assignments for logging
    const { data: currentAssignments } = await supabaseAdmin
      .from('project_assignments')
      .select('project_id')
      .eq('user_id', id)

    // Delete all assignments
    const { error } = await supabaseAdmin
      .from('project_assignments')
      .delete()
      .eq('user_id', id)

    if (error) {
      console.error('Error removing assignments:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to remove project assignments' },
        { status: 500 }
      )
    }

    // Log security event
    await logSecurityEvent(
      'all_project_assignments_removed',
      req,
      'warning',
      {
        targetUserId: id,
        removedProjectCount: currentAssignments?.length || 0,
        removedProjects: currentAssignments?.map(a => a.project_id) || []
      }
    )

    return NextResponse.json({
      success: true,
      message: 'All project assignments removed successfully',
      data: {
        removedCount: currentAssignments?.length || 0
      }
    })

  } catch (error) {
    console.error('Error in DELETE /api/team/[id]/assignments:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/team/[id]/assignments
 * Bulk create project assignments
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check permissions - only owner can bulk create assignments
    const ownerCheck = await checkOwnerAuth(req)
    if (!ownerCheck) {
      return NextResponse.json(
        { success: false, message: 'Only the owner can bulk create project assignments' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { projectIds, role = 'member' } = body

    if (!Array.isArray(projectIds) || projectIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Project IDs array is required' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['lead', 'member', 'viewer'].includes(role)) {
      return NextResponse.json(
        { success: false, message: 'Invalid role specified' },
        { status: 400 }
      )
    }

    // Create assignments for each project
    const assignments = projectIds.map(projectId => ({
      user_id: id,
      project_id: projectId,
      role,
      assigned_at: new Date().toISOString()
    }))

    const { data: created, error } = await supabaseAdmin
      .from('project_assignments')
      .insert(assignments)
      .select()

    if (error) {
      console.error('Error creating assignments:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to create project assignments' },
        { status: 500 }
      )
    }

    // Log security event
    await logSecurityEvent(
      'bulk_project_assignments_created',
      req,
      'info',
      {
        targetUserId: id,
        projectCount: projectIds.length,
        projectIds,
        role
      }
    )

    return NextResponse.json({
      success: true,
      message: `Created ${created.length} project assignments`,
      data: {
        created: created.length,
        assignments: created
      }
    })

  } catch (error) {
    console.error('Error in POST /api/team/[id]/assignments:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}