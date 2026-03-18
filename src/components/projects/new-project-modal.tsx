"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'

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

export function NewProjectModal({ open, onOpenChange, onSubmit }: NewProjectModalProps) {
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    githubUrl: '',
    deployUrl: '',
    technologies: []
  })
  const [techInput, setTechInput] = useState('')

  const handleAddTech = () => {
    if (techInput.trim() && !formData.technologies.includes(techInput.trim())) {
      setFormData(prev => ({
        ...prev,
        technologies: [...prev.technologies, techInput.trim()]
      }))
      setTechInput('')
    }
  }

  const handleRemoveTech = (tech: string) => {
    setFormData(prev => ({
      ...prev,
      technologies: prev.technologies.filter(t => t !== tech)
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name && formData.description) {
      onSubmit(formData)
      setFormData({
        name: '',
        description: '',
        githubUrl: '',
        deployUrl: '',
        technologies: []
      })
      onOpenChange(false)
    }
  }

  const handleTechKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTech()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="My Awesome Project"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of your project"
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="github">GitHub URL</Label>
            <Input
              id="github"
              value={formData.githubUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, githubUrl: e.target.value }))}
              placeholder="https://github.com/username/repo"
              type="url"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deploy">Deploy URL</Label>
            <Input
              id="deploy"
              value={formData.deployUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, deployUrl: e.target.value }))}
              placeholder="https://myproject.vercel.app"
              type="url"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tech">Technologies</Label>
            <div className="flex space-x-2">
              <Input
                id="tech"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyPress={handleTechKeyPress}
                placeholder="React, Next.js, TypeScript..."
              />
              <Button type="button" onClick={handleAddTech} variant="outline">
                Add
              </Button>
            </div>
            {formData.technologies.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.technologies.map((tech) => (
                  <Badge key={tech} variant="secondary" className="text-xs">
                    {tech}
                    <button
                      type="button"
                      onClick={() => handleRemoveTech(tech)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.name || !formData.description}>
              Create Project
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}