/**
 * Failure Detection and Auto-Recovery Triggers for GenPlatform.ai
 * Automatically handles failures and triggers recovery workflows
 * Created: 2026-03-18 for Task 7-18
 */

import { supabaseAdmin } from '@/lib/supabase'
import { triggerWorkflow } from '@/lib/workflow-triggers'

interface FailureContext {
  failureType: 'task_failed' | 'deployment_failed' | 'workflow_failed' | 'system_error'
  entityId: string
  entityType: string
  errorMessage?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  userId?: string
  projectId?: string
  metadata?: any
}

interface FailurePattern {
  pattern: RegExp | string
  severity: 'low' | 'medium' | 'high' | 'critical'
  workflowTemplate: string
  autoApprove?: boolean
  conditions?: any
}

/**
 * Pre-defined failure patterns that trigger specific workflows
 */
const FAILURE_PATTERNS: FailurePattern[] = [
  // Build/Compilation failures
  {
    pattern: /compilation error|build failed|syntax error|type error/i,
    severity: 'high',
    workflowTemplate: 'Bug Fix',
    autoApprove: true
  },
  
  // Test failures
  {
    pattern: /test failed|assertion error|unit test|integration test/i,
    severity: 'medium',
    workflowTemplate: 'Bug Fix',
    autoApprove: true
  },
  
  // Runtime/Production errors
  {
    pattern: /runtime error|null reference|undefined|cannot read property/i,
    severity: 'critical',
    workflowTemplate: 'Bug Fix',
    autoApprove: false // Critical issues need approval
  },
  
  // Database/Connection errors
  {
    pattern: /database error|connection timeout|sql error|supabase/i,
    severity: 'high',
    workflowTemplate: 'Bug Fix',
    autoApprove: false
  },
  
  // Security vulnerabilities
  {
    pattern: /security|vulnerability|unauthorized|csrf|xss|injection/i,
    severity: 'critical',
    workflowTemplate: 'Bug Fix',
    autoApprove: false
  },
  
  // Performance issues
  {
    pattern: /performance|slow|timeout|memory leak|high cpu/i,
    severity: 'medium',
    workflowTemplate: 'Bug Fix',
    autoApprove: true
  },
  
  // Deployment failures
  {
    pattern: /deployment failed|deploy error|vercel error|build timeout/i,
    severity: 'high',
    workflowTemplate: 'Deploy Pipeline',
    autoApprove: true
  }
]

/**
 * Main failure detection and trigger handler
 */
export async function handleFailure(context: FailureContext): Promise<string | null> {
  try {
    console.log(`🚨 Handling failure: ${context.failureType} - ${context.entityId}`)

    if (!supabaseAdmin) {
      console.error('Supabase admin client not available')
      return null
    }

    // Log the failure in security events
    await logFailureEvent(context)

    // Analyze the failure and determine appropriate response
    const response = await analyzeFailureAndRespond(context)
    
    if (response) {
      console.log(`🔧 Auto-recovery initiated: ${response.workflowRunId}`)
      return response.workflowRunId
    }

    console.log(`📝 Failure logged but no auto-recovery triggered`)
    return null

  } catch (error) {
    console.error('Error handling failure:', error)
    return null
  }
}

/**
 * Analyze failure and determine appropriate response
 */
async function analyzeFailureAndRespond(context: FailureContext): Promise<{ workflowRunId: string, workflowName: string } | null> {
  try {
    // Find matching failure pattern
    const matchingPattern = findMatchingPattern(context.errorMessage || '', context.severity)
    
    if (!matchingPattern) {
      console.log(`📭 No matching pattern found for failure: ${context.failureType}`)
      return null
    }

    console.log(`🎯 Matched failure pattern: ${matchingPattern.workflowTemplate} workflow`)

    // Get the workflow template
    const workflow = await getWorkflowByTemplate(matchingPattern.workflowTemplate)
    
    if (!workflow) {
      console.error(`Workflow template not found: ${matchingPattern.workflowTemplate}`)
      return null
    }

    // Create enhanced trigger context
    const triggerContext = {
      eventType: 'failure_detected',
      entityType: context.entityType,
      entityId: context.entityId,
      userId: context.userId || 'auto-recovery',
      metadata: {
        ...context.metadata,
        failureType: context.failureType,
        severity: context.severity,
        errorMessage: context.errorMessage,
        matchedPattern: matchingPattern.pattern.toString(),
        autoApprove: matchingPattern.autoApprove,
        recoveryWorkflow: matchingPattern.workflowTemplate,
        projectId: context.projectId
      }
    }

    // Start the recovery workflow
    const runId = await triggerWorkflow(triggerContext)
    
    if (runId) {
      // If auto-approve is enabled and severity allows it, approve immediately
      if (matchingPattern.autoApprove && context.severity !== 'critical') {
        await autoApproveRecoveryWorkflow(runId, context)
      }
      
      return {
        workflowRunId: runId,
        workflowName: workflow.name
      }
    }

    return null

  } catch (error) {
    console.error('Error analyzing failure:', error)
    return null
  }
}

