const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

class WorkflowRunner {
  constructor() {
    this.runningWorkflows = new Map() // workflowRunId -> execution state
  }

  async executeWorkflow(workflowId, projectId = null, triggeredBy = 'manual') {
    try {
      console.log(`Starting workflow execution: ${workflowId}`)

      // Fetch workflow template
      const { data: workflow, error: workflowError } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', workflowId)
        .single()

      if (workflowError || !workflow) {
        throw new Error(`Workflow not found: ${workflowId}`)
      }

      if (!workflow.is_active) {
        throw new Error(`Workflow is not active: ${workflow.name}`)
      }

      // Create workflow run record
      const { data: workflowRun, error: runError } = await supabase
        .from('workflow_runs')
        .insert({
          workflow_id: workflowId,
          project_id: projectId,
          status: 'running',
          current_step: workflow.config.steps[0]?.name || 'Starting',
          steps_total: workflow.config.steps.length,
          logs: [{
            timestamp: new Date().toISOString(),
            level: 'info',
            message: `Workflow started by ${triggeredBy}`,
            step: 'initialization'
          }]
        })
        .select()
        .single()

      if (runError) {
        throw new Error(`Failed to create workflow run: ${runError.message}`)
      }

      // Start execution
      this.runningWorkflows.set(workflowRun.id, {
        workflowRun,
        workflow,
        currentStepIndex: 0,
        projectId,
        paused: false
      })

      // Execute steps
      this.executeNextStep(workflowRun.id)

      return workflowRun
    } catch (error) {
      console.error('Failed to start workflow:', error)
      throw error
    }
  }

  async executeNextStep(workflowRunId) {
    try {
      const execution = this.runningWorkflows.get(workflowRunId)
      if (!execution || execution.paused) {
        return
      }

      const { workflow, workflowRun, currentStepIndex, projectId } = execution
      const steps = workflow.config.steps

      if (currentStepIndex >= steps.length) {
        // Workflow completed
        await this.completeWorkflow(workflowRunId, 'completed')
        return
      }

      const currentStep = steps[currentStepIndex]
      console.log(`Executing step ${currentStepIndex + 1}: ${currentStep.name}`)

      // Log step start
      await this.logStep(workflowRunId, 'info', `Starting step: ${currentStep.name}`, currentStep.name)

      // Update current step in database
      await supabase
        .from('workflow_runs')
        .update({
          current_step: currentStep.name,
          steps_completed: currentStepIndex
        })
        .eq('id', workflowRunId)

      // Execute step based on type
      switch (currentStep.type) {
        case 'action':
          await this.executeActionStep(workflowRunId, currentStep, projectId)
          break
        
        case 'approval':
          await this.executeApprovalStep(workflowRunId, currentStep)
          break
        
        case 'loop':
          await this.executeLoopStep(workflowRunId, currentStep, projectId)
          break
        
        default:
          throw new Error(`Unknown step type: ${currentStep.type}`)
      }

    } catch (error) {
      console.error(`Step execution failed for workflow run ${workflowRunId}:`, error)
      await this.completeWorkflow(workflowRunId, 'failed', error.message)
    }
  }

  async executeActionStep(workflowRunId, step, projectId) {
    try {
      // Send command to OpenClaw
      const command = this.formatCommand(step.command, projectId)
      const response = await this.sendToOpenClaw(command, projectId)

      await this.logStep(workflowRunId, 'info', `Action completed: ${step.name}`, step.name)
      
      // Move to next step
      const execution = this.runningWorkflows.get(workflowRunId)
      execution.currentStepIndex++
      
      // Continue with next step after a brief delay
      setTimeout(() => this.executeNextStep(workflowRunId), 1000)

    } catch (error) {
      await this.logStep(workflowRunId, 'error', `Action failed: ${error.message}`, step.name)
      throw error
    }
  }

  async executeApprovalStep(workflowRunId, step) {
    try {
      // Pause workflow and wait for approval
      const execution = this.runningWorkflows.get(workflowRunId)
      execution.paused = true

      // Update status to waiting_approval
      await supabase
        .from('workflow_runs')
        .update({ status: 'waiting_approval' })
        .eq('id', workflowRunId)

      await this.logStep(workflowRunId, 'info', `Waiting for approval: ${step.approval_message}`, step.name)

      // Send notification to owner (implement notification system)
      await this.notifyOwner(workflowRunId, step.approval_message)

    } catch (error) {
      await this.logStep(workflowRunId, 'error', `Approval step failed: ${error.message}`, step.name)
      throw error
    }
  }

  async executeLoopStep(workflowRunId, step, projectId) {
    try {
      // For now, treat loop as a single action that processes all tasks
      // In a real implementation, this would iterate over tasks
      const command = this.formatCommand(step.command, projectId)
      await this.sendToOpenClaw(command, projectId)

      await this.logStep(workflowRunId, 'info', `Loop completed: ${step.name}`, step.name)
      
      // Move to next step
      const execution = this.runningWorkflows.get(workflowRunId)
      execution.currentStepIndex++
      
      setTimeout(() => this.executeNextStep(workflowRunId), 2000)

    } catch (error) {
      await this.logStep(workflowRunId, 'error', `Loop failed: ${error.message}`, step.name)
      throw error
    }
  }

