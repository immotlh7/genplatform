import { NextRequest, NextResponse } from 'next/server'
import { readdir, readFile, stat } from 'fs/promises'
import { join } from 'path'
import { config } from '@/lib/config'

interface Skill {
  name: string
  description: string
  location: string
  lastModified: string
  size: number
  active: boolean
  category?: string
}

export async function GET(request: NextRequest) {
  try {
    const skillsPath = join(config.workspacePath, 'skills')
    
    // Check if skills directory exists
    try {
      const skillsStats = await stat(skillsPath)
      if (!skillsStats.isDirectory()) {
        throw new Error('Skills path is not a directory')
      }
    } catch {
      return NextResponse.json({
        skills: [],
        count: 0,
        error: 'Skills directory not found'
      })
    }

    const skillDirs = await readdir(skillsPath)
    const skills: Skill[] = []

    for (const skillDir of skillDirs) {
      const skillPath = join(skillsPath, skillDir)
      const skillMdPath = join(skillPath, 'SKILL.md')
      
      try {
        const skillStats = await stat(skillPath)
        if (!skillStats.isDirectory()) continue

        // Try to read SKILL.md for description
        let description = 'No description available'
        let category = 'Unknown'
        
        try {
          const skillMd = await readFile(skillMdPath, 'utf-8')
          
          // Extract description from markdown
          const descMatch = skillMd.match(/^#\s+(.+?)$/m)
          if (descMatch) {
            description = descMatch[1]
          }
          
          // Look for description in frontmatter or content
          const descRegex = /description[:\s]+(.+)/i
          const descriptionMatch = skillMd.match(descRegex)
          if (descriptionMatch) {
            description = descriptionMatch[1].trim()
          }
          
          // Simple category detection
          if (skillMd.toLowerCase().includes('github')) category = 'Development'
          else if (skillMd.toLowerCase().includes('security')) category = 'Security'
          else if (skillMd.toLowerCase().includes('system')) category = 'System'
          else if (skillMd.toLowerCase().includes('ai') || skillMd.toLowerCase().includes('agent')) category = 'AI'
          
        } catch {
          // SKILL.md doesn't exist or can't be read
        }

        const skill: Skill = {
          name: skillDir,
          description: description.substring(0, 200), // Limit length
          location: skillPath,
          lastModified: skillStats.mtime.toISOString(),
          size: skillStats.size,
          active: Math.random() > 0.3, // Random for demo - would check actual status
          category
        }

        skills.push(skill)
      } catch (error) {
        console.error(`Error processing skill ${skillDir}:`, error)
      }
    }

    // Sort by name
    skills.sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json({
      skills,
      count: skills.length,
      categories: [...new Set(skills.map(s => s.category))],
      lastScanned: new Date().toISOString()
    })

  } catch (error) {
    console.error('Skills API error:', error)
    return NextResponse.json(
      { error: 'Failed to scan skills directory' },
      { status: 500 }
    )
  }
}