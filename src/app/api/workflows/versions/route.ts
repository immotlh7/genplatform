import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const workflowId = searchParams.get('workflowId')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!workflowId) {
      return NextResponse.json({
        success: false,
        message: 'workflowId parameter is required'
      }, { status: 400 })
    }

    // Fetch workflow versions
    const { data: versions, error: versionsError } = await supabase
      .from('workflow_versions')
      .select(`
        id,
        workflow_id,
        version_number,
        version_name,
        template_data,
        changelog,
        created_by,
        is_active,
        is_published,
        created_at,
        updated_at,
        metadata
      `)
      .eq('workflow_id', workflowId)
      .order('version_number', { ascending: false })
      .range(offset, offset + limit - 1)

    if (versionsError) throw versionsError

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('workflow_versions')
      .select('id', { count: 'exact', head: true })
      .eq('workflow_id', workflowId)

    if (countError) throw countError

    return NextResponse.json({
      success: true,
      versions: versions || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    })

  } catch (error) {
    console.error('Error fetching workflow versions:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch workflow versions',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { 
      workflowId, 
      templateData, 
      versionName, 
      changelog, 
      createdBy,
      isPublished = false,
      metadata = {}
    } = body

    if (!workflowId || !templateData || !versionName) {
      return NextResponse.json({
        success: false,
        message: 'workflowId, templateData, and versionName are required'
      }, { status: 400 })
    }

    // Get the latest version number
    const { data: latestVersion, error: latestError } = await supabase
      .from('workflow_versions')
      .select('version_number')
      .eq('workflow_id', workflowId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single()

    const newVersionNumber = latestVersion ? latestVersion.version_number + 1 : 1

    // If this is being published, deactivate all other versions
    if (isPublished) {
      const { error: deactivateError } = await supabase
        .from('workflow_versions')
        .update({ is_active: false })
        .eq('workflow_id', workflowId)

      if (deactivateError) {
        console.warn('Failed to deactivate previous versions:', deactivateError)
      }
    }

    // Create new version
    const { data: newVersion, error: createError } = await supabase
      .from('workflow_versions')
      .insert({
        workflow_id: workflowId,
        version_number: newVersionNumber,
        version_name: versionName,
        template_data: templateData,
        changelog: changelog || [],
        created_by: createdBy,
        is_active: isPublished,
        is_published: isPublished,
        metadata: metadata
      })
      .select()
      .single()

    if (createError) throw createError

    // Update the main workflow record if this version is being published
    if (isPublished) {
      const { error: updateWorkflowError } = await supabase
        .from('workflows')
        .update({
          template: templateData,
          updated_at: new Date().toISOString(),
          current_version: newVersionNumber
        })
        .eq('id', workflowId)

      if (updateWorkflowError) {
        console.error('Failed to update main workflow record:', updateWorkflowError)
        // Don't fail the request, just log the error
      }
    }

    // Log the version creation
    await logVersionEvent(workflowId, 'version_created', {
      version_number: newVersionNumber,
      version_name: versionName,
      created_by: createdBy,
      published: isPublished
    })

    return NextResponse.json({
      success: true,
      message: 'Workflow version created successfully',
      version: newVersion
    })

  } catch (error) {
    console.error('Error creating workflow version:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to create workflow version',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { 
      versionId, 
      versionName, 
      templateData, 
      changelog, 
      isPublished,
      metadata 
    } = body

    if (!versionId) {
      return NextResponse.json({
        success: false,
        message: 'versionId is required'
      }, { status: 400 })
    }

    // Get current version info
    const { data: currentVersion, error: currentError } = await supabase
      .from('workflow_versions')
      .select('workflow_id, version_number, is_active, is_published')
      .eq('id', versionId)
      .single()

    if (currentError) throw currentError
    if (!currentVersion) {
      return NextResponse.json({
        success: false,
        message: 'Version not found'
      }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {}
    if (versionName !== undefined) updateData.version_name = versionName
    if (templateData !== undefined) updateData.template_data = templateData
    if (changelog !== undefined) updateData.changelog = changelog
    if (metadata !== undefined) updateData.metadata = metadata
    if (isPublished !== undefined) {
      updateData.is_published = isPublished
      updateData.is_active = isPublished
    }

    updateData.updated_at = new Date().toISOString()

    // If publishing this version, deactivate others
    if (isPublished && !currentVersion.is_published) {
      const { error: deactivateError } = await supabase
        .from('workflow_versions')
        .update({ is_active: false })
        .eq('workflow_id', currentVersion.workflow_id)
        .neq('id', versionId)

      if (deactivateError) {
        console.warn('Failed to deactivate other versions:', deactivateError)
      }

      // Update main workflow record
      if (templateData) {
        const { error: updateWorkflowError } = await supabase
          .from('workflows')
          .update({
            template: templateData,
            updated_at: new Date().toISOString(),
            current_version: currentVersion.version_number
          })
          .eq('id', currentVersion.workflow_id)

        if (updateWorkflowError) {
          console.error('Failed to update main workflow:', updateWorkflowError)
        }
      }
    }

    // Update the version
    const { data: updatedVersion, error: updateError } = await supabase
      .from('workflow_versions')
      .update(updateData)
      .eq('id', versionId)
      .select()
      .single()

    if (updateError) throw updateError

    // Log the update
    await logVersionEvent(currentVersion.workflow_id, 'version_updated', {
      version_id: versionId,
      version_number: currentVersion.version_number,
      changes: Object.keys(updateData)
    })

    return NextResponse.json({
      success: true,
      message: 'Workflow version updated successfully',
      version: updatedVersion
    })

  } catch (error) {
    console.error('Error updating workflow version:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to update workflow version',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const versionId = searchParams.get('versionId')

    if (!versionId) {
      return NextResponse.json({
        success: false,
        message: 'versionId parameter is required'
      }, { status: 400 })
    }

    // Get version info before deletion
    const { data: version, error: versionError } = await supabase
      .from('workflow_versions')
      .select('workflow_id, version_number, is_active, is_published')
      .eq('id', versionId)
      .single()

    if (versionError) throw versionError
    if (!version) {
      return NextResponse.json({
        success: false,
        message: 'Version not found'
      }, { status: 404 })
    }

    // Check if this is the only version
    const { count: versionCount, error: countError } = await supabase
      .from('workflow_versions')
      .select('id', { count: 'exact', head: true })
      .eq('workflow_id', version.workflow_id)

    if (countError) throw countError

    if (versionCount === 1) {
      return NextResponse.json({
        success: false,
        message: 'Cannot delete the only version of a workflow'
      }, { status: 400 })
    }

    // If deleting the active version, activate the previous version
    if (version.is_active) {
      const { data: previousVersion, error: prevError } = await supabase
        .from('workflow_versions')
        .select('id, template_data, version_number')
        .eq('workflow_id', version.workflow_id)
        .neq('id', versionId)
        .order('version_number', { ascending: false })
        .limit(1)
        .single()

      if (prevError) {
        console.warn('Failed to find previous version:', prevError)
      } else {
        // Activate previous version
        const { error: activateError } = await supabase
          .from('workflow_versions')
          .update({ is_active: true, is_published: true })
          .eq('id', previousVersion.id)

        if (activateError) {
          console.warn('Failed to activate previous version:', activateError)
        } else {
          // Update main workflow record
          const { error: updateWorkflowError } = await supabase
            .from('workflows')
            .update({
              template: previousVersion.template_data,
              updated_at: new Date().toISOString(),
              current_version: previousVersion.version_number
            })
            .eq('id', version.workflow_id)

          if (updateWorkflowError) {
            console.error('Failed to update main workflow:', updateWorkflowError)
          }
        }
      }
    }

    // Delete the version
    const { error: deleteError } = await supabase
      .from('workflow_versions')
      .delete()
      .eq('id', versionId)

    if (deleteError) throw deleteError

    // Log the deletion
    await logVersionEvent(version.workflow_id, 'version_deleted', {
      version_number: version.version_number,
      was_active: version.is_active
    })

    return NextResponse.json({
      success: true,
      message: 'Workflow version deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting workflow version:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to delete workflow version',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Helper function to log version events
async function logVersionEvent(workflowId: string, eventType: string, metadata: any) {
  try {
    await supabase
      .from('workflow_version_history')
      .insert({
        workflow_id: workflowId,
        event_type: eventType,
        metadata: metadata,
        timestamp: new Date().toISOString()
      })
  } catch (error) {
    console.error('Failed to log version event:', error)
  }
}