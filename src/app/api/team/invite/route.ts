import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/access-control'
import { supabase } from '@/lib/supabase'

interface ProjectAssignment {
  projectId: string
  accessLevel: 'ADMIN' | 'MANAGER' | 'VIEWER'
}

interface InviteRequest {
  email: string
  displayName: string
  role: 'ADMIN' | 'MANAGER' | 'VIEWER'
  projectAssignments: ProjectAssignment[]
}

export async function POST(request: NextRequest) {
  try {
    // Only OWNER can invite team members
    const currentUser = getCurrentUser()
    if (!currentUser || currentUser.role !== 'OWNER') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only platform owner can invite team members' },
        { status: 403 }
      )
    }

    const body: InviteRequest = await request.json()
    const { email, displayName, role, projectAssignments } = body

    // Validate required fields
    if (!email || !displayName || !role) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: email, displayName, role' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['ADMIN', 'MANAGER', 'VIEWER'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role. Must be ADMIN, MANAGER, or VIEWER' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const { data: existingMember, error: checkError } = await supabase
      .from('team_members')
      .select('id, email')
      .eq('email', email)
      .single()

    if (existingMember && !checkError) {
      return NextResponse.json(
        { success: false, error: 'A team member with this email already exists' },
        { status: 409 }
      )
    }

    // Step 1: Create Supabase Auth user (sends invitation email automatically)
    const { data: authUser, error: authError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: {
        display_name: displayName,
        role: role,
        invited_by: currentUser.id
      },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://genplatform-six.vercel.app'}/auth/callback`
    })

    if (authError || !authUser.user) {
      console.error('Supabase Auth invite error:', authError)
      return NextResponse.json(
        { success: false, error: 'Failed to send invitation email' },
        { status: 500 }
      )
    }

    // Step 2: Insert into team_members table
    const { data: teamMember, error: memberError } = await supabase
      .from('team_members')
      .insert({
        email,
        display_name: displayName,
        role,
        is_active: true,
        invited_by: currentUser.id,
        invited_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (memberError || !teamMember) {
      console.error('Team member creation error:', memberError)
      
      // Clean up the auth user if team member creation fails
      await supabase.auth.admin.deleteUser(authUser.user.id)
      
      return NextResponse.json(
        { success: false, error: 'Failed to create team member record' },
        { status: 500 }
      )
    }

    // Step 3: Create project assignments
    if (projectAssignments && projectAssignments.length > 0) {
      // Validate that all referenced projects exist
      const projectIds = projectAssignments.map(a => a.projectId)
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id')
        .in('id', projectIds)

      if (projectsError || projects.length !== projectIds.length) {
        console.error('Invalid project references:', projectsError)
        return NextResponse.json(
          { success: false, error: 'One or more referenced projects do not exist' },
          { status: 400 }
        )
      }

      // Insert project assignments
      const assignments = projectAssignments.map(assignment => ({
        project_id: assignment.projectId,
        member_id: teamMember.id,
        access_level: assignment.accessLevel,
        assigned_at: new Date().toISOString()
      }))

      const { error: assignmentError } = await supabase
        .from('project_assignments')
        .insert(assignments)

      if (assignmentError) {
        console.error('Project assignment error:', assignmentError)
        // Don't fail the entire operation for assignment errors
        // The team member is created, just log the error
      }
    }

    // Log the invitation as a security event
    await supabase
      .from('security_events')
      .insert({
        event_type: 'login', // Using 'login' as closest available type
        severity: 'info',
        description: `Team member invited: ${displayName} (${email}) with role ${role}`,
        details: {
          invited_email: email,
          invited_role: role,
          invited_by: currentUser.email,
          project_assignments: projectAssignments.length
        }
      })

    return NextResponse.json({
      success: true,
      memberId: teamMember.id,
      message: `Invitation sent to ${email}`,
      data: {
        id: teamMember.id,
        email: teamMember.email,
        displayName: teamMember.display_name,
        role: teamMember.role,
        projectAssignments: projectAssignments.length
      }
    })

  } catch (error) {
    console.error('Team invitation error:', error)
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