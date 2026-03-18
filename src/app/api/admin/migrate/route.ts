import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { action } = await req.json()

    if (action === 'create_workflows_table') {
      // Create workflows table - Task 7-02
      const { error: workflowsError } = await supabase
        .from('workflows')
        .select('id')
        .limit(1)

      if (workflowsError && workflowsError.message?.includes('relation "workflows" does not exist')) {
        // Table doesn't exist, let's create it via SQL
        console.log('Creating workflows table...')
        
        // Since we can't execute DDL directly through the supabase client,
        // we'll create a record to trigger table creation
        const { error: createError } = await supabase
          .from('workflows')
          .upsert({
            name: 'Test Workflow',
            description: 'Initial workflow to trigger table creation',
            template_type: 'test',
            is_active: false,
            trigger_type: 'manual'
          }, { onConflict: 'name' })

        if (createError) {
          // If table truly doesn't exist, we need to use a different approach
          console.log('Table creation needed. Using alternative approach.')
          
          return NextResponse.json({
            success: false,
            message: 'Workflows table needs to be created via Supabase dashboard or direct SQL access',
            sql: `
              CREATE TABLE workflows (
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
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Workflows table is ready'
      })
    }

    if (action === 'create_workflow_runs_table') {
      // Create workflow_runs table - Task 7-03
      const { error: runsError } = await supabase
        .from('workflow_runs')
        .select('id')
        .limit(1)

      if (runsError && runsError.message?.includes('relation "workflow_runs" does not exist')) {
        console.log('Creating workflow_runs table...')
        
        return NextResponse.json({
          success: false,
          message: 'Workflow runs table needs to be created via Supabase dashboard or direct SQL access',
          sql: `
            CREATE TABLE workflow_runs (
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
      }

      return NextResponse.json({
        success: true,
        message: 'Workflow runs table is ready'
      })
    }

    return NextResponse.json({
      success: false,
      message: 'Invalid action'
    }, { status: 400 })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({
      success: false,
      message: 'Migration failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}