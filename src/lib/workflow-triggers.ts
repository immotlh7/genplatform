/**
 * Workflow Trigger System for GenPlatform.ai
 * Automatically triggers workflows based on platform events
 * Created: 2026-03-18 for Task 7-17
 */

import { supabaseAdmin } from '@/lib/supabase'

interface TriggerContext {
  eventType: string
  entityType: string
  entityId: string
  userId: string
  metadata?: any
}

interface WorkflowTriggerConfig {
  workflowId: string
  eventType: string
  entityType?: string
  conditions?: any
  priority?: 'low' | 'medium' | 'high'
  autoApprove?: boolean
}

/**
 * Main workflow trigger handler
 */
export async function triggerWorkflow(context: TriggerContext): Promise<string | null> {
  try {
    console.log(`🎯 Evaluating workflow triggers for event: ${context.eventType}`)

    if (!supabaseAdmin) {
      console.error('Supabase admin client not available')
      return null
    }

    // Get all active workflows with matching triggers
    const { data: workflows, error } = await supabaseAdmin
      .from('workflows')
      .select('*')
      .eq('is_active', true)
      .eq('trigger_type', 'auto')
      .contains('trigger_events', [context.eventType])

    if (error) {
      console.error('Error fetching trigger workflows:', error)
      return null
    }

    if (!workflows || workflows.length === 0) {
      console.log(`📭 No workflows configured for event: ${context.eventType}`)
      return null
    }

    // Find the best matching workflow
    const matchingWorkflow = workflows.find(workflow => {
      const config = workflow.config || {}
      const triggers = config.triggers || []
      
      return triggers.some((trigger: WorkflowTriggerConfig) => 
        trigger.eventType === context.eventType &&
        (!trigger.entityType || trigger.entityType === context.entityType)
      )
    })

    if (!matchingWorkflow) {
      console.log(`📭 No matching workflow found for ${context.eventType} on ${context.entityType}`)
      return null
    }

    console.log(`🚀 Triggering workflow: ${matchingWorkflow.name} (${matchingWorkflow.id})`)

    // Start the workflow
    const runId = await startWorkflowRun(matchingWorkflow.id, context)
    
    if (runId) {
      console.log(`✅ Workflow triggered successfully: ${runId}`)
    }

    return runId

  } catch (error) {
    console.error('Error in triggerWorkflow:', error)
    return null
  }
}

/**
 * Start a new workflow run
 */
async function startWorkflowRun(workflowId: string, context: TriggerContext): Promise<string | null> {
  try {
    const workflow = await supabaseAdmin
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .single()

    if (!workflow.data) {
      console.error(`Workflow not found: ${workflowId}`)
      return null
    }

    const workflowData = workflow.data
    const workflowSteps = workflowData.config?.steps || []
    const stepsTotal = workflowSteps.length

    // Create workflow run record
    const { data: workflowRun, error: createError } = await supabaseAdmin
      .from('workflow_runs')
      .insert({
        workflow_id: workflowId,
        project_id: context.entityType === 'project' ? context.entityId : null,
        status: 'running',
        current_step: workflowSteps[0]?.name || 'Starting...',
        steps_completed: 0,
        steps_total: stepsTotal,
        started_by: 'auto-trigger',
        logs: [
          {
            type: 'workflow_auto_triggered',
            status: 'started',
            timestamp: new Date().toISOString(),
            trigger_event: context.eventType,
            entity_type: context.entityType,
            entity_id: context.entityId,
            user_id: context.userId,
            trigger_metadata: context.metadata
          }
        ]
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating workflow run:', createError)
      return null
    }

    const runId = workflowRun.id

    // Start workflow execution asynchronously
    startWorkflowExecution(runId)

    return runId

  } catch (error) {
    console.error('Error starting workflow run:', error)
    return null
  }
}

/**
 * Start workflow execution engine
 */
async function startWorkflowExecution(runId: string) {
  try {
    // Call the workflow run API endpoint
    const response = await fetch('/api/workflows/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        runId: runId,
        source: 'auto-trigger'
      })
    })

    if (response.ok) {
      console.log(`🎯 Workflow execution started for run: ${runId}`)
    } else {
      console.error(`Failed to start workflow execution: ${response.statusText}`)
    }
  } catch (error) {
    console.error('Error starting workflow execution:', error)
  }
}

/**
 * Trigger handlers for specific events
 */

/**
 * Handle idea submission events
 * Triggers "Idea to MVP" workflow automatically
 */