/**
 * Find matching failure pattern
 */
function findMatchingPattern(errorMessage: string, severity: string): FailurePattern | null {
  // First, try to match by error message content
  for (const pattern of FAILURE_PATTERNS) {
    if (pattern.pattern instanceof RegExp) {
      if (pattern.pattern.test(errorMessage)) {
        return pattern
      }
    } else if (typeof pattern.pattern === 'string') {
      if (errorMessage.toLowerCase().includes(pattern.pattern.toLowerCase())) {
        return pattern
      }
    }
  }

  // Fallback: match by severity for generic failures
  const genericPattern = FAILURE_PATTERNS.find(p => p.severity === severity)
  return genericPattern || null
}

/**
 * Get workflow by template name
 */
async function getWorkflowByTemplate(templateName: string) {
  try {
    const { data: workflow, error } = await supabaseAdmin
      .from('workflows')
      .select('*')
      .eq('name', templateName)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error(`Error finding workflow template ${templateName}:`, error)
      return null
    }

    return workflow

  } catch (error) {
    console.error('Error getting workflow by template:', error)
    return null
  }
}

/**
 * Auto-approve recovery workflow if conditions are met
 */
async function autoApproveRecoveryWorkflow(runId: string, context: FailureContext) {
  try {
    console.log(`🤖 Auto-approving recovery workflow: ${runId}`)

    // Wait a moment for the workflow to initialize
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Call the approval API
    const response = await fetch('/api/workflows/approve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        runId: runId,
        approvalNotes: `Auto-approved for ${context.failureType} recovery (severity: ${context.severity})`
      })
    })

    if (response.ok) {
      console.log(`✅ Recovery workflow auto-approved: ${runId}`)
    } else {
      console.error(`Failed to auto-approve recovery workflow: ${response.statusText}`)
    }

  } catch (error) {
    console.error('Error auto-approving recovery workflow:', error)
  }
}

/**
 * Log failure event for tracking and analysis
 */
async function logFailureEvent(context: FailureContext) {
  try {
    await supabaseAdmin
      .from('security_events')
      .insert({
        event_type: 'failure',
        severity: context.severity,
        description: `${context.failureType}: ${context.entityType} ${context.entityId}`,
        details: {
          failure_type: context.failureType,
          entity_type: context.entityType,
          entity_id: context.entityId,
          error_message: context.errorMessage,
          severity: context.severity,
          user_id: context.userId,
          project_id: context.projectId,
          metadata: context.metadata,
          timestamp: new Date().toISOString()
        },
        resolved: false // Will be resolved when recovery workflow completes
      })

    console.log(`📊 Failure event logged: ${context.failureType}`)

  } catch (error) {
    console.error('Error logging failure event:', error)
  }
}

/**
 * Specific failure handlers
 */

/**
 * Handle task failure events
 */
export async function onTaskFailed(taskId: string, error: string, userId?: string, projectId?: string) {
  console.log(`❌ Task failed: ${taskId} - ${error}`)

  const severity = determineSeverityFromError(error)
  
  const context: FailureContext = {
    failureType: 'task_failed',
    entityId: taskId,
    entityType: 'task',
    errorMessage: error,
    severity: severity,
    userId: userId,
    projectId: projectId,
    metadata: {
      taskId: taskId,
      errorTime: new Date().toISOString()
    }
  }

  return await handleFailure(context)
}

