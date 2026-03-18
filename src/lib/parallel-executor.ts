/**
 * Workflow Parallel Execution System
 * Handles concurrent step processing, resource allocation management,
 * synchronization points, and error handling for parallel flows
 */

export interface ParallelExecutionConfig {
  maxConcurrency: number;
  resourceLimits: ResourceLimits;
  synchronization: SynchronizationConfig;
  errorHandling: ErrorHandlingConfig;
  monitoring: MonitoringConfig;
}

export interface ResourceLimits {
  maxMemoryMB: number;
  maxCpuPercent: number;
  maxDiskIOKBps: number;
  maxNetworkKBps: number;
  customLimits: Record<string, number>;
}

export interface SynchronizationConfig {
  barriers: SynchronizationBarrier[];
  locks: ResourceLock[];
  conditions: SynchronizationCondition[];
}

export interface SynchronizationBarrier {
  id: string;
  name: string;
  requiredSteps: string[];
  timeout: number; // milliseconds
  onTimeout: 'fail' | 'continue' | 'retry';
}

export interface ResourceLock {
  id: string;
  resourceId: string;
  lockType: 'shared' | 'exclusive';
  timeout: number;
  priority: number;
}

export interface SynchronizationCondition {
  id: string;
  expression: string;
  checkInterval: number;
  timeout: number;
}

export interface ErrorHandlingConfig {
  strategy: 'fail_fast' | 'continue' | 'retry_failed';
  maxRetries: number;
  retryDelay: number;
  isolateFailed: boolean;
  rollbackOnFailure: boolean;
}

export interface MonitoringConfig {
  collectMetrics: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  alertThresholds: {
    maxExecutionTime: number;
    maxMemoryUsage: number;
    maxErrorRate: number;
  };
}

export interface ParallelStep {
  id: string;
  name: string;
  type: string;
  config: any;
  dependencies: string[];
  resourceRequirements: ResourceRequirement[];
  estimatedDuration: number;
  priority: number;
  retryPolicy?: RetryPolicy;
  condition?: string; // Optional condition for conditional execution
}

export interface ResourceRequirement {
  type: 'memory' | 'cpu' | 'disk' | 'network' | 'custom';
  amount: number;
  unit: string;
  shared: boolean;
}

export interface RetryPolicy {
  maxRetries: number;
  initialDelay: number;
  backoffMultiplier: number;
  maxDelay: number;
}

export interface ExecutionGroup {
  id: string;
  name: string;
  steps: string[];
  executionMode: 'parallel' | 'sequential' | 'pipeline';
  synchronizationPoint?: string;
  resourcePool?: string;
}

export interface ParallelExecutionPlan {
  id: string;
  workflowId: string;
  groups: ExecutionGroup[];
  config: ParallelExecutionConfig;
  estimatedTotalTime: number;
  criticalPath: string[];
  resourceAllocation: ResourceAllocation[];
  createdAt: Date;
}

export interface ResourceAllocation {
  stepId: string;
  resources: AllocatedResource[];
  priority: number;
  startTime?: Date;
  endTime?: Date;
}

export interface AllocatedResource {
  type: string;
  amount: number;
  unit: string;
  poolId?: string;
}

export interface ExecutionResult {
  stepId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'waiting';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  result?: any;
  error?: Error;
  retryCount: number;
  resourceUsage: ResourceUsageStats;
}

export interface ResourceUsageStats {
  peakMemoryMB: number;
  avgCpuPercent: number;
  totalDiskIOKB: number;
  totalNetworkIOKB: number;
  customMetrics: Record<string, number>;
}

export interface ExecutionContext {
  executionId: string;
  workflowId: string;
  plan: ParallelExecutionPlan;
  results: Map<string, ExecutionResult>;
  activeSteps: Set<string>;
  completedSteps: Set<string>;
  failedSteps: Set<string>;
  barriers: Map<string, BarrierState>;
  locks: Map<string, LockState>;
  resourcePools: Map<string, ResourcePool>;
  startTime: Date;
  variables: Map<string, any>;
}

export interface BarrierState {
  id: string;
  requiredSteps: string[];
  arrivedSteps: Set<string>;
  isOpen: boolean;
  openedAt?: Date;
}

