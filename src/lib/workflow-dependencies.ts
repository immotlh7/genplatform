/**
 * Workflow Dependency Management System
 * Handles workflow prerequisites, dependency graphs, conflict resolution, and chain execution planning
 */

export interface WorkflowDependency {
  id: string;
  workflowId: string;
  dependsOnWorkflowId: string;
  dependencyType: 'sequential' | 'data' | 'resource' | 'conditional';
  isRequired: boolean;
  condition?: string; // JavaScript expression for conditional dependencies
  metadata: {
    description: string;
    createdAt: Date;
    createdBy: string;
  };
}

export interface DependencyNode {
  workflowId: string;
  workflowName: string;
  dependencies: string[]; // Array of workflow IDs this depends on
  dependents: string[]; // Array of workflow IDs that depend on this
  level: number; // Execution level (0 = no dependencies, 1 = depends on level 0, etc.)
  status: 'ready' | 'waiting' | 'running' | 'completed' | 'failed' | 'blocked';
  estimatedDuration?: number;
  lastRun?: Date;
}

export interface ExecutionPlan {
  id: string;
  name: string;
  levels: DependencyNode[][]; // Array of levels, each containing workflows that can run in parallel
  totalEstimatedTime: number;
  criticalPath: string[]; // Workflow IDs in the critical path
  conflicts: DependencyConflict[];
  createdAt: Date;
}

export interface DependencyConflict {
  id: string;
  type: 'circular' | 'resource' | 'timing' | 'version';
  description: string;
  affectedWorkflows: string[];
  severity: 'low' | 'medium' | 'high' | 'blocking';
  resolution?: string;
  resolvedAt?: Date;
}

export interface ResourceRequirement {
  workflowId: string;
  resourceType: 'cpu' | 'memory' | 'disk' | 'network' | 'database' | 'api_quota';
  amount: number;
  unit: string;
  isExclusive: boolean; // Whether this resource cannot be shared
}

class WorkflowDependencyManager {
  private dependencies: Map<string, WorkflowDependency> = new Map();
  private resourceRequirements: Map<string, ResourceRequirement[]> = new Map();
  private executionHistory: Map<string, Date> = new Map();