/**
 * Handle deployment failure events
 */
export async function onDeploymentFailed(deploymentId: string, error: string, userId?: string, projectId?: string) {
  console.log(`🚨 Deployment failed: ${deploymentId} - ${error}`)

  const context: FailureContext = {
    failureType: 'deployment_failed',
    entityId: deploymentId,
    entityType: 'deployment',
    errorMessage: error,
    severity: 'high', // Deployment failures are always high priority
    userId: userId,
    projectId: projectId,
    metadata: {
      deploymentId: deploymentId,
      errorTime: new Date().toISOString()
    }
  }

  return await handleFailure(context)
}

/**
 * Handle workflow failure events
 */
export async function onWorkflowFailed(workflowRunId: string, error: string, userId?: string) {
  console.log(`⚠️ Workflow failed: ${workflowRunId} - ${error}`)

  const context: FailureContext = {
    failureType: 'workflow_failed',
    entityId: workflowRunId,
    entityType: 'workflow_run',
    errorMessage: error,
    severity: 'medium',
    userId: userId,
    metadata: {
      workflowRunId: workflowRunId,
      errorTime: new Date().toISOString()
    }
  }

  return await handleFailure(context)
}

/**
 * Handle system error events
 */
export async function onSystemError(component: string, error: string, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium') {
  console.log(`🔥 System error in ${component}: ${error}`)

  const context: FailureContext = {
    failureType: 'system_error',
    entityId: `system-${Date.now()}`,
    entityType: 'system',
    errorMessage: error,
    severity: severity,
    userId: 'system',
    metadata: {
      component: component,
      errorTime: new Date().toISOString()
    }
  }

  return await handleFailure(context)
}

/**
 * Determine error severity from error message
 */
function determineSeverityFromError(error: string): 'low' | 'medium' | 'high' | 'critical' {
  const lowerError = error.toLowerCase()
  
  // Critical indicators
  if (lowerError.includes('critical') || lowerError.includes('security') || 
      lowerError.includes('data loss') || lowerError.includes('corruption')) {
    return 'critical'
  }
  
  // High severity indicators  
  if (lowerError.includes('failed') || lowerError.includes('error') ||
      lowerError.includes('exception') || lowerError.includes('crash')) {
    return 'high'
  }
  
  // Medium severity indicators
  if (lowerError.includes('warning') || lowerError.includes('timeout') ||
      lowerError.includes('slow') || lowerError.includes('retry')) {
    return 'medium'
  }
  
  // Default to low
  return 'low'
}

/**
 * Get failure statistics for monitoring
 */
export async function getFailureStats(timeRange: '1h' | '24h' | '7d' = '24h'): Promise<any> {
  try {
    if (!supabaseAdmin) return null

    const now = new Date()
    const startTime = new Date(now.getTime() - getTimeRangeMs(timeRange))

    const { data: events, error } = await supabaseAdmin
      .from('security_events')
      .select('*')
      .eq('event_type', 'failure')
      .gte('created_at', startTime.toISOString())

    if (error) {
      console.error('Error fetching failure stats:', error)
      return null
    }

    // Aggregate statistics
    const stats = {
      total: events?.length || 0,
      bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
      byType: {},
      resolved: 0,
      autoRecovered: 0
    }

    events?.forEach(event => {
      const severity = event.severity || 'medium'
      const failureType = event.details?.failure_type || 'unknown'
      
      stats.bySeverity[severity as keyof typeof stats.bySeverity]++
      stats.byType[failureType] = (stats.byType[failureType] || 0) + 1
      
      if (event.resolved) {
        stats.resolved++
      }
      
      if (event.details?.autoRecovered) {
        stats.autoRecovered++
      }
    })

    return stats

  } catch (error) {
    console.error('Error getting failure stats:', error)
    return null
  }
}

/**
 * Helper function to convert time range to milliseconds
 */
function getTimeRangeMs(timeRange: string): number {
  switch (timeRange) {
    case '1h': return 60 * 60 * 1000
    case '24h': return 24 * 60 * 60 * 1000
    case '7d': return 7 * 24 * 60 * 60 * 1000
    default: return 24 * 60 * 60 * 1000
  }
}