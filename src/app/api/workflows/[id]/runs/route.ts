import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requirePermission, checkOwnerAuth } from '@/lib/rbac'
import { logSecurityEvent } from '@/lib/security-logger'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/workflows/[id]/runs
 * Get run history for a specific workflow
 */
export async function GET(req: NextRequest, context: RouteContext) {
  const { id: workflowId } = await context.params
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
      // Check team member permissions for workflow viewing
      const permissionCheck = await requirePermission('workflows:read')
      if (permissionCheck.authorized) {
        authorized = true
        requestorInfo = permissionCheck.user
      }
    }

    if (!authorized) {
      await logSecurityEvent(ip, 'unauthorized_workflow_runs_access', 'warning', {
        workflowId,
        userAgent,
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

    // Get workflow details
    const { data: workflow, error: workflowError } = await supabaseAdmin
      .from('workflows')
      .select('id, name, templateType, isActive')
      .eq('id', workflowId)
      .single()

    if (workflowError || !workflow) {
      return NextResponse.json(
        { success: false, message: 'Workflow not found' },
        { status: 404 }
      )
    }

    // Build query for runs
    let query = supabaseAdmin
      .from('workflow_runs')
      .select('*', { count: 'exact' })
      .eq('workflow_id', workflowId)
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply status filter if provided
    if (status && ['pending', 'running', 'completed', 'failed'].includes(status)) {
      query = query.eq('status', status)
    }

    const { data: runs, count, error: runsError } = await query

    if (runsError) {
      console.error('Error fetching workflow runs:', runsError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch workflow runs' },
        { status: 500 }
      )
    }

    // Optionally include additional details for each run
    let enrichedRuns = runs || []
    if (includeDetails && runs && runs.length > 0) {
      enrichedRuns = await Promise.all(
        runs.map(async (run) => {
          // Get approval details if this run required approval
          if (run.approval_required) {
            const { data: approval } = await supabaseAdmin
              .from('workflow_approvals')
              .select('id, approved_by, approved_at, comments')
              .eq('run_id', run.id)
              .single()

            return { ...run, approval_details: approval }
          }
          return run
        })
      )
    }

    // Calculate run statistics
    const statistics = {
      total: count || 0,
      completed: runs?.filter(r => r.status === 'completed').length || 0,
      failed: runs?.filter(r => r.status === 'failed').length || 0,
      running: runs?.filter(r => r.status === 'running').length || 0,
      pending: runs?.filter(r => r.status === 'pending').length || 0,
      avgDuration: calculateAvgDuration(runs || [])
    }

    return NextResponse.json({
      success: true,
      data: {
        workflow: {
          id: workflow.id,
          name: workflow.name,
          templateType: workflow.templateType,
          isActive: workflow.isActive
        },
        runs: enrichedRuns,
        pagination: {
          total: count || 0,
          limit,
          offset,
          hasMore: (offset + limit) < (count || 0)
        },
        statistics,
        filters: {
          status: status || 'all'
        }
      }
    })

  } catch (error) {
    console.error('Workflow runs fetch error:', error)
    
    await logSecurityEvent(ip, 'workflow_runs_system_error', 'critical', {
      workflowId,
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

/**
 * POST /api/workflows/[id]/runs
 * Manually trigger a workflow run
 */
export async function POST(req: NextRequest, context: RouteContext) {
  const { id: workflowId } = await context.params
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  const userAgent = req.headers.get('user-agent') || 'unknown'

  try {
    // Validate workflow ID
    if (!workflowId || workflowId === 'undefined') {
      return NextResponse.json(
        { success: false, message: 'Workflow ID is required' },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await req.json()
    const { parameters = {}, reason } = body

    // Check authentication and permissions (need execute permission)
    const authCookie = req.cookies.get('auth-token')?.value
    let authorized = false
    let requestorInfo = null

    // Check owner authentication first
    const ownerAuth = checkOwnerAuth(authCookie)
    if (ownerAuth.isOwner) {
      authorized = true
      requestorInfo = ownerAuth.user
    } else {
      // Check team member permissions for workflow execution
      const permissionCheck = await requirePermission('workflows:execute')
      if (permissionCheck.authorized) {
        authorized = true
        requestorInfo = permissionCheck.user
      }
    }

    if (!authorized) {
      await logSecurityEvent(ip, 'unauthorized_workflow_trigger_attempt', 'warning', {
        workflowId,
        userAgent,
        timestamp: new Date().toISOString()
      })

      return NextResponse.json(
        { success: false, message: 'Insufficient permissions to trigger workflows' },
        { status: 403 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, message: 'Workflow service unavailable' },
        { status: 503 }
      )
    }

    // Get workflow details and verify it exists and is active
    const { data: workflow, error: workflowError } = await supabaseAdmin
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .single()

    if (workflowError || !workflow) {
      return NextResponse.json(
        { success: false, message: 'Workflow not found' },
        { status: 404 }
      )
    }

    if (!workflow.isActive) {
      return NextResponse.json(
        { success: false, message: 'Workflow is not active' },
        { status: 400 }
      )
    }

    // Create the workflow run
    const runData = {
      workflow_id: workflowId,
      status: 'pending',
      parameters: parameters || {},
      triggered_by: requestorInfo?.email || 'system',
      trigger_type: 'manual',
      trigger_reason: reason || 'Manual trigger via API',
      started_at: new Date().toISOString(),
      approval_required: workflow.requireApproval || false
    }

    const { data: newRun, error: createError } = await supabaseAdmin
      .from('workflow_runs')
      .insert(runData)
      .select()
      .single()

    if (createError) {
      console.error('Error creating workflow run:', createError)
      return NextResponse.json(
        { success: false, message: 'Failed to create workflow run' },
        { status: 500 }
      )
    }

    // Log the workflow trigger in security events
    await supabaseAdmin
      .from('security_events')
      .insert({
        event_type: 'audit',
        severity: 'info',
        description: `Workflow manually triggered: ${workflow.name}`,
        details: {
          workflow_id: workflowId,
          workflow_name: workflow.name,
          run_id: newRun.id,
          triggered_by: requestorInfo?.email,
          trigger_reason: reason,
          timestamp: new Date().toISOString()
        },
        resolved: true
      })

    // Log security event
    await logSecurityEvent(ip, 'workflow_manually_triggered', 'info', {
      workflowId,
      workflowName: workflow.name,
      runId: newRun.id,
      triggeredBy: requestorInfo?.email,
      reason,
      userAgent
    })

    return NextResponse.json({
      success: true,
      message: 'Workflow run created successfully',
      data: {
        run: newRun,
        workflow: {
          id: workflow.id,
          name: workflow.name,
          templateType: workflow.templateType
        }
      }
    })

  } catch (error) {
    console.error('Workflow trigger error:', error)
    
    await logSecurityEvent(ip, 'workflow_trigger_system_error', 'critical', {
      workflowId,
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

/**
 * Helper function to calculate average run duration
 */
function calculateAvgDuration(runs: any[]): number {
  const completedRuns = runs.filter(r => 
    r.status === 'completed' && r.started_at && r.completed_at
  )
  
  if (completedRuns.length === 0) return 0
  
  const totalDuration = completedRuns.reduce((sum, run) => {
    const duration = new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()
    return sum + duration
  }, 0)
  
  return Math.round(totalDuration / completedRuns.length / 1000) // Return in seconds
}