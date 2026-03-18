import { NextRequest, NextResponse } from 'next/server'
import { readdir, stat } from 'fs/promises'
import { join } from 'path'
import { config } from '@/lib/config'

interface TreeNode {
  name: string
  path: string
  type: 'file' | 'directory'
  size: number
  lastModified: string
  children?: TreeNode[]
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path') || ''
    
    const memoryPath = join(config.workspacePath, 'memory')
    const targetPath = path ? join(memoryPath, path) : memoryPath

    // Security check
    if (!targetPath.startsWith(memoryPath)) {
      return NextResponse.json(
        { error: 'Invalid path' },
        { status: 403 }
      )
    }

    const tree = await buildFileTree(targetPath, path, 2) // Max depth of 2 for performance

    return NextResponse.json({
      tree,
      path,
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error('File tree error:', error)
    return NextResponse.json(
      { error: 'Failed to build file tree' },
      { status: 500 }
    )
  }
}

async function buildFileTree(
  fullPath: string, 
  relativePath: string, 
  maxDepth: number = 3,
  currentDepth: number = 0
): Promise<TreeNode[]> {
  if (currentDepth >= maxDepth) {
    return []
  }

  try {
    const entries = await readdir(fullPath)
    const nodes: TreeNode[] = []

    for (const entry of entries) {
      // Skip hidden files and directories
      if (entry.startsWith('.')) continue

      const entryPath = join(fullPath, entry)
      const entryRelativePath = relativePath ? `${relativePath}/${entry}` : entry

      try {
        const entryStats = await stat(entryPath)
        
        const node: TreeNode = {
          name: entry,
          path: entryRelativePath,
          type: entryStats.isDirectory() ? 'directory' : 'file',
          size: entryStats.size,
          lastModified: entryStats.mtime.toISOString()
        }

        // Recursively build children for directories
        if (entryStats.isDirectory() && currentDepth < maxDepth - 1) {
          node.children = await buildFileTree(entryPath, entryRelativePath, maxDepth, currentDepth + 1)
        }

        nodes.push(node)
      } catch (error) {
        // Skip entries we can't access
        console.warn(`Skipping ${entryPath}:`, error)
      }
    }

    // Sort: directories first, then files, both alphabetically
    nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })

    return nodes
  } catch (error) {
    console.warn(`Failed to read directory ${fullPath}:`, error)
    return []
  }
}