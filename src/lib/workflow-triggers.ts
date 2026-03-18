// Workflow trigger system for automated workflow execution
// Task 7-17 & 7-18: Auto-trigger workflows based on events

import { supabase } from './supabase'

export interface TriggerContext {
  eventType: 'new_idea' | 'task_complete' | 'manual'
  entityId?: string
  entityData?: any
  userId?: string
  metadata?: Record<string, any>
}

/**
 * Trigger workflows based on new idea creation
 * Task 7-17: Wire "New Idea" submission to trigger workflow
 */
export async function triggerNewIdeaWorkflows(ideaId: string, ideaData: any, userId?: string) {
  try {
    console.log(`💡 New idea created, checking for trigger workflows: ${ideaId}`)

    // Find active workflows that trigger on new ideas
    const { data: workflows, error: workflowsError } = await supabase
      .from('workflows')
      .select('*')
      .eq('trigger_type', 'new_idea')
      .eq('is_active', true)

    if (workflowsError) {
      console.error('Error fetching new idea workflows:', workflowsError)
      return { success: false, error: workflowsError.message }
    }

    if (!workflows || workflows.length === 0) {
      console.log('📝 No active workflows found for new idea trigger')
      return { success: true, triggeredWorkflows: [] }
    }

    console.log(`🔄 Found ${workflows.length} active workflow(s) for new idea trigger`)

    const triggeredWorkflows = []

    // Trigger each workflow
    for (const workflow of workflows) {
      try {
        console.log(`🚀 Triggering workflow: ${workflow.name} for idea: ${ideaId}`)

        // Start the workflow with idea context
        const triggerResult = await startWorkflowExecution(workflow.id, null, {
          eventType: 'new_idea',
          entityId: ideaId,
          entityData: ideaData,
          userId,
          metadata: {
            ideaTitle: ideaData.title || 'New Idea',
            ideaDescription: ideaData.description || '',
            triggerSource: 'new_idea_submission'
          }
        })

        if (triggerResult.success) {
          triggeredWorkflows.push({
            workflowId: workflow.id,
            workflowName: workflow.name,
            runId: triggerResult.runId
          })

          // Update idea with automated pipeline status
          await updateIdeaWithPipelineStatus(ideaId, workflow.id, triggerResult.runId)

        } else {
          console.error(`❌ Failed to trigger workflow ${workflow.name}:`, triggerResult.error)
        }

      } catch (workflowError) {
        console.error(`❌ Error triggering workflow ${workflow.name}:`, workflowError)
      }
    }

    console.log(`✅ Successfully triggered ${triggeredWorkflows.length} workflow(s) for idea: ${ideaId}`)

    return {
      success: true,
      triggeredWorkflows,
      message: triggeredWorkflows.length > 0 
        ? `Automated pipeline started for ${triggeredWorkflows.length} workflow(s)`
        : 'No workflows were triggered'
    }

  } catch (error) {
    console.error('Error in triggerNewIdeaWorkflows:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Trigger workflows based on task completion
 * Task 7-18: Wire task completion to trigger workflow
 */
export async function triggerTaskCompleteWorkflows(taskId: string, taskData: any, projectId?: string, userId?: string) {
  try {
    console.log(`✅ Task completed, checking for trigger workflows: ${taskId}`)

    // Find active workflows that trigger on task completion
    const { data: workflows, error: workflowsError } = await supabase
      .from('workflows')
      .select('*')
      .eq('trigger_type', 'task_complete')
      .eq('is_active', true)

    if (workflowsError) {
      console.error('Error fetching task complete workflows:', workflowsError)
      return { success: false, error: workflowsError.message }
    }

    if (!workflows || workflows.length === 0) {
      console.log('📋 No active workflows found for task completion trigger')
      return { success: true, triggeredWorkflows: [] }
    }

    console.log(`🔄 Found ${workflows.length} active workflow(s) for task completion trigger`)

    const triggeredWorkflows = []

    // Trigger each workflow
    for (const workflow of workflows) {
      try {
        console.log(`🚀 Triggering workflow: ${workflow.name} for completed task: ${taskId}`)

        // Start the workflow with task context
        const triggerResult = await startWorkflowExecution(workflow.id, projectId, {
          eventType: 'task_complete',
          entityId: taskId,
          entityData: taskData,
          userId,
          metadata: {
            taskName: taskData.name || 'Completed Task',
            taskStatus: taskData.status || 'done',
            projectId: projectId || null,
            triggerSource: 'task_completion'
          }
        })

        if (triggerResult.success) {
          triggeredWorkflows.push({
            workflowId: workflow.id,
            workflowName: workflow.name,
            runId: triggerResult.runId
          })

          console.log(`✅ Successfully triggered workflow: ${workflow.name}`)

        } else {
          console.error(`❌ Failed to trigger workflow ${workflow.name}:`, triggerResult.error)
        }

      } catch (workflowError) {
        console.error(`❌ Error triggering workflow ${workflow.name}:`, workflowError)
      }
    }

    console.log(`✅ Successfully triggered ${triggeredWorkflows.length} workflow(s) for task: ${taskId}`)

    return {
      success: true,
      triggeredWorkflows,
      message: triggeredWorkflows.length > 0 
        ? `${triggeredWorkflows.length} workflow(s) triggered by task completion`
        : 'No workflows were triggered'
    }

  } catch (error) {
    console.error('Error in triggerTaskCompleteWorkflows:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Start workflow execution with context
 */
async function startWorkflowExecution(workflowId: string, projectId: string | null, context: TriggerContext) {
  try {
    const response = await fetch('/api/workflows/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workflowId,
        projectId,
        context
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to start workflow')
    }

    const data = await response.json()
    return {
      success: true,
      runId: data.runId,
      message: data.message
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Update idea with automated pipeline status
 */
async function updateIdeaWithPipelineStatus(ideaId: string, workflowId: string, runId: string) {
  try {
    // Get current idea data
    const { data: idea, error: ideaError } = await supabase
      .from('ideas')
      .select('*')
      .eq('id', ideaId)
      .single()

    if (ideaError || !idea) {
      console.error('Error fetching idea for pipeline update:', ideaError)
      return
    }

    // Update idea with pipeline information
    const updatedMetadata = {
      ...(idea.metadata || {}),
      automatedPipeline: {
        workflowId,
        runId,
        status: 'running',
        startedAt: new Date().toISOString()
      }
    }

    const { error: updateError } = await supabase
      .from('ideas')
      .update({
        metadata: updatedMetadata,
        status: 'in_pipeline' // Add this status if your ideas table supports it
      })
      .eq('id', ideaId)

    if (updateError) {
      console.error('Error updating idea with pipeline status:', updateError)
    } else {
      console.log(`📝 Updated idea ${ideaId} with pipeline status`)
    }

  } catch (error) {
    console.error('Error updating idea pipeline status:', error)
  }
}

/**
 * Get workflow trigger summary for a project or entity
 */
export async function getWorkflowTriggerSummary(entityType: 'idea' | 'task', entityId: string) {
  try {
    // Get workflow runs triggered by this entity
    const { data: workflowRuns, error: runsError } = await supabase
      .from('workflow_runs')
      .select(`
        id,
        status,
        started_at,
        completed_at,
        workflows (
          id,
          name,
          template_type
        )
      `)
      .contains('logs', [{ entityId }])
      .order('started_at', { ascending: false })

    if (runsError) {
      console.error('Error fetching workflow trigger summary:', runsError)
      return { success: false, error: runsError.message }
    }

    return {
      success: true,
      triggeredRuns: workflowRuns || [],
      count: workflowRuns?.length || 0
    }

  } catch (error) {
    console.error('Error getting workflow trigger summary:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Check if an entity has active workflow runs
 */
export async function hasActiveWorkflowRuns(entityId: string): Promise<boolean> {
  try {
    const { count } = await supabase
      .from('workflow_runs')
      .select('*', { count: 'exact', head: true })
      .contains('logs', [{ entityId }])
      .in('status', ['running', 'waiting_approval'])

    return (count || 0) > 0

  } catch (error) {
    console.error('Error checking active workflow runs:', error)
    return false
  }
}