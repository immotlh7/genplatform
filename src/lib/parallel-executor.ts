import { supabase } from './supabase'
import { WorkflowMetricsCollector } from './workflow-metrics'

export interface ParallelExecutionConfig {
  max_concurrent_steps: number
  resource_allocation: {
    cpu_limit: number
    memory_limit: number
    concurrent_api_calls: number
  }
  synchronization_points: {
    step_id: string
    wait_for: string[]
    timeout_minutes: number
  }[]
  error_handling: {
    fail_fast: boolean
    retry_failed_dependencies: boolean
    continue_on_non_critical_failure: boolean
  }
  execution_strategy: 'greedy' | 'balanced' | 'conservative'
}

export interface ExecutionNode {
  step_id: string
  step_name: string
  step_type: string
  step_config: any
  dependencies: string[]
  dependents: string[]
  priority: number
  estimated_duration: number
  resource_requirements: {
    cpu_weight: number
    memory_weight: number
    api_calls: number
  }
  status: 'pending' | 'ready' | 'running' | 'completed' | 'failed' | 'skipped'
  start_time?: number
  end_time?: number
  error?: any
  results?: any
}

export interface ExecutionPool {
  pool_id: string
  workflow_id: string
  run_id: string
  nodes: Map<string, ExecutionNode>
  running_steps: Map<string, Promise<any>>
  completed_steps: Set<string>
  failed_steps: Set<string>
  resource_usage: {
    active_cpu_weight: number
    active_memory_weight: number
    active_api_calls: number
  }
  config: ParallelExecutionConfig
  metrics_collector: WorkflowMetricsCollector
}

export interface SynchronizationPoint {
  id: string
  step_id: string
  required_steps: string[]
  completed_steps: Set<string>
  timeout: number
  created_at: number
  status: 'waiting' | 'satisfied' | 'timeout'
}

export class ParallelWorkflowExecutor {
  private executionPools = new Map<string, ExecutionPool>()
  private synchronizationPoints = new Map<string, SynchronizationPoint>()

