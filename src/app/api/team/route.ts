import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requirePermission, checkOwnerAuth } from '@/lib/rbac'
import { logSecurityEvent } from '@/lib/security-logger'

interface TeamMemberWithStats {
  id: string
  email: string
  full_name: string
  role: string
  status: string
  invited_by?: string
  joined_at?: string
  last_active?: string
  created_at: string
  projectCount?: number
  activeTasksCount?: number
  lastProject?: string
}

/**
 * GET /api/team
 * Retrieve team members list with optional filtering and statistics
 */
export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  const userAgent = req.headers.get('user-agent') || 'unknown'
  const url = new URL(req.url)

  // Parse query parameters
  const role = url.searchParams.get('role')
  const status = url.searchParams.get('status')
  const includeStats = url.searchParams.get('stats') === 'true'
  const search = url.searchParams.get('search')
  const limit = parseInt(url.searchParams.get('limit') || '50')
  const offset = parseInt(url.searchParams.get('offset') || '0')

  try {
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
      await logSecurityEvent(ip, 'unauthorized_team_access_attempt', 'warning', {
        userAgent,
        queryParams: Object.fromEntries(url.searchParams),
        timestamp: new Date().toISOString()
      })

      return NextResponse.json(
        { success: false, message: 'Insufficient permissions to view team members' },
        { status: 403 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, message: 'Team service unavailable' },
        { status: 503 }
      )
    }

    // Build query
    let query = supabaseAdmin
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
        created_at
      `)

    // Apply filters
    if (role) {
      query = query.eq('role', role.toUpperCase())
    }

    if (status) {
      query = query.eq('status', status.toLowerCase())
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    // Order by creation date (newest first)
    query = query.order('created_at', { ascending: false })

    const { data: teamMembers, error: fetchError, count } = await query

    if (fetchError) {
      console.error('Error fetching team members:', fetchError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch team members' },
        { status: 500 }
      )
    }

    // Enhance with statistics if requested
    let enhancedMembers: TeamMemberWithStats[] = teamMembers || []

    if (includeStats && teamMembers) {
      enhancedMembers = await Promise.all(
        teamMembers.map(async (member) => {
          try {
            // Get project assignments count
            const { count: projectCount } = await supabaseAdmin
              .from('project_assignments')
              .select('*', { count: 'exact', head: true })
              .eq('team_member_id', member.id)

            // Get active tasks count
            const { count: activeTasksCount } = await supabaseAdmin
              .from('project_tasks')
              .select('*', { count: 'exact', head: true })
              .eq('assigned_role', member.role)
              .eq('status', 'in_progress')

            // Get last project name
            const { data: lastAssignment } = await supabaseAdmin
              .from('project_assignments')
              .select(`
                projects (
                  name
                )
              `)
              .eq('team_member_id', member.id)
              .order('assigned_at', { ascending: false })
              .limit(1)
              .single()

            return {
              ...member,
              projectCount: projectCount || 0,
              activeTasksCount: activeTasksCount || 0,
              lastProject: lastAssignment?.projects?.name || null
            }
          } catch (error) {
            console.warn(`Failed to fetch stats for member ${member.id}:`, error)
            return {
              ...member,
              projectCount: 0,
              activeTasksCount: 0,
              lastProject: null
            }
          }
        })
      )
    }

    // Get summary statistics if no specific filters
    let summaryStats = null
    if (!role && !status && !search) {
      try {
        const [
          { count: totalCount },
          { count: activeCount },
          { count: invitedCount },
          { count: adminCount }
        ] = await Promise.all([
          supabaseAdmin
            .from('team_members')
            .select('*', { count: 'exact', head: true }),
          supabaseAdmin
            .from('team_members')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active'),
          supabaseAdmin
            .from('team_members')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'invited'),
          supabaseAdmin
            .from('team_members')
            .select('*', { count: 'exact', head: true })
            .in('role', ['OWNER', 'ADMIN'])
        ])

        summaryStats = {
          total: totalCount || 0,
          active: activeCount || 0,
          invited: invitedCount || 0,
          admins: adminCount || 0
        }
      } catch (error) {
        console.warn('Failed to fetch summary stats:', error)
      }
    }

    // Log successful access
    await logSecurityEvent(ip, 'team_members_accessed', 'info', {
      requestorEmail: requestorInfo?.email,
      requestorRole: requestorInfo?.role,
      filters: { role, status, search },
      resultCount: enhancedMembers.length,
      userAgent
    })

    return NextResponse.json({
      success: true,
      data: {
        members: enhancedMembers,
        pagination: {
          limit,
          offset,
          total: count || enhancedMembers.length,
          hasMore: (count || 0) > offset + limit
        },
        stats: summaryStats,
        filters: {
          role,
          status,
          search,
          includeStats
        }
      }
    })

  } catch (error) {
    console.error('Team API error:', error)
    
    await logSecurityEvent(ip, 'team_api_system_error', 'critical', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userAgent,
      queryParams: Object.fromEntries(url.searchParams),
      timestamp: new Date().toISOString()
    })

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}