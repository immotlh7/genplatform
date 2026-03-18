// Migration script for workflows and workflow_runs tables
import { supabaseHelpers } from './supabase'

export async function createWorkflowsTable() {
  try {
    const { error } = await supabaseHelpers.supabase.sql`
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
    
    if (error) {
      console.error('Error creating workflows table:', error)
      return false
    }
    
    console.log('Workflows table created successfully')
    return true
  } catch (err) {
    console.error('Failed to create workflows table:', err)
    return false
  }
}

export async function createWorkflowRunsTable() {
  try {
    const { error } = await supabaseHelpers.supabase.sql`
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
    
    if (error) {
      console.error('Error creating workflow_runs table:', error)
      return false
    }
    
    console.log('Workflow runs table created successfully')
    return true
  } catch (err) {
    console.error('Failed to create workflow_runs table:', err)
    return false
  }
}

export async function runAllMigrations() {
  console.log('Running workflow table migrations...')
  
  const workflowsResult = await createWorkflowsTable()
  const workflowRunsResult = await createWorkflowRunsTable()
  
  if (workflowsResult && workflowRunsResult) {
    console.log('All migrations completed successfully')
    return true
  } else {
    console.log('Some migrations failed')
    return false
  }
}