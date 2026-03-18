import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requirePermission, checkOwnerAuth } from '@/lib/rbac'
import { logSecurityEvent } from '@/lib/security-logger'

/**
 * GET /api/workflows
 * Get all workflows with run information and statistics
 */
export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  const userAgent = req.headers.get('user-agent') || 'unknown'
  const url = new URL(req.url)

  // Parse query parameters
  const includeInactive = url.searchParams.get('include_inactive') === 'true'
  const templateType = url.searchParams.get('template_type')
  const triggerType = url.searchParams.get('trigger_type')
  const limit = parseInt(url.searchParams.get('limit') || '50')
  const offset = parseInt(url.searchParams.get('offset') || '0')

  try {
    // Check authentication and permissions (only ADMIN+ can view workflows)
    const authCookie = req.cookies.get('auth-token')?.value
    let authorized = false
    let requestorInfo = null

    // Check owner authentication first
    const ownerAuth = checkOwnerAuth(authCookie)
    if (ownerAuth.isOwner) {
      authorized = true
      requestorInfo = ownerAuth.user
    } else {
      // Check team member permissions (ADMIN can view workflows)
      const permissionCheck = await requirePermission('system:health') // Using system:health as proxy for ADMIN
      if (permissionCheck.authorized) {
        authorized = true
        requestorInfo = permissionCheck.user
      }
    }

    if (!authorized) {
      await logSecurityEvent(ip, 'unauthorized_workflows_access_attempt', 'warning', {
        userAgent,
        queryParams: Object.fromEntries(url.searchParams),
        timestamp: new Date().toISOString()
      })

      return NextResponse.json(
        { success: false, message: 'Insufficient permissions to view workflows' },
        { status: 403 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, message: 'Workflow service unavailable' },
        { status: 503 }
      )
    }

    // Build query
    let query = supabaseAdmin
      .from('workflows')
      .select(`
        id,
        name,
        description,
        template_type,
        is_active,
        trigger_type,
        schedule,
        config,
        last_run_at,
        last_run_status,
        created_at,
        updated_at
      `)

    // Apply filters
    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    if (templateType) {
      query = query.eq('template_type', templateType)
    }

    if (triggerType) {
      query = query.eq('trigger_type', triggerType)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    // Order by creation date (newest first)
    query = query.order('created_at', { ascending: false })

    const { data: workflows, error: fetchError, count } = await query

    if (fetchError) {
      console.error('Error fetching workflows:', fetchError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch workflows' },
        { status: 500 }
      )
    }

    // Enhance workflows with run statistics
    const enhancedWorkflows = await Promise.all(
      (workflows || []).map(async (workflow) => {
        try {
          // Get run statistics for each workflow
          const [
            { count: totalRuns },
            { count: runningRuns },
            { count: completedRuns },
            { count: failedRuns },
            { count: waitingApprovalRuns }
          ] = await Promise.all([
            supabaseAdmin
              .from('workflow_runs')
              .select('*', { count: 'exact', head: true })
              .eq('workflow_id', workflow.id),
            supabaseAdmin
              .from('workflow_runs')
              .select('*', { count: 'exact', head: true })
              .eq('workflow_id', workflow.id)
              .eq('status', 'running'),
            supabaseAdmin
              .from('workflow_runs')
              .select('*', { count: 'exact', head: true })
              .eq('workflow_id', workflow.id)
              .eq('status', 'completed'),
            supabaseAdmin
              .from('workflow_runs')
              .select('*', { count: 'exact', head: true })
              .eq('workflow_id', workflow.id)
              .eq('status', 'failed'),
            supabaseAdmin
              .from('workflow_runs')
              .select('*', { count: 'exact', head: true })
              .eq('workflow_id', workflow.id)
              .eq('status', 'waiting_approval')
          ])

          // Calculate success rate
          const completedRunsCount = completedRuns || 0
          const totalRunsCount = totalRuns || 0
          const successRate = totalRunsCount > 0 ? Math.round((completedRunsCount / totalRunsCount) * 100) : 0

          // Get latest run details
          const { data: latestRun } = await supabaseAdmin
            .from('workflow_runs')
            .select('id, status, started_at, completed_at, steps_completed, steps_total')
            .eq('workflow_id', workflow.id)
            .order('started_at', { ascending: false })
            .limit(1)
            .single()

          return {
            ...workflow,
            runStatistics: {
              totalRuns: totalRunsCount,
              runningRuns: runningRuns || 0,
              completedRuns: completedRunsCount,
              failedRuns: failedRuns || 0,
              waitingApprovalRuns: waitingApprovalRuns || 0,
              successRate: successRate
            },
            latestRun: latestRun || null,
            estimatedDuration: workflow.config?.estimated_total_duration || 'Unknown',
            stepCount: workflow.config?.steps?.length || 0
          }
        } catch (error) {
          console.warn(`Failed to fetch statistics for workflow ${workflow.id}:`, error)
          return {
            ...workflow,
            runStatistics: {
              totalRuns: 0,
              runningRuns: 0,
              completedRuns: 0,
              failedRuns: 0,
              waitingApprovalRuns: 0,
              successRate: 0
            },
            latestRun: null,
            estimatedDuration: 'Unknown',
            stepCount: 0
          }
        }
      })
    )

    // Get overall statistics
    const overallStats = enhancedWorkflows.reduce((acc, workflow) => {
      const stats = workflow.runStatistics
      return {
        totalWorkflows: acc.totalWorkflows + 1,
        activeWorkflows: acc.activeWorkflows + (workflow.is_active ? 1 : 0),
        totalRuns: acc.totalRuns + stats.totalRuns,
        runningRuns: acc.runningRuns + stats.runningRuns,
        completedRuns: acc.completedRuns + stats.completedRuns,
        failedRuns: acc.failedRuns + stats.failedRuns,
        waitingApprovalRuns: acc.waitingApprovalRuns + stats.waitingApprovalRuns
      }
    }, {
      totalWorkflows: 0,
      activeWorkflows: 0,
      totalRuns: 0,
      runningRuns: 0,
      completedRuns: 0,
      failedRuns: 0,
      waitingApprovalRuns: 0
    })

    // Calculate overall success rate
    const overallSuccessRate = overallStats.totalRuns > 0 
      ? Math.round((overallStats.completedRuns / overallStats.totalRuns) * 100) 
      : 0

    // Log successful access
    await logSecurityEvent(ip, 'workflows_accessed', 'info', {
      requestorEmail: requestorInfo?.email,
      requestorRole: requestorInfo?.role,
      filters: { includeInactive, templateType, triggerType },
      resultCount: enhancedWorkflows.length,
      userAgent
    })

    return NextResponse.json({
      success: true,
      data: {
        workflows: enhancedWorkflows,
        pagination: {
          limit,
          offset,
          total: count || enhancedWorkflows.length,
          hasMore: (count || 0) > offset + limit
        },
        statistics: {
          ...overallStats,
          successRate: overallSuccessRate
        },
        filters: {
          includeInactive,
          templateType,
          triggerType
        }
      }
    })

  } catch (error) {
    console.error('Workflows API error:', error)
    
    await logSecurityEvent(ip, 'workflows_api_system_error', 'critical', {
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

/**
 * POST /api/workflows
 * Create a new workflow (placeholder for future implementation)
 */
export async function POST(req: NextRequest) {
  return NextResponse.json(
    { success: false, message: 'Workflow creation not yet implemented' },
    { status: 501 }
  )
}

/**
 * PUT /api/workflows
 * Update workflow settings (placeholder for future implementation)  
 */
export async function PUT(req: NextRequest) {
  return NextResponse.json(
    { success: false, message: 'Workflow updates not yet implemented' },
    { status: 501 }
  )
}