  /**
   * Add a dependency between workflows
   */
  addDependency(dependency: Omit<WorkflowDependency, 'id'>): string {
    const id = `dep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const fullDependency: WorkflowDependency = {
      id,
      ...dependency,
      metadata: {
        ...dependency.metadata,
        createdAt: new Date()
      }
    };

    this.dependencies.set(id, fullDependency);
    console.log(`➕ Added dependency: ${dependency.workflowId} depends on ${dependency.dependsOnWorkflowId}`);
    
    return id;
  }

  /**
   * Remove a dependency
   */
  removeDependency(dependencyId: string): boolean {
    const removed = this.dependencies.delete(dependencyId);
    if (removed) {
      console.log(`➖ Removed dependency: ${dependencyId}`);
    }
    return removed;
  }

  /**
   * Get all dependencies for a specific workflow
   */
  getWorkflowDependencies(workflowId: string): WorkflowDependency[] {
    return Array.from(this.dependencies.values())
      .filter(dep => dep.workflowId === workflowId);
  }

  /**
   * Get all workflows that depend on a specific workflow
   */
  getWorkflowDependents(workflowId: string): WorkflowDependency[] {
    return Array.from(this.dependencies.values())
      .filter(dep => dep.dependsOnWorkflowId === workflowId);
  }

  /**
   * Build dependency graph for visualization
   */
  buildDependencyGraph(workflowIds: string[]): DependencyNode[] {
    const nodes: DependencyNode[] = [];
    const nodeMap = new Map<string, DependencyNode>();

    // Create nodes for all workflows
    workflowIds.forEach(workflowId => {
      const node: DependencyNode = {
        workflowId,
        workflowName: `Workflow ${workflowId}`, // In real implementation, fetch from database
        dependencies: [],
        dependents: [],
        level: 0,
        status: 'ready',
        estimatedDuration: 60000, // Default 1 minute
        lastRun: this.executionHistory.get(workflowId)
      };
      
      nodes.push(node);
      nodeMap.set(workflowId, node);
    });

    // Populate dependencies and dependents
    this.dependencies.forEach(dep => {
      const dependentNode = nodeMap.get(dep.workflowId);
      const dependsOnNode = nodeMap.get(dep.dependsOnWorkflowId);

      if (dependentNode && dependsOnNode) {
        dependentNode.dependencies.push(dep.dependsOnWorkflowId);
        dependsOnNode.dependents.push(dep.workflowId);
      }
    });

    // Calculate execution levels using topological sort
    this.calculateExecutionLevels(nodes);

    return nodes;
  }

  /**
   * Calculate execution levels for workflows using topological sorting
   */
  private calculateExecutionLevels(nodes: DependencyNode[]): void {
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const calculateLevel = (node: DependencyNode): number => {
      if (visiting.has(node.workflowId)) {
        throw new Error(`Circular dependency detected involving workflow ${node.workflowId}`);
      }

      if (visited.has(node.workflowId)) {
        return node.level;
      }

      visiting.add(node.workflowId);

      if (node.dependencies.length === 0) {
        node.level = 0;
      } else {
        const dependencyLevels = node.dependencies.map(depId => {
          const depNode = nodes.find(n => n.workflowId === depId);
          return depNode ? calculateLevel(depNode) : 0;
        });
        node.level = Math.max(...dependencyLevels) + 1;
      }

      visiting.delete(node.workflowId);
      visited.add(node.workflowId);

      return node.level;
    };

    nodes.forEach(node => {
      if (!visited.has(node.workflowId)) {
        calculateLevel(node);
      }
    });
  }

  /**
   * Create execution plan with conflict detection
   */
  createExecutionPlan(workflowIds: string[], planName: string = 'Execution Plan'): ExecutionPlan {
    try {
      const nodes = this.buildDependencyGraph(workflowIds);
      const conflicts = this.detectConflicts(nodes);

      // Group workflows by execution level
      const maxLevel = Math.max(...nodes.map(n => n.level));
      const levels: DependencyNode[][] = [];

      for (let level = 0; level <= maxLevel; level++) {
        levels.push(nodes.filter(n => n.level === level));
      }

      // Calculate total estimated time and critical path
      const { totalTime, criticalPath } = this.calculateCriticalPath(nodes);

      const plan: ExecutionPlan = {
        id: `plan_${Date.now()}`,
        name: planName,
        levels,
        totalEstimatedTime: totalTime,
        criticalPath,
        conflicts,
        createdAt: new Date()
      };

      console.log(`📋 Created execution plan with ${levels.length} levels and ${conflicts.length} conflicts`);
      return plan;

    } catch (error) {
      console.error('Error creating execution plan:', error);
      throw error;
    }
  }

  /**
   * Detect conflicts in dependency graph
   */
  detectConflicts(nodes: DependencyNode[]): DependencyConflict[] {
    const conflicts: DependencyConflict[] = [];

    // Check for circular dependencies (should be caught in level calculation)
    const circularConflicts = this.detectCircularDependencies(nodes);
    conflicts.push(...circularConflicts);

    // Check for resource conflicts
    const resourceConflicts = this.detectResourceConflicts(nodes);
    conflicts.push(...resourceConflicts);

    // Check for timing conflicts
    const timingConflicts = this.detectTimingConflicts(nodes);
    conflicts.push(...timingConflicts);

    return conflicts;
  }

  /**
   * Detect circular dependencies
   */
  private detectCircularDependencies(nodes: DependencyNode[]): DependencyConflict[] {
    const conflicts: DependencyConflict[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfsCheck = (nodeId: string, path: string[]): boolean => {
      if (recursionStack.has(nodeId)) {
        const cycleStart = path.indexOf(nodeId);
        const cycle = path.slice(cycleStart).concat([nodeId]);
        
        conflicts.push({
          id: `circular_${Date.now()}`,
          type: 'circular',
          description: `Circular dependency detected: ${cycle.join(' → ')}`,
          affectedWorkflows: cycle,
          severity: 'blocking'
        });
        
        return true;
      }

      if (visited.has(nodeId)) {
        return false;
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const node = nodes.find(n => n.workflowId === nodeId);
      if (node) {
        for (const depId of node.dependencies) {
          if (dfsCheck(depId, [...path, nodeId])) {
            return true;
          }
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    nodes.forEach(node => {
      if (!visited.has(node.workflowId)) {
        dfsCheck(node.workflowId, []);
      }
    });

    return conflicts;
  }

  /**
   * Detect resource conflicts
   */
  private detectResourceConflicts(nodes: DependencyNode[]): DependencyConflict[] {
    const conflicts: DependencyConflict[] = [];
    
    // Group nodes by execution level to check for resource conflicts within same level
    const levelGroups = new Map<number, DependencyNode[]>();
    nodes.forEach(node => {
      if (!levelGroups.has(node.level)) {
        levelGroups.set(node.level, []);
      }
      levelGroups.get(node.level)!.push(node);
    });

    levelGroups.forEach((levelNodes, level) => {
      const resourceUsage = new Map<string, string[]>();

      levelNodes.forEach(node => {
        const requirements = this.resourceRequirements.get(node.workflowId) || [];
        
        requirements.forEach(req => {
          if (req.isExclusive) {
            const resourceKey = `${req.resourceType}_${req.amount}_${req.unit}`;
            
            if (!resourceUsage.has(resourceKey)) {
              resourceUsage.set(resourceKey, []);
            }
            resourceUsage.get(resourceKey)!.push(node.workflowId);
          }
        });
      });

      // Check for conflicts (multiple workflows needing same exclusive resource)
      resourceUsage.forEach((workflowIds, resourceKey) => {
        if (workflowIds.length > 1) {
          conflicts.push({
            id: `resource_${Date.now()}_${resourceKey}`,
            type: 'resource',
            description: `Resource conflict: Multiple workflows require exclusive access to ${resourceKey}`,
            affectedWorkflows: workflowIds,
            severity: 'high',
            resolution: 'Consider running these workflows sequentially or increasing resource capacity'
          });
        }
      });
    });

    return conflicts;
  }

  /**
   * Detect timing conflicts
   */
  private detectTimingConflicts(nodes: DependencyNode[]): DependencyConflict[] {
    const conflicts: DependencyConflict[] = [];

    // Check for workflows that have scheduling constraints
    // This is a simplified example - real implementation would check actual schedules
    const scheduledWorkflows = nodes.filter(n => n.lastRun && 
      (Date.now() - n.lastRun.getTime()) < 3600000); // Ran within last hour

    if (scheduledWorkflows.length > 0) {
      conflicts.push({
        id: `timing_${Date.now()}`,
        type: 'timing',
        description: `Some workflows were recently executed and may need cooldown period`,
        affectedWorkflows: scheduledWorkflows.map(w => w.workflowId),
        severity: 'low',
        resolution: 'Consider workflow scheduling constraints and cooldown periods'
      });
    }

    return conflicts;
  }

  /**
   * Calculate critical path and total execution time
   */
  private calculateCriticalPath(nodes: DependencyNode[]): { totalTime: number; criticalPath: string[] } {
    const nodeMap = new Map(nodes.map(n => [n.workflowId, n]));
    const pathTimes = new Map<string, number>();
    const pathWorkflows = new Map<string, string[]>();

    const calculatePath = (nodeId: string, visited: Set<string>): { time: number; path: string[] } => {
      if (visited.has(nodeId)) {
        return { time: 0, path: [] };
      }

      if (pathTimes.has(nodeId)) {
        return { 
          time: pathTimes.get(nodeId)!, 
          path: pathWorkflows.get(nodeId)! 
        };
      }

      visited.add(nodeId);
      const node = nodeMap.get(nodeId);
      
      if (!node) {
        return { time: 0, path: [] };
      }

      if (node.dependencies.length === 0) {
        const time = node.estimatedDuration || 0;
        const path = [nodeId];
        pathTimes.set(nodeId, time);
        pathWorkflows.set(nodeId, path);
        visited.delete(nodeId);
        return { time, path };
      }

      let maxTime = 0;
      let maxPath: string[] = [];

      for (const depId of node.dependencies) {
        const { time: depTime, path: depPath } = calculatePath(depId, visited);
        if (depTime > maxTime) {
          maxTime = depTime;
          maxPath = depPath;
        }
      }

      const totalTime = maxTime + (node.estimatedDuration || 0);
      const totalPath = [...maxPath, nodeId];
      
      pathTimes.set(nodeId, totalTime);
      pathWorkflows.set(nodeId, totalPath);
      visited.delete(nodeId);

      return { time: totalTime, path: totalPath };
    };

    let longestTime = 0;
    let longestPath: string[] = [];

    // Find the longest path among all end nodes (nodes with no dependents)
    const endNodes = nodes.filter(n => n.dependents.length === 0);
    
    endNodes.forEach(node => {
      const { time, path } = calculatePath(node.workflowId, new Set());
      if (time > longestTime) {
        longestTime = time;
        longestPath = path;
      }
    });

    return {
      totalTime: longestTime,
      criticalPath: longestPath
    };
  }

  /**
   * Check if a workflow can be executed (all dependencies met)
   */
  canExecuteWorkflow(workflowId: string): { canExecute: boolean; blockers: string[] } {
    const dependencies = this.getWorkflowDependencies(workflowId);
    const blockers: string[] = [];

    dependencies.forEach(dep => {
      if (dep.isRequired) {
        // Check if dependency has been satisfied
        const lastRun = this.executionHistory.get(dep.dependsOnWorkflowId);
        
        if (!lastRun) {
          blockers.push(`Workflow ${dep.dependsOnWorkflowId} has never been executed`);
        } else if (dep.condition) {
          // Evaluate conditional dependency
          try {
            const conditionMet = this.evaluateCondition(dep.condition, {
              lastRun,
              workflowId: dep.dependsOnWorkflowId
            });
            
            if (!conditionMet) {
              blockers.push(`Conditional dependency not met: ${dep.condition}`);
            }
          } catch (error) {
            blockers.push(`Error evaluating condition: ${dep.condition}`);
          }
        }
      }
    });

    return {
      canExecute: blockers.length === 0,
      blockers
    };
  }

  /**
   * Simple condition evaluation (in real implementation, use a proper expression evaluator)
   */
  private evaluateCondition(condition: string, context: any): boolean {
    try {
      // This is a simplified example - in production, use a safe expression evaluator
      const func = new Function('context', `with(context) { return ${condition}; }`);
      return Boolean(func(context));
    } catch (error) {
      console.error('Error evaluating condition:', error);
      return false;
    }
  }

  /**
   * Record workflow execution for dependency tracking
   */
  recordExecution(workflowId: string, executionTime: Date = new Date()): void {
    this.executionHistory.set(workflowId, executionTime);
    console.log(`📝 Recorded execution of workflow ${workflowId} at ${executionTime.toISOString()}`);
  }

  /**
   * Add resource requirements for a workflow
   */
  addResourceRequirement(workflowId: string, requirement: Omit<ResourceRequirement, 'workflowId'>): void {
    if (!this.resourceRequirements.has(workflowId)) {
      this.resourceRequirements.set(workflowId, []);
    }
    
    this.resourceRequirements.get(workflowId)!.push({
      workflowId,
      ...requirement
    });

    console.log(`📊 Added resource requirement for ${workflowId}: ${requirement.amount} ${requirement.unit} of ${requirement.resourceType}`);
  }

  /**
   * Get execution plan summary
   */
  getExecutionPlanSummary(plan: ExecutionPlan): string {
    const totalWorkflows = plan.levels.reduce((sum, level) => sum + level.length, 0);
    const conflictSummary = plan.conflicts.length > 0 
      ? `⚠️ ${plan.conflicts.length} conflicts detected`
      : '✅ No conflicts';

    return `
📋 Execution Plan: ${plan.name}
├── Workflows: ${totalWorkflows}
├── Execution Levels: ${plan.levels.length}
├── Estimated Duration: ${Math.round(plan.totalEstimatedTime / 1000 / 60)} minutes
├── Critical Path: ${plan.criticalPath.join(' → ')}
└── Status: ${conflictSummary}
    `.trim();
  }
}

// Singleton instance
export const workflowDependencies = new WorkflowDependencyManager();

// Convenience functions
export const addDependency = (dependency: Omit<WorkflowDependency, 'id'>) => 
  workflowDependencies.addDependency(dependency);

export const removeDependency = (dependencyId: string) => 
  workflowDependencies.removeDependency(dependencyId);

export const buildDependencyGraph = (workflowIds: string[]) => 
  workflowDependencies.buildDependencyGraph(workflowIds);

export const createExecutionPlan = (workflowIds: string[], planName?: string) => 
  workflowDependencies.createExecutionPlan(workflowIds, planName);

export const canExecuteWorkflow = (workflowId: string) => 
  workflowDependencies.canExecuteWorkflow(workflowId);

export const recordExecution = (workflowId: string, executionTime?: Date) => 
  workflowDependencies.recordExecution(workflowId, executionTime);

export const addResourceRequirement = (workflowId: string, requirement: Omit<ResourceRequirement, 'workflowId'>) => 
  workflowDependencies.addResourceRequirement(workflowId, requirement);

// Export types
export type { WorkflowDependency, DependencyNode, ExecutionPlan, DependencyConflict, ResourceRequirement };