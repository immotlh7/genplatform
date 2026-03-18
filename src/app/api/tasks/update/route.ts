import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { triggerTaskCompleteWorkflows } from '@/lib/workflow-triggers'

export async function POST(req: NextRequest) {
  try {
    const { taskId, status, ...updateData } = await req.json()

    console.log(`📋 Updating task: ${taskId} to status: ${status}`)

    // Validate required fields
    if (!taskId || !status) {
      return NextResponse.json({
        success: false,
        message: 'taskId and status are required'
      }, { status: 400 })
    }

    // Get current task data before update
    const { data: currentTask, error: fetchError } = await supabase
      .from('project_tasks')
      .select('*')
      .eq('id', taskId)
      .single()

    if (fetchError || !currentTask) {
      console.error('Error fetching current task:', fetchError)
      return NextResponse.json({
        success: false,
        message: 'Task not found',
        error: fetchError?.message || 'Task not found'
      }, { status: 404 })
    }

    // Prepare update data
    const updatePayload = {
      status,
      ...updateData
    }

    // Add completion timestamp if status is 'done'
    if (status === 'done' && currentTask.status !== 'done') {
      updatePayload.completed_at = new Date().toISOString()
      
      // Calculate actual minutes if started_at exists
      if (currentTask.started_at) {
        const startTime = new Date(currentTask.started_at).getTime()
        const endTime = new Date().getTime()
        const actualMinutes = Math.round((endTime - startTime) / (1000 * 60))
        updatePayload.actual_minutes = actualMinutes
      }
    }

    // Add start timestamp if status is 'in_progress' and not already started
    if (status === 'in_progress' && !currentTask.started_at) {
      updatePayload.started_at = new Date().toISOString()
    }

    // Update the task
    const { data: updatedTask, error: updateError } = await supabase
      .from('project_tasks')
      .update(updatePayload)
      .eq('id', taskId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error updating task:', updateError)
      return NextResponse.json({
        success: false,
        message: 'Failed to update task',
        error: updateError.message
      }, { status: 500 })
    }

    console.log(`✅ Task updated: ${taskId} - ${status}`)

    // Task 7-18: Check if task was marked as 'done' and trigger workflows
    let workflowTriggerResult = null
    
    if (status === 'done' && currentTask.status !== 'done') {
      try {
        console.log(`🎯 Task completed, checking for trigger workflows: ${taskId}`)
        
        workflowTriggerResult = await triggerTaskCompleteWorkflows(
          taskId,
          updatedTask,
          updatedTask.project_id,
          updateData.user_id || null
        )

        if (workflowTriggerResult.success && workflowTriggerResult.triggeredWorkflows.length > 0) {
          console.log(`🚀 Triggered ${workflowTriggerResult.triggeredWorkflows.length} workflow(s) for task completion: ${taskId}`)
        }

      } catch (triggerError) {
        console.error('Error triggering task completion workflows:', triggerError)
        // Don't fail the task update if workflow trigger fails
        workflowTriggerResult = {
          success: false,
          error: triggerError instanceof Error ? triggerError.message : 'Unknown error'
        }
      }
    }

    // Log the task event
    try {
      await supabase
        .from('task_events')
        .insert({
          task_id: taskId,
          project_id: updatedTask.project_id,
          event_type: `task_${status}`,
          actor_user_id: updateData.user_id || null,
          details: {
            previousStatus: currentTask.status,
            newStatus: status,
            completionTriggered: workflowTriggerResult?.success || false,
            triggeredWorkflows: workflowTriggerResult?.triggeredWorkflows || [],
            ...updateData
          }
        })
    } catch (eventError) {
      console.error('Error logging task event:', eventError)
      // Don't fail the update if event logging fails
    }

    // Prepare response
    const response: any = {
      success: true,
      message: 'Task updated successfully',
      task: updatedTask,
      statusChanged: currentTask.status !== status,
      previousStatus: currentTask.status,
      newStatus: status
    }

    // Add workflow trigger information if applicable
    if (workflowTriggerResult) {
      response.automation = {
        enabled: workflowTriggerResult.success,
        message: workflowTriggerResult.message,
        triggeredWorkflows: workflowTriggerResult.triggeredWorkflows || [],
        error: workflowTriggerResult.error || null
      }

      // Add workflow info to the task object
      response.task.automationTriggered = workflowTriggerResult.success
      response.task.triggeredWorkflows = workflowTriggerResult.triggeredWorkflows || []
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Task update API error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const taskId = searchParams.get('taskId')
    const projectId = searchParams.get('projectId')

    if (!taskId && !projectId) {
      return NextResponse.json({
        success: false,
        message: 'Either taskId or projectId is required'
      }, { status: 400 })
    }

    let query = supabase
      .from('project_tasks')
      .select('*')
      .order('created_at', { ascending: false })

    if (taskId) {
      query = query.eq('id', taskId)
    } else if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data: tasks, error } = await query

    if (error) {
      console.error('Error fetching tasks:', error)
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch tasks',
        error: error.message
      }, { status: 500 })
    }

    if (taskId) {
      const task = tasks?.[0]
      if (!task) {
        return NextResponse.json({
          success: false,
          message: 'Task not found'
        }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        task
      })
    }

    return NextResponse.json({
      success: true,
      tasks: tasks || [],
      count: tasks?.length || 0
    })

  } catch (error) {
    console.error('Task fetch API error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}