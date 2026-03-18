import { NextRequest, NextResponse } from 'next/server'
import { readdir, readFile, stat } from 'fs/promises'
import { join } from 'path'
import { config } from '@/lib/config'

interface MemoryFile {
  name: string
  path: string
  size: number
  lastModified: string
  type: 'file' | 'directory'
  isMarkdown: boolean
  preview?: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path') || ''
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''

    const memoryPath = join(config.workspacePath, 'memory', path)
    
    // Security check - ensure path is within workspace
    if (!memoryPath.startsWith(config.workspacePath)) {
      return NextResponse.json(
        { error: 'Invalid path' },
        { status: 403 }
      )
    }

    try {
      const memoryStats = await stat(memoryPath)
      
      if (memoryStats.isFile()) {
        // Return single file content
        const content = await readFile(memoryPath, 'utf-8')
        return NextResponse.json({
          type: 'file',
          content,
          name: path.split('/').pop(),
          size: memoryStats.size,
          lastModified: memoryStats.mtime.toISOString()
        })
      }

      // List directory contents
      const entries = await readdir(memoryPath)
      const files: MemoryFile[] = []

      for (const entry of entries) {
        const entryPath = join(memoryPath, entry)
        const entryStats = await stat(entryPath)
        
        const file: MemoryFile = {
          name: entry,
          path: path ? `${path}/${entry}` : entry,
          size: entryStats.size,
          lastModified: entryStats.mtime.toISOString(),
          type: entryStats.isDirectory() ? 'directory' : 'file',
          isMarkdown: entry.endsWith('.md')
        }

        // Add preview for markdown files
        if (file.isMarkdown && entryStats.size < 10000) {
          try {
            const content = await readFile(entryPath, 'utf-8')
            file.preview = content.substring(0, 200) + (content.length > 200 ? '...' : '')
          } catch {
            // Ignore preview errors
          }
        }

        // Filter by search term
        if (search && !entry.toLowerCase().includes(search.toLowerCase())) {
          continue
        }

        files.push(file)
      }

      // Sort: directories first, then files, alphabetically
      files.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1
        }
        return a.name.localeCompare(b.name)
      })

      // Apply limit
      const limitedFiles = files.slice(0, limit)

      // Calculate totals
      const totalSize = files.reduce((sum, file) => sum + file.size, 0)
      const totalFiles = files.filter(f => f.type === 'file').length
      const totalDirs = files.filter(f => f.type === 'directory').length

      return NextResponse.json({
        type: 'directory',
        path,
        files: limitedFiles,
        pagination: {
          total: files.length,
          limit,
          hasMore: files.length > limit
        },
        stats: {
          totalFiles,
          totalDirs,
          totalSize,
          lastScanned: new Date().toISOString()
        }
      })

    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return NextResponse.json({
          type: 'directory',
          path,
          files: [],
          stats: {
            totalFiles: 0,
            totalDirs: 0,
            totalSize: 0
          },
          error: 'Directory not found'
        })
      }
      throw error
    }

  } catch (error) {
    console.error('Memory API error:', error)
    return NextResponse.json(
      { error: 'Failed to read memory directory' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, path, content, newPath } = await request.json()

    const fullPath = join(config.workspacePath, 'memory', path || '')

    // Security check
    if (!fullPath.startsWith(config.workspacePath)) {
      return NextResponse.json(
        { error: 'Invalid path' },
        { status: 403 }
      )
    }

    if (action === 'save' && content !== undefined) {
      // Save file content
      const { writeFile } = await import('fs/promises')
      await writeFile(fullPath, content, 'utf-8')
      
      return NextResponse.json({
        success: true,
        message: 'File saved successfully',
        path
      })
    }

    if (action === 'delete') {
      // Delete file (implement carefully with safety checks)
      return NextResponse.json({
        success: true,
        message: 'Delete operation would be implemented here',
        path
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Memory POST error:', error)
    return NextResponse.json(
      { error: 'Failed to perform memory operation' },
      { status: 500 }
    )
  }
}