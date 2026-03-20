"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import {
  FileText, Folder, FolderOpen, Plus, Edit, Save, X, RefreshCw,
  Brain, Database, Calendar, BookOpen
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'

interface MemoryFile {
  name: string
  path: string
  type: 'file' | 'folder'
  size?: number
  modified?: string
  category?: string
}

export default function MemoryPage() {
  const { toast } = useToast()
  const [files, setFiles] = useState<MemoryFile[]>([])
  const [stats, setStats] = useState({ totalFiles: 0, totalFolders: 0, totalSize: 0 })
  const [selectedFile, setSelectedFile] = useState<MemoryFile | null>(null)
  const [fileContent, setFileContent] = useState('')
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingFile, setLoadingFile] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newFileOpen, setNewFileOpen] = useState(false)
  const [newFilePath, setNewFilePath] = useState('')
  const [newFileContent, setNewFileContent] = useState('')
  const [creatingFile, setCreatingFile] = useState(false)

  useEffect(() => {
    loadFiles()
  }, [])

  const loadFiles = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/bridge/memory', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setFiles(data.tree || [])
        setStats(data.stats || { totalFiles: 0, totalFolders: 0, totalSize: 0 })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load memory files', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const selectFile = async (file: MemoryFile) => {
    if (file.type === 'folder') return
    setSelectedFile(file)
    setEditing(false)
    setLoadingFile(true)
    setFileContent('')
    try {
      const res = await fetch(`/api/bridge/memory?path=${encodeURIComponent(file.path)}`, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setFileContent(data.content || '')
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load file', variant: 'destructive' })
    } finally {
      setLoadingFile(false)
    }
  }

  const startEdit = () => {
    setEditContent(fileContent)
    setEditing(true)
  }

  const cancelEdit = () => {
    setEditing(false)
    setEditContent('')
  }

  const saveFile = async () => {
    if (!selectedFile) return
    setSaving(true)
    try {
      const res = await fetch('/api/bridge/memory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: selectedFile.path, content: editContent })
      })
      if (res.ok) {
        setFileContent(editContent)
        setEditing(false)
        toast({ title: 'Saved', description: 'File saved successfully' })
      } else {
        toast({ title: 'Error', description: 'Failed to save file', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to save file', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const createFile = async () => {
    if (!newFilePath.trim()) {
      toast({ title: 'Error', description: 'File path cannot be empty', variant: 'destructive' })
      return
    }
    if (newFilePath.includes('..')) {
      toast({ title: 'Error', description: 'Path cannot contain ".."', variant: 'destructive' })
      return
    }
    setCreatingFile(true)
    try {
      const res = await fetch('/api/bridge/memory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: `/${newFilePath}`, content: newFileContent })
      })
      if (res.ok) {
        toast({ title: 'Created', description: 'File created successfully' })
        setNewFileOpen(false)
        setNewFilePath('')
        setNewFileContent('')
        await loadFiles()
      } else {
        toast({ title: 'Error', description: 'Failed to create file', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to create file', variant: 'destructive' })
    } finally {
      setCreatingFile(false)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  const formatDate = (iso?: string) => {
    if (!iso) return ''
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const countByFolder = (prefix: string) =>
    files.filter(f => f.type === 'file' && f.path.startsWith(`/${prefix}/`)).length

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Memory</h1>
          <p className="text-muted-foreground">OpenClaw workspace files</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadFiles}>
            <RefreshCw className="h-4 w-4 mr-2" />Refresh
          </Button>
          <Button size="sm" onClick={() => setNewFileOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />New File
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Brain className="h-8 w-8 text-blue-500" />
            <div>
              <div className="text-2xl font-bold">{stats.totalFiles}</div>
              <div className="text-xs text-muted-foreground">Total Files</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-purple-500" />
            <div>
              <div className="text-2xl font-bold">{countByFolder('memory')}</div>
              <div className="text-xs text-muted-foreground">Memory Logs</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Calendar className="h-8 w-8 text-green-500" />
            <div>
              <div className="text-2xl font-bold">{countByFolder('skills')}</div>
              <div className="text-xs text-muted-foreground">Skills</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Database className="h-8 w-8 text-orange-500" />
            <div>
              <div className="text-2xl font-bold">{formatSize(stats.totalSize)}</div>
              <div className="text-xs text-muted-foreground">Total Size</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* File Tree */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Files</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
            ) : files.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">No files found</div>
            ) : (
              <div className="space-y-0.5 max-h-[500px] overflow-y-auto">
                {files.map((file, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectFile(file)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm text-left hover:bg-accent transition-colors ${
                      selectedFile?.path === file.path ? 'bg-accent' : ''
                    }`}
                  >
                    {file.type === 'folder'
                      ? <FolderOpen className="h-4 w-4 text-yellow-500 shrink-0" />
                      : <FileText className="h-4 w-4 text-blue-400 shrink-0" />
                    }
                    <span className="truncate flex-1">{file.name}</span>
                    {file.size && (
                      <span className="text-xs text-muted-foreground shrink-0">{formatSize(file.size)}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* File Viewer */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm">
                  {selectedFile ? selectedFile.name : 'Select a file'}
                </CardTitle>
                {selectedFile && (
                  <p className="text-xs text-muted-foreground mt-0.5">{selectedFile.path}</p>
                )}
              </div>
              {selectedFile && !editing && (
                <Button size="sm" variant="outline" onClick={startEdit}>
                  <Edit className="h-3 w-3 mr-1" />Edit
                </Button>
              )}
              {editing && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={cancelEdit}>
                    <X className="h-3 w-3 mr-1" />Cancel
                  </Button>
                  <Button size="sm" onClick={saveFile} disabled={saving}>
                    <Save className="h-3 w-3 mr-1" />{saving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedFile ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                Select a file from the tree to view its contents
              </div>
            ) : loadingFile ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                Loading file...
              </div>
            ) : editing ? (
              <Textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                className="font-mono text-sm min-h-[400px] resize-none"
              />
            ) : (
              <pre className="font-mono text-sm whitespace-pre-wrap break-words bg-muted/30 rounded p-4 max-h-[500px] overflow-y-auto">
                {fileContent || '(empty file)'}
              </pre>
            )}
          </CardContent>
        </Card>
      </div>

      {/* New File Dialog */}
      <Dialog open={newFileOpen} onOpenChange={setNewFileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New File</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">File Path</label>
              <Input
                placeholder="e.g. notes/meeting.md"
                value={newFilePath}
                onChange={e => setNewFilePath(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Content</label>
              <Textarea
                placeholder="File content..."
                value={newFileContent}
                onChange={e => setNewFileContent(e.target.value)}
                className="mt-1 min-h-[150px] font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFileOpen(false)}>Cancel</Button>
            <Button onClick={createFile} disabled={creatingFile}>
              {creatingFile ? 'Creating...' : 'Create File'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
