import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserServer } from '@/lib/access-control'
import { supabaseHelpers } from '@/lib/supabase'

interface ApproveWorkflowRequest {
  runId: string
  action: 'approve' | 'reject'
  reason?: string
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and permissions
    const user = await getCurrentUserServer()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      )
    }

    // Only OWNER and ADMIN can approve workflows
    if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only OWNER and ADMIN can approve workflows.' },
        { status: 403 }
      )
    }

    const body: ApproveWorkflowRequest = await request.json()
    const { runId, action, reason } = body

    if (!runId) {
      return NextResponse.json(
        { error: 'runId is required' }, 
        { status: 400 }
      )
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be "approve" or "reject"' }, 
        { status: 400 }
      )
    }

    // Validate workflow run exists and is waiting approval
    const { data: workflowRun, error: runError } = await supabaseHelpers.supabase
      .from('workflow_runs')
      .select(`
        *,
        workflow:workflows(name, config)
      `)
      .eq('id', runId)
      .single()

    if (runError || !workflowRun) {
      return NextResponse.json(
        { error: 'Workflow run not found' }, 
        { status: 404 }
      )
    }

    if (workflowRun.status !== 'waiting_approval') {
      return NextResponse.json(
        { error: 'Workflow is not waiting for approval' }, 
        { status: 400 }
      )
    }

    // Get current logs
    const currentLogs = workflowRun.logs || []
    
    if (action === 'approve') {
      // Approve and continue workflow
      const newLog = {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `Workflow approved by ${user.email}${reason ? `: ${reason}` : ''}`,
        step: workflowRun.current_step
      }

      // Find next step
      const steps = workflowRun.workflow?.config?.steps || []
      const currentStepIndex = steps.findIndex((step: any) => step.name === workflowRun.current_step)
      const nextStepIndex = currentStepIndex + 1
      const nextStep = steps[nextStepIndex]

      const updateData: any = {
        status: nextStep ? 'running' : 'completed',
        logs: [...currentLogs, newLog]
      }

      if (nextStep) {
        updateData.current_step = nextStep.name
        updateData.steps_completed = nextStepIndex
      } else {
        updateData.completed_at = new Date().toISOString()
        updateData.steps_completed = steps.length
      }

      const { error: updateError } = await supabaseHelpers.supabase
        .from('workflow_runs')
        .update(updateData)
        .eq('id', runId)

      if (updateError) {
        console.error('Failed to update workflow run:', updateError)
        return NextResponse.json(
          { error: 'Failed to approve workflow' }, 
          { status: 500 }
        )
      }

      // Update workflow last run status
      await supabaseHelpers.supabase
        .from('workflows')
        .update({
          last_run_status: nextStep ? 'running' : 'completed'
        })
        .eq('id', workflowRun.workflow_id)

      // Continue workflow execution (async)
      if (nextStep) {
        continueWorkflowExecution(runId, workflowRun.workflow, nextStepIndex)
      }

      return NextResponse.json({
        success: true,
        action: 'approved',
        message: 'Workflow approved and continued',
        nextStep: nextStep?.name || 'completed'
      })

    } else {
      // Reject and stop workflow
      const newLog = {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `Workflow rejected by ${user.email}${reason ? `: ${reason}` : ''}`,
        step: workflowRun.current_step
      }

      const { error: updateError } = await supabaseHelpers.supabase
        .from('workflow_runs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          logs: [...currentLogs, newLog]
        })
        .eq('id', runId)

      if (updateError) {
        console.error('Failed to update workflow run:', updateError)
        return NextResponse.json(
          { error: 'Failed to reject workflow' }, 
          { status: 500 }
        )
      }

      // Update workflow last run status
      await supabaseHelpers.supabase
        .from('workflows')
        .update({
          last_run_status: 'failed'
        })
        .eq('id', workflowRun.workflow_id)

      return NextResponse.json({
        success: true,
        action: 'rejected',
        message: 'Workflow rejected and stopped',
        reason: reason || 'No reason provided'
      })
    }

  } catch (error) {
    console.error('Error processing workflow approval:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

// Continue workflow execution after approval
async function continueWorkflowExecution(
  runId: string,
  workflow: any,
  currentStepIndex: number
) {
  try {
    console.log(`Continuing workflow execution for run ${runId} at step ${currentStepIndex + 1}`)
    
    const steps = workflow.config?.steps || []
    const currentStep = steps[currentStepIndex]
    
    if (!currentStep) {
      console.log(`No more steps for workflow run ${runId}`)
      return
    }

    // Simulate step execution time
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Get current state
    const { data: currentRun } = await supabaseHelpers.supabase
      .from('workflow_runs')
      .select('logs')
      .eq('id', runId)
      .single()

    const currentLogs = currentRun?.logs || []
    
    if (currentStep.type === 'approval') {
      // This is another approval step
      const newLog = {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `Waiting for approval: ${currentStep.description}`,
        step: currentStep.name
      }

      await supabaseHelpers.supabase
        .from('workflow_runs')
        .update({
          status: 'waiting_approval',
          current_step: currentStep.name,
          logs: [...currentLogs, newLog]
        })
        .eq('id', runId)

      console.log(`Workflow run ${runId} waiting for approval at step: ${currentStep.name}`)
      
    } else {
      // Execute action or loop step
      const newLog = {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `Executed step: ${currentStep.name}`,
        step: currentStep.name
      }

      // Check if there are more steps
      const nextStepIndex = currentStepIndex + 1
      const nextStep = steps[nextStepIndex]

      const updateData: any = {
        logs: [...currentLogs, newLog],
        steps_completed: currentStepIndex + 1
      }

      if (nextStep) {
        updateData.current_step = nextStep.name
        
        // If next step is approval, set status accordingly
        if (nextStep.type === 'approval') {
          updateData.status = 'waiting_approval'
          updateData.logs.push({
            timestamp: new Date().toISOString(),
            level: 'info',
            message: `Waiting for approval: ${nextStep.description}`,
            step: nextStep.name
          })
        }
      } else {
        // Workflow completed
        updateData.status = 'completed'
        updateData.completed_at = new Date().toISOString()
      }

      await supabaseHelpers.supabase
        .from('workflow_runs')
        .update(updateData)
        .eq('id', runId)

      // Update workflow status
      await supabaseHelpers.supabase
        .from('workflows')
        .update({
          last_run_status: updateData.status
        })
        .eq('id', workflow.id)

      console.log(`Workflow run ${runId} step completed: ${currentStep.name}`)
      
      // Continue if there are more non-approval steps
      if (nextStep && nextStep.type !== 'approval') {
        continueWorkflowExecution(runId, workflow, nextStepIndex)
      }
    }

  } catch (error) {
    console.error(`Error continuing workflow execution ${runId}:`, error)
    
    // Mark workflow as failed
    await supabaseHelpers.supabase
      .from('workflow_runs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString()
      })
      .eq('id', runId)
  }
}