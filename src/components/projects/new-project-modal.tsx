"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { X, Edit2 } from 'lucide-react'

interface NewProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (project: ProjectFormData) => void
}

interface ProjectFormData {
  name: string
  description: string
  githubUrl: string
  deployUrl: string
  technologies: string[]
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 30)
    .replace(/-$/, '')
}

export function NewProjectModal({ open, onOpenChange, onSubmit }: NewProjectModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [subdomain, setSubdomain] = useState('')
  const [editingSubdomain, setEditingSubdomain] = useState(false)
  const [technologies, setTechnologies] = useState<string[]>([])
  const [techInput, setTechInput] = useState('')

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setName(val)
    if (val.length > 2 && !editingSubdomain) {
      setSubdomain(generateSlug(val))
    }
  }

  const handleAddTech = () => {
    const t = techInput.trim()
    if (t && !technologies.includes(t)) {
      setTechnologies(prev => [...prev, t])
      setTechInput('')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !description) return
    const slug = subdomain || generateSlug(name)
    onSubmit({
      name,
      description,
      githubUrl: '',        // auto-created by server if GITHUB_TOKEN exists
      deployUrl: `https://${slug}.gen3.ai`,
      technologies,
    })
    // Reset
    setName(''); setDescription(''); setSubdomain(''); setTechnologies([])
    setEditingSubdomain(false)
    onOpenChange(false)
  }

  const slug = subdomain || (name.length > 2 ? generateSlug(name) : 'my-project')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Project Name *</Label>
            <Input id="name" value={name} onChange={handleNameChange} placeholder="My Awesome Project" required />
          </div>

          {/* Auto subdomain */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Subdomain (auto-generated)</Label>
            {!editingSubdomain ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center bg-muted/30 border rounded-lg px-3 py-2 text-sm">
                  <span className="font-mono">{slug}</span>
                  <span className="text-muted-foreground">.gen3.ai</span>
                </div>
                <Button type="button" variant="ghost" size="sm" className="h-9 w-9 p-0"
                  onClick={() => { setSubdomain(slug); setEditingSubdomain(true) }}>
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  value={subdomain}
                  onChange={e => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="my-project"
                  className="font-mono"
                />
                <span className="text-sm text-muted-foreground flex-shrink-0">.gen3.ai</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">Live URL: https://{slug}.gen3.ai</p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea id="description" value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief description of your project" rows={3} required />
          </div>

          {/* Technologies */}
          <div className="space-y-2">
            <Label>Technologies</Label>
            <div className="flex gap-2">
              <Input value={techInput} onChange={e => setTechInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTech() } }}
                placeholder="Next.js, TypeScript..." />
              <Button type="button" onClick={handleAddTech} variant="outline">Add</Button>
            </div>
            {technologies.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {technologies.map(t => (
                  <Badge key={t} variant="secondary" className="text-xs">
                    {t}
                    <button type="button" onClick={() => setTechnologies(p => p.filter(x => x !== t))} className="ml-1">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!name || !description}>Create Project</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
