import { NextRequest, NextResponse } from 'next/server'
import { readdir, readFile, stat } from 'fs/promises'
import { join } from 'path'
import { config } from '@/lib/config'

interface SearchResult {
  path: string
  name: string
  matches: SearchMatch[]
  score: number
  size: number
  lastModified: string
}

interface SearchMatch {
  line: number
  text: string
  before: string
  after: string
  highlighted: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '50')
    const includeContent = searchParams.get('content') === 'true'

    if (!query || query.length < 2) {
      return NextResponse.json({
        results: [],
        total: 0,
        query,
        message: 'Query must be at least 2 characters long'
      })
    }

    const memoryPath = join(config.workspacePath, 'memory')
    const results: SearchResult[] = []

    // Security check
    if (!memoryPath.startsWith(config.workspacePath)) {
      return NextResponse.json(
        { error: 'Invalid path' },
        { status: 403 }
      )
    }

    const searchQuery = query.toLowerCase()
    const searchRegex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')

    await searchDirectory(memoryPath, '', searchQuery, searchRegex, results, includeContent)

    // Sort by relevance score (higher is better)
    results.sort((a, b) => b.score - a.score)

    // Apply limit
    const limitedResults = results.slice(0, limit)

    return NextResponse.json({
      results: limitedResults,
      total: results.length,
      query,
      hasMore: results.length > limit,
      searchTime: Date.now() // Simple timestamp
    })

  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}

async function searchDirectory(
  fullPath: string,
  relativePath: string,
  searchQuery: string,
  searchRegex: RegExp,
  results: SearchResult[],
  includeContent: boolean
): Promise<void> {
  try {
    const entries = await readdir(fullPath)

    for (const entry of entries) {
      const entryPath = join(fullPath, entry)
      const entryRelativePath = relativePath ? `${relativePath}/${entry}` : entry
      
      try {
        const entryStats = await stat(entryPath)

        if (entryStats.isDirectory()) {
          // Skip hidden directories and node_modules
          if (!entry.startsWith('.') && entry !== 'node_modules') {
            await searchDirectory(entryPath, entryRelativePath, searchQuery, searchRegex, results, includeContent)
          }
        } else if (entryStats.isFile()) {
          // Only search text files
          if (isSearchableFile(entry)) {
            await searchFile(entryPath, entryRelativePath, searchQuery, searchRegex, results, includeContent, entryStats)
          }
        }
      } catch (error) {
        // Skip files/directories we can't access
        console.warn(`Skipping ${entryPath}:`, error)
      }
    }
  } catch (error) {
    console.warn(`Failed to read directory ${fullPath}:`, error)
  }
}

async function searchFile(
  fullPath: string,
  relativePath: string,
  searchQuery: string,
  searchRegex: RegExp,
  results: SearchResult[],
  includeContent: boolean,
  fileStats: any
): Promise<void> {
  try {
    // Skip large files to prevent memory issues
    const maxFileSize = 10 * 1024 * 1024 // 10MB
    if (fileStats.size > maxFileSize) {
      return
    }

    const content = await readFile(fullPath, 'utf-8')
    const lines = content.split('\n')
    const matches: SearchMatch[] = []
    let score = 0

    // Check filename match first
    const filenameMatch = relativePath.toLowerCase().includes(searchQuery)
    if (filenameMatch) {
      score += 50 // Filename matches are highly relevant
    }

    // Search content
    lines.forEach((line, index) => {
      const lowerLine = line.toLowerCase()
      if (lowerLine.includes(searchQuery)) {
        const match = searchRegex.exec(line)
        if (match) {
          const before = line.substring(0, match.index).slice(-20)
          const after = line.substring(match.index + match[0].length, match.index + match[0].length + 20)
          const highlighted = line.replace(searchRegex, `**${match[0]}**`)

          matches.push({
            line: index + 1,
            text: line.trim(),
            before,
            after,
            highlighted: highlighted.trim()
          })

          // Calculate score based on match position and context
          if (index < 10) score += 10 // Early in file
          if (lowerLine.startsWith(searchQuery)) score += 15 // Line starts with query
          score += 5 // Basic match score
        }
      }
    })

    // Add extra score for markdown headers containing the query
    const headerMatches = lines.filter(line => 
      (line.startsWith('#') || line.startsWith('##') || line.startsWith('###')) &&
      line.toLowerCase().includes(searchQuery)
    )
    score += headerMatches.length * 20

    if (matches.length > 0 || filenameMatch) {
      results.push({
        path: relativePath,
        name: relativePath.split('/').pop() || relativePath,
        matches: includeContent ? matches.slice(0, 10) : [], // Limit matches per file
        score,
        size: fileStats.size,
        lastModified: fileStats.mtime.toISOString()
      })
    }
  } catch (error) {
    // Skip files we can't read (binary files, permission issues, etc.)
  }
}

function isSearchableFile(filename: string): boolean {
  const searchableExtensions = [
    '.md', '.txt', '.json', '.js', '.ts', '.jsx', '.tsx',
    '.py', '.sh', '.yml', '.yaml', '.xml', '.html', '.css',
    '.log', '.conf', '.config', '.env', '.gitignore'
  ]

  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'))
  return searchableExtensions.includes(extension) || !filename.includes('.')
}