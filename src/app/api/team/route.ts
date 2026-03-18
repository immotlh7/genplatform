import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/access-control'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Only OWNER and ADMIN can access team list
    const currentUser = getCurrentUser()
    if (!currentUser || (currentUser.role !== 'OWNER' && currentUser.role !== 'ADMIN')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only owners and admins can view team members' },
        { status: 403 }
      )
    }

    // Fetch all team members
    const { data: teamMembers, error: membersError } = await supabase
      .from('team_members')
      .select(`
        id,
        email,
        display_name,
        role,
        is_active,
        avatar_url,
        invited_by,
        invited_at,
        last_login_at,
        created_at
      `)
      .order('created_at', { ascending: false })

    if (membersError) {
      console.error('Error fetching team members:', membersError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch team members' },
        { status: 500 }
      )
    }

    // For each team member, get their project assignment count
    const membersWithProjectCount = await Promise.all(
      teamMembers.map(async (member) => {
        // Get project assignment count
        const { count: projectCount, error: countError } = await supabase
          .from('project_assignments')
          .select('*', { count: 'exact', head: true })
          .eq('member_id', member.id)

        if (countError) {
          console.error(`Error counting projects for member ${member.id}:`, countError)
        }

        return {
          id: member.id,
          email: member.email,
          display_name: member.display_name,
          role: member.role,
          is_active: member.is_active,
          avatar_url: member.avatar_url,
          invited_by: member.invited_by,
          invited_at: member.invited_at,
          last_login_at: member.last_login_at,
          created_at: member.created_at,
          project_count: projectCount || 0
        }
      })
    )

    // Get summary statistics
    const stats = {
      total: membersWithProjectCount.length,
      active: membersWithProjectCount.filter(m => m.is_active).length,
      inactive: membersWithProjectCount.filter(m => !m.is_active).length,
      byRole: {
        OWNER: membersWithProjectCount.filter(m => m.role === 'OWNER').length,
        ADMIN: membersWithProjectCount.filter(m => m.role === 'ADMIN').length,
        MANAGER: membersWithProjectCount.filter(m => m.role === 'MANAGER').length,
        VIEWER: membersWithProjectCount.filter(m => m.role === 'VIEWER').length
      }
    }

    return NextResponse.json({
      success: true,
      members: membersWithProjectCount,
      stats,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Team list error:', error)
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