import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requirePermission, checkOwnerAuth } from '@/lib/rbac'
import { logSecurityEvent } from '@/lib/security-logger'
import { resumeWorkflow } from '../../../../../engine/workflow-runner.js'

interface ApproveWorkflowRequest {
  runId: string
  approvalNotes?: string
}

/**
 * POST /api/workflows/approve
 * Approve a workflow that is waiting for approval
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  const userAgent = req.headers.get('user-agent') || 'unknown'

  try {
    // Check authentication and permissions (only OWNER/ADMIN can approve)
    const authCookie = req.cookies.get('auth-token')?.value
    let authorized = false
    let approverInfo = null

    // Check owner authentication first
    const ownerAuth = checkOwnerAuth(authCookie)
    if (ownerAuth.isOwner) {
      authorized = true
      approverInfo = ownerAuth.user
    } else {
      // Check team member permissions (ADMIN can approve workflows)
      const permissionCheck = await requirePermission('system:health') // Using system:health as proxy for ADMIN
      if (permissionCheck.authorized && permissionCheck.user?.role === 'ADMIN') {
        authorized = true
        approverInfo = permissionCheck.user
      }
    }

    if (!authorized) {
      await logSecurityEvent(ip, 'unauthorized_workflow_approval_attempt', 'warning', {
        userAgent,
        timestamp: new Date().toISOString()
      })

      return NextResponse.json(
        { success: false, message: 'Only OWNER/ADMIN can approve workflows' },
        { status: 403 }
      )
    }

    // Parse request body
    const body: ApproveWorkflowRequest = await req.json()
    const { runId, approvalNotes } = body

    // Validate required fields
    if (!runId) {
      return NextResponse.json(
        { success: false, message: 'runId is required' },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, message: 'Workflow service unavailable' },
        { status: 503 }
      )
    }

    // Get workflow run and verify it's waiting for approval
    const { data: workflowRun, error: runError } = await supabaseAdmin
      .from('workflow_runs')
      .select(`
        *,
        workflows (
          id,
          name,
          template_type
        )
      `)
      .eq('id', runId)
      .single()

    if (runError || !workflowRun) {
      return NextResponse.json(
        { success: false, message: 'Workflow run not found' },
        { status: 404 }
      )
    }

    if (workflowRun.status !== 'waiting_approval') {
      return NextResponse.json(
        { success: false, message: `Workflow is not waiting for approval (current status: ${workflowRun.status})` },
        { status: 400 }
      )
    }

    // Update workflow run with approval information
    const approvalTime = new Date().toISOString()
    
    // Get current logs and add approval log
    const logs = workflowRun.logs || []
    logs.push({
      type: 'approval',
      status: 'approved',
      timestamp: approvalTime,
      approved_by: approverInfo?.email,
      approver_role: approverInfo?.role,
      approval_notes: approvalNotes,
      step_name: workflowRun.current_step
    })

    const { error: updateError } = await supabaseAdmin
      .from('workflow_runs')
      .update({
        approved_by: approverInfo?.email,
        approved_at: approvalTime,
        logs: logs
      })
      .eq('id', runId)

    if (updateError) {
      console.error('Error updating workflow run:', updateError)
      return NextResponse.json(
        { success: false, message: 'Failed to record approval' },
        { status: 500 }
      )
    }

    // Resume workflow execution
    try {
      console.log(`▶️ Resuming workflow after approval: ${runId}`)
      
      // Use dynamic import to handle potential module loading issues
      const { resumeWorkflow: resumeFunc } = await import('../../../../../engine/workflow-runner.js')
      
      // Resume workflow execution asynchronously
      setImmediate(async () => {
        try {
          await resumeFunc(runId)
        } catch (resumeError) {
          console.error(`Failed to resume workflow ${runId}:`, resumeError)
          
          // Update run status to failed
          await supabaseAdmin
            .from('workflow_runs')
            .update({
              status: 'failed',
              error_message: `Failed to resume after approval: ${resumeError.message}`
            })
            .eq('id', runId)
        }
      })

      console.log(`✅ Workflow approval processed and execution resumed: ${runId}`)
      
    } catch (resumeError) {
      console.error('Failed to resume workflow:', resumeError)
      
      // Update status but don't fail the approval - manual intervention may be needed
      await supabaseAdmin
        .from('workflow_runs')
        .update({
          status: 'failed',
          error_message: `Approved but failed to resume execution: ${resumeError.message}`
        })
        .eq('id', runId)

      // Still return success since approval was recorded
    }

    // Log security event
    await logSecurityEvent(ip, 'workflow_approved', 'info', {
      runId,
      workflowId: workflowRun.workflow_id,
      workflowName: workflowRun.workflows?.name,
      approvedBy: approverInfo?.email,
      approverRole: approverInfo?.role,
      approvalNotes,
      userAgent
    })

    // Log to security_events table
    await supabaseAdmin
      .from('security_events')
      .insert({
        event_type: 'audit',
        severity: 'info',
        description: `Workflow approved: ${workflowRun.workflows?.name || workflowRun.workflow_id}`,
        details: {
          run_id: runId,
          workflow_id: workflowRun.workflow_id,
          workflow_name: workflowRun.workflows?.name,
          approved_by: approverInfo?.email,
          approver_role: approverInfo?.role,
          approval_notes: approvalNotes,
          current_step: workflowRun.current_step,
          steps_completed: workflowRun.steps_completed,
          steps_total: workflowRun.steps_total
        },
        resolved: true
      })

    return NextResponse.json({
      success: true,
      message: 'Workflow approved and execution resumed',
      data: {
        runId: runId,
        workflowId: workflowRun.workflow_id,
        workflowName: workflowRun.workflows?.name,
        approvedBy: approverInfo?.email,
        approvedAt: approvalTime,
        status: 'running',
        nextStep: 'Resuming execution...'
      }
    })

  } catch (error) {
    console.error('Workflow approval error:', error)
    
    await logSecurityEvent(ip, 'workflow_approval_system_error', 'critical', {
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
 * GET /api/workflows/approve
 * Get pending approvals for the current user
 */
export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

  try {
    // Check authentication and permissions
    const authCookie = req.cookies.get('auth-token')?.value
    let authorized = false
    let requestorInfo = null

    const ownerAuth = checkOwnerAuth(authCookie)
    if (ownerAuth.isOwner) {
      authorized = true
      requestorInfo = ownerAuth.user
    } else {
      const permissionCheck = await requirePermission('system:health')
      if (permissionCheck.authorized) {
        authorized = true
        requestorInfo = permissionCheck.user
      }
    }

    if (!authorized) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, message: 'Service unavailable' },
        { status: 503 }
      )
    }

    // Get all workflow runs waiting for approval
    const { data: pendingRuns, error } = await supabaseAdmin
      .from('workflow_runs')
      .select(`
        *,
        workflows (
          id,
          name,
          template_type,
          config
        )
      `)
      .eq('status', 'waiting_approval')
      .order('started_at', { ascending: true })

    if (error) {
      console.error('Error fetching pending approvals:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch pending approvals' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        pendingApprovals: pendingRuns || [],
        count: pendingRuns?.length || 0
      }
    })

  } catch (error) {
    console.error('Get approvals error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}