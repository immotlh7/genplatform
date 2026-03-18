#!/usr/bin/env node

/**
 * Workflow Execution Engine for GenPlatform.ai
 * Handles step-by-step workflow execution with approval gates and error handling
 * Created: 2026-03-18 for Task 7-10
 */

import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'

// Environment configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const OPENCLAW_API_URL = process.env.OPENCLAW_API_URL || 'http://localhost:8080'

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

/**
 * Main Workflow Runner Class
 */
class WorkflowRunner {
  constructor(runId) {
    this.runId = runId
    this.workflowRun = null
    this.workflow = null
    this.steps = []
    this.currentStepIndex = 0
  }

  /**
   * Initialize and start workflow execution
   */
  async start() {
    try {
      console.log(`🚀 Starting workflow run: ${this.runId}`)
      
      // Load workflow run and template
      await this.loadWorkflowData()
      
      // Validate workflow
      if (!this.workflow || !this.steps.length) {
        throw new Error('Invalid workflow configuration')
      }

      // Update run status to running
      await this.updateRunStatus('running')
      
      // Start executing steps
      await this.executeNextStep()
      
    } catch (error) {
      console.error(`❌ Workflow ${this.runId} failed to start:`, error)
      await this.handleFailure(error.message)
    }
  }

  /**
   * Load workflow run data and template from Supabase
   */
  async loadWorkflowData() {
    // Get workflow run
    const { data: runData, error: runError } = await supabase
      .from('workflow_runs')
      .select('*')
      .eq('id', this.runId)
      .single()

    if (runError || !runData) {
      throw new Error(`Failed to load workflow run: ${runError?.message}`)
    }

    this.workflowRun = runData
    console.log(`📋 Loaded workflow run: ${runData.workflow_id}`)

    // Get workflow template
    const { data: workflowData, error: workflowError } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', runData.workflow_id)
      .single()

    if (workflowError || !workflowData) {
      throw new Error(`Failed to load workflow template: ${workflowError?.message}`)
    }

    this.workflow = workflowData
    this.steps = workflowData.config?.steps || []
    this.currentStepIndex = runData.steps_completed || 0

    console.log(`📝 Loaded ${this.steps.length} workflow steps`)
  }

  /**
   * Execute the next step in the workflow
   */
  async executeNextStep() {
    if (this.currentStepIndex >= this.steps.length) {
      console.log(`✅ Workflow ${this.runId} completed successfully`)
      await this.handleCompletion()
      return
    }

    const step = this.steps[this.currentStepIndex]
    console.log(`🔄 Executing step ${this.currentStepIndex + 1}/${this.steps.length}: ${step.name}`)

    try {
      // Update current step in database
      await this.updateCurrentStep(step.id, step.name)

      // Execute step based on type
      switch (step.type) {
        case 'action':
          await this.executeActionStep(step)
          break
        case 'approval':
          await this.executeApprovalStep(step)
          return // Stop execution until approval
        case 'loop':
          await this.executeLoopStep(step)
          break
        case 'notification':
          await this.executeNotificationStep(step)
          break
        default:
          throw new Error(`Unknown step type: ${step.type}`)
      }

      // Step completed successfully
      await this.stepCompleted(step)
      
      // Move to next step
      this.currentStepIndex++
      
      // Continue with next step after a brief delay
      setTimeout(() => this.executeNextStep(), 1000)

    } catch (error) {
      console.error(`❌ Step ${step.name} failed:`, error)
      await this.handleStepFailure(step, error.message)
    }
  }

