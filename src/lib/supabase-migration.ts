// Migration script for workflows table
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