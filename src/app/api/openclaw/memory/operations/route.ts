import { NextRequest, NextResponse } from 'next/server'
import { writeFile, readFile, unlink, rename, mkdir, stat, access } from 'fs/promises'
import { join, dirname, basename } from 'path'
import { config } from '@/lib/config'

interface OperationRequest {
  action: 'create' | 'rename' | 'delete' | 'copy' | 'move' | 'mkdir'
  path: string
  newPath?: string
  content?: string
  isDirectory?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const { action, path, newPath, content, isDirectory }: OperationRequest = await request.json()

    if (!action || !path) {
      return NextResponse.json(
        { error: 'Action and path are required' },
        { status: 400 }
      )
    }

    const fullPath = join(config.workspacePath, 'memory', path)
    const newFullPath = newPath ? join(config.workspacePath, 'memory', newPath) : undefined

    // Security checks
    if (!fullPath.startsWith(join(config.workspacePath, 'memory'))) {
      return NextResponse.json(
        { error: 'Invalid path - outside memory directory' },
        { status: 403 }
      )
    }

    if (newFullPath && !newFullPath.startsWith(join(config.workspacePath, 'memory'))) {
      return NextResponse.json(
        { error: 'Invalid new path - outside memory directory' },
        { status: 403 }
      )
    }

    switch (action) {
      case 'create':
        return await handleCreate(fullPath, content, isDirectory)
      
      case 'rename':
        if (!newFullPath) {
          return NextResponse.json(
            { error: 'newPath is required for rename operation' },
            { status: 400 }
          )
        }
        return await handleRename(fullPath, newFullPath)
      
      case 'delete':
        return await handleDelete(fullPath, path)
      
      case 'copy':
        if (!newFullPath) {
          return NextResponse.json(
            { error: 'newPath is required for copy operation' },
            { status: 400 }
          )
        }
        return await handleCopy(fullPath, newFullPath)
      
      case 'move':
        if (!newFullPath) {
          return NextResponse.json(
            { error: 'newPath is required for move operation' },
            { status: 400 }
          )
        }
        return await handleMove(fullPath, newFullPath)
      
      case 'mkdir':
        return await handleMkdir(fullPath, path)
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('File operation error:', error)
    return NextResponse.json(
      { 
        error: 'Operation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function handleCreate(fullPath: string, content?: string, isDirectory?: boolean) {
  try {
    // Check if file/directory already exists
    try {
      await access(fullPath)
      return NextResponse.json(
        { error: 'File or directory already exists' },
        { status: 409 }
      )
    } catch {
      // Good, doesn't exist
    }

    // Ensure parent directory exists
    await mkdir(dirname(fullPath), { recursive: true })

    if (isDirectory) {
      await mkdir(fullPath, { recursive: true })
      return NextResponse.json({
        success: true,
        message: 'Directory created successfully',
        path: fullPath,
        type: 'directory'
      })
    } else {
      // Create file with content
      const fileContent = content || ''
      await writeFile(fullPath, fileContent, 'utf-8')
      
      return NextResponse.json({
        success: true,
        message: 'File created successfully',
        path: fullPath,
        type: 'file',
        size: fileContent.length
      })
    }
  } catch (error) {
    throw new Error(`Failed to create: ${error}`)
  }
}

async function handleRename(oldPath: string, newPath: string) {
  try {
    // Check if old path exists
    try {
      await access(oldPath)
    } catch {
      return NextResponse.json(
        { error: 'Source file or directory not found' },
        { status: 404 }
      )
    }

    // Check if new path already exists
    try {
      await access(newPath)
      return NextResponse.json(
        { error: 'Destination already exists' },
        { status: 409 }
      )
    } catch {
      // Good, destination doesn't exist
    }

    // Ensure destination directory exists
    await mkdir(dirname(newPath), { recursive: true })

    // Perform rename
    await rename(oldPath, newPath)

    return NextResponse.json({
      success: true,
      message: 'Renamed successfully',
      oldPath,
      newPath
    })

  } catch (error) {
    throw new Error(`Failed to rename: ${error}`)
  }
}

async function handleDelete(fullPath: string, relativePath: string) {
  try {
    // Check if file exists
    let fileStats
    try {
      fileStats = await stat(fullPath)
    } catch {
      return NextResponse.json(
        { error: 'File or directory not found' },
        { status: 404 }
      )
    }

    // Safety check - prevent deletion of important directories
    const protectedPaths = ['', '.', '..', 'daily', 'projects', 'areas', 'resources']
    if (protectedPaths.includes(relativePath)) {
      return NextResponse.json(
        { error: 'Cannot delete protected directory' },
        { status: 403 }
      )
    }

    if (fileStats.isDirectory()) {
      // For directories, use recursive removal (be careful!)
      const { rm } = await import('fs/promises')
      await rm(fullPath, { recursive: true, force: true })
    } else {
      // For files, simple unlink
      await unlink(fullPath)
    }

    return NextResponse.json({
      success: true,
      message: `${fileStats.isDirectory() ? 'Directory' : 'File'} deleted successfully`,
      path: fullPath,
      type: fileStats.isDirectory() ? 'directory' : 'file'
    })

  } catch (error) {
    throw new Error(`Failed to delete: ${error}`)
  }
}

async function handleCopy(sourcePath: string, destPath: string) {
  try {
    // Check if source exists
    let sourceStats
    try {
      sourceStats = await stat(sourcePath)
    } catch {
      return NextResponse.json(
        { error: 'Source file not found' },
        { status: 404 }
      )
    }

    // Check if destination already exists
    try {
      await access(destPath)
      return NextResponse.json(
        { error: 'Destination already exists' },
        { status: 409 }
      )
    } catch {
      // Good, destination doesn't exist
    }

    // Ensure destination directory exists
    await mkdir(dirname(destPath), { recursive: true })

    if (sourceStats.isFile()) {
      // Copy file content
      const content = await readFile(sourcePath, 'utf-8')
      await writeFile(destPath, content, 'utf-8')
    } else {
      // For directories, would need recursive copy (simplified here)
      return NextResponse.json(
        { error: 'Directory copying not implemented yet' },
        { status: 501 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'File copied successfully',
      sourcePath,
      destPath
    })

  } catch (error) {
    throw new Error(`Failed to copy: ${error}`)
  }
}

async function handleMove(sourcePath: string, destPath: string) {
  try {
    // Move is essentially rename
    return await handleRename(sourcePath, destPath)
  } catch (error) {
    throw new Error(`Failed to move: ${error}`)
  }
}

async function handleMkdir(fullPath: string, relativePath: string) {
  try {
    // Check if directory already exists
    try {
      const stats = await stat(fullPath)
      if (stats.isDirectory()) {
        return NextResponse.json(
          { error: 'Directory already exists' },
          { status: 409 }
        )
      }
    } catch {
      // Good, doesn't exist
    }

    await mkdir(fullPath, { recursive: true })

    return NextResponse.json({
      success: true,
      message: 'Directory created successfully',
      path: fullPath
    })

  } catch (error) {
    throw new Error(`Failed to create directory: ${error}`)
  }
}