export async function onIdeaSubmitted(ideaId: string, userId: string, ideaData?: any) {
  console.log(`💡 Idea submitted: ${ideaId} by user ${userId}`)

  const context: TriggerContext = {
    eventType: 'idea_submitted',
    entityType: 'idea',
    entityId: ideaId,
    userId: userId,
    metadata: {
      ideaTitle: ideaData?.title || 'New Idea',
      ideaDescription: ideaData?.description,
      complexity: ideaData?.complexity || 'medium',
      priority: ideaData?.priority || 'medium'
    }
  }

  return await triggerWorkflow(context)
}

/**
 * Handle task completion events
 * Can trigger various follow-up workflows
 */
export async function onTaskCompleted(taskId: string, userId: string, taskData?: any) {
  console.log(`✅ Task completed: ${taskId} by user ${userId}`)

  const context: TriggerContext = {
    eventType: 'task_completed',
    entityType: 'task',
    entityId: taskId,
    userId: userId,
    metadata: {
      taskTitle: taskData?.title || 'Task',
      taskType: taskData?.type,
      projectId: taskData?.projectId,
      priority: taskData?.priority || 'medium'
    }
  }

  return await triggerWorkflow(context)
}

/**
 * Handle project creation events
 * Can trigger project setup workflows
 */
export async function onProjectCreated(projectId: string, userId: string, projectData?: any) {
  console.log(`🚀 Project created: ${projectId} by user ${userId}`)

  const context: TriggerContext = {
    eventType: 'project_created',
    entityType: 'project',
    entityId: projectId,
    userId: userId,
    metadata: {
      projectName: projectData?.name || 'New Project',
      projectType: projectData?.type,
      priority: projectData?.priority || 'medium'
    }
  }

  return await triggerWorkflow(context)
}

/**
 * Handle bug report submissions
 * Triggers "Bug Fix" workflow automatically
 */
export async function onBugReported(bugId: string, userId: string, bugData?: any) {
  console.log(`🐛 Bug reported: ${bugId} by user ${userId}`)

  const context: TriggerContext = {
    eventType: 'bug_reported',
    entityType: 'bug',
    entityId: bugId,
    userId: userId,
    metadata: {
      bugTitle: bugData?.title || 'Bug Report',
      severity: bugData?.severity || 'medium',
      component: bugData?.component,
      priority: bugData?.severity === 'critical' ? 'high' : 'medium'
    }
  }

  return await triggerWorkflow(context)
}

/**
 * Handle deployment requests
 * Triggers "Deploy Pipeline" workflow
 */
export async function onDeploymentRequested(deploymentId: string, userId: string, deploymentData?: any) {
  console.log(`🚀 Deployment requested: ${deploymentId} by user ${userId}`)

  const context: TriggerContext = {
    eventType: 'deployment_requested',
    entityType: 'deployment',
    entityId: deploymentId,
    userId: userId,
    metadata: {
      environment: deploymentData?.environment || 'production',
      projectId: deploymentData?.projectId,
      version: deploymentData?.version,
      priority: deploymentData?.environment === 'production' ? 'high' : 'medium'
    }
  }

  return await triggerWorkflow(context)
}

/**
 * Schedule nightly maintenance workflow
 * Called by cron job or scheduler
 */
export async function triggerNightlyMaintenance() {
  console.log(`🌙 Starting nightly maintenance workflow`)

  const context: TriggerContext = {
    eventType: 'scheduled_maintenance',
    entityType: 'system',
    entityId: 'nightly-maintenance',
    userId: 'system',
    metadata: {
      scheduledAt: new Date().toISOString(),
      maintenanceType: 'nightly',
      priority: 'low'
    }
  }

  return await triggerWorkflow(context)
}

/**
 * Utility function to check if a workflow can be auto-triggered
 */
export async function canTriggerWorkflow(workflowId: string, eventType: string): Promise<boolean> {
  try {
    if (!supabaseAdmin) return false

    const { data: workflow, error } = await supabaseAdmin
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .eq('is_active', true)
      .single()

    if (error || !workflow) {
      return false
    }

    const triggerEvents = workflow.trigger_events || []
    return triggerEvents.includes(eventType)

  } catch (error) {
    console.error('Error checking workflow trigger capability:', error)
    return false
  }
}

/**
 * Get all configured triggers for debugging
 */
export async function getActiveTriggers(): Promise<any[]> {
  try {
    if (!supabaseAdmin) return []

    const { data: workflows, error } = await supabaseAdmin
      .from('workflows')
      .select('id, name, trigger_type, trigger_events, config')
      .eq('is_active', true)
      .eq('trigger_type', 'auto')

    if (error) {
      console.error('Error fetching active triggers:', error)
      return []
    }

    return workflows || []

  } catch (error) {
    console.error('Error getting active triggers:', error)
    return []
  }
}