  /**
   * Execute an action step (sends command to OpenClaw)
   */
  async executeActionStep(step) {
    const startTime = Date.now()
    
    console.log(`⚡ Executing action: ${step.description}`)
    
    // Prepare command payload
    const payload = {
      role: step.role,
      command: step.command,
      context: {
        workflowId: this.workflow.id,
        runId: this.runId,
        projectId: this.workflowRun.project_id,
        step: step.name
      },
      timeout: 300000 // 5 minute timeout
    }

    // Send command to OpenClaw
    const response = await fetch(`${OPENCLAW_API_URL}/api/command`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENCLAW_API_KEY || 'workflow-runner'}`
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`OpenClaw command failed: ${response.statusText}`)
    }

    const result = await response.json()
    const duration = Date.now() - startTime

    // Log step result
    await this.logStepResult(step, {
      type: 'action',
      status: 'completed',
      duration: Math.round(duration / 1000),
      result: result,
      outputs: step.outputs || []
    })

    console.log(`✅ Action completed in ${Math.round(duration / 1000)}s`)
  }

  /**
   * Execute an approval step (pauses workflow for human approval)
   */
  async executeApprovalStep(step) {
    console.log(`⏸️ Approval required: ${step.description}`)
    
    // Update run status to waiting for approval
    await this.updateRunStatus('waiting_approval')
    
    // Log approval request
    await this.logStepResult(step, {
      type: 'approval',
      status: 'waiting',
      approval_message: step.approval_message,
      required_role: step.required_role,
      requested_at: new Date().toISOString()
    })

    // Send notification about approval needed
    await this.sendApprovalNotification(step)
    
    console.log(`📬 Approval notification sent for step: ${step.name}`)
  }

  /**
   * Execute a loop step (iterates over project tasks)
   */
  async executeLoopStep(step) {
    console.log(`🔄 Executing loop: ${step.description}`)
    
    // For now, simulate loop execution
    // In a full implementation, this would iterate over actual tasks
    const iterations = 3 // Example: 3 tasks to process
    
    for (let i = 0; i < iterations; i++) {
      console.log(`  Loop iteration ${i + 1}/${iterations}`)
      
      for (const loopStep of step.loop_steps) {
        await this.executeActionStep({
          ...loopStep,
          name: `${step.name} - ${loopStep.name} (${i + 1}/${iterations})`
        })
        
        // Brief delay between loop steps
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    await this.logStepResult(step, {
      type: 'loop',
      status: 'completed',
      iterations: iterations,
      total_sub_steps: iterations * step.loop_steps.length
    })
  }

  /**
   * Execute a notification step
   */
  async executeNotificationStep(step) {
    console.log(`🔔 Sending notification: ${step.description}`)
    
    const notification = {
      message: step.message,
      channels: step.notification_channels || ['dashboard'],
      include_outputs: step.include_outputs || [],
      workflow_id: this.workflow.id,
      run_id: this.runId
    }

    // Send to notification system (implement actual notification logic)
    await this.sendNotification(notification)

    await this.logStepResult(step, {
      type: 'notification',
      status: 'sent',
      channels: notification.channels,
      message: notification.message
    })
  }

  /**
   * Handle step completion
   */
  async stepCompleted(step) {
    const stepsCompleted = this.currentStepIndex + 1
    
    await supabase
      .from('workflow_runs')
      .update({
        steps_completed: stepsCompleted,
        current_step: stepsCompleted < this.steps.length ? this.steps[stepsCompleted].name : null
      })
      .eq('id', this.runId)

    console.log(`✅ Step completed: ${step.name} (${stepsCompleted}/${this.steps.length})`)
  }

  /**
   * Handle workflow completion
   */
  async handleCompletion() {
    await this.updateRunStatus('completed')
    
    // Log completion
    await this.logStepResult(null, {
      type: 'workflow_complete',
      status: 'completed',
      total_steps: this.steps.length,
      completion_time: new Date().toISOString()
    })

    // Send completion notification
    await this.sendNotification({
      message: `🎉 Workflow "${this.workflow.name}" completed successfully!`,
      channels: ['dashboard', 'email'],
      workflow_id: this.workflow.id,
      run_id: this.runId
    })

    console.log(`🎉 Workflow ${this.runId} completed successfully!`)
  }

  /**
   * Handle workflow failure
   */
  async handleFailure(errorMessage) {
    await this.updateRunStatus('failed')
    
    await supabase
      .from('workflow_runs')
      .update({
        error_message: errorMessage
      })
      .eq('id', this.runId)

    // Send failure notification
    await this.sendNotification({
      message: `❌ Workflow "${this.workflow.name}" failed: ${errorMessage}`,
      channels: ['dashboard', 'email'],
      workflow_id: this.workflow.id,
      run_id: this.runId
    })

    console.log(`❌ Workflow ${this.runId} failed: ${errorMessage}`)
  }

  /**
   * Handle step failure
   */
  async handleStepFailure(step, errorMessage) {
    await this.logStepResult(step, {
      type: 'error',
      status: 'failed',
      error: errorMessage,
      failed_at: new Date().toISOString()
    })

    const maxRetries = this.workflow.config?.failure_handling?.max_retries || 0
    
    if (maxRetries > 0) {
      console.log(`🔄 Retrying step ${step.name} (max ${maxRetries} retries)`)
      // Implement retry logic here
    } else {
      await this.handleFailure(`Step "${step.name}" failed: ${errorMessage}`)
    }
  }

  /**
   * Update workflow run status
   */
  async updateRunStatus(status) {
    await supabase
      .from('workflow_runs')
      .update({ status })
      .eq('id', this.runId)
  }

  /**
   * Update current step being executed
   */
  async updateCurrentStep(stepId, stepName) {
    await supabase
      .from('workflow_runs')
      .update({ current_step: stepName })
      .eq('id', this.runId)
  }

  /**
   * Log step result to workflow run
   */
  async logStepResult(step, result) {
    // Get current logs
    const { data: runData } = await supabase
      .from('workflow_runs')
      .select('logs')
      .eq('id', this.runId)
      .single()

    const logs = runData?.logs || []
    
    // Add new log entry
    logs.push({
      step_id: step?.id,
      step_name: step?.name,
      timestamp: new Date().toISOString(),
      ...result
    })

    // Update logs in database
    await supabase
      .from('workflow_runs')
      .update({ logs })
      .eq('id', this.runId)
  }

  /**
   * Send approval notification
   */
  async sendApprovalNotification(step) {
    const notification = {
      message: `⏸️ Workflow "${this.workflow.name}" needs your approval at Step "${step.name}"`,
      type: 'approval_required',
      workflow_id: this.workflow.id,
      run_id: this.runId,
      step_id: step.id,
      approval_message: step.approval_message,
      required_role: step.required_role
    }

    await this.sendNotification(notification)
  }

  /**
   * Send notification (placeholder implementation)
   */
  async sendNotification(notification) {
    // In a full implementation, this would integrate with notification services
    console.log(`📬 Notification: ${notification.message}`)
    
    // Store notification in database for dashboard display
    try {
      await supabase
        .from('notifications')
        .insert({
          type: notification.type || 'workflow',
          message: notification.message,
          data: notification,
          created_at: new Date().toISOString()
        })
    } catch (error) {
      console.warn('Failed to store notification:', error.message)
    }
  }
}

/**
 * Resume workflow execution after approval
 */
export async function resumeWorkflow(runId) {
  console.log(`▶️ Resuming workflow: ${runId}`)
  
  const runner = new WorkflowRunner(runId)
  await runner.loadWorkflowData()
  
  // Update status from waiting_approval to running
  await runner.updateRunStatus('running')
  
  // Continue from current step
  await runner.executeNextStep()
}

/**
 * Start new workflow execution
 */
export async function startWorkflow(runId) {
  const runner = new WorkflowRunner(runId)
  await runner.start()
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2]
  const runId = process.argv[3]

  if (!runId) {
    console.error('Usage: workflow-runner.js <start|resume> <runId>')
    process.exit(1)
  }

  switch (command) {
    case 'start':
      startWorkflow(runId)
      break
    case 'resume':
      resumeWorkflow(runId)
      break
    default:
      console.error('Invalid command. Use "start" or "resume"')
      process.exit(1)
  }
}