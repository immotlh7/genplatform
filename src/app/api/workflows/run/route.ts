import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { workflowId, projectId, context = {} } = await req.json()

    // Validate required parameters
    if (!workflowId) {
      return NextResponse.json({
        success: false,
        message: 'workflowId is required'
      }, { status: 400 })
    }

    console.log(`🚀 Starting workflow execution: ${workflowId}`)

    // Fetch workflow to validate it exists and is active
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .single()

    if (workflowError || !workflow) {
      console.error('Workflow not found:', workflowError)
      return NextResponse.json({
        success: false,
        message: 'Workflow not found'
      }, { status: 404 })
    }

    if (!workflow.is_active) {
      return NextResponse.json({
        success: false,
        message: 'Workflow is not active'
      }, { status: 400 })
    }

    // Validate user has permission to run workflows
    // TODO: Add proper authentication and role checking
    // For now, assume user has permission

    // Create workflow run record
    const { data: workflowRun, error: runError } = await supabase
      .from('workflow_runs')
      .insert({
        workflow_id: workflowId,
        project_id: projectId,
        status: 'running',
        current_step: null,
        steps_completed: 0,
        steps_total: workflow.config?.steps?.length || 0,
        logs: [{
          level: 'info',
          message: 'Workflow execution started',
          timestamp: new Date().toISOString(),
          context
        }]
      })
      .select()
      .single()

    if (runError) {
      console.error('Failed to create workflow run:', runError)
      return NextResponse.json({
        success: false,
        message: 'Failed to create workflow run',
        error: runError.message
      }, { status: 500 })
    }

    // In a real implementation, this would:
    // 1. Send the workflow run to the Bridge API workflow engine
    // 2. The engine would execute steps asynchronously
    // 3. Return immediately with the run ID
    
    // For now, simulate starting the workflow engine
    try {
      // Call the workflow engine to start execution
      await startWorkflowEngine(workflowRun.id, workflow, projectId, context)
    } catch (engineError) {
      console.error('Failed to start workflow engine:', engineError)
      
      // Update workflow run status to failed
      await supabase
        .from('workflow_runs')
        .update({ 
          status: 'failed',
          logs: [{
            level: 'error',
            message: `Failed to start workflow engine: ${engineError.message}`,
            timestamp: new Date().toISOString()
          }]
        })
        .eq('id', workflowRun.id)

      return NextResponse.json({
        success: false,
        message: 'Failed to start workflow execution',
        error: engineError.message
      }, { status: 500 })
    }

    // Update workflow's last run info
    await supabase
      .from('workflows')
      .update({
        last_run_at: new Date().toISOString(),
        last_run_status: 'running'
      })
      .eq('id', workflowId)

    console.log(`✅ Workflow started successfully: ${workflowRun.id}`)

    return NextResponse.json({
      success: true,
      runId: workflowRun.id,
      message: 'Workflow started successfully',
      workflow: {
        id: workflow.id,
        name: workflow.name,
        template_type: workflow.template_type
      },
      run: {
        id: workflowRun.id,
        status: workflowRun.status,
        steps_total: workflowRun.steps_total,
        started_at: workflowRun.started_at
      }
    })

  } catch (error) {
    console.error('Workflow run API error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Start the workflow engine for a specific workflow run
 * In a real implementation, this would communicate with the Bridge API
 */
async function startWorkflowEngine(runId: string, workflow: any, projectId: string | null, context: any) {
  try {
    console.log(`⚙️ Starting workflow engine for run: ${runId}`)

    // Simulate workflow engine startup
    // In production, this would:
    // 1. Send HTTP request to Bridge API workflow engine
    // 2. Pass workflow definition and run ID
    // 3. Engine executes steps asynchronously
    // 4. Updates database with progress

    // For demonstration, we'll simulate the first step execution
    setTimeout(async () => {
      try {
        await simulateFirstStep(runId, workflow)
      } catch (error) {
        console.error('Error in simulated first step:', error)
      }
    }, 2000) // Start first step after 2 seconds

    return true
  } catch (error) {
    console.error('Error starting workflow engine:', error)
    throw error
  }
}

/**
 * Simulate the execution of the first workflow step
 */
async function simulateFirstStep(runId: string, workflow: any) {
  try {
    const steps = workflow.config?.steps || []
    if (steps.length === 0) return

    const firstStep = steps[0]
    console.log(`🔧 Simulating first step: ${firstStep.name}`)

    // Update current step
    await supabase
      .from('workflow_runs')
      .update({
        current_step: firstStep.name
      })
      .eq('id', runId)

    // Add step start log
    const currentRun = await supabase
      .from('workflow_runs')
      .select('logs')
      .eq('id', runId)
      .single()

    if (currentRun.data) {
      const updatedLogs = [
        ...(currentRun.data.logs || []),
        {
          level: 'info',
          message: `Starting step: ${firstStep.name}`,
          step: firstStep.name,
          timestamp: new Date().toISOString()
        }
      ]

      await supabase
        .from('workflow_runs')
        .update({ logs: updatedLogs })
        .eq('id', runId)
    }

    // Simulate step execution time
    const executionTime = Math.min((firstStep.estimatedMinutes || 1) * 1000, 10000) // Cap at 10 seconds for demo
    
    setTimeout(async () => {
      // Complete first step
      const updatedRun = await supabase
        .from('workflow_runs')
        .select('logs')
        .eq('id', runId)
        .single()

      if (updatedRun.data) {
        const completionLogs = [
          ...(updatedRun.data.logs || []),
          {
            level: 'success',
            message: `Completed step: ${firstStep.name}`,
            step: firstStep.name,
            timestamp: new Date().toISOString(),
            duration: executionTime
          }
        ]

        await supabase
          .from('workflow_runs')
          .update({
            steps_completed: 1,
            logs: completionLogs
          })
          .eq('id', runId)

        console.log(`✅ First step completed: ${firstStep.name}`)
      }
    }, executionTime)

  } catch (error) {
    console.error('Error simulating first step:', error)
  }
}