  /**
   * Start parallel execution of a workflow
   */
  async startParallelExecution(
    workflowId: string,
    runId: string,
    steps: any[],
    config: ParallelExecutionConfig,
    metricsCollector: WorkflowMetricsCollector
  ): Promise<{ success: boolean; results?: any; error?: string }> {
    const poolId = `${runId}-${Date.now()}`
    
    try {
      // Create execution pool
      const pool = this.createExecutionPool(poolId, workflowId, runId, steps, config, metricsCollector)
      this.executionPools.set(poolId, pool)

      console.log(`🔄 Starting parallel execution for workflow ${workflowId} with ${steps.length} steps`)

      // Build dependency graph
      this.buildDependencyGraph(pool)

      // Setup synchronization points
      this.setupSynchronizationPoints(pool)

      // Start execution
      const result = await this.executeWorkflow(pool)

      // Cleanup
      this.executionPools.delete(poolId)
      this.cleanupSynchronizationPoints(poolId)

      return result
    } catch (error) {
      console.error(`Failed to execute workflow ${workflowId} in parallel:`, error)
      this.executionPools.delete(poolId)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Create execution pool with nodes
   */
  private createExecutionPool(
    poolId: string,
    workflowId: string,
    runId: string,
    steps: any[],
    config: ParallelExecutionConfig,
    metricsCollector: WorkflowMetricsCollector
  ): ExecutionPool {
    const nodes = new Map<string, ExecutionNode>()

    steps.forEach(step => {
      const node: ExecutionNode = {
        step_id: step.id,
        step_name: step.name,
        step_type: step.type,
        step_config: step.config || {},
        dependencies: step.dependencies || [],
        dependents: [],
        priority: step.priority || 0,
        estimated_duration: step.estimated_duration || 60, // Default 1 minute
        resource_requirements: {
          cpu_weight: step.resource_requirements?.cpu_weight || 1,
          memory_weight: step.resource_requirements?.memory_weight || 1,
          api_calls: step.resource_requirements?.api_calls || 0
        },
        status: 'pending'
      }
      nodes.set(step.id, node)
    })

    return {
      pool_id: poolId,
      workflow_id: workflowId,
      run_id: runId,
      nodes,
      running_steps: new Map(),
      completed_steps: new Set(),
      failed_steps: new Set(),
      resource_usage: {
        active_cpu_weight: 0,
        active_memory_weight: 0,
        active_api_calls: 0
      },
      config,
      metrics_collector: metricsCollector
    }
  }

  /**
   * Build dependency graph and calculate dependents
   */
  private buildDependencyGraph(pool: ExecutionPool): void {
    // Calculate dependents for each node
    for (const [stepId, node] of pool.nodes) {
      for (const depId of node.dependencies) {
        const depNode = pool.nodes.get(depId)
        if (depNode) {
          depNode.dependents.push(stepId)
        }
      }
    }

    // Mark nodes with no dependencies as ready
    for (const [stepId, node] of pool.nodes) {
      if (node.dependencies.length === 0) {
        node.status = 'ready'
      }
    }
  }

  /**
   * Setup synchronization points
   */
  private setupSynchronizationPoints(pool: ExecutionPool): void {
    for (const syncConfig of pool.config.synchronization_points) {
      const syncPoint: SynchronizationPoint = {
        id: `${pool.pool_id}-${syncConfig.step_id}`,
        step_id: syncConfig.step_id,
        required_steps: [...syncConfig.wait_for],
        completed_steps: new Set(),
        timeout: syncConfig.timeout_minutes * 60 * 1000,
        created_at: Date.now(),
        status: 'waiting'
      }
      this.synchronizationPoints.set(syncPoint.id, syncPoint)
    }
  }

  /**
   * Execute workflow with parallel processing
   */
  private async executeWorkflow(pool: ExecutionPool): Promise<{ success: boolean; results?: any; error?: string }> {
    const allResults = new Map<string, any>()
    let totalSteps = pool.nodes.size
    let hasError = false
    let lastError: any = null

    while (pool.completed_steps.size + pool.failed_steps.size < totalSteps) {
      // Find ready steps that can be executed
      const readySteps = this.findReadySteps(pool)

      if (readySteps.length === 0) {
        // Check if we're waiting for synchronization points
        const waitingForSync = await this.checkSynchronizationPoints(pool)
        
        if (!waitingForSync && pool.running_steps.size === 0) {
          // No steps running and none ready - possible deadlock
          break
        }

        // Wait for some running steps to complete
        await this.waitForStepCompletion(pool)
        continue
      }

      // Select steps to execute based on strategy
      const stepsToExecute = this.selectStepsToExecute(readySteps, pool)

      // Execute selected steps
      for (const step of stepsToExecute) {
        const promise = this.executeStep(step, pool)
        pool.running_steps.set(step.step_id, promise)
        
        // Track resource allocation
        this.allocateResources(step, pool)

        console.log(`🚀 Started step ${step.step_name} (${step.step_id})`)
      }

      // Wait for at least one step to complete
      await this.waitForStepCompletion(pool)
    }

    // Wait for all remaining steps to complete
    if (pool.running_steps.size > 0) {
      await Promise.allSettled(Array.from(pool.running_steps.values()))
    }

    // Collect all results
    for (const [stepId, node] of pool.nodes) {
      if (node.results) {
        allResults.set(stepId, node.results)
      }
      if (node.status === 'failed') {
        hasError = true
        lastError = node.error
      }
    }

    const successCount = pool.completed_steps.size
    const failureCount = pool.failed_steps.size

    console.log(`✅ Parallel execution completed: ${successCount} succeeded, ${failureCount} failed`)

    return {
      success: !hasError || !pool.config.error_handling.fail_fast,
      results: Object.fromEntries(allResults),
      error: hasError ? (lastError?.message || 'Some steps failed') : undefined
    }
  }

  /**
   * Find steps that are ready to execute
   */
  private findReadySteps(pool: ExecutionPool): ExecutionNode[] {
    const readySteps: ExecutionNode[] = []

    for (const [stepId, node] of pool.nodes) {
      if (node.status === 'ready') {
        // Check if all dependencies are completed
        const allDepsCompleted = node.dependencies.every(depId => 
          pool.completed_steps.has(depId)
        )

        if (allDepsCompleted) {
          // Check synchronization points
          const syncPoint = this.synchronizationPoints.get(`${pool.pool_id}-${stepId}`)
          if (syncPoint && syncPoint.status !== 'satisfied') {
            continue // Wait for synchronization
          }

          readySteps.push(node)
        }
      }
    }

    return readySteps.sort((a, b) => b.priority - a.priority) // Higher priority first
  }

  /**
   * Select which steps to execute based on resource availability and strategy
   */
  private selectStepsToExecute(readySteps: ExecutionNode[], pool: ExecutionPool): ExecutionNode[] {
    const { config } = pool
    const selected: ExecutionNode[] = []

    for (const step of readySteps) {
      // Check concurrent step limit
      if (pool.running_steps.size >= config.max_concurrent_steps) {
        break
      }

      // Check resource constraints
      const wouldExceedLimits = this.wouldExceedResourceLimits(step, pool)
      if (wouldExceedLimits) {
        continue
      }

      selected.push(step)

      // Apply execution strategy
      if (config.execution_strategy === 'conservative' && selected.length >= 2) {
        break
      }
    }

    return selected
  }

  /**
   * Check if executing a step would exceed resource limits
   */
  private wouldExceedResourceLimits(step: ExecutionNode, pool: ExecutionPool): boolean {
    const { resource_allocation } = pool.config
    const { resource_usage } = pool

    const newCpuWeight = resource_usage.active_cpu_weight + step.resource_requirements.cpu_weight
    const newMemoryWeight = resource_usage.active_memory_weight + step.resource_requirements.memory_weight
    const newApiCalls = resource_usage.active_api_calls + step.resource_requirements.api_calls

    return newCpuWeight > resource_allocation.cpu_limit ||
           newMemoryWeight > resource_allocation.memory_limit ||
           newApiCalls > resource_allocation.concurrent_api_calls
  }

  /**
   * Allocate resources for a step
   */
  private allocateResources(step: ExecutionNode, pool: ExecutionPool): void {
    pool.resource_usage.active_cpu_weight += step.resource_requirements.cpu_weight
    pool.resource_usage.active_memory_weight += step.resource_requirements.memory_weight
    pool.resource_usage.active_api_calls += step.resource_requirements.api_calls
  }

  /**
   * Release resources for a step
   */
  private releaseResources(step: ExecutionNode, pool: ExecutionPool): void {
    pool.resource_usage.active_cpu_weight -= step.resource_requirements.cpu_weight
    pool.resource_usage.active_memory_weight -= step.resource_requirements.memory_weight
    pool.resource_usage.active_api_calls -= step.resource_requirements.api_calls
  }

  /**
   * Execute a single step
   */
  private async executeStep(step: ExecutionNode, pool: ExecutionPool): Promise<any> {
    step.status = 'running'
    step.start_time = Date.now()

    // Record step start in metrics
    pool.metrics_collector.recordStepStart(step.step_id, step.step_name)

    try {
      // Execute the actual step logic
      const result = await this.executeStepLogic(step, pool)

      step.status = 'completed'
      step.end_time = Date.now()
      step.results = result

      // Update pool state
      pool.completed_steps.add(step.step_id)
      pool.running_steps.delete(step.step_id)
      this.releaseResources(step, pool)

      // Record step completion
      await pool.metrics_collector.recordStepCompletion(step.step_id, step.step_name, true)

      // Update dependent steps
      this.updateDependentSteps(step, pool)

      // Update synchronization points
      this.updateSynchronizationPoints(step.step_id, pool)

      console.log(`✅ Completed step ${step.step_name} in ${step.end_time! - step.start_time!}ms`)

      return result
    } catch (error) {
      step.status = 'failed'
      step.end_time = Date.now()
      step.error = error

      // Update pool state
      pool.failed_steps.add(step.step_id)
      pool.running_steps.delete(step.step_id)
      this.releaseResources(step, pool)

      // Record step failure
      await pool.metrics_collector.recordStepCompletion(step.step_id, step.step_name, false, error)

      console.error(`❌ Failed step ${step.step_name}:`, error)

      // Handle error based on configuration
      if (pool.config.error_handling.fail_fast) {
        throw error
      }

      // Mark dependent steps based on error handling
      this.handleStepFailure(step, pool)

      return null
    }
  }

  /**
   * Execute the actual step logic (placeholder - would be implemented based on step type)
   */
  private async executeStepLogic(step: ExecutionNode, pool: ExecutionPool): Promise<any> {
    // Simulate step execution time
    const executionTime = step.estimated_duration * 1000 + (Math.random() * 2000)
    
    // Simulate potential failure
    if (Math.random() < 0.05) { // 5% failure rate
      throw new Error(`Simulated failure in step ${step.step_name}`)
    }

    await new Promise(resolve => setTimeout(resolve, executionTime))

    return {
      step_id: step.step_id,
      step_name: step.step_name,
      execution_time: executionTime,
      timestamp: new Date().toISOString(),
      result: `Result from ${step.step_name}`
    }
  }

  /**
   * Update dependent steps when a step completes
   */
  private updateDependentSteps(step: ExecutionNode, pool: ExecutionPool): void {
    for (const dependentId of step.dependents) {
      const dependentNode = pool.nodes.get(dependentId)
      if (dependentNode && dependentNode.status === 'pending') {
        // Check if all dependencies are now completed
        const allDepsCompleted = dependentNode.dependencies.every(depId =>
          pool.completed_steps.has(depId)
        )

        if (allDepsCompleted) {
          dependentNode.status = 'ready'
        }
      }
    }
  }

  /**
   * Handle step failure and update dependent steps
   */
  private handleStepFailure(step: ExecutionNode, pool: ExecutionPool): void {
    if (pool.config.error_handling.continue_on_non_critical_failure) {
      // Mark as completed for dependency purposes if non-critical
      if (!step.step_config.critical) {
        pool.completed_steps.add(step.step_id)
        this.updateDependentSteps(step, pool)
      }
    }

    // Skip dependent steps if failure is critical
    if (step.step_config.critical || !pool.config.error_handling.continue_on_non_critical_failure) {
      this.markDependentsAsSkipped(step, pool)
    }
  }

  /**
   * Mark all dependent steps as skipped
   */
  private markDependentsAsSkipped(step: ExecutionNode, pool: ExecutionPool): void {
    for (const dependentId of step.dependents) {
      const dependentNode = pool.nodes.get(dependentId)
      if (dependentNode && dependentNode.status !== 'completed') {
        dependentNode.status = 'skipped'
        pool.failed_steps.add(dependentId)
        this.markDependentsAsSkipped(dependentNode, pool)
      }
    }
  }

  /**
   * Check and update synchronization points
   */
  private updateSynchronizationPoints(completedStepId: string, pool: ExecutionPool): void {
    for (const [syncId, syncPoint] of this.synchronizationPoints) {
      if (syncPoint.status === 'waiting' && syncPoint.required_steps.includes(completedStepId)) {
        syncPoint.completed_steps.add(completedStepId)

        // Check if all required steps are completed
        if (syncPoint.required_steps.every(stepId => syncPoint.completed_steps.has(stepId))) {
          syncPoint.status = 'satisfied'
          console.log(`🔄 Synchronization point ${syncPoint.step_id} satisfied`)
        }
      }
    }
  }

  /**
   * Check synchronization points for timeouts
   */
  private async checkSynchronizationPoints(pool: ExecutionPool): Promise<boolean> {
    let waitingForSync = false
    const now = Date.now()

    for (const [syncId, syncPoint] of this.synchronizationPoints) {
      if (syncPoint.status === 'waiting') {
        // Check for timeout
        if (now - syncPoint.created_at > syncPoint.timeout) {
          syncPoint.status = 'timeout'
          console.warn(`⏰ Synchronization point ${syncPoint.step_id} timed out`)
          
          // Mark the step as ready anyway if timeout handling allows it
          const node = pool.nodes.get(syncPoint.step_id)
          if (node && node.status === 'pending') {
            node.status = 'ready'
          }
        } else {
          waitingForSync = true
        }
      }
    }

    return waitingForSync
  }

  /**
   * Wait for at least one step to complete
   */
  private async waitForStepCompletion(pool: ExecutionPool): Promise<void> {
    if (pool.running_steps.size === 0) return

    try {
      await Promise.race(Array.from(pool.running_steps.values()))
    } catch (error) {
      // Expected - some steps may fail
    }
  }

  /**
   * Cleanup synchronization points for a pool
   */
  private cleanupSynchronizationPoints(poolId: string): void {
    for (const [syncId, syncPoint] of this.synchronizationPoints) {
      if (syncId.startsWith(poolId)) {
        this.synchronizationPoints.delete(syncId)
      }
    }
  }

  /**
   * Get execution status for a workflow
   */
  getExecutionStatus(runId: string): { pool?: ExecutionPool; status: string } {
    for (const [poolId, pool] of this.executionPools) {
      if (pool.run_id === runId) {
        const totalSteps = pool.nodes.size
        const completed = pool.completed_steps.size
        const failed = pool.failed_steps.size
        const running = pool.running_steps.size

        return {
          pool,
          status: `${completed + failed}/${totalSteps} steps complete (${running} running)`
        }
      }
    }

    return { status: 'not_found' }
  }

  /**
   * Cancel workflow execution
   */
  async cancelExecution(runId: string): Promise<{ success: boolean; error?: string }> {
    try {
      for (const [poolId, pool] of this.executionPools) {
        if (pool.run_id === runId) {
          // Mark all pending/ready steps as skipped
          for (const [stepId, node] of pool.nodes) {
            if (node.status === 'pending' || node.status === 'ready') {
              node.status = 'skipped'
              pool.failed_steps.add(stepId)
            }
          }

          // Running steps will complete naturally, but workflow won't start new ones
          console.log(`🛑 Cancelled execution for workflow run ${runId}`)
          return { success: true }
        }
      }

      return { success: false, error: 'Execution not found' }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

/**
 * Utility functions for parallel execution
 */
export class ParallelExecutionUtils {
  /**
   * Analyze workflow for parallel execution opportunities
   */
  static analyzeWorkflowParallelism(steps: any[]): {
    parallelizable_groups: string[][]
    bottlenecks: string[]
    estimated_improvement: number
    recommendations: string[]
  } {
    // Build dependency graph
    const dependencies = new Map<string, string[]>()
    const dependents = new Map<string, string[]>()

    steps.forEach(step => {
      dependencies.set(step.id, step.dependencies || [])
      
      for (const depId of step.dependencies || []) {
        if (!dependents.has(depId)) {
          dependents.set(depId, [])
        }
        dependents.get(depId)!.push(step.id)
      }
    })

    // Find parallelizable groups (steps at the same level)
    const levels = this.calculateLevels(steps, dependencies)
    const parallelizableGroups = Object.values(
      steps.reduce((groups, step) => {
        const level = levels.get(step.id) || 0
        if (!groups[level]) groups[level] = []
        groups[level].push(step.id)
        return groups
      }, {} as Record<number, string[]>)
    ).filter(group => group.length > 1)

    // Identify bottlenecks (steps with many dependents)
    const bottlenecks = Array.from(dependents.entries())
      .filter(([stepId, deps]) => deps.length > 2)
      .map(([stepId]) => stepId)

    // Estimate improvement
    const totalSequentialTime = steps.reduce((sum, step) => sum + (step.estimated_duration || 60), 0)
    const maxParallelTime = Math.max(...Object.values(levels as any))
    const estimatedImprovement = Math.max(0, 1 - (maxParallelTime / totalSequentialTime))

    // Generate recommendations
    const recommendations: string[] = []
    if (parallelizableGroups.length > 0) {
      recommendations.push(`${parallelizableGroups.length} groups of steps can run in parallel`)
    }
    if (bottlenecks.length > 0) {
      recommendations.push(`${bottlenecks.length} bottleneck steps could be optimized`)
    }
    if (estimatedImprovement > 0.3) {
      recommendations.push(`Potential ${Math.round(estimatedImprovement * 100)}% execution time improvement`)
    }

    return {
      parallelizable_groups: parallelizableGroups,
      bottlenecks,
      estimated_improvement: estimatedImprovement,
      recommendations
    }
  }

  /**
   * Calculate step levels for topological ordering
   */
  private static calculateLevels(steps: any[], dependencies: Map<string, string[]>): Map<string, number> {
    const levels = new Map<string, number>()
    const visited = new Set<string>()

    const calculateLevel = (stepId: string): number => {
      if (visited.has(stepId)) return levels.get(stepId) || 0
      if (levels.has(stepId)) return levels.get(stepId)!

      visited.add(stepId)
      
      const deps = dependencies.get(stepId) || []
      const maxDepLevel = deps.length > 0
        ? Math.max(...deps.map(depId => calculateLevel(depId)))
        : -1

      const level = maxDepLevel + 1
      levels.set(stepId, level)
      
      return level
    }

    steps.forEach(step => calculateLevel(step.id))
    return levels
  }

  /**
   * Generate optimal parallel execution configuration
   */
  static generateOptimalConfig(steps: any[], systemLimits: any = {}): ParallelExecutionConfig {
    const analysis = this.analyzeWorkflowParallelism(steps)
    
    return {
      max_concurrent_steps: Math.min(
        Math.max(...analysis.parallelizable_groups.map(g => g.length)) || 2,
        systemLimits.max_concurrent_steps || 5
      ),
      resource_allocation: {
        cpu_limit: systemLimits.cpu_limit || 8,
        memory_limit: systemLimits.memory_limit || 16,
        concurrent_api_calls: systemLimits.concurrent_api_calls || 10
      },
      synchronization_points: [],
      error_handling: {
        fail_fast: false,
        retry_failed_dependencies: true,
        continue_on_non_critical_failure: true
      },
      execution_strategy: analysis.estimated_improvement > 0.5 ? 'greedy' : 'balanced'
    }
  }
}

// Create singleton instance
export const parallelExecutor = new ParallelWorkflowExecutor()