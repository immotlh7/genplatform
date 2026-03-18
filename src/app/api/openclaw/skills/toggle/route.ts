import { NextRequest, NextResponse } from 'next/server'
import { writeFile, readFile, access } from 'fs/promises'
import { join } from 'path'
import { config } from '@/lib/config'

export async function POST(request: NextRequest) {
  try {
    const { skillName } = await request.json()

    if (!skillName) {
      return NextResponse.json(
        { error: 'Skill name is required' },
        { status: 400 }
      )
    }

    // Path to skill configuration file
    const skillPath = join(config.workspacePath, 'skills', skillName)
    const configPath = join(skillPath, 'config.json')

    // Check if skill exists
    try {
      await access(skillPath)
    } catch {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      )
    }

    // Read current configuration
    let skillConfig = { enabled: false }
    try {
      const configData = await readFile(configPath, 'utf-8')
      skillConfig = JSON.parse(configData)
    } catch {
      // If no config file exists, create default
      skillConfig = { enabled: false }
    }

    // Toggle the enabled state
    skillConfig.enabled = !skillConfig.enabled
    skillConfig.lastModified = new Date().toISOString()

    // Write updated configuration
    await writeFile(configPath, JSON.stringify(skillConfig, null, 2))

    // In a real implementation, you would also:
    // 1. Restart skill process if it's running
    // 2. Update skill registry
    // 3. Notify other services
    // 4. Log the change

    console.log(`Skill ${skillName} ${skillConfig.enabled ? 'enabled' : 'disabled'}`)

    return NextResponse.json({
      success: true,
      skillName,
      enabled: skillConfig.enabled,
      message: `Skill ${skillConfig.enabled ? 'enabled' : 'disabled'} successfully`
    })

  } catch (error) {
    console.error('Toggle skill error:', error)
    return NextResponse.json(
      { error: 'Failed to toggle skill' },
      { status: 500 }
    )
  }
}