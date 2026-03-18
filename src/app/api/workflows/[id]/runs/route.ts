import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requirePermission, checkOwnerAuth } from '@/lib/rbac'
import { logSecurityEvent } from '@/lib/security-logger'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * GET /api/workflows/[id]/runs
 * Get run history for a specific workflow
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id: workflowId } = params
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  const userAgent = req.headers.get('user-agent') || 'unknown'
  const url = new URL(req.url)

  // Parse query parameters
  const status = url.searchParams.get('status')
  const limit = parseInt(url.searchParams.get('limit') || '20')
  const offset = parseInt(url.searchParams.get('offset') || '0')
  const includeDetails = url.searchParams.get('include_details') === 'true'

  try {
    // Validate workflow ID
    if (!workflowId || workflowId === 'undefined') {
      return NextResponse.json(
        { success: false, message: 'Workflow ID is required' },
        { status: 400 }
      )
    }

    // Check authentication and permissions (only ADMIN+ can view workflow runs)
    const authCookie = req.cookies.get('auth-token')?.value
    let authorized = false
    let requestorInfo = null

    // Check owner authentication first
    const ownerAuth = checkOwnerAuth(authCookie)
    if (ownerAuth.isOwner) {
      authorized = true
      requestorInfo = ownerAuth.user
    } else {
      // Check team member permissions (ADMIN can view workflow runs)
      const permissionCheck = await requirePermission('system:health') // Using system:health as proxy for ADMIN
      if (permissionCheck.authorized) {
        authorized = true
        requestorInfo = permissionCheck.user
      }
    }

    if (!authorized) {
      await logSecurityEvent(ip, 'unauthorized_workflow_runs_access_attempt', 'warning', {
        workflowId,
        userAgent,
        queryParams: Object.fromEntries(url.searchParams),
        timestamp: new Date().toISOString()
      })

      return NextResponse.json(
        { success: false, message: 'Insufficient permissions to view workflow runs' },
        { status: 403 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, message: 'Workflow service unavailable' },
        { status: 503 }
      )
    }

    // Verify workflow exists
    const { data: workflow, error: workflowError } = await supabaseAdmin
      .from('workflows')
      .select('id, name, template_type, is_active')
      .eq('id', workflowId)
      .single()

    if (workflowError || !workflow) {
      return NextResponse.json(
        { success: false, message: 'Workflow not found' },
        { status: 404 }
      )
    }

    // Build query for workflow runs
    let query = supabaseAdmin
      .from('workflow_runs')
      .select(`
        id,
        workflow_id,
        project_id,
        status,
        current_step,
        steps_completed,
        steps_total,
        started_at,
        completed_at,
        started_by,
        approved_by,
        approved_at,
        error_message,
        ${includeDetails ? 'logs,' : ''}
        projects (
          id,
          name
        )
      `)
      .eq('workflow_id', workflowId)

    // Apply status filter
    if (status) {
      query = query.eq('status', status)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    // Order by start date (newest first)
    query = query.order('started_at', { ascending: false })

    const { data: runs, error: runsError, count } = await query

    if (runsError) {
      console.error('Error fetching workflow runs:', runsError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch workflow runs' },
        { status: 500 }
      )
    }

    // Enhance runs with calculated fields
    const enhancedRuns = (runs || []).map(run => {
      const startTime = new Date(run.started_at)
      const endTime = run.completed_at ? new Date(run.completed_at) : new Date()
      const durationMs = endTime.getTime() - startTime.getTime()
      
      // Calculate duration in human-readable format
      const durationMinutes = Math.floor(durationMs / (1000 * 60))
      const durationSeconds = Math.floor((durationMs % (1000 * 60)) / 1000)
      const duration = durationMinutes > 0 
        ? `${durationMinutes}m ${durationSeconds}s`
        : `${durationSeconds}s`

      // Calculate progress percentage
      const progress = run.steps_total > 0 
        ? Math.round((run.steps_completed / run.steps_total) * 100)
        : 0

      // Get last log entry for additional context
      const lastLog = includeDetails && run.logs && Array.isArray(run.logs) 
        ? run.logs[run.logs.length - 1] 
        : null

      return {
        id: run.id,
        status: run.status,
        currentStep: run.current_step,
        stepsCompleted: run.steps_completed,
        stepsTotal: run.steps_total,
        progress: progress,
        startedAt: run.started_at,
        completedAt: run.completed_at,
        duration: duration,
        durationMs: durationMs,
        startedBy: run.started_by,
        approvedBy: run.approved_by,
        approvedAt: run.approved_at,
        errorMessage: run.error_message,
        project: run.projects ? {
          id: run.projects.id,
          name: run.projects.name
        } : null,
        ...(includeDetails && {
          logs: run.logs || [],
          lastLog: lastLog
        })
      }
    })

    // Calculate run statistics
    const runStats = enhancedRuns.reduce((stats, run) => {
      stats.total++
      switch (run.status) {
        case 'running':
          stats.running++
          break
        case 'completed':
          stats.completed++
          break
        case 'failed':
          stats.failed++
          break
        case 'waiting_approval':
          stats.waitingApproval++
          break
      }
      return stats
    }, {
      total: 0,
      running: 0,
      completed: 0,
      failed: 0,
      waitingApproval: 0
    })

    // Calculate success rate
    const successRate = runStats.total > 0 
      ? Math.round((runStats.completed / runStats.total) * 100)
      : 0

    // Calculate average duration for completed runs
    const completedRuns = enhancedRuns.filter(run => run.status === 'completed')
    const averageDuration = completedRuns.length > 0
      ? completedRuns.reduce((sum, run) => sum + run.durationMs, 0) / completedRuns.length
      : 0

    const averageDurationFormatted = averageDuration > 0
      ? `${Math.floor(averageDuration / (1000 * 60))}m ${Math.floor((averageDuration % (1000 * 60)) / 1000)}s`
      : 'N/A'

    // Log successful access
    await logSecurityEvent(ip, 'workflow_runs_accessed', 'info', {
      workflowId,
      workflowName: workflow.name,
      requestorEmail: requestorInfo?.email,
      requestorRole: requestorInfo?.role,
      filters: { status, includeDetails },
      resultCount: enhancedRuns.length,
      userAgent
    })

    return NextResponse.json({
      success: true,
      data: {
        workflow: {
          id: workflow.id,
          name: workflow.name,
          templateType: workflow.template_type,
          isActive: workflow.is_active
        },
        runs: enhancedRuns,
        pagination: {
          limit,
          offset,
          total: count || enhancedRuns.length,
          hasMore: (count || 0) > offset + limit
        },
        statistics: {
          ...runStats,
          successRate,
          averageDuration: averageDurationFormatted,
          averageDurationMs: Math.round(averageDuration)
        },
        filters: {
          status,
          includeDetails
        }
      }
    })

  } catch (error) {
    console.error('Workflow runs API error:', error)
    
    await logSecurityEvent(ip, 'workflow_runs_api_system_error', 'critical', {
      workflowId,
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