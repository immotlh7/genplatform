"use client"

import { useState } from 'react'
import { PriorityBadge } from '@/components/ui/priority-badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AlertTriangle, Circle, ArrowUp, Save } from 'lucide-react'
import { useProjects, type Project } from '@/contexts/project-context'

interface PriorityManagerProps {
  project: Project
  onSave?: () => void
  compact?: boolean
}

export function PriorityManager({ project, onSave, compact = false }: PriorityManagerProps) {
  const [selectedPriority, setSelectedPriority] = useState<'high' | 'medium' | 'low'>(project.priority)
  const [saving, setSaving] = useState(false)
  const { updateProject } = useProjects()

  const handleSave = async () => {
    if (selectedPriority === project.priority) return

    try {
      setSaving(true)
      await updateProject(project.id, { priority: selectedPriority })
      onSave?.()
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error updating priority:', error);
      }
    } finally {
      setSaving(false)
    }
  }

  const priorityOptions = [
    {
      value: 'high' as const,
      label: 'High Priority',
      description: 'Critical projects requiring immediate attention',
      icon: AlertTriangle,
      color: 'text-red-500'
    },
    {
      value: 'medium' as const,
      label: 'Medium Priority', 
      description: 'Important projects in active development',
      icon: Circle,
      color: 'text-yellow-500'
    },
    {
      value: 'low' as const,
      label: 'Low Priority',
      description: 'Background projects or maintenance tasks',
      icon: ArrowUp,
      color: 'text-green-500'
    }
  ]

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <Label htmlFor={`priority-${project.id}`} className="text-sm font-medium">
          Priority:
        </Label>
        <Select value={selectedPriority} onValueChange={setSelectedPriority}>
          <SelectTrigger id={`priority-${project.id}`} className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {priorityOptions.map((option) => {
              const Icon = option.icon
              return (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center space-x-2">
                    <Icon className={`h-4 w-4 ${option.color}`} />
                    <span className="capitalize">{option.value}</span>
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
        {selectedPriority !== project.priority && (
          <Button 
            size="sm" 
            onClick={handleSave} 
            disabled={saving}
            className="ml-2"
          >
            {saving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Save className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>Project Priority</span>
          <PriorityBadge priority={project.priority} showIcon />
        </CardTitle>
        <CardDescription>
          Set the priority level for this project to help organize your workflow
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {priorityOptions.map((option) => {
            const Icon = option.icon
            const isSelected = selectedPriority === option.value
            
            return (
              <div
                key={option.value}
                className={`p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground'
                }`}
                onClick={() => setSelectedPriority(option.value)}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <Icon className={`h-5 w-5 ${option.color}`} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-medium">{option.label}</h4>
                      <PriorityBadge priority={option.value} size="sm" />
                    </div>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      isSelected 
                        ? 'border-primary bg-primary' 
                        : 'border-muted-foreground'
                    }`}>
                      {isSelected && (
                        <div className="w-full h-full rounded-full bg-primary-foreground opacity-30" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {selectedPriority !== project.priority && (
          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Priority will change from{' '}
              <PriorityBadge priority={project.priority} size="sm" className="mx-1" />
              to{' '}
              <PriorityBadge priority={selectedPriority} size="sm" className="mx-1" />
            </p>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedPriority(project.priority)}
              >
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={handleSave} 
                disabled={saving}
              >
                {saving ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Priority
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}