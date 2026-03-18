import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET /api/workflows/[id] - Get specific workflow
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const workflowId = (await context.params).id

    // Fetch workflow from Supabase
    const { data: workflow, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, message: 'Workflow not found' },
          { status: 404 }
        )
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      workflow,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching workflow:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// PATCH /api/workflows/[id] - Update workflow configuration
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const workflowId = (await context.params).id
    const updates = await req.json()

    // Validate the updates
    const allowedFields = [
      'name', 
      'description', 
      'is_active', 
      'trigger_type', 
      'schedule', 
      'config'
    ]

    const updateData: Record<string, any> = {}
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateData[key] = value
      }
    }

    // Additional validation
    if (updateData.trigger_type === 'schedule' && !updateData.schedule) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Schedule is required when trigger type is "schedule"' 
        },
        { status: 400 }
      )
    }

    // If changing to non-schedule trigger, clear schedule
    if (updateData.trigger_type && updateData.trigger_type !== 'schedule') {
      updateData.schedule = null
    }

    // Validate cron expression if schedule is provided
    if (updateData.schedule && updateData.trigger_type === 'schedule') {
      if (!isValidCronExpression(updateData.schedule)) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Invalid schedule format. Use cron expression (5 parts) or @-notation.' 
          },
          { status: 400 }
        )
      }
    }

    // Check if workflow exists first
    const { data: existingWorkflow, error: fetchError } = await supabase
      .from('workflows')
      .select('id, name')
      .eq('id', workflowId)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, message: 'Workflow not found' },
          { status: 404 }
        )
      }
      throw fetchError
    }

    // Update the workflow
    const { data: updatedWorkflow, error: updateError } = await supabase
      .from('workflows')
      .update(updateData)
      .eq('id', workflowId)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    console.log(`✅ Workflow "${existingWorkflow.name}" updated:`, updateData)

    return NextResponse.json({
      success: true,
      workflow: updatedWorkflow,
      message: 'Workflow updated successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error updating workflow:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// DELETE /api/workflows/[id] - Delete workflow
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const workflowId = (await context.params).id

    // Check if workflow exists and get its name for logging
    const { data: existingWorkflow, error: fetchError } = await supabase
      .from('workflows')
      .select('id, name')
      .eq('id', workflowId)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, message: 'Workflow not found' },
          { status: 404 }
        )
      }
      throw fetchError
    }

    // Delete the workflow (this will cascade to workflow_runs due to foreign key)
    const { error: deleteError } = await supabase
      .from('workflows')
      .delete()
      .eq('id', workflowId)

    if (deleteError) {
      throw deleteError
    }

    console.log(`🗑️ Workflow "${existingWorkflow.name}" deleted`)

    return NextResponse.json({
      success: true,
      message: `Workflow "${existingWorkflow.name}" deleted successfully`,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error deleting workflow:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Helper function to validate cron expressions
function isValidCronExpression(schedule: string): boolean {
  // Allow @-notation
  if (schedule.startsWith('@')) {
    const validAtNotations = [
      '@yearly', '@annually', '@monthly', '@weekly', 
      '@daily', '@midnight', '@hourly'
    ]
    return validAtNotations.includes(schedule.toLowerCase())
  }

  // Validate standard cron expression (5 parts)
  const parts = schedule.trim().split(/\s+/)
  if (parts.length !== 5) {
    return false
  }

  // Basic validation for each part
  const [minute, hour, day, month, dayOfWeek] = parts

  // Minute: 0-59 or * or */n or n-m or n,m
  if (!isValidCronField(minute, 0, 59)) return false

  // Hour: 0-23 or * or */n or n-m or n,m
  if (!isValidCronField(hour, 0, 23)) return false

  // Day: 1-31 or * or */n or n-m or n,m
  if (!isValidCronField(day, 1, 31)) return false

  // Month: 1-12 or * or */n or n-m or n,m
  if (!isValidCronField(month, 1, 12)) return false

  // Day of week: 0-7 (both 0 and 7 are Sunday) or * or */n or n-m or n,m
  if (!isValidCronField(dayOfWeek, 0, 7)) return false

  return true
}

function isValidCronField(field: string, min: number, max: number): boolean {
  // Wildcard
  if (field === '*') return true

  // Step values (*/n)
  if (field.includes('*/')) {
    const step = field.split('/')[1]
    const stepNum = parseInt(step)
    return !isNaN(stepNum) && stepNum > 0 && stepNum <= max
  }

  // Range (n-m)
  if (field.includes('-')) {
    const [start, end] = field.split('-').map(n => parseInt(n))
    return !isNaN(start) && !isNaN(end) && 
           start >= min && start <= max && 
           end >= min && end <= max && 
           start <= end
  }

  // List (n,m,k)
  if (field.includes(',')) {
    const values = field.split(',').map(n => parseInt(n))
    return values.every(val => !isNaN(val) && val >= min && val <= max)
  }

  // Single number
  const num = parseInt(field)
  return !isNaN(num) && num >= min && num <= max
}