export interface LockState {
  id: string;
  resourceId: string;
  type: 'shared' | 'exclusive';
  holders: Set<string>;
  waitQueue: LockRequest[];
  acquiredAt: Date;
}

export interface LockRequest {
  stepId: string;
  lockType: 'shared' | 'exclusive';
  priority: number;
  requestedAt: Date;
  timeout: number;
}

export interface ResourcePool {
  id: string;
  type: string;
  totalCapacity: number;
  availableCapacity: number;
  allocations: Map<string, number>;
  unit: string;
}

class ParallelExecutor {
  private activeExecutions: Map<string, ExecutionContext> = new Map();
  private stepExecutors: Map<string, (step: ParallelStep, context: ExecutionContext) => Promise<any>> = new Map();
  private resourceMonitor: NodeJS.Timeout | null = null;

  /**
   * Create parallel execution plan
   */
  createExecutionPlan(
    workflowId: string,
    steps: ParallelStep[],
    config: ParallelExecutionConfig
  ): ParallelExecutionPlan {
    // Analyze dependencies and create execution groups
    const groups = this.analyzeDependencies(steps);
    
    // Calculate critical path and resource allocation
    const { criticalPath, estimatedTime } = this.calculateCriticalPath(steps, groups);
    const resourceAllocation = this.planResourceAllocation(steps, config);

    const plan: ParallelExecutionPlan = {
      id: `plan_${Date.now()}`,
      workflowId,
      groups,
      config,
      estimatedTotalTime: estimatedTime,
      criticalPath,
      resourceAllocation,
      createdAt: new Date()
    };

    console.log(`📋 Created parallel execution plan with ${groups.length} groups`);
    return plan;
  }

  /**
   * Execute workflow with parallel processing
   */
  async executeWorkflow(plan: ParallelExecutionPlan, initialVariables: Record<string, any> = {}): Promise<ExecutionContext> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const context: ExecutionContext = {
      executionId,
      workflowId: plan.workflowId,
      plan,
      results: new Map(),
      activeSteps: new Set(),
      completedSteps: new Set(),
      failedSteps: new Set(),
      barriers: new Map(),
      locks: new Map(),
      resourcePools: this.initializeResourcePools(plan.config),
      startTime: new Date(),
      variables: new Map(Object.entries(initialVariables))
    };

    this.activeExecutions.set(executionId, context);

    // Initialize synchronization primitives
    this.initializeSynchronization(context);

