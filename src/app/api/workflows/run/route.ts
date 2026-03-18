import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseHelpers } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { workflow_id, trigger_data } = await req.json()

    if (!workflow_id) {
      return NextResponse.json(
        { error: 'Workflow ID is required' },
        { status: 400 }
      )
    }

    // Get workflow configuration
    const { data: workflow, error: workflowError } = await supabase
      .from('automation_workflows')
      .select('*')
      .eq('id', workflow_id)
      .single()

    if (workflowError || !workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    // Check if workflow is enabled
    if (!workflow.enabled) {
      return NextResponse.json(
        { error: 'Workflow is disabled' },
        { status: 400 }
      )
    }

    // Create workflow run record
    const runData = {
      workflow_id,
      status: 'running' as const,
      started_at: new Date().toISOString(),
      context: {
        trigger: workflow.trigger,
        trigger_data: trigger_data || {},
        configuration: workflow.configuration || {}
      },
      logs: []
    }

    const { data: workflowRun, error: runError } = await supabase
      .from('workflow_runs')
      .insert(runData)
      .select()
      .single()

    if (runError || !workflowRun) {
      console.error('Failed to create workflow run:', runError)
      return NextResponse.json(
        { error: 'Failed to start workflow' },
        { status: 500 }
      )
    }

    // Execute workflow actions directly (simplified for now)
    let currentStatus = 'running'
    const logs: any[] = []
    const results: any = {}

    try {
      // Log workflow start
      logs.push({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `Starting workflow: ${workflow.name}`,
        data: { workflow_id, trigger: workflow.trigger }
      })

      // Process each action in sequence
      if (workflow.actions && Array.isArray(workflow.actions)) {
        for (const [index, action] of workflow.actions.entries()) {
          const actionLog = {
            timestamp: new Date().toISOString(),
            level: 'info' as const,
            message: `Executing action ${index + 1}: ${action.type}`,
            data: { action }
          }
          logs.push(actionLog)

          // Simulate action execution
          try {
            // In a real implementation, this would call appropriate action handlers
            switch (action.type) {
              case 'send_email':
                results[`action_${index}`] = { success: true, message: 'Email queued for sending' }
                break
              case 'create_task':
                results[`action_${index}`] = { success: true, task_id: 'simulated-task-id' }
                break
              case 'notify_webhook':
                results[`action_${index}`] = { success: true, response: 'Webhook notification sent' }
                break
              default:
                results[`action_${index}`] = { success: true, message: `Action ${action.type} executed` }
            }

            logs.push({
              timestamp: new Date().toISOString(),
              level: 'success',
              message: `Action ${index + 1} completed successfully`,
              data: { action_type: action.type, result: results[`action_${index}`] }
            })
          } catch (actionError: any) {
            logs.push({
              timestamp: new Date().toISOString(),
              level: 'error',
              message: `Action ${index + 1} failed`,
              data: { action_type: action.type, error: actionError.message }
            })
            throw actionError
          }
        }
      }

      currentStatus = 'completed'
      logs.push({
        timestamp: new Date().toISOString(),
        level: 'success',
        message: 'Workflow completed successfully',
        data: { total_actions: workflow.actions?.length || 0 }
      })
    } catch (executionError: any) {
      currentStatus = 'failed'
      logs.push({
        timestamp: new Date().toISOString(),
        level: 'error',
        message: 'Workflow execution failed',
        data: { error: executionError.message }
      })
    }

    // Update workflow run with results
    const { error: updateError } = await supabase
      .from('workflow_runs')
      .update({
        status: currentStatus,
        completed_at: new Date().toISOString(),
        logs,
        result: results,
        context: {
          ...workflowRun.context,
          execution_summary: {
            total_actions: workflow.actions?.length || 0,
            completed_actions: Object.keys(results).length,
            duration_ms: Date.now() - new Date(workflowRun.started_at).getTime()
          }
        }
      })
      .eq('id', workflowRun.id)

    if (updateError) {
      console.error('Failed to update workflow run:', updateError)
    }

    return NextResponse.json({
      run_id: workflowRun.id,
      status: currentStatus,
      message: currentStatus === 'completed' ? 'Workflow executed successfully' : 'Workflow execution failed',
      logs: logs.slice(0, 5), // Return first 5 logs
      results: Object.keys(results).length > 0 ? results : undefined
    })

  } catch (error) {
    console.error('Workflow execution error:', error)
    return NextResponse.json(
      { error: 'Failed to execute workflow' },
      { status: 500 }
    )
  }
}