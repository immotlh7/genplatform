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