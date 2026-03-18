import { supabase } from './supabase'

export interface WorkflowDependency {
  id: string
  workflow_id: string
  depends_on_workflow_id: string
  dependency_type: 'prerequisite' | 'trigger' | 'data' | 'resource'
  condition: {
    type: 'success' | 'completion' | 'status' | 'data_available' | 'resource_free'
    value?: any
    timeout_minutes?: number
  }
  is_blocking: boolean
  created_at: string
  updated_at: string
}

export interface DependencyNode {
  id: string
  workflow_id: string
  workflow_name: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'blocked'
  dependencies: string[]
  dependents: string[]
  level: number
  position: { x: number; y: number }
}

export interface DependencyGraph {
  nodes: DependencyNode[]
  edges: {
    from: string
    to: string
    type: string
    condition: string
  }[]
  cycles: string[][]
  execution_order: string[]
}

export interface ConflictResolution {
  conflict_id: string
  type: 'circular_dependency' | 'resource_conflict' | 'timing_conflict'
  affected_workflows: string[]
  description: string
  resolution_options: {
    id: string
    description: string
    action: 'remove_dependency' | 'add_delay' | 'change_condition' | 'split_workflow'
    impact: 'low' | 'medium' | 'high'
  }[]
}

export class WorkflowDependencyManager {
  /**
   * Add a dependency between workflows
   */
  static async addDependency(dependency: Omit<WorkflowDependency, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; error?: string; dependency?: WorkflowDependency }> {
    try {
      // Check for circular dependencies before adding
      const wouldCreateCycle = await this.wouldCreateCircularDependency(
        dependency.workflow_id,
        dependency.depends_on_workflow_id
      )

      if (wouldCreateCycle) {
        return {
          success: false,
          error: 'Adding this dependency would create a circular dependency'
        }
      }

      const { data, error } = await supabase
        .from('workflow_dependencies')
        .insert({
          workflow_id: dependency.workflow_id,
          depends_on_workflow_id: dependency.depends_on_workflow_id,
          dependency_type: dependency.dependency_type,
          condition: dependency.condition,
          is_blocking: dependency.is_blocking
        })
        .select()
        .single()

      if (error) throw error

      return { success: true, dependency: data }
    } catch (error) {
      console.error('Failed to add workflow dependency:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Remove a dependency
   */
  static async removeDependency(dependencyId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('workflow_dependencies')
        .delete()
        .eq('id', dependencyId)

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Failed to remove workflow dependency:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get all dependencies for a workflow
   */
  static async getWorkflowDependencies(workflowId: string): Promise<WorkflowDependency[]> {
    try {
      const { data, error } = await supabase
        .from('workflow_dependencies')
        .select('*')
        .or(`workflow_id.eq.${workflowId},depends_on_workflow_id.eq.${workflowId}`)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Failed to get workflow dependencies:', error)
      return []
    }
  }

  /**
   * Check if a workflow's dependencies are satisfied
   */
  static async checkDependencies(workflowId: string): Promise<{
    satisfied: boolean
    pending_dependencies: {
      workflow_id: string
      workflow_name: string
      condition: any
      status: string
      blocking: boolean
    }[]
    estimated_wait_time?: number
  }> {
    try {
      // Get all dependencies for this workflow
      const { data: dependencies, error } = await supabase
        .from('workflow_dependencies')
        .select(`
          *,
          dependency_workflow:workflows!workflow_dependencies_depends_on_workflow_id_fkey(id, name),
          runs:workflow_runs!workflow_runs_workflow_id_fkey(status, completed_at, created_at)
        `)
        .eq('workflow_id', workflowId)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (!dependencies || dependencies.length === 0) {
        return { satisfied: true, pending_dependencies: [] }
      }

      const pendingDependencies = []
      let totalWaitTime = 0

      for (const dep of dependencies) {
        const depStatus = await this.checkSingleDependency(dep)
        
        if (!depStatus.satisfied) {
          pendingDependencies.push({
            workflow_id: dep.depends_on_workflow_id,
            workflow_name: dep.dependency_workflow?.name || 'Unknown',
            condition: dep.condition,
            status: depStatus.current_status,
            blocking: dep.is_blocking
          })

          if (depStatus.estimated_wait_time && dep.is_blocking) {
            totalWaitTime = Math.max(totalWaitTime, depStatus.estimated_wait_time)
          }
        }
      }

      const blockingDependencies = pendingDependencies.filter(dep => dep.blocking)

      return {
        satisfied: blockingDependencies.length === 0,
        pending_dependencies: pendingDependencies,
        estimated_wait_time: totalWaitTime > 0 ? totalWaitTime : undefined
      }
    } catch (error) {
      console.error('Failed to check workflow dependencies:', error)
      return { satisfied: false, pending_dependencies: [] }
    }
  }

  /**
   * Generate a dependency graph for visualization
   */
  static async generateDependencyGraph(workflowIds?: string[]): Promise<DependencyGraph> {
    try {
      let query = supabase
        .from('workflow_dependencies')
        .select(`
          *,
          workflow:workflows!workflow_dependencies_workflow_id_fkey(id, name),
          dependency_workflow:workflows!workflow_dependencies_depends_on_workflow_id_fkey(id, name)
        `)

      if (workflowIds && workflowIds.length > 0) {
        query = query.in('workflow_id', workflowIds)
      }

      const { data: dependencies, error } = await query

      if (error) throw error

      // Get all unique workflows involved
      const workflowMap = new Map<string, { id: string; name: string }>()
      
      dependencies?.forEach(dep => {
        if (dep.workflow) {
          workflowMap.set(dep.workflow.id, { id: dep.workflow.id, name: dep.workflow.name })
        }
        if (dep.dependency_workflow) {
          workflowMap.set(dep.dependency_workflow.id, { 
            id: dep.dependency_workflow.id, 
            name: dep.dependency_workflow.name 
          })
        }
      })

      // Build adjacency map
      const dependencyMap = new Map<string, string[]>()
      const dependentMap = new Map<string, string[]>()

      dependencies?.forEach(dep => {
        const workflowId = dep.workflow_id
        const dependsOnId = dep.depends_on_workflow_id

        if (!dependencyMap.has(workflowId)) {
          dependencyMap.set(workflowId, [])
        }
        dependencyMap.get(workflowId)!.push(dependsOnId)

        if (!dependentMap.has(dependsOnId)) {
          dependentMap.set(dependsOnId, [])
        }
        dependentMap.get(dependsOnId)!.push(workflowId)
      })

      // Create nodes with levels (topological sort)
      const nodes = await this.createGraphNodes(workflowMap, dependencyMap, dependentMap)
      
      // Create edges
      const edges = dependencies?.map(dep => ({
        from: dep.depends_on_workflow_id,
        to: dep.workflow_id,
        type: dep.dependency_type,
        condition: this.formatCondition(dep.condition)
      })) || []

      // Detect cycles
      const cycles = this.detectCycles(dependencyMap)

      // Calculate execution order
      const executionOrder = this.calculateExecutionOrder(nodes, dependencyMap)

      return { nodes, edges, cycles, execution_order: executionOrder }
    } catch (error) {
      console.error('Failed to generate dependency graph:', error)
      return { nodes: [], edges: [], cycles: [], execution_order: [] }
    }
  }

  /**
   * Plan execution order for a set of workflows
   */
  static async planExecution(workflowIds: string[]): Promise<{
    execution_plan: {
      level: number
      workflows: string[]
      estimated_time: number
    }[]
    total_estimated_time: number
    potential_parallelism: number
    conflicts: ConflictResolution[]
  }> {
    try {
      const graph = await this.generateDependencyGraph(workflowIds)
      const conflicts = await this.detectConflicts(workflowIds)
      
      // Group workflows by level for parallel execution
      const levelMap = new Map<number, string[]>()
      graph.nodes.forEach(node => {
        if (!levelMap.has(node.level)) {
          levelMap.set(node.level, [])
        }
        levelMap.get(node.level)!.push(node.workflow_id)
      })

      // Calculate estimated times (mock data for now)
      const executionPlan = Array.from(levelMap.entries())
        .sort(([a], [b]) => a - b)
        .map(([level, workflows]) => ({
          level,
          workflows,
          estimated_time: workflows.length * 300 // 5 minutes per workflow (mock)
        }))

      const totalTime = executionPlan.reduce((sum, plan) => sum + plan.estimated_time, 0)
      const parallelism = Math.max(...executionPlan.map(plan => plan.workflows.length))

      return {
        execution_plan: executionPlan,
        total_estimated_time: totalTime,
        potential_parallelism: parallelism,
        conflicts
      }
    } catch (error) {
      console.error('Failed to plan workflow execution:', error)
      return {
        execution_plan: [],
        total_estimated_time: 0,
        potential_parallelism: 0,
        conflicts: []
      }
    }
  }

  /**
   * Check if adding a dependency would create a circular dependency
   */
  private static async wouldCreateCircularDependency(
    workflowId: string, 
    dependsOnWorkflowId: string
  ): Promise<boolean> {
    try {
      // Get all existing dependencies
      const { data: dependencies } = await supabase
        .from('workflow_dependencies')
        .select('workflow_id, depends_on_workflow_id')

      if (!dependencies) return false

      // Build adjacency map
      const adjacencyMap = new Map<string, string[]>()
      
      dependencies.forEach(dep => {
        if (!adjacencyMap.has(dep.workflow_id)) {
          adjacencyMap.set(dep.workflow_id, [])
        }
        adjacencyMap.get(dep.workflow_id)!.push(dep.depends_on_workflow_id)
      })

      // Add the proposed new dependency
      if (!adjacencyMap.has(workflowId)) {
        adjacencyMap.set(workflowId, [])
      }
      adjacencyMap.get(workflowId)!.push(dependsOnWorkflowId)

      // Check for cycles using DFS
      return this.hasCycleDFS(adjacencyMap, workflowId, new Set(), new Set())
    } catch (error) {
      console.error('Error checking for circular dependency:', error)
      return false
    }
  }

  /**
   * Check a single dependency condition
   */
  private static async checkSingleDependency(dependency: any): Promise<{
    satisfied: boolean
    current_status: string
    estimated_wait_time?: number
  }> {
    const { condition, depends_on_workflow_id } = dependency

    try {
      // Get the latest run of the dependency workflow
      const { data: runs } = await supabase
        .from('workflow_runs')
        .select('status, completed_at, created_at')
        .eq('workflow_id', depends_on_workflow_id)
        .order('created_at', { ascending: false })
        .limit(1)

      const latestRun = runs?.[0]

      if (!latestRun) {
        return {
          satisfied: false,
          current_status: 'never_run',
          estimated_wait_time: 600 // 10 minutes default
        }
      }

      switch (condition.type) {
        case 'success':
          return {
            satisfied: latestRun.status === 'completed',
            current_status: latestRun.status,
            estimated_wait_time: latestRun.status === 'running' ? 300 : undefined
          }

        case 'completion':
          return {
            satisfied: ['completed', 'failed'].includes(latestRun.status),
            current_status: latestRun.status,
            estimated_wait_time: latestRun.status === 'running' ? 300 : undefined
          }

        case 'status':
          return {
            satisfied: latestRun.status === condition.value,
            current_status: latestRun.status
          }

        default:
          return {
            satisfied: true,
            current_status: latestRun.status
          }
      }
    } catch (error) {
      console.error('Error checking dependency condition:', error)
      return {
        satisfied: false,
        current_status: 'error'
      }
    }
  }

  /**
   * Create graph nodes with proper positioning
   */
  private static async createGraphNodes(
    workflowMap: Map<string, { id: string; name: string }>,
    dependencyMap: Map<string, string[]>,
    dependentMap: Map<string, string[]>
  ): Promise<DependencyNode[]> {
    const nodes: DependencyNode[] = []
    const levelMap = new Map<string, number>()

    // Calculate levels using topological sort
    const calculateLevel = (workflowId: string, visited: Set<string> = new Set()): number => {
      if (visited.has(workflowId)) return 0 // Circular dependency
      if (levelMap.has(workflowId)) return levelMap.get(workflowId)!

      visited.add(workflowId)
      
      const dependencies = dependencyMap.get(workflowId) || []
      const maxDepLevel = dependencies.length > 0 
        ? Math.max(...dependencies.map(depId => calculateLevel(depId, new Set(visited))))
        : 0

      const level = maxDepLevel + 1
      levelMap.set(workflowId, level)
      visited.delete(workflowId)
      
      return level
    }

    // Calculate levels for all workflows
    for (const [workflowId] of workflowMap) {
      calculateLevel(workflowId)
    }

    // Create nodes with positions
    const levelGroups = new Map<number, string[]>()
    for (const [workflowId, level] of levelMap) {
      if (!levelGroups.has(level)) {
        levelGroups.set(level, [])
      }
      levelGroups.get(level)!.push(workflowId)
    }

    // Position nodes
    for (const [workflowId, workflow] of workflowMap) {
      const level = levelMap.get(workflowId) || 0
      const levelWorkflows = levelGroups.get(level) || []
      const indexInLevel = levelWorkflows.indexOf(workflowId)
      
      nodes.push({
        id: workflowId,
        workflow_id: workflowId,
        workflow_name: workflow.name,
        status: 'pending', // Would be fetched from actual runs
        dependencies: dependencyMap.get(workflowId) || [],
        dependents: dependentMap.get(workflowId) || [],
        level,
        position: {
          x: level * 200,
          y: indexInLevel * 100
        }
      })
    }

    return nodes
  }

  /**
   * Detect circular dependencies
   */
  private static detectCycles(adjacencyMap: Map<string, string[]>): string[][] {
    const cycles: string[][] = []
    const visited = new Set<string>()
    const recursionStack = new Set<string>()

    const dfs = (node: string, path: string[]): void => {
      visited.add(node)
      recursionStack.add(node)
      path.push(node)

      const neighbors = adjacencyMap.get(node) || []
      for (const neighbor of neighbors) {
        if (recursionStack.has(neighbor)) {
          // Found a cycle
          const cycleStart = path.indexOf(neighbor)
          cycles.push([...path.slice(cycleStart), neighbor])
        } else if (!visited.has(neighbor)) {
          dfs(neighbor, [...path])
        }
      }

      recursionStack.delete(node)
    }

    for (const [node] of adjacencyMap) {
      if (!visited.has(node)) {
        dfs(node, [])
      }
    }

    return cycles
  }

  /**
   * Calculate execution order
   */
  private static calculateExecutionOrder(
    nodes: DependencyNode[],
    dependencyMap: Map<string, string[]>
  ): string[] {
    const sorted: string[] = []
    const visited = new Set<string>()
    const temp = new Set<string>()

    const visit = (nodeId: string): void => {
      if (temp.has(nodeId)) return // Circular dependency
      if (visited.has(nodeId)) return

      temp.add(nodeId)
      
      const dependencies = dependencyMap.get(nodeId) || []
      dependencies.forEach(depId => visit(depId))
      
      temp.delete(nodeId)
      visited.add(nodeId)
      sorted.push(nodeId)
    }

    nodes.forEach(node => {
      if (!visited.has(node.workflow_id)) {
        visit(node.workflow_id)
      }
    })

    return sorted.reverse()
  }

  /**
   * Detect conflicts in workflow execution
   */
  private static async detectConflicts(workflowIds: string[]): Promise<ConflictResolution[]> {
    // This would analyze resource conflicts, timing issues, etc.
    // For now, return empty array
    return []
  }

  /**
   * Format condition for display
   */
  private static formatCondition(condition: any): string {
    switch (condition.type) {
      case 'success':
        return 'Must complete successfully'
      case 'completion':
        return 'Must complete (any status)'
      case 'status':
        return `Must have status: ${condition.value}`
      case 'data_available':
        return 'Data must be available'
      case 'resource_free':
        return 'Resource must be free'
      default:
        return 'Custom condition'
    }
  }

  /**
   * DFS cycle detection helper
   */
  private static hasCycleDFS(
    adjacencyMap: Map<string, string[]>,
    node: string,
    visited: Set<string>,
    recursionStack: Set<string>
  ): boolean {
    visited.add(node)
    recursionStack.add(node)

    const neighbors = adjacencyMap.get(node) || []
    for (const neighbor of neighbors) {
      if (recursionStack.has(neighbor)) {
        return true // Cycle found
      }
      if (!visited.has(neighbor) && this.hasCycleDFS(adjacencyMap, neighbor, visited, recursionStack)) {
        return true
      }
    }

    recursionStack.delete(node)
    return false
  }
}

/**
 * Database schema for workflow dependencies
 */
export const workflowDependenciesTableSchema = `
CREATE TABLE IF NOT EXISTS workflow_dependencies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id VARCHAR(255) NOT NULL,
  depends_on_workflow_id VARCHAR(255) NOT NULL,
  dependency_type VARCHAR(50) NOT NULL DEFAULT 'prerequisite',
  condition JSONB NOT NULL DEFAULT '{"type": "success"}',
  is_blocking BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  INDEX idx_workflow_dependencies_workflow_id (workflow_id),
  INDEX idx_workflow_dependencies_depends_on (depends_on_workflow_id),
  INDEX idx_workflow_dependencies_type (dependency_type),
  
  FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
  FOREIGN KEY (depends_on_workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
  
  UNIQUE(workflow_id, depends_on_workflow_id, dependency_type)
);
`