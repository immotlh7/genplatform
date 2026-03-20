import { useState, useEffect } from 'react'
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText, Plus, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface FileNode {
  id: string
  name: string
  type: 'file' | 'folder'
  path: string
  children?: FileNode[]
  size?: number
  lastModified?: string
}

interface FileTreeProps {
  onFileSelect?: (file: FileNode) => void
  selectedPath?: string
  onCreateFile?: (path: string) => void
  onDeleteFile?: (path: string) => void
  onRenameFile?: (oldPath: string, newPath: string) => void
  canEdit?: boolean
}

export function FileTree({ 
  onFileSelect, 
  selectedPath, 
  onCreateFile,
  onDeleteFile,
  onRenameFile,
  canEdit = false 
}: FileTreeProps) {
  const [tree, setTree] = useState<FileNode[]>([])
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['/', '/projects', '/areas', '/resources']))
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadFileTree()
  }, [])

  const loadFileTree = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/bridge/memory')
      const data = await response.json()
      
      if (data.tree) {
        setTree(data.tree)
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load file tree:', error);
      }
      // Demo fallback
      setTree([
        {
          id: 'projects',
          name: 'projects',
          type: 'folder',
          path: '/projects',
          children: []
        },
        {
          id: 'areas',
          name: 'areas',
          type: 'folder',
          path: '/areas',
          children: []
        },
        {
          id: 'resources',
          name: 'resources',
          type: 'folder',
          path: '/resources',
          children: []
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })
  }

  const handleNodeClick = async (node: FileNode) => {
    if (node.type === 'folder') {
      toggleNode(node.id)
      
      // Load children if not loaded
      if (!node.children && expandedNodes.has(node.id)) {
        try {
          const response = await fetch(`/api/bridge/memory?path=${encodeURIComponent(node.path)}`)
          const data = await response.json()
          
          if (data.children) {
            // Update the tree with loaded children
            updateNodeChildren(node.id, data.children)
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Failed to load folder contents:', error);
          }
        }
      }
    } else {
      onFileSelect?.(node)
    }
  }

  const updateNodeChildren = (nodeId: string, children: FileNode[]) => {
    setTree(prevTree => {
      const updateNode = (nodes: FileNode[]): FileNode[] => {
        return nodes.map(node => {
          if (node.id === nodeId) {
            return { ...node, children }
          }
          if (node.children) {
            return { ...node, children: updateNode(node.children) }
          }
          return node
        })
      }
      return updateNode(prevTree)
    })
  }

  const handleCreateFile = (parentPath: string) => {
    const fileName = prompt('Enter file name:')
    if (fileName) {
      const fullPath = parentPath === '/' ? `/${fileName}` : `${parentPath}/${fileName}`
      onCreateFile?.(fullPath)
      // Refresh tree after creation
      setTimeout(loadFileTree, 500)
    }
  }

  const handleDeleteFile = (path: string) => {
    if (confirm(`Are you sure you want to delete ${path}?`)) {
      onDeleteFile?.(path)
      // Refresh tree after deletion
      setTimeout(loadFileTree, 500)
    }
  }

  const handleRenameFile = (oldPath: string) => {
    const parts = oldPath.split('/')
    const oldName = parts[parts.length - 1]
    const newName = prompt('Enter new name:', oldName)
    if (newName && newName !== oldName) {
      parts[parts.length - 1] = newName
      const newPath = parts.join('/')
      onRenameFile?.(oldPath, newPath)
      // Refresh tree after rename
      setTimeout(loadFileTree, 500)
    }
  }

  const renderNode = (node: FileNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id)
    const isSelected = selectedPath === node.path
    const isFolder = node.type === 'folder'
    
    // Filter by search
    if (searchQuery && !node.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      // Still render if children match
      if (!isFolder || !node.children?.some(child => 
        child.name.toLowerCase().includes(searchQuery.toLowerCase())
      )) {
        return null
      }
    }

    return (
      <div key={node.id}>
        <div
          className={cn(
            "flex items-center py-1.5 px-2 hover:bg-muted/50 rounded-md cursor-pointer group",
            isSelected && "bg-muted"
          )}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => handleNodeClick(node)}
        >
          {isFolder && (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 mr-1"
              onClick={(e) => {
                e.stopPropagation()
                toggleNode(node.id)
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          )}
          
          <div className="flex items-center flex-1 min-w-0">
            {isFolder ? (
              isExpanded ? (
                <FolderOpen className="h-4 w-4 mr-2 text-muted-foreground" />
              ) : (
                <Folder className="h-4 w-4 mr-2 text-muted-foreground" />
              )
            ) : (
              <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
            )}
            <span className="text-sm truncate">{node.name}</span>
          </div>

          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isFolder && (
                  <DropdownMenuItem onClick={() => handleCreateFile(node.path)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New File
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => handleRenameFile(node.path)}>
                  Rename
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={() => handleDeleteFile(node.path)}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {isFolder && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Loading file tree...
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-2 border-b">
        <Input
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8"
        />
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {tree.length > 0 ? (
          tree.map(node => renderNode(node))
        ) : (
          <div className="text-center text-muted-foreground p-4">
            No files found
          </div>
        )}
      </div>

      {canEdit && (
        <div className="p-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => handleCreateFile('/')}
          >
            <Plus className="h-4 w-4 mr-2" />
            New File
          </Button>
        </div>
      )}
    </div>
  )
}