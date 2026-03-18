import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/access-control'
import { supabase } from '@/lib/supabase'

interface UpdateMemberRequest {
  role?: 'ADMIN' | 'MANAGER' | 'VIEWER'
  displayName?: string
  isActive?: boolean
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Only OWNER can update team members (with some exceptions)
    const currentUser = getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const memberId = params.id
    const body: UpdateMemberRequest = await request.json()
    const { role, displayName, isActive } = body

    // Get the target member
    const { data: targetMember, error: fetchError } = await supabase
      .from('team_members')
      .select('*')
      .eq('id', memberId)
      .single()

    if (fetchError || !targetMember) {
      return NextResponse.json(
        { success: false, error: 'Team member not found' },
        { status: 404 }
      )
    }

    // Permission checks
    if (role && currentUser.role !== 'OWNER') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only platform owner can change roles' },
        { status: 403 }
      )
    }

    // Users can update their own display name
    const canUpdateDisplayName = currentUser.role === 'OWNER' || currentUser.id === memberId
    if (displayName && !canUpdateDisplayName) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: You can only update your own display name' },
        { status: 403 }
      )
    }

    // Only OWNER can change active status
    if (isActive !== undefined && currentUser.role !== 'OWNER') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only platform owner can activate/deactivate members' },
        { status: 403 }
      )
    }

    // Cannot change OWNER role or deactivate OWNER
    if (targetMember.role === 'OWNER') {
      if (role && role !== 'OWNER') {
        return NextResponse.json(
          { success: false, error: 'Cannot change platform owner role' },
          { status: 400 }
        )
      }
      if (isActive === false) {
        return NextResponse.json(
          { success: false, error: 'Cannot deactivate platform owner' },
          { status: 400 }
        )
      }
    }

    // Validate role if provided
    if (role && !['ADMIN', 'MANAGER', 'VIEWER'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role. Must be ADMIN, MANAGER, or VIEWER' },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (role) updateData.role = role
    if (displayName) updateData.display_name = displayName
    if (isActive !== undefined) updateData.is_active = isActive

    // Update the team member
    const { data: updatedMember, error: updateError } = await supabase
      .from('team_members')
      .update(updateData)
      .eq('id', memberId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating team member:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update team member' },
        { status: 500 }
      )
    }

    // If role changed, update all project assignments accordingly
    if (role && role !== targetMember.role) {
      // For role changes, we might need to adjust project access levels
      // ADMIN gets ADMIN access to all assigned projects
      // MANAGER and VIEWER keep their existing project access levels
      
      if (role === 'ADMIN') {
        // Upgrade all project assignments to ADMIN level
        const { error: upgradeError } = await supabase
          .from('project_assignments')
          .update({ 
            access_level: 'ADMIN',
            updated_at: new Date().toISOString()
          })
          .eq('member_id', memberId)

        if (upgradeError) {
          console.error('Error upgrading project access levels:', upgradeError)
        }
      }
      // For MANAGER and VIEWER, we keep existing project access levels
    }

    // Log the change as a security event
    const changes = []
    if (role) changes.push(`role: ${targetMember.role} → ${role}`)
    if (displayName) changes.push(`name: ${targetMember.display_name} → ${displayName}`)
    if (isActive !== undefined) changes.push(`status: ${targetMember.is_active ? 'active' : 'inactive'} → ${isActive ? 'active' : 'inactive'}`)

    await supabase
      .from('security_events')
      .insert({
        event_type: 'audit',
        severity: 'info',
        description: `Team member updated: ${targetMember.display_name} (${targetMember.email})`,
        details: {
          target_member: targetMember.email,
          changes: changes,
          updated_by: currentUser.email
        }
      })

    return NextResponse.json({
      success: true,
      member: updatedMember,
      changes: changes,
      message: `Team member updated successfully`
    })

  } catch (error) {
    console.error('Team member update error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Only OWNER can delete team members
    const currentUser = getCurrentUser()
    if (!currentUser || currentUser.role !== 'OWNER') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only platform owner can remove team members' },
        { status: 403 }
      )
    }

    const memberId = params.id

    // Get the target member
    const { data: targetMember, error: fetchError } = await supabase
      .from('team_members')
      .select('*')
      .eq('id', memberId)
      .single()

    if (fetchError || !targetMember) {
      return NextResponse.json(
        { success: false, error: 'Team member not found' },
        { status: 404 }
      )
    }

    // Cannot delete OWNER
    if (targetMember.role === 'OWNER') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete platform owner' },
        { status: 400 }
      )
    }

    // Cannot delete yourself
    if (currentUser.id === memberId) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Soft delete: set is_active=false instead of hard delete to preserve data integrity
    const { data: deactivatedMember, error: updateError } = await supabase
      .from('team_members')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', memberId)
      .select()
      .single()

    if (updateError) {
      console.error('Error deactivating team member:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to remove team member' },
        { status: 500 }
      )
    }

    // Remove all project assignments for this member
    const { error: assignmentError } = await supabase
      .from('project_assignments')
      .delete()
      .eq('member_id', memberId)

    if (assignmentError) {
      console.error('Error removing project assignments:', assignmentError)
      // Don't fail the operation, but log the error
    }

    // Try to revoke Supabase Auth session
    try {
      // Get the user's auth ID from Supabase Auth
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
      
      if (!authError && authUsers.users) {
        const authUser = authUsers.users.find(user => user.email === targetMember.email)
        
        if (authUser) {
          // Delete the auth user to revoke all sessions
          const { error: deleteError } = await supabase.auth.admin.deleteUser(authUser.id)
          
          if (deleteError) {
            console.error('Error deleting auth user:', deleteError)
            // Don't fail the operation, but log the error
          }
        }
      }
    } catch (authError) {
      console.error('Error revoking auth session:', authError)
      // Don't fail the operation
    }

    // Log the removal as a security event
    await supabase
      .from('security_events')
      .insert({
        event_type: 'audit',
        severity: 'warning',
        description: `Team member removed: ${targetMember.display_name} (${targetMember.email})`,
        details: {
          removed_member: {
            email: targetMember.email,
            name: targetMember.display_name,
            role: targetMember.role
          },
          removed_by: currentUser.email,
          action: 'team_member_removal'
        }
      })

    return NextResponse.json({
      success: true,
      message: `Team member ${targetMember.display_name} has been removed`,
      details: {
        email: targetMember.email,
        displayName: targetMember.display_name,
        role: targetMember.role,
        removedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Team member deletion error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}