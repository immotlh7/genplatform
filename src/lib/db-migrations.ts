import { supabase } from './supabase'
import { supabase } from '@/lib/supabase';

// Migration scripts for database schema updates
export class DatabaseMigrations {
  
  // Create workflows table - Task 7-02
  static async createWorkflowsTable(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS workflows (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            template_type TEXT NOT NULL,
            is_active BOOLEAN DEFAULT false,
            trigger_type TEXT CHECK (trigger_type IN ('manual','new_idea','task_complete','schedule')),
            schedule TEXT,
            config JSONB DEFAULT '{}',
            last_run_at TIMESTAMPTZ,
            last_run_status TEXT,
            created_at TIMESTAMPTZ DEFAULT now()
          );
        `
      })

      if (error) throw error

      console.log('✅ Successfully created workflows table')
      return { success: true }
    } catch (error) {
      console.error('❌ Error creating workflows table:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // Create workflow_runs table - Task 7-03
  static async createWorkflowRunsTable(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS workflow_runs (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
            project_id UUID REFERENCES projects(id),
            status TEXT DEFAULT 'running' CHECK (status IN ('running','completed','failed','waiting_approval')),
            current_step TEXT,
            steps_completed INT DEFAULT 0,
            steps_total INT,
            logs JSONB DEFAULT '[]',
            started_at TIMESTAMPTZ DEFAULT now(),
            completed_at TIMESTAMPTZ
          );
        `
      })

      if (error) throw error

      console.log('✅ Successfully created workflow_runs table')
      return { success: true }
    } catch (error) {
      console.error('❌ Error creating workflow_runs table:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // Run all pending migrations
  static async runAllMigrations(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = []

    // Create workflows table
    const workflowsResult = await this.createWorkflowsTable()
    if (!workflowsResult.success && workflowsResult.error) {
      errors.push(`Workflows table: ${workflowsResult.error}`)
    }

    // Create workflow_runs table
    const runsResult = await this.createWorkflowRunsTable()
    if (!runsResult.success && runsResult.error) {
      errors.push(`Workflow runs table: ${runsResult.error}`)
    }

    return {
      success: errors.length === 0,
      errors
    }
  }
}

// Export individual migration functions
export const createWorkflowsTable = DatabaseMigrations.createWorkflowsTable
export const createWorkflowRunsTable = DatabaseMigrations.createWorkflowRunsTable
export const runAllMigrations = DatabaseMigrations.runAllMigrations