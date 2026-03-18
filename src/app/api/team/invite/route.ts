import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requirePermission, checkOwnerAuth } from '@/lib/rbac'
import { logSecurityEvent } from '@/lib/security-logger'

interface InviteTeamMemberRequest {
  email: string
  fullName: string
  role: 'ADMIN' | 'MANAGER' | 'VIEWER'
  message?: string
}

/**
 * POST /api/team/invite
 * Invite a new team member to join the platform
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  const userAgent = req.headers.get('user-agent') || 'unknown'

  try {
    // Check authentication and permissions
    const authCookie = req.cookies.get('auth-token')?.value
    let authorized = false
    let inviterInfo = null

    // Check owner authentication first
    const ownerAuth = checkOwnerAuth(authCookie)
    if (ownerAuth.isOwner) {
      authorized = true
      inviterInfo = ownerAuth.user
    } else {
      // Check team member permissions
      const permissionCheck = await requirePermission('team:invite')
      if (permissionCheck.authorized) {
        authorized = true
        inviterInfo = permissionCheck.user
      }
    }

    if (!authorized) {
      await logSecurityEvent(ip, 'unauthorized_team_invite_attempt', 'warning', {
        userAgent,
        timestamp: new Date().toISOString()
      })

      return NextResponse.json(
        { success: false, message: 'Insufficient permissions to invite team members' },
        { status: 403 }
      )
    }

    // Validate request body
    const body: InviteTeamMemberRequest = await req.json()
    const { email, fullName, role, message } = body

    if (!email || !fullName || !role) {
      return NextResponse.json(
        { success: false, message: 'Email, full name, and role are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['ADMIN', 'MANAGER', 'VIEWER'].includes(role)) {
      return NextResponse.json(
        { success: false, message: 'Invalid role. Must be ADMIN, MANAGER, or VIEWER' },
        { status: 400 }
      )
    }

    // Check if user is already in team
    if (supabaseAdmin) {
      const { data: existingMember, error: checkError } = await supabaseAdmin
        .from('team_members')
        .select('id, email, status')
        .eq('email', email)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing member:', checkError)
        return NextResponse.json(
          { success: false, message: 'Database error occurred' },
          { status: 500 }
        )
      }

      if (existingMember) {
        const statusMessage = existingMember.status === 'active' 
          ? 'User is already a team member'
          : existingMember.status === 'invited'
          ? 'User has already been invited'
          : 'User account exists but is disabled'

        return NextResponse.json(
          { success: false, message: statusMessage },
          { status: 409 }
        )
      }

      // Create team member record
      const { data: teamMember, error: createError } = await supabaseAdmin
        .from('team_members')
        .insert({
          email,
          full_name: fullName,
          role,
          status: 'invited',
          invited_by: inviterInfo?.id || 'owner'
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating team member:', createError)
        return NextResponse.json(
          { success: false, message: 'Failed to create team member record' },
          { status: 500 }
        )
      }

      // Send invitation via Supabase Auth
      const { data: authData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        email,
        {
          data: {
            full_name: fullName,
            role,
            invited_by: inviterInfo?.email,
            custom_message: message
          },
          redirectTo: `${process.env.NEXTAUTH_URL}/auth/callback`
        }
      )

      if (inviteError) {
        console.error('Error sending invitation:', inviteError)
        
        // Clean up team member record if invite failed
        await supabaseAdmin
          .from('team_members')
          .delete()
          .eq('id', teamMember.id)

        return NextResponse.json(
          { success: false, message: 'Failed to send invitation email' },
          { status: 500 }
        )
      }

      // Log security event
      await logSecurityEvent(ip, 'team_member_invited', 'info', {
        invitedEmail: email,
        invitedRole: role,
        inviterEmail: inviterInfo?.email,
        inviterRole: inviterInfo?.role,
        userAgent,
        teamMemberId: teamMember.id
      })

      // Log to security_events table as well
      await supabaseAdmin
        .from('security_events')
        .insert({
          event_type: 'audit',
          severity: 'info',
          description: `Team member invited: ${email} as ${role}`,
          details: {
            invited_email: email,
            invited_role: role,
            inviter_email: inviterInfo?.email,
            inviter_role: inviterInfo?.role,
            personal_message: message || null
          },
          resolved: true
        })

      return NextResponse.json({
        success: true,
        message: 'Invitation sent successfully',
        data: {
          teamMember: {
            id: teamMember.id,
            email: teamMember.email,
            full_name: teamMember.full_name,
            role: teamMember.role,
            status: teamMember.status,
            created_at: teamMember.created_at
          }
        }
      })
    }

    // Fallback if Supabase admin not available
    return NextResponse.json(
      { success: false, message: 'Team management service unavailable' },
      { status: 503 }
    )

  } catch (error) {
    console.error('Team invite error:', error)
    
    await logSecurityEvent(ip, 'team_invite_system_error', 'critical', {
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