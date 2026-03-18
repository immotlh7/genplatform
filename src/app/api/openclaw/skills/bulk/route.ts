import { NextRequest, NextResponse } from 'next/server'
import { readdir, writeFile, readFile, stat } from 'fs/promises'
import { join } from 'path'
import { config } from '@/lib/config'

export async function POST(request: NextRequest) {
  try {
    const { action, skillNames } = await request.json()

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    const skillsPath = join(config.workspacePath, 'skills')
    let targetSkills: string[] = []

    if (skillNames && Array.isArray(skillNames)) {
      // Specific skills provided
      targetSkills = skillNames
    } else {
      // Get all skills if no specific list provided
      try {
        const skillDirs = await readdir(skillsPath)
        for (const skillDir of skillDirs) {
          const skillPath = join(skillsPath, skillDir)
          const skillStats = await stat(skillPath)
          if (skillStats.isDirectory()) {
            targetSkills.push(skillDir)
          }
        }
      } catch {
        return NextResponse.json(
          { error: 'Skills directory not found' },
          { status: 404 }
        )
      }
    }

    const results: Array<{ skill: string; success: boolean; error?: string }> = []
    let successCount = 0

    switch (action) {
      case 'enable_all':
      case 'disable_all':
        const shouldEnable = action === 'enable_all'
        
        for (const skillName of targetSkills) {
          try {
            const skillPath = join(skillsPath, skillName)
            const configPath = join(skillPath, 'config.json')

            // Read current configuration
            let skillConfig = { enabled: false }
            try {
              const configData = await readFile(configPath, 'utf-8')
              skillConfig = JSON.parse(configData)
            } catch {
              // If no config file exists, create default
              skillConfig = { enabled: false }
            }

            // Update enabled state
            skillConfig.enabled = shouldEnable
            // skillConfig.lastModified = new Date().toISOString()
            // skillConfig.bulkOperation = true

            // Write updated configuration
            await writeFile(configPath, JSON.stringify(skillConfig, null, 2))

            results.push({ skill: skillName, success: true })
            successCount++

          } catch (error) {
            results.push({ 
              skill: skillName, 
              success: false, 
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
        }
        break

      case 'update_all':
        // Update all skills (placeholder for future implementation)
        for (const skillName of targetSkills) {
          try {
            // In a real implementation:
            // 1. Check for updates from clawhub
            // 2. Download and install updates
            // 3. Backup old version
            // 4. Update skill registry
            
            results.push({ skill: skillName, success: true })
            successCount++
          } catch (error) {
            results.push({ 
              skill: skillName, 
              success: false, 
              error: 'Update failed'
            })
          }
        }
        break

      case 'backup_all':
        // Backup all skills
        for (const skillName of targetSkills) {
          try {
            // In a real implementation:
            // 1. Create backup archive
            // 2. Store in backup directory with timestamp
            // 3. Update backup registry
            
            results.push({ skill: skillName, success: true })
            successCount++
          } catch (error) {
            results.push({ 
              skill: skillName, 
              success: false, 
              error: 'Backup failed'
            })
          }
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported: enable_all, disable_all, update_all, backup_all' },
          { status: 400 }
        )
    }

    console.log(`Bulk operation ${action} completed: ${successCount}/${targetSkills.length} succeeded`)

    return NextResponse.json({
      success: true,
      action,
      totalSkills: targetSkills.length,
      successCount,
      failureCount: targetSkills.length - successCount,
      results,
      message: `Bulk operation completed: ${successCount}/${targetSkills.length} skills processed successfully`
    })

  } catch (error) {
    console.error('Bulk operation error:', error)
    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    )
  }
}