  async approveWorkflow(workflowRunId) {
    try {
      const execution = this.runningWorkflows.get(workflowRunId)
      if (!execution) {
        throw new Error('Workflow run not found')
      }

      // Resume workflow
      execution.paused = false
      execution.currentStepIndex++ // Move past approval step

      // Update status back to running
      await supabase
        .from('workflow_runs')
        .update({ status: 'running' })
        .eq('id', workflowRunId)

      await this.logStep(workflowRunId, 'info', 'Workflow approved, continuing execution', 'approval')

      // Continue execution
      this.executeNextStep(workflowRunId)

      return { success: true }
    } catch (error) {
      console.error('Failed to approve workflow:', error)
      throw error
    }
  }

  async rejectWorkflow(workflowRunId, reason = 'No reason provided') {
    try {
      await this.logStep(workflowRunId, 'info', `Workflow rejected: ${reason}`, 'approval')
      await this.completeWorkflow(workflowRunId, 'failed', `Rejected: ${reason}`)
      
      return { success: true }
    } catch (error) {
      console.error('Failed to reject workflow:', error)
      throw error
    }
  }

  async completeWorkflow(workflowRunId, status, errorMessage = null) {
    try {
      const execution = this.runningWorkflows.get(workflowRunId)
      if (!execution) return

      // Update workflow run in database
      const updateData = {
        status,
        completed_at: new Date().toISOString(),
        steps_completed: execution.currentStepIndex
      }

      await supabase
        .from('workflow_runs')
        .update(updateData)
        .eq('id', workflowRunId)

      // Update last run info in workflow
      await supabase
        .from('workflows')
        .update({
          last_run_at: new Date().toISOString(),
          last_run_status: status
        })
        .eq('id', execution.workflow.id)

      // Log completion
      const message = status === 'completed' 
        ? 'Workflow completed successfully' 
        : `Workflow failed: ${errorMessage}`
      
      await this.logStep(workflowRunId, status === 'completed' ? 'info' : 'error', message, 'completion')

      // Clean up
      this.runningWorkflows.delete(workflowRunId)

      console.log(`Workflow ${execution.workflow.name} ${status}`)

    } catch (error) {
      console.error('Failed to complete workflow:', error)
    }
  }

  async logStep(workflowRunId, level, message, stepName) {
    try {
      // Fetch current logs
      const { data: currentRun } = await supabase
        .from('workflow_runs')
        .select('logs')
        .eq('id', workflowRunId)
        .single()

      const logs = currentRun?.logs || []
      logs.push({
        timestamp: new Date().toISOString(),
        level,
        message,
        step: stepName
      })

      // Update logs
      await supabase
        .from('workflow_runs')
        .update({ logs })
        .eq('id', workflowRunId)

      console.log(`[${stepName}] ${level.toUpperCase()}: ${message}`)

    } catch (error) {
      console.error('Failed to log step:', error)
    }
  }

  formatCommand(command, projectId) {
    // Replace placeholders in command
    let formattedCommand = command
    
    if (projectId) {
      // In a real implementation, fetch project details
      formattedCommand = formattedCommand.replace('{projectId}', projectId)
      formattedCommand = formattedCommand.replace('{projectName}', `Project ${projectId}`)
    }

    return formattedCommand
  }

  async sendToOpenClaw(command, projectId) {
    try {
      // Mock implementation - in real system, this would use Telegram Bot API
      console.log(`Sending to OpenClaw: ${command}`)
      
      // Simulate OpenClaw processing time
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock response
      return {
        success: true,
        response: `Command executed: ${command}`
      }
    } catch (error) {
      console.error('Failed to send to OpenClaw:', error)
      throw error
    }
  }

  async notifyOwner(workflowRunId, message) {
    try {
      // Mock notification implementation
      console.log(`Notification: ${message}`)
      
      // In real implementation, this would:
      // 1. Send browser notification
      // 2. Update bell icon badge
      // 3. Maybe send email/SMS
      
      return { success: true }
    } catch (error) {
      console.error('Failed to notify owner:', error)
    }
  }

  // Get status of all running workflows
  getRunningWorkflows() {
    return Array.from(this.runningWorkflows.entries()).map(([runId, execution]) => ({
      runId,
      workflowName: execution.workflow.name,
      currentStep: execution.workflow.config.steps[execution.currentStepIndex]?.name || 'Unknown',
      stepProgress: `${execution.currentStepIndex}/${execution.workflow.config.steps.length}`,
      paused: execution.paused,
      projectId: execution.projectId
    }))
  }

  // Check if workflow is currently running for a project
  isWorkflowRunningForProject(projectId, templateType) {
    for (const execution of this.runningWorkflows.values()) {
      if (execution.projectId === projectId && execution.workflow.template_type === templateType) {
        return true
      }
    }
    return false
  }
}

// Singleton instance
const workflowRunner = new WorkflowRunner()

module.exports = workflowRunner