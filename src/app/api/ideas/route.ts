import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserServer } from '@/lib/access-control'
import { supabaseHelpers } from '@/lib/supabase'

// Wire "New Idea" submission to trigger workflow (Task 7-17)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserServer()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, language } = body

    // Create idea in database
    const { data: idea, error } = await supabaseHelpers.supabase
      .from('ideas')
      .insert({
        title,
        description,
        language,
        status: 'analyzing',
        stage: 1
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to create idea' }, { status: 500 })
    }

    // Check if "Idea to MVP" workflow is active and trigger it
    const { data: workflow } = await supabaseHelpers.supabase
      .from('workflows')
      .select('*')
      .eq('template_type', 'idea_to_mvp')
      .eq('trigger_type', 'new_idea')
      .eq('is_active', true)
      .single()

    if (workflow) {
      // Trigger workflow automatically
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/workflows/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId: workflow.id,
          triggeredBy: 'new_idea',
          projectId: idea.id
        })
      })
    }

    return NextResponse.json({ success: true, idea })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}