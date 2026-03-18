import { NextRequest, NextResponse } from 'next/server'
import { rm, readFile, access } from 'fs/promises'
import { join } from 'path'
import { config } from '@/lib/config'

export async function DELETE(request: NextRequest) {
  try {
    const { skillName, force } = await request.json()

    if (!skillName) {
      return NextResponse.json(
        { error: 'Skill name is required' },
        { status: 400 }
      )
    }

    const skillsPath = join(config.workspacePath, 'skills')
    const skillPath = join(skillsPath, skillName)

    // Check if skill exists
    try {
      await access(skillPath)
    } catch {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      )
    }

    // Read skill configuration to check if it's a core skill
    let skillConfig = null
    try {
      const configData = await readFile(join(skillPath, 'config.json'), 'utf-8')
      skillConfig = JSON.parse(configData)
    } catch {
      // No config file, proceed with caution
    }

    // Prevent removal of critical/core skills unless forced
    const coreSkills = ['system', 'core', 'essential', 'security']
    if (!force && skillConfig?.core === true) {
      return NextResponse.json(
        { 
          error: 'Cannot uninstall core skill without force flag',
          isCore: true,
          skillName
        },
        { status: 403 }
      )
    }

    if (!force && coreSkills.some(core => skillName.toLowerCase().includes(core))) {
      return NextResponse.json(
        { 
          error: 'This appears to be a core skill. Use force=true to uninstall anyway.',
          warning: true,
          skillName
        },
        { status: 403 }
      )
    }

    // Check if skill is currently active
    if (!force && skillConfig?.enabled === true) {
      return NextResponse.json(
        { 
          error: 'Skill is currently active. Disable it first or use force=true to uninstall.',
          isActive: true,
          skillName
        },
        { status: 409 }
      )
    }

    // Perform pre-uninstall cleanup
    try {
      // In a real implementation:
      // 1. Stop skill if running
      // 2. Remove from skill registry
      // 3. Clean up any scheduled tasks
      // 4. Remove from memory/cache
      // 5. Run pre-uninstall hooks
      console.log(`Performing pre-uninstall cleanup for ${skillName}`)
    } catch (error) {
      console.warn(`Pre-uninstall cleanup failed for ${skillName}:`, error)
    }

    // Create backup before removal (optional)
    if (skillConfig?.backup !== false) {
      try {
        // In a real implementation:
        // 1. Create timestamped backup
        // 2. Archive skill directory
        // 3. Store backup metadata
        console.log(`Creating backup for ${skillName} before removal`)
      } catch (error) {
        console.warn(`Backup creation failed for ${skillName}:`, error)
      }
    }

    // Remove skill directory
    try {
      await rm(skillPath, { recursive: true, force: true })
    } catch (error) {
      return NextResponse.json(
        { 
          error: 'Failed to remove skill files',
          details: error instanceof Error ? error.message : 'Unknown error',
          skillPath
        },
        { status: 500 }
      )
    }

    // Verify removal
    try {
      await access(skillPath)
      // If we get here, the removal failed
      return NextResponse.json(
        { error: 'Skill directory still exists after removal attempt' },
        { status: 500 }
      )
    } catch {
      // Good, skill directory no longer exists
    }

    // Perform post-uninstall cleanup
    try {
      // In a real implementation:
      // 1. Update skill registry
      // 2. Notify other services
      // 3. Clean up dependencies if not used by other skills
      // 4. Update skill indexes
      // 5. Run post-uninstall hooks
      console.log(`Performing post-uninstall cleanup for ${skillName}`)
    } catch (error) {
      console.warn(`Post-uninstall cleanup failed for ${skillName}:`, error)
    }

    return NextResponse.json({
      success: true,
      skillName,
      removedPath: skillPath,
      forced: force === true,
      message: `Skill '${skillName}' uninstalled successfully`,
      timestamp: new Date().toISOString(),
      warnings: force ? ['Skill was force-removed without safety checks'] : []
    })

  } catch (error) {
    console.error('Skill uninstallation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to uninstall skill',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}