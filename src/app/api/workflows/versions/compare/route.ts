import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface VersionComparison {
  workflow_id: string
  version1: {
    id: string
    version_number: number
    version_name: string
    template_data: any
    created_at: string
  }
  version2: {
    id: string
    version_number: number
    version_name: string
    template_data: any
    created_at: string
  }
  differences: {
    steps: {
      added: any[]
      removed: any[]
      modified: {
        step_id: string
        field: string
        old_value: any
        new_value: any
      }[]
    }
    triggers: {
      added: any[]
      removed: any[]
      modified: any[]
    }
    config: {
      added: any[]
      removed: any[]
      modified: any[]
    }
  }
  summary: {
    total_changes: number
    breaking_changes: number
    compatibility: 'compatible' | 'minor_issues' | 'breaking'
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const version1Id = searchParams.get('version1')
    const version2Id = searchParams.get('version2')

    if (!version1Id || !version2Id) {
      return NextResponse.json({
        success: false,
        message: 'Both version1 and version2 parameters are required'
      }, { status: 400 })
    }

    // Fetch both versions
    const { data: versions, error: versionsError } = await supabase
      .from('workflow_versions')
      .select(`
        id,
        workflow_id,
        version_number,
        version_name,
        template_data,
        created_at
      `)
      .in('id', [version1Id, version2Id])

    if (versionsError) throw versionsError

    if (!versions || versions.length !== 2) {
      return NextResponse.json({
        success: false,
        message: 'One or both versions not found'
      }, { status: 404 })
    }

    // Ensure both versions belong to the same workflow
    if (versions[0].workflow_id !== versions[1].workflow_id) {
      return NextResponse.json({
        success: false,
        message: 'Cannot compare versions from different workflows'
      }, { status: 400 })
    }

    // Sort versions by version number
    const [olderVersion, newerVersion] = versions.sort((a, b) => a.version_number - b.version_number)

    // Compare the versions
    const comparison = compareVersions(olderVersion, newerVersion)

    return NextResponse.json({
      success: true,
      comparison
    })

  } catch (error) {
    console.error('Error comparing workflow versions:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to compare workflow versions',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function compareVersions(version1: any, version2: any): VersionComparison {
  const template1 = version1.template_data
  const template2 = version2.template_data

  // Compare steps
  const stepsDiff = compareSteps(template1.steps || [], template2.steps || [])
  
  // Compare triggers
  const triggersDiff = compareTriggers(template1.triggers || [], template2.triggers || [])
  
  // Compare config
  const configDiff = compareConfig(template1.config || {}, template2.config || {})

  const totalChanges = stepsDiff.added.length + stepsDiff.removed.length + stepsDiff.modified.length +
                      triggersDiff.added.length + triggersDiff.removed.length + triggersDiff.modified.length +
                      configDiff.added.length + configDiff.removed.length + configDiff.modified.length

  // Determine breaking changes
  const breakingChanges = stepsDiff.removed.length + 
                         stepsDiff.modified.filter(change => isBreakingChange(change)).length +
                         triggersDiff.removed.length +
                         configDiff.modified.filter(change => isBreakingConfigChange(change)).length

  let compatibility: 'compatible' | 'minor_issues' | 'breaking' = 'compatible'
  if (breakingChanges > 0) {
    compatibility = 'breaking'
  } else if (totalChanges > 5) {
    compatibility = 'minor_issues'
  }

  return {
    workflow_id: version1.workflow_id,
    version1: {
      id: version1.id,
      version_number: version1.version_number,
      version_name: version1.version_name,
      template_data: version1.template_data,
      created_at: version1.created_at
    },
    version2: {
      id: version2.id,
      version_number: version2.version_number,
      version_name: version2.version_name,
      template_data: version2.template_data,
      created_at: version2.created_at
    },
    differences: {
      steps: stepsDiff,
      triggers: triggersDiff,
      config: configDiff
    },
    summary: {
      total_changes: totalChanges,
      breaking_changes: breakingChanges,
      compatibility
    }
  }
}

function compareSteps(steps1: any[], steps2: any[]): {
  added: any[]
  removed: any[]
  modified: {
    step_id: string
    field: string
    old_value: any
    new_value: any
  }[]
} {
  const steps1Map = new Map(steps1.map(step => [step.id, step]))
  const steps2Map = new Map(steps2.map(step => [step.id, step]))

  const added = steps2.filter(step => !steps1Map.has(step.id))
  const removed = steps1.filter(step => !steps2Map.has(step.id))
  const modified: any[] = []

  // Find modified steps
  for (const [stepId, step1] of steps1Map) {
    const step2 = steps2Map.get(stepId)
    if (step2) {
      const stepModifications = compareObjects(step1, step2, stepId)
      modified.push(...stepModifications)
    }
  }

  return { added, removed, modified }
}

function compareTriggers(triggers1: any[], triggers2: any[]): {
  added: any[]
  removed: any[]
  modified: any[]
} {
  // Simple array comparison for triggers
  const added = triggers2.filter(t2 => 
    !triggers1.some(t1 => t1.type === t2.type && t1.condition === t2.condition)
  )
  const removed = triggers1.filter(t1 => 
    !triggers2.some(t2 => t2.type === t1.type && t2.condition === t1.condition)
  )
  
  return { added, removed, modified: [] }
}

function compareConfig(config1: any, config2: any): {
  added: any[]
  removed: any[]
  modified: any[]
} {
  const added: any[] = []
  const removed: any[] = []
  const modified: any[] = []

  // Find added keys
  for (const [key, value] of Object.entries(config2)) {
    if (!(key in config1)) {
      added.push({ key, value })
    } else if (JSON.stringify(config1[key]) !== JSON.stringify(value)) {
      modified.push({ key, old_value: config1[key], new_value: value })
    }
  }

  // Find removed keys
  for (const [key, value] of Object.entries(config1)) {
    if (!(key in config2)) {
      removed.push({ key, value })
    }
  }

  return { added, removed, modified }
}

function compareObjects(obj1: any, obj2: any, stepId: string): any[] {
  const modifications: any[] = []
  const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)])

  for (const key of allKeys) {
    if (key === 'id') continue // Skip ID field

    const value1 = obj1[key]
    const value2 = obj2[key]

    if (value1 === undefined && value2 !== undefined) {
      modifications.push({
        step_id: stepId,
        field: key,
        old_value: undefined,
        new_value: value2
      })
    } else if (value1 !== undefined && value2 === undefined) {
      modifications.push({
        step_id: stepId,
        field: key,
        old_value: value1,
        new_value: undefined
      })
    } else if (JSON.stringify(value1) !== JSON.stringify(value2)) {
      modifications.push({
        step_id: stepId,
        field: key,
        old_value: value1,
        new_value: value2
      })
    }
  }

  return modifications
}

