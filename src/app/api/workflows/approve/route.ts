import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { runId, approved = true } = await req.json()

    // Validate required parameters
    if (!runId) {
      return NextResponse.json({
        success: false,
        message: 'runId is required'
      }, { status: 400 })
    }

    console.log(`⚖️ Processing workflow approval: ${runId} - ${approved ? 'APPROVED' : 'REJECTED'}`)

    // Fetch workflow run to validate it exists and is waiting for approval
    const { data: workflowRun, error: runError } = await supabase
      .from('workflow_runs')
      .select(`
        *,
        workflows (
          id,
          name,
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

    if (workflowRun.status !== 'waiting_approval') {
      return NextResponse.json({
        success: false,
        message: 'Workflow is not waiting for approval',
        currentStatus: workflowRun.status
      }, { status: 400 })
    }

    // Validate user has permission to approve workflows
    // TODO: Add proper authentication and role checking
    // For now, check if user is OWNER or ADMIN based on the step requirements
    
    const workflow = workflowRun.workflows
    const steps = workflow?.config?.steps || []
    const currentStep = steps[workflowRun.steps_completed]
    
    if (!currentStep || currentStep.type !== 'approval') {
      return NextResponse.json({
        success: false,
        message: 'Current step is not an approval step'
      }, { status: 400 })
    }

    const requiredApprover = currentStep.config?.approver || 'owner'
    
    // TODO: Validate user role matches required approver
    // if (userRole !== 'OWNER' && userRole !== 'ADMIN') {
    //   return NextResponse.json({
    //     success: false,
    //     message: 'Insufficient permissions to approve workflows'
    //   }, { status: 403 })
    // }

    // Create approval log entry
    const approvalLog = {
      level: approved ? 'success' : 'warning',
      message: approved 
        ? `Workflow approved by ${requiredApprover}, continuing to next step`
        : `Workflow rejected by ${requiredApprover}, stopping execution`,
      step: currentStep.name,
      timestamp: new Date().toISOString(),
      approver: requiredApprover,
      decision: approved ? 'approved' : 'rejected'
    }

    // Update workflow run based on approval decision
    if (approved) {
      // Approval granted - continue workflow
      const updatedLogs = [...(workflowRun.logs || []), approvalLog]
      
      // Update run to continue
      const { error: updateError } = await supabase
        .from('workflow_runs')
        .update({
          status: 'running',
          steps_completed: workflowRun.steps_completed + 1,
          logs: updatedLogs
        })
        .eq('id', runId)

      if (updateError) {
        console.error('Failed to update workflow run:', updateError)
        return NextResponse.json({
          success: false,
          message: 'Failed to update workflow run',
          error: updateError.message
        }, { status: 500 })
      }

      // In a real implementation, this would notify the workflow engine to continue
      try {
        await continueWorkflowExecution(runId, workflowRun, workflow)
      } catch (engineError) {
        console.error('Failed to continue workflow:', engineError)
        // Don't fail the approval, but log the error
      }

      console.log(`✅ Workflow approved and continuing: ${runId}`)

      return NextResponse.json({
        success: true,
        message: 'Workflow approved and continuing',
        runId,
        decision: 'approved',
        nextStep: steps[workflowRun.steps_completed + 1]?.name || 'Final step'
      })

    } else {
      // Approval rejected - stop workflow
      const updatedLogs = [...(workflowRun.logs || []), approvalLog]
      
      // Update run to failed/rejected status
      const { error: updateError } = await supabase
        .from('workflow_runs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          logs: updatedLogs
        })
        .eq('id', runId)

      if (updateError) {
        console.error('Failed to update workflow run:', updateError)
        return NextResponse.json({
          success: false,
          message: 'Failed to update workflow run',
          error: updateError.message
        }, { status: 500 })
      }

      // Update workflow's last run status
      await supabase
        .from('workflows')
        .update({
          last_run_at: new Date().toISOString(),
          last_run_status: 'failed'
        })
        .eq('id', workflow.id)

      console.log(`❌ Workflow rejected and stopped: ${runId}`)

      return NextResponse.json({
        success: true,
        message: 'Workflow rejected and stopped',
        runId,
        decision: 'rejected'
      })
    }

  } catch (error) {
    console.error('Workflow approval API error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Continue workflow execution after approval
 */
async function continueWorkflowExecution(runId: string, workflowRun: any, workflow: any) {
  try {
    console.log(`⚙️ Continuing workflow execution: ${runId}`)

    // In a real implementation, this would:
    // 1. Send continuation signal to Bridge API workflow engine
    // 2. Engine resumes from the next step
    // 3. Updates database with progress

    // For demonstration, simulate next step execution
    const steps = workflow?.config?.steps || []
    const nextStepIndex = workflowRun.steps_completed + 1

    if (nextStepIndex < steps.length) {
      const nextStep = steps[nextStepIndex]
      
      setTimeout(async () => {
        try {
          await simulateStepExecution(runId, nextStep, nextStepIndex)
        } catch (error) {
          console.error('Error in step simulation:', error)
        }
      }, 1000) // Continue after 1 second
    } else {
      // All steps completed
      setTimeout(async () => {
        try {
          await completeWorkflow(runId, workflow.id)
        } catch (error) {
          console.error('Error completing workflow:', error)
        }
      }, 1000)
    }

  } catch (error) {
    console.error('Error continuing workflow execution:', error)
    throw error
  }
}

/**
 * Simulate step execution
 */
async function simulateStepExecution(runId: string, step: any, stepIndex: number) {
  try {
    console.log(`🔧 Simulating step ${stepIndex + 1}: ${step.name}`)

    // Update current step
    await supabase
      .from('workflow_runs')
      .update({
        current_step: step.name
      })
      .eq('id', runId)

    // Add step start log
    const currentRun = await supabase
      .from('workflow_runs')
      .select('logs')
      .eq('id', runId)
      .single()

    if (currentRun.data) {
      const startLog = {
        level: 'info',
        message: `Starting step: ${step.name}`,
        step: step.name,
        timestamp: new Date().toISOString()
      }

      const updatedLogs = [...(currentRun.data.logs || []), startLog]

      await supabase
        .from('workflow_runs')
        .update({ logs: updatedLogs })
        .eq('id', runId)

      // Simulate execution time
      const executionTime = Math.min((step.estimatedMinutes || 1) * 1000, 8000) // Cap at 8 seconds

      setTimeout(async () => {
        // Complete step
        const latestRun = await supabase
          .from('workflow_runs')
          .select('logs, steps_completed')
          .eq('id', runId)
          .single()

        if (latestRun.data) {
          const completionLog = {
            level: 'success',
            message: `Completed step: ${step.name}`,
            step: step.name,
            timestamp: new Date().toISOString(),
            duration: executionTime
          }

          const finalLogs = [...(latestRun.data.logs || []), completionLog]

          await supabase
            .from('workflow_runs')
            .update({
              steps_completed: stepIndex + 1,
              logs: finalLogs
            })
            .eq('id', runId)

          console.log(`✅ Step completed: ${step.name}`)
        }
      }, executionTime)
    }

  } catch (error) {
    console.error('Error simulating step execution:', error)
  }
}

/**
 * Complete workflow
 */
async function completeWorkflow(runId: string, workflowId: string) {
  try {
    const completedAt = new Date().toISOString()

    // Get current logs
    const currentRun = await supabase
      .from('workflow_runs')
      .select('logs')
      .eq('id', runId)
      .single()

    const completionLog = {
      level: 'success',
      message: 'Workflow completed successfully',
      timestamp: completedAt
    }

    const finalLogs = [...(currentRun.data?.logs || []), completionLog]

    // Update workflow run
    await supabase
      .from('workflow_runs')
      .update({
        status: 'completed',
        completed_at: completedAt,
        logs: finalLogs
      })
      .eq('id', runId)

    // Update workflow
    await supabase
      .from('workflows')
      .update({
        last_run_at: completedAt,
        last_run_status: 'completed'
      })
      .eq('id', workflowId)

    console.log(`🎉 Workflow completed: ${runId}`)

  } catch (error) {
    console.error('Error completing workflow:', error)
  }
}