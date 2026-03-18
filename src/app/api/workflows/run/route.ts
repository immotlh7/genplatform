import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserServer } from '@/lib/access-control'
import { supabaseHelpers } from '@/lib/supabase'

interface RunWorkflowRequest {
  workflowId: string
  projectId?: string
  triggeredBy?: string
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

    // Only OWNER and ADMIN can run workflows
    if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only OWNER and ADMIN can run workflows.' },
        { status: 403 }
      )
    }

    const body: RunWorkflowRequest = await request.json()
    const { workflowId, projectId, triggeredBy = 'manual' } = body

    if (!workflowId) {
      return NextResponse.json(
        { error: 'workflowId is required' }, 
        { status: 400 }
      )
    }

    // Validate workflow exists and is active
    const { data: workflow, error: workflowError } = await supabaseHelpers.supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .single()

    if (workflowError || !workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' }, 
        { status: 404 }
      )
    }

    if (!workflow.is_active) {
      return NextResponse.json(
        { error: 'Workflow is not active' }, 
        { status: 400 }
      )
    }

    // If projectId is provided, validate it exists and user has access
    if (projectId) {
      const { data: project, error: projectError } = await supabaseHelpers.supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (projectError || !project) {
        return NextResponse.json(
          { error: 'Project not found' }, 
          { status: 404 }
        )
      }

      // Check if user has access to this project
      if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
        const { data: assignment } = await supabaseHelpers.supabase
          .from('project_assignments')
          .select('*')
          .eq('project_id', projectId)
          .eq('user_id', user.id)
          .single()

        if (!assignment) {
          return NextResponse.json(
            { error: 'Access denied to this project' },
            { status: 403 }
          )
        }
      }
    }

    // Create workflow run record
    const { data: workflowRun, error: runError } = await supabaseHelpers.supabase
      .from('workflow_runs')
      .insert({
        workflow_id: workflowId,
        project_id: projectId,
        status: 'running',
        current_step: workflow.config?.steps?.[0]?.name || 'Starting',
        steps_total: workflow.config?.steps?.length || 0,
        logs: [{
          timestamp: new Date().toISOString(),
          level: 'info',
          message: `Workflow started by ${triggeredBy} (${user.email})`,
          step: 'initialization'
        }]
      })
      .select()
      .single()

    if (runError) {
      console.error('Failed to create workflow run:', runError)
      return NextResponse.json(
        { error: 'Failed to create workflow run' }, 
        { status: 500 }
      )
    }

    // Update workflow last run info
    await supabaseHelpers.supabase
      .from('workflows')
      .update({
        last_run_at: new Date().toISOString(),
        last_run_status: 'running'
      })
      .eq('id', workflowId)

    // Start workflow execution (async - in background)
    // In a real implementation, this would trigger the workflow engine
    startWorkflowExecution(workflowRun.id, workflow, projectId, user.email)

    return NextResponse.json({
      success: true,
      runId: workflowRun.id,
      status: 'started',
      message: 'Workflow execution started successfully'
    })

  } catch (error) {
    console.error('Error starting workflow:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

// Async function to start workflow execution
async function startWorkflowExecution(
  runId: string, 
  workflow: any, 
  projectId?: string, 
  userEmail?: string
) {
  try {
    console.log(`Starting workflow execution for run ${runId}`)
    
    // In a real implementation, this would:
    // 1. Send request to Bridge API
    // 2. Bridge API would use workflow-runner.js
    // 3. Execute steps in order
    // 4. Handle approvals, loops, etc.
    
    // Mock execution for now
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Simulate first step completion
    await supabaseHelpers.supabase
      .from('workflow_runs')
      .update({
        current_step: workflow.config?.steps?.[1]?.name || 'Step 2',
        steps_completed: 1,
        logs: [{
          timestamp: new Date().toISOString(),
          level: 'info',
          message: `Workflow started by manual trigger (${userEmail})`,
          step: 'initialization'
        }, {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'First step completed successfully',
          step: workflow.config?.steps?.[0]?.name || 'Step 1'
        }]
      })
      .eq('id', runId)

    console.log(`Workflow run ${runId} first step completed`)
    
  } catch (error) {
    console.error(`Error in workflow execution ${runId}:`, error)
    
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

// Get running workflows
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserServer()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      )
    }

    if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get currently running workflows
    const { data: runningWorkflows, error } = await supabaseHelpers.supabase
      .from('workflow_runs')
      .select(`
        *,
        workflow:workflows(name, template_type, description),
        project:projects(name)
      `)
      .in('status', ['running', 'waiting_approval'])
      .order('started_at', { ascending: false })

    if (error) {
      console.error('Error fetching running workflows:', error)
      return NextResponse.json(
        { error: 'Failed to fetch running workflows' }, 
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      workflows: runningWorkflows || [],
      count: runningWorkflows?.length || 0
    })

  } catch (error) {
    console.error('Error fetching running workflows:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}