function isBreakingChange(change: any): boolean {
  // Define which field changes are considered breaking
  const breakingFields = [
    'type',
    'action',
    'required_inputs',
    'outputs',
    'dependencies'
  ]
  
  return breakingFields.includes(change.field)
}

function isBreakingConfigChange(change: any): boolean {
  // Define which config changes are breaking
  const breakingConfigKeys = [
    'schedule',
    'permissions',
    'resource_limits',
    'timeout'
  ]
  
  return breakingConfigKeys.includes(change.key)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { versionId, rollbackReason, rollbackBy } = body

    if (!versionId) {
      return NextResponse.json({
        success: false,
        message: 'versionId is required'
      }, { status: 400 })
    }

    // Get the version to rollback to
    const { data: targetVersion, error: versionError } = await supabase
      .from('workflow_versions')
      .select('workflow_id, version_number, template_data, version_name')
      .eq('id', versionId)
      .single()

    if (versionError) throw versionError
    if (!targetVersion) {
      return NextResponse.json({
        success: false,
        message: 'Version not found'
      }, { status: 404 })
    }

    // Deactivate all current versions
    const { error: deactivateError } = await supabase
      .from('workflow_versions')
      .update({ is_active: false })
      .eq('workflow_id', targetVersion.workflow_id)

    if (deactivateError) throw deactivateError

    // Activate the target version
    const { error: activateError } = await supabase
      .from('workflow_versions')
      .update({ is_active: true, is_published: true })
      .eq('id', versionId)

    if (activateError) throw activateError

    // Update the main workflow record
    const { error: updateWorkflowError } = await supabase
      .from('workflows')
      .update({
        template: targetVersion.template_data,
        updated_at: new Date().toISOString(),
        current_version: targetVersion.version_number
      })
      .eq('id', targetVersion.workflow_id)

    if (updateWorkflowError) throw updateWorkflowError

    // Log the rollback
    await supabase
      .from('workflow_version_history')
      .insert({
        workflow_id: targetVersion.workflow_id,
        event_type: 'version_rollback',
        metadata: {
          rolled_back_to_version: targetVersion.version_number,
          rolled_back_to_name: targetVersion.version_name,
          reason: rollbackReason,
          performed_by: rollbackBy
        },
        timestamp: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      message: `Successfully rolled back to version ${targetVersion.version_number}`
    })

  } catch (error) {
    console.error('Error rolling back workflow version:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to rollback workflow version',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}