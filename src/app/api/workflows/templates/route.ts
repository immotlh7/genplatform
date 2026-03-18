import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { workflowTemplates } from '@/lib/workflow-templates'

export async function POST(req: NextRequest) {
  try {
    const { action } = await req.json()

    if (action === 'seed_templates') {
      // Insert all workflow templates into the database
      const templateInserts = workflowTemplates.map(template => ({
        name: template.name,
        description: template.description,
        template_type: template.template_type,
        is_active: template.is_active,
        trigger_type: template.trigger_type,
        schedule: template.schedule || null,
        config: {
          steps: template.steps,
          priority: template.config.priority,
          category: template.config.category,
          estimatedTotalMinutes: template.config.estimatedTotalMinutes
        }
      }))

      console.log('Seeding workflow templates:', templateInserts.length)

      const { data, error } = await supabase
        .from('workflows')
        .upsert(templateInserts, { 
          onConflict: 'name',
          ignoreDuplicates: false 
        })
        .select()

      if (error) {
        console.error('Error seeding templates:', error)
        return NextResponse.json({
          success: false,
          message: 'Failed to seed workflow templates',
          error: error.message
        }, { status: 500 })
      }

      console.log('✅ Successfully seeded workflow templates:', data?.length)

      return NextResponse.json({
        success: true,
        message: `Successfully seeded ${data?.length} workflow templates`,
        templates: data
      })
    }

    return NextResponse.json({
      success: false,
      message: 'Invalid action'
    }, { status: 400 })

  } catch (error) {
    console.error('Templates API error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Return the template definitions
    return NextResponse.json({
      success: true,
      templates: workflowTemplates,
      count: workflowTemplates.length
    })
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch templates',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}