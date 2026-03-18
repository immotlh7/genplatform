import { NextRequest, NextResponse } from 'next/server'
import { checkOwnerAuth } from '@/lib/rbac'
import { authHelpers, supabaseHelpers } from '@/lib/supabase'

/**
 * GET /api/auth/check
 * Check current authentication status for both owner and team members
 */
export async function GET(req: NextRequest) {
  try {
    // Check owner authentication first (cookie-based)
    const authCookie = req.cookies.get('auth-token')?.value
    const ownerAuth = checkOwnerAuth(authCookie)
    
    if (ownerAuth.isOwner && ownerAuth.user) {
      return NextResponse.json({
        authenticated: true,
        userType: 'owner',
        user: ownerAuth.user
      })
    }

    // Check Supabase authentication for team members
    try {
      const supabaseUser = await authHelpers.getCurrentUser()
      
      if (supabaseUser) {
        const teamMember = await supabaseHelpers.getTeamMemberByEmail(supabaseUser.email!)
        
        if (teamMember && teamMember.status === 'active') {
          return NextResponse.json({
            authenticated: true,
            userType: 'team_member',
            user: {
              id: supabaseUser.id,
              email: supabaseUser.email,
              displayName: teamMember.full_name,
              role: teamMember.role,
              userType: 'team_member'
            }
          })
        }
      }
    } catch (supabaseError) {
      console.warn('Supabase auth check failed:', supabaseError)
      // Continue to return unauthenticated
    }

    // No valid authentication found
    return NextResponse.json({
      authenticated: false,
      userType: null,
      user: null
    })

  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json({
      authenticated: false,
      userType: null,
      user: null,
      error: 'Authentication check failed'
    }, { status: 500 })
  }
}