    try {
      console.log(`🚀 Starting parallel execution: ${executionId}`);
      
      // Start resource monitoring
      this.startResourceMonitoring(context);

      // Execute groups in order, with parallel execution within groups
      for (const group of plan.groups) {
        await this.executeGroup(context, group);
        
        // Check for synchronization points
        if (group.synchronizationPoint) {
          await this.waitForBarrier(context, group.synchronizationPoint);
        }
      }

      console.log(`✅ Completed parallel execution: ${executionId}`);
      return context;

    } catch (error) {
      console.error(`❌ Parallel execution failed: ${executionId}:`, error);
      
      if (plan.config.errorHandling.rollbackOnFailure) {
        await this.rollbackExecution(context);
      }
      
      throw error;
    } finally {
      this.stopResourceMonitoring(context);
      this.activeExecutions.delete(executionId);
    }
  }

  /**
   * Analyze step dependencies and create execution groups
   */
  private analyzeDependencies(steps: ParallelStep[]): ExecutionGroup[] {
    const groups: ExecutionGroup[] = [];
    const stepMap = new Map(steps.map(s => [s.id, s]));
    const processed = new Set<string>();
    let level = 0;

    while (processed.size < steps.length) {
      const currentGroup: string[] = [];
      
      for (const step of steps) {
        if (processed.has(step.id)) continue;
        
        // Check if all dependencies are satisfied
        const canExecute = step.dependencies.every(dep => processed.has(dep));
        
        if (canExecute) {
          currentGroup.push(step.id);
          processed.add(step.id);
        }
      }

      if (currentGroup.length === 0) {
        throw new Error('Circular dependency detected or unresolvable dependencies');
      }

      groups.push({
        id: `group_${level}`,
        name: `Execution Group ${level}`,
        steps: currentGroup,
        executionMode: currentGroup.length > 1 ? 'parallel' : 'sequential'
      });

      level++;
    }

    return groups;
  }

  /**
   * Execute a group of steps
   */
  private async executeGroup(context: ExecutionContext, group: ExecutionGroup): Promise<void> {
    console.log(`📦 Executing group: ${group.name} (${group.steps.length} steps)`);

    if (group.executionMode === 'parallel') {
      // Execute steps in parallel
      const promises = group.steps.map(stepId => this.executeStep(context, stepId));
      await Promise.all(promises);
    } else {
      // Execute steps sequentially
      for (const stepId of group.steps) {
        await this.executeStep(context, stepId);
      }
    }

    console.log(`✅ Completed group: ${group.name}`);
  }

  /**
   * Execute a single step
   */
  private async executeStep(context: ExecutionContext, stepId: string): Promise<void> {
    const plan = context.plan;
    const allSteps = this.getAllStepsFromPlan(plan);
    const step = allSteps.find(s => s.id === stepId);
    
    if (!step) {
      throw new Error(`Step ${stepId} not found in execution plan`);
    }

    // Initialize result
    const result: ExecutionResult = {
      stepId,
      status: 'pending',
      retryCount: 0,
      resourceUsage: {
        peakMemoryMB: 0,
        avgCpuPercent: 0,
        totalDiskIOKB: 0,
        totalNetworkIOKB: 0,
        customMetrics: {}
      }
    };

    context.results.set(stepId, result);

    try {
      // Check conditions
      if (step.condition && !await this.evaluateCondition(step.condition, context)) {
        result.status = 'completed';
        result.result = 'skipped_condition';
        console.log(`⏭️ Skipped step ${stepId} - condition not met`);
        return;
      }

      // Acquire resources
      await this.acquireResources(context, step);

      // Acquire locks if needed
      await this.acquireLocks(context, step);

      result.status = 'running';
      result.startTime = new Date();
      context.activeSteps.add(stepId);

      console.log(`🔄 Executing step: ${stepId}`);

      // Execute step with retry logic
      const stepResult = await this.executeStepWithRetry(context, step);
      
      result.endTime = new Date();
      result.duration = result.endTime.getTime() - result.startTime.getTime();
      result.result = stepResult;
      result.status = 'completed';
      
      context.activeSteps.delete(stepId);
      context.completedSteps.add(stepId);

      console.log(`✅ Completed step: ${stepId} in ${result.duration}ms`);

    } catch (error) {
      result.endTime = new Date();
      result.duration = result.startTime ? result.endTime.getTime() - result.startTime.getTime() : 0;
      result.error = error instanceof Error ? error : new Error(String(error));
      result.status = 'failed';
      
      context.activeSteps.delete(stepId);
      context.failedSteps.add(stepId);

      console.error(`❌ Failed step: ${stepId}:`, error);

      if (plan.config.errorHandling.strategy === 'fail_fast') {
        throw error;
      }
    } finally {
      // Release resources and locks
      await this.releaseResources(context, step);
      await this.releaseLocks(context, step);
    }
  }

  /**
   * Execute step with retry logic
   */
  private async executeStepWithRetry(context: ExecutionContext, step: ParallelStep): Promise<any> {
    const retryPolicy = step.retryPolicy || {
      maxRetries: 3,
      initialDelay: 1000,
      backoffMultiplier: 2,
      maxDelay: 30000
    };

    let lastError: Error | null = null;
    let delay = retryPolicy.initialDelay;

    for (let attempt = 0; attempt <= retryPolicy.maxRetries; attempt++) {
      try {
        const result = context.results.get(step.id)!;
        result.retryCount = attempt;

        // Execute the actual step
        return await this.executeStepLogic(context, step);

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === retryPolicy.maxRetries) {
          break;
        }

        console.warn(`🔄 Retry ${attempt + 1}/${retryPolicy.maxRetries} for step ${step.id}: ${lastError.message}`);
        
        // Wait before retry
        await this.delay(Math.min(delay, retryPolicy.maxDelay));
        delay *= retryPolicy.backoffMultiplier;
      }
    }

    throw lastError;
  }

  /**
   * Execute the actual step logic
   */
  private async executeStepLogic(context: ExecutionContext, step: ParallelStep): Promise<any> {
    const executor = this.stepExecutors.get(step.type);
    
    if (!executor) {
      throw new Error(`No executor registered for step type: ${step.type}`);
    }

    return await executor(step, context);
  }

  /**
   * Resource management
   */
  private async acquireResources(context: ExecutionContext, step: ParallelStep): Promise<void> {
    for (const requirement of step.resourceRequirements) {
      const poolId = `${requirement.type}_pool`;
      const pool = context.resourcePools.get(poolId);
      
      if (!pool) continue;

      if (pool.availableCapacity < requirement.amount) {
        throw new Error(`Insufficient ${requirement.type} resources: need ${requirement.amount}, available ${pool.availableCapacity}`);
      }

      pool.availableCapacity -= requirement.amount;
      pool.allocations.set(step.id, requirement.amount);
    }
  }

  private async releaseResources(context: ExecutionContext, step: ParallelStep): Promise<void> {
    for (const requirement of step.resourceRequirements) {
      const poolId = `${requirement.type}_pool`;
      const pool = context.resourcePools.get(poolId);
      
      if (!pool) continue;

      const allocation = pool.allocations.get(step.id);
      if (allocation) {
        pool.availableCapacity += allocation;
        pool.allocations.delete(step.id);
      }
    }
  }

  /**
   * Lock management
   */
  private async acquireLocks(context: ExecutionContext, step: ParallelStep): Promise<void> {
    // Implementation would handle acquiring necessary locks for shared resources
    console.log(`🔒 Acquiring locks for step: ${step.id}`);
  }

  private async releaseLocks(context: ExecutionContext, step: ParallelStep): Promise<void> {
    // Implementation would handle releasing locks
    console.log(`🔓 Releasing locks for step: ${step.id}`);
  }

  /**
   * Synchronization
   */
  private async waitForBarrier(context: ExecutionContext, barrierId: string): Promise<void> {
    const barrier = context.barriers.get(barrierId);
    if (!barrier) return;

    console.log(`🚧 Waiting for synchronization barrier: ${barrierId}`);
    
    // Wait until all required steps have arrived at the barrier
    while (!barrier.isOpen) {
      const arrivedCount = barrier.arrivedSteps.size;
      const requiredCount = barrier.requiredSteps.length;
      
      if (arrivedCount === requiredCount) {
        barrier.isOpen = true;
        barrier.openedAt = new Date();
        console.log(`✅ Barrier ${barrierId} opened`);
        break;
      }

      // Check if required steps have completed
      const completedRequired = barrier.requiredSteps.filter(stepId => 
        context.completedSteps.has(stepId)
      );
      
      barrier.arrivedSteps = new Set(completedRequired);
      
      await this.delay(100); // Check every 100ms
    }
  }

  /**
   * Utility functions
   */
  private initializeResourcePools(config: ParallelExecutionConfig): Map<string, ResourcePool> {
    const pools = new Map<string, ResourcePool>();
    
    pools.set('memory_pool', {
      id: 'memory_pool',
      type: 'memory',
      totalCapacity: config.resourceLimits.maxMemoryMB,
      availableCapacity: config.resourceLimits.maxMemoryMB,
      allocations: new Map(),
      unit: 'MB'
    });

    pools.set('cpu_pool', {
      id: 'cpu_pool',
      type: 'cpu',
      totalCapacity: config.resourceLimits.maxCpuPercent,
      availableCapacity: config.resourceLimits.maxCpuPercent,
      allocations: new Map(),
      unit: '%'
    });

    return pools;
  }

  private initializeSynchronization(context: ExecutionContext): void {
    // Initialize barriers
    context.plan.config.synchronization.barriers.forEach(barrier => {
      context.barriers.set(barrier.id, {
        id: barrier.id,
        requiredSteps: barrier.requiredSteps,
        arrivedSteps: new Set(),
        isOpen: false
      });
    });
  }

  private getAllStepsFromPlan(plan: ParallelExecutionPlan): ParallelStep[] {
    // In real implementation, this would extract all steps from the plan
    return [];
  }

  private calculateCriticalPath(steps: ParallelStep[], groups: ExecutionGroup[]): { criticalPath: string[]; estimatedTime: number } {
    // Simplified critical path calculation
    const longestPath = groups.reduce((total, group) => {
      const groupTime = Math.max(...group.steps.map(stepId => {
        const step = steps.find(s => s.id === stepId);
        return step?.estimatedDuration || 0;
      }));
      return total + groupTime;
    }, 0);

    return {
      criticalPath: groups.flatMap(g => g.steps),
      estimatedTime: longestPath
    };
  }

  private planResourceAllocation(steps: ParallelStep[], config: ParallelExecutionConfig): ResourceAllocation[] {
    return steps.map(step => ({
      stepId: step.id,
      resources: step.resourceRequirements.map(req => ({
        type: req.type,
        amount: req.amount,
        unit: req.unit
      })),
      priority: step.priority
    }));
  }

  private async evaluateCondition(condition: string, context: ExecutionContext): Promise<boolean> {
    try {
      const variables = Object.fromEntries(context.variables);
      const func = new Function('vars', `with(vars) { return ${condition}; }`);
      return Boolean(func(variables));
    } catch (error) {
      console.error('Error evaluating condition:', error);
      return false;
    }
  }

  private async rollbackExecution(context: ExecutionContext): Promise<void> {
    console.log(`🔄 Rolling back execution: ${context.executionId}`);
    // Implementation would rollback completed steps if needed
  }

  private startResourceMonitoring(context: ExecutionContext): void {
    this.resourceMonitor = setInterval(() => {
      this.collectResourceMetrics(context);
    }, 5000); // Collect metrics every 5 seconds
  }

  private stopResourceMonitoring(context: ExecutionContext): void {
    if (this.resourceMonitor) {
      clearInterval(this.resourceMonitor);
      this.resourceMonitor = null;
    }
  }

  private collectResourceMetrics(context: ExecutionContext): void {
    // Implementation would collect actual resource usage metrics
    console.log(`📊 Collecting resource metrics for execution: ${context.executionId}`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Register step executor
   */
  registerStepExecutor(stepType: string, executor: (step: ParallelStep, context: ExecutionContext) => Promise<any>): void {
    this.stepExecutors.set(stepType, executor);
    console.log(`📝 Registered step executor for type: ${stepType}`);
  }

  /**
   * Get execution status
   */
  getExecutionStatus(executionId: string): ExecutionContext | undefined {
    return this.activeExecutions.get(executionId);
  }

  /**
   * Cancel execution
   */
  async cancelExecution(executionId: string): Promise<void> {
    const context = this.activeExecutions.get(executionId);
    if (!context) return;

    console.log(`⏹️ Cancelling execution: ${executionId}`);
    
    // Cancel active steps
    context.activeSteps.forEach(stepId => {
      const result = context.results.get(stepId);
      if (result) {
        result.status = 'cancelled';
        result.endTime = new Date();
      }
    });

    this.activeExecutions.delete(executionId);
  }
}

// Singleton instance
export const parallelExecutor = new ParallelExecutor();

// Convenience functions
export const createExecutionPlan = (workflowId: string, steps: ParallelStep[], config: ParallelExecutionConfig) => 
  parallelExecutor.createExecutionPlan(workflowId, steps, config);

export const executeWorkflow = (plan: ParallelExecutionPlan, variables?: Record<string, any>) => 
  parallelExecutor.executeWorkflow(plan, variables);

export const registerStepExecutor = (stepType: string, executor: (step: ParallelStep, context: ExecutionContext) => Promise<any>) => 
  parallelExecutor.registerStepExecutor(stepType, executor);

export const getExecutionStatus = (executionId: string) => 
  parallelExecutor.getExecutionStatus(executionId);

export const cancelExecution = (executionId: string) => 
  parallelExecutor.cancelExecution(executionId);

// Export types
export type { 
  ParallelStep, 
  ParallelExecutionConfig, 
  ParallelExecutionPlan, 
  ExecutionContext, 
  ExecutionResult,
  ResourceRequirement,
  ExecutionGroup
};