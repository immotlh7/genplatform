import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requirePermission, checkOwnerAuth } from '@/lib/rbac'
import { logSecurityEvent } from '@/lib/security-logger'
import { spawn } from 'child_process'
import path from 'path'

interface StartWorkflowRequest {
  workflowId: string
  projectId?: string
  triggerContext?: any
  priority?: 'low' | 'medium' | 'high'
}

/**
 * POST /api/workflows/run
 * Start workflow execution
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  const userAgent = req.headers.get('user-agent') || 'unknown'

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
      // Check team member permissions (ADMIN can run workflows)
      const permissionCheck = await requirePermission('system:health') // Using system:health as proxy for ADMIN
      if (permissionCheck.authorized) {
        authorized = true
        requestorInfo = permissionCheck.user
      }
    }

    if (!authorized) {
      await logSecurityEvent(ip, 'unauthorized_workflow_start_attempt', 'warning', {
        userAgent,
        timestamp: new Date().toISOString()
      })

      return NextResponse.json(
        { success: false, message: 'Insufficient permissions to start workflows' },
        { status: 403 }
      )
    }

    // Parse request body
    const body: StartWorkflowRequest = await req.json()
    const { workflowId, projectId, triggerContext, priority = 'medium' } = body

    // Validate required fields
    if (!workflowId) {
      return NextResponse.json(
        { success: false, message: 'workflowId is required' },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, message: 'Workflow service unavailable' },
        { status: 503 }
      )
    }

    // Verify workflow exists and is active
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

    if (!workflow.is_active) {
      return NextResponse.json(
        { success: false, message: 'Workflow is not active' },
        { status: 400 }
      )
    }

    // Validate project if specified
    if (projectId) {
      const { data: project, error: projectError } = await supabaseAdmin
        .from('projects')
        .select('id, name')
        .eq('id', projectId)
        .single()

      if (projectError || !project) {
        return NextResponse.json(
          { success: false, message: 'Project not found' },
          { status: 404 }
        )
      }
    }

    // Get workflow steps count
    const workflowSteps = workflow.config?.steps || []
    const stepsTotal = workflowSteps.length

    if (stepsTotal === 0) {
      return NextResponse.json(
        { success: false, message: 'Workflow has no steps defined' },
        { status: 400 }
      )
    }

    // Create workflow run record
    const { data: workflowRun, error: createError } = await supabaseAdmin
      .from('workflow_runs')
      .insert({
        workflow_id: workflowId,
        project_id: projectId || null,
        status: 'running',
        current_step: workflowSteps[0]?.name || 'Starting...',
        steps_completed: 0,
        steps_total: stepsTotal,
        started_by: requestorInfo?.email || 'system',
        logs: [
          {
            type: 'workflow_started',
            status: 'started',
            timestamp: new Date().toISOString(),
            started_by: requestorInfo?.email,
            trigger_context: triggerContext,
            priority: priority
          }
        ]
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating workflow run:', createError)
      return NextResponse.json(
        { success: false, message: 'Failed to create workflow run' },
        { status: 500 }
      )
    }

    const runId = workflowRun.id

    // Start workflow execution engine asynchronously
    try {
      const enginePath = path.join(process.cwd(), 'engine', 'workflow-runner.js')
      const childProcess = spawn('node', [enginePath, 'start', runId], {
        detached: true,
        stdio: 'ignore',
        env: {
          ...process.env,
          NODE_ENV: process.env.NODE_ENV,
          NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
          SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
          OPENCLAW_API_URL: process.env.OPENCLAW_API_URL,
          OPENCLAW_API_KEY: process.env.OPENCLAW_API_KEY
        }
      })

      childProcess.unref() // Allow the parent process to exit independently
      
      console.log(`🚀 Workflow execution started: ${runId} (PID: ${childProcess.pid})`)
    } catch (execError) {
      console.error('Failed to start workflow engine:', execError)
      
      // Update run status to failed
      await supabaseAdmin
        .from('workflow_runs')
        .update({
          status: 'failed',
          error_message: 'Failed to start workflow execution engine'
        })
        .eq('id', runId)

      return NextResponse.json(
        { success: false, message: 'Failed to start workflow execution' },
        { status: 500 }
      )
    }

    // Log security event
    await logSecurityEvent(ip, 'workflow_started', 'info', {
      workflowId,
      workflowName: workflow.name,
      runId,
      projectId,
      startedBy: requestorInfo?.email,
      priority,
      userAgent
    })

    // Log to security_events table
    await supabaseAdmin
      .from('security_events')
      .insert({
        event_type: 'audit',
        severity: 'info',
        description: `Workflow started: ${workflow.name}`,
        details: {
          workflow_id: workflowId,
          workflow_name: workflow.name,
          run_id: runId,
          project_id: projectId,
          started_by: requestorInfo?.email,
          trigger_context: triggerContext,
          priority,
          steps_total: stepsTotal
        },
        resolved: true
      })

    return NextResponse.json({
      success: true,
      message: 'Workflow started successfully',
      data: {
        runId: runId,
        workflowId: workflowId,
        workflowName: workflow.name,
        status: 'running',
        stepsTotal: stepsTotal,
        estimatedDuration: workflow.config?.estimated_total_duration || 'Unknown',
        startedAt: workflowRun.started_at,
        startedBy: requestorInfo?.email
      }
    })

  } catch (error) {
    console.error('Workflow start error:', error)
    
    await logSecurityEvent(ip, 'workflow_start_system_error', 'critical', {
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