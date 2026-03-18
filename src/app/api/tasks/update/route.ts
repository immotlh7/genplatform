import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserServer } from '@/lib/access-control'
import { supabaseHelpers } from '@/lib/supabase'

// Wire task completion to trigger workflow (Task 7-18)
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUserServer()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { taskId, status } = body

    // Update task status
    const { data: task, error } = await supabaseHelpers.supabase
      .from('project_tasks')
      .update({ status })
      .eq('id', taskId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
    }

    // If task is marked as 'done', check for task_complete workflows
    if (status === 'done') {
      const { data: workflows } = await supabaseHelpers.supabase
        .from('workflows')
        .select('*')
        .eq('trigger_type', 'task_complete')
        .eq('is_active', true)

      if (workflows && workflows.length > 0) {
        // Trigger each active task_complete workflow
        for (const workflow of workflows) {
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/workflows/run`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              workflowId: workflow.id,
              triggeredBy: 'task_complete',
              projectId: task.project_id
            })
          })
        }
      }
    }

    return NextResponse.json({ success: true, task })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}