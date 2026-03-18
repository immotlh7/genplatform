import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest, { params }: { params: { runId: string } }) {
  try {
    const runId = params.runId

    console.log(`📋 Fetching workflow run details: ${runId}`)

    // Fetch workflow run with workflow information
    const { data: workflowRun, error: runError } = await supabase
      .from('workflow_runs')
      .select(`
        *,
        workflows (
          id,
          name,
          description,
          template_type,
          trigger_type,
          config
        )
      `)
      .eq('id', runId)
      .single()

    if (runError || !workflowRun) {
      console.error('Workflow run not found:', runError)
      return NextResponse.json({
        success: false,
        message: 'Workflow run not found'
      }, { status: 404 })
    }

    const workflow = workflowRun.workflows
    const steps = workflow?.config?.steps || []

    // Calculate run duration
    const startTime = new Date(workflowRun.started_at).getTime()
    const endTime = workflowRun.completed_at 
      ? new Date(workflowRun.completed_at).getTime()
      : new Date().getTime()
    const totalDuration = endTime - startTime

    // Calculate progress
    const progress = workflowRun.steps_total > 0 
      ? Math.round((workflowRun.steps_completed / workflowRun.steps_total) * 100)
      : 0

    // Get current step information
    const currentStepIndex = workflowRun.steps_completed
    const currentStep = currentStepIndex < steps.length ? steps[currentStepIndex] : null

    // Process logs to get step details
    const stepDetails = processStepLogs(workflowRun.logs || [], steps)

    // Get approval information if waiting for approval
    const approvalInfo = workflowRun.status === 'waiting_approval' && currentStep?.type === 'approval' 
      ? {
          stepName: currentStep.name,
          description: currentStep.description,
          approver: currentStep.config?.approver || 'owner',
          requestedAt: workflowRun.started_at // Fallback, ideally track when approval was requested
        }
      : null

    // Get error details for failed runs
    const errorDetails = workflowRun.status === 'failed'
      ? getDetailedErrorInfo(workflowRun.logs || [])
      : null

    // Build enriched run object
    const enrichedRun = {
      id: workflowRun.id,
      workflowId: workflowRun.workflow_id,
      projectId: workflowRun.project_id,
      status: workflowRun.status,
      currentStep: workflowRun.current_step,
      stepsCompleted: workflowRun.steps_completed,
      stepsTotal: workflowRun.steps_total,
      startedAt: workflowRun.started_at,
      completedAt: workflowRun.completed_at,
      logs: workflowRun.logs,

      // Calculated fields
      progress,
      totalDuration: Math.round(totalDuration / 1000), // in seconds
      isRunning: ['running', 'waiting_approval'].includes(workflowRun.status),
      isCompleted: workflowRun.status === 'completed',
      isFailed: workflowRun.status === 'failed',
      isPendingApproval: workflowRun.status === 'waiting_approval',

      // Step information
      currentStepInfo: currentStep,
      stepDetails,
      
      // Approval information
      approvalInfo,
      
      // Error information
      errorDetails
    }

    console.log(`✅ Retrieved workflow run: ${runId} (${workflowRun.status})`)

    return NextResponse.json({
      success: true,
      run: enrichedRun,
      workflow: {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        templateType: workflow.template_type,
        triggerType: workflow.trigger_type,
        config: workflow.config
      }
    })

  } catch (error) {
    console.error('Workflow run detail API error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Process logs to extract detailed step information
 */
function processStepLogs(logs: any[], steps: any[]) {
  const stepDetails = steps.map((step, index) => {
    // Get logs for this step
    const stepLogs = logs.filter(log => log.step === step.name)
    
    // Determine step status
    let status = 'pending'
    if (stepLogs.some(log => log.level === 'error')) {
      status = 'failed'
    } else if (stepLogs.some(log => log.level === 'success' && log.message?.includes('Completed'))) {
      status = 'completed'
    } else if (stepLogs.some(log => log.message?.includes('approval'))) {
      status = 'waiting_approval'
    } else if (stepLogs.some(log => log.message?.includes('Starting'))) {
      status = 'running'
    }

    // Calculate step duration
    let duration = null
    const startLog = stepLogs.find(log => log.message?.includes('Starting'))
    const endLog = stepLogs.find(log => log.message?.includes('Completed'))
    
    if (startLog && endLog) {
      const start = new Date(startLog.timestamp).getTime()
      const end = new Date(endLog.timestamp).getTime()
      duration = Math.round((end - start) / 1000)
    }

    // Get step-specific logs
    const relevantLogs = stepLogs.map(log => ({
      level: log.level,
      message: log.message,
      timestamp: log.timestamp,
      error: log.error || null,
      duration: log.duration || null
    }))

    return {
      ...step,
      index,
      status,
      duration,
      logs: relevantLogs,
      hasLogs: relevantLogs.length > 0
    }
  })

  return stepDetails
}

/**
 * Get detailed error information
 */
function getDetailedErrorInfo(logs: any[]) {
  const errorLogs = logs
    .filter(log => log.level === 'error')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  if (errorLogs.length === 0) return null

  const primaryError = errorLogs[0]

  return {
    message: primaryError.message || 'Unknown error occurred',
    step: primaryError.step || null,
    timestamp: primaryError.timestamp,
    error: primaryError.error || null,
    allErrors: errorLogs.map(log => ({
      message: log.message,
      step: log.step,
      timestamp: log.timestamp,
      error: log.error
    }))
  }
}