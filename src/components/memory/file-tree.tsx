"use client"

import { useState, useEffect } from 'react'
import { ChevronRight, ChevronDown, Folder, FileText, FolderOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileTreeNode {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileTreeNode[]
  expanded?: boolean
  size?: number
  lastModified?: string
}

interface FileTreeProps {
  onFileSelect: (path: string, isDirectory: boolean) => void
  selectedPath: string
}

export function FileTree({ onFileSelect, selectedPath }: FileTreeProps) {
  const [treeData, setTreeData] = useState<FileTreeNode[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTreeData()
  }, [])

  const loadTreeData = async () => {
    try {
      // Load root directory structure
      const response = await fetch('/api/openclaw/memory/tree')
      const data = await response.json()
      setTreeData(data.tree || [])
    } catch (error) {
      console.error('Failed to load file tree:', error)
      // Create demo PARA structure if API fails
      setTreeData([
        {
          name: 'Projects',
          path: 'projects',
          type: 'directory',
          children: [
            { name: 'GenPlatform.ai', path: 'projects/genplatform', type: 'directory' },
            { name: 'Agent Skills', path: 'projects/agent-skills', type: 'directory' }
          ]
        },
        {
          name: 'Areas',
          path: 'areas',
          type: 'directory', 
          children: [
            { name: 'Development', path: 'areas/development', type: 'directory' },
            { name: 'Research', path: 'areas/research', type: 'directory' }
          ]
        },
        {
          name: 'Resources',
          path: 'resources',
          type: 'directory',
          children: [
            { name: 'Documentation', path: 'resources/docs', type: 'directory' },
            { name: 'Templates', path: 'resources/templates', type: 'directory' }
          ]
        },
        {
          name: 'Archive',
          path: 'archive',
          type: 'directory',
          children: [
            { name: '2026', path: 'archive/2026', type: 'directory' },
            { name: '2025', path: 'archive/2025', type: 'directory' }
          ]
        },
        {
          name: 'daily',
          path: 'daily', 
          type: 'directory',
          children: [
            { name: '2026-03-18.md', path: 'daily/2026-03-18.md', type: 'file' },
            { name: '2026-03-17.md', path: 'daily/2026-03-17.md', type: 'file' }
          ]
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const toggleExpanded = async (node: FileTreeNode) => {
    if (node.type === 'file') return

    const updateNode = (nodes: FileTreeNode[]): FileTreeNode[] => {
      return nodes.map(n => {
        if (n.path === node.path) {
          return { ...n, expanded: !n.expanded }
        }
        if (n.children) {
          return { ...n, children: updateNode(n.children) }
        }
        return n
      })
    }

    setTreeData(updateNode)

    // Load children if expanding and not already loaded
    if (!node.expanded && (!node.children || node.children.length === 0)) {
      try {
        const response = await fetch(`/api/openclaw/memory/tree?path=${encodeURIComponent(node.path)}`)
        const data = await response.json()
        
        const updateWithChildren = (nodes: FileTreeNode[]): FileTreeNode[] => {
          return nodes.map(n => {
            if (n.path === node.path) {
              return { ...n, children: data.children || [], expanded: true }
            }
            if (n.children) {
              return { ...n, children: updateWithChildren(n.children) }
            }
            return n
          })
        }
        
        setTreeData(updateWithChildren)
      } catch (error) {
        console.error('Failed to load directory contents:', error)
      }
    }
  }

  const renderNode = (node: FileTreeNode, depth: number = 0): React.ReactNode => {
    const isSelected = selectedPath === node.path
    const isExpanded = node.expanded || false

    return (
      <div key={node.path}>
        <div 
          className={cn(
            "flex items-center py-1 px-2 hover:bg-muted/50 cursor-pointer rounded-sm",
            isSelected && "bg-accent text-accent-foreground"
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => {
            if (node.type === 'directory') {
              toggleExpanded(node)
            }
            onFileSelect(node.path, node.type === 'directory')
          }}
        >
          {node.type === 'directory' && (
            <div className="mr-1 flex-shrink-0">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          )}
          
          <div className="mr-2 flex-shrink-0">
            {node.type === 'directory' ? (
              isExpanded ? (
                <FolderOpen className="h-4 w-4 text-blue-600" />
              ) : (
                <Folder className="h-4 w-4 text-blue-600" />
              )
            ) : (
              <FileText className="h-4 w-4 text-gray-600" />
            )}
          </div>
          
          <span className="text-sm truncate">{node.name}</span>
        </div>
        
        {node.type === 'directory' && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="animate-pulse flex items-center space-x-2">
              <div className="w-4 h-4 bg-muted rounded"></div>
              <div className="w-16 h-4 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-2">
        <h3 className="text-sm font-medium mb-2 text-muted-foreground">PARA Structure</h3>
        {treeData.map(node => renderNode(node))}
      </div>
    </div>
  )
}