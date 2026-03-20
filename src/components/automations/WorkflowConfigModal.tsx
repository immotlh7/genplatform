'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Clock, Play, Pause, Settings, Save, X, Calendar, Zap } from 'lucide-react'
import { toast } from 'sonner'

interface WorkflowConfig {
  id: string
  name: string
  description: string
  template_type: string
  is_active: boolean
  trigger_type: 'manual' | 'new_idea' | 'task_complete' | 'schedule'
  schedule?: string
  config: Record<string, any>
  last_run_at?: string
  last_run_status?: string
}

interface WorkflowConfigModalProps {
  workflow: WorkflowConfig | null
  isOpen: boolean
  onClose: () => void
  onSave: (config: Partial<WorkflowConfig>) => Promise<void>
}

const SCHEDULE_PRESETS = [
  { value: '@daily', label: 'Daily (midnight)', description: 'Runs every day at midnight' },
  { value: '@hourly', label: 'Hourly', description: 'Runs every hour' },
  { value: '@weekly', label: 'Weekly (Sunday)', description: 'Runs every Sunday at midnight' },
  { value: '0 2 * * *', label: 'Daily at 2 AM', description: 'Runs every day at 2:00 AM' },
  { value: '0 9 * * 1-5', label: 'Weekdays at 9 AM', description: 'Runs Monday to Friday at 9:00 AM' },
  { value: '0 0 1 * *', label: 'Monthly (1st)', description: 'Runs on the 1st day of every month' },
  { value: '*/15 * * * *', label: 'Every 15 minutes', description: 'Runs every 15 minutes' },
  { value: '*/5 * * * *', label: 'Every 5 minutes', description: 'Runs every 5 minutes (testing)' },
  { value: 'custom', label: 'Custom Cron Expression', description: 'Define your own cron schedule' }
]

const TRIGGER_DESCRIPTIONS = {
  manual: 'Run only when manually triggered by clicking "Run Now" button',
  new_idea: 'Automatically trigger when a new idea is submitted to the Ideas Lab',
  task_complete: 'Automatically trigger when any project task is marked as completed',
  schedule: 'Run automatically based on a time schedule (cron expression)'
}

export default function WorkflowConfigModal({ workflow, isOpen, onClose, onSave }: WorkflowConfigModalProps) {
  const [config, setConfig] = useState<Partial<WorkflowConfig>>({})
  const [customSchedule, setCustomSchedule] = useState('')
  const [selectedPreset, setSelectedPreset] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (workflow) {
      setConfig({
        name: workflow.name,
        description: workflow.description,
        is_active: workflow.is_active,
        trigger_type: workflow.trigger_type,
        schedule: workflow.schedule,
        config: workflow.config || {}
      })

      // Set preset selection if schedule matches a preset
      if (workflow.schedule) {
        const preset = SCHEDULE_PRESETS.find(p => p.value === workflow.schedule)
        if (preset) {
          setSelectedPreset(preset.value)
        } else {
          setSelectedPreset('custom')
          setCustomSchedule(workflow.schedule)
        }
      }
    } else {
      // Reset form for new workflow
      setConfig({
        name: '',
        description: '',
        is_active: false,
        trigger_type: 'manual',
        schedule: '',
        config: {}
      })
      setSelectedPreset('')
      setCustomSchedule('')
    }
    setValidationErrors({})
  }, [workflow, isOpen])

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!config.name?.trim()) {
      errors.name = 'Workflow name is required'
    }

    if (!config.description?.trim()) {
      errors.description = 'Description is required'
    }

    if (config.trigger_type === 'schedule') {
      const schedule = selectedPreset === 'custom' ? customSchedule : selectedPreset
      if (!schedule || schedule === 'custom') {
        errors.schedule = 'Schedule is required when trigger type is "schedule"'
      } else if (selectedPreset === 'custom') {
        // Basic cron validation (5 parts)
        const cronParts = schedule.split(' ')
        if (cronParts.length !== 5 && !schedule.startsWith('@')) {
          errors.schedule = 'Cron expression must have 5 parts (minute hour day month dayOfWeek) or use @-notation'
        }
      }
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) {
      return
    }

    setIsSaving(true)
    try {
      const finalSchedule = config.trigger_type === 'schedule' 
        ? (selectedPreset === 'custom' ? customSchedule : selectedPreset)
        : null

      const configToSave = {
        ...config,
        schedule: finalSchedule
      }

      await onSave(configToSave)
      toast.success('Workflow configuration saved successfully')
      onClose()
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error saving workflow config:', error);
      }
      toast.error('Failed to save workflow configuration')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSchedulePresetChange = (value: string) => {
    setSelectedPreset(value)
    if (value !== 'custom') {
      setCustomSchedule('')
      setConfig({ ...config, schedule: value })
    }
  }

  const formatLastRun = (lastRun?: string, status?: string) => {
    if (!lastRun) return 'Never run'
    
    const date = new Date(lastRun)
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    let timeAgo
    if (diffMinutes < 1) timeAgo = 'Just now'
    else if (diffMinutes < 60) timeAgo = `${diffMinutes}m ago`
    else if (diffMinutes < 1440) timeAgo = `${Math.floor(diffMinutes / 60)}h ago`
    else timeAgo = `${Math.floor(diffMinutes / 1440)}d ago`
    
    const statusIcon = status === 'completed' ? '✅' : 
                     status === 'failed' ? '❌' : 
                     status === 'running' ? '🔄' : '⏸️'
    
    return `${statusIcon} ${timeAgo}`
  }

  if (!workflow) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Configure Workflow</span>
          </DialogTitle>
          <DialogDescription>
            Configure how and when this workflow should run
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Workflow Status Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{workflow.name}</CardTitle>
                <Badge 
                  variant={workflow.is_active ? "default" : "secondary"}
                  className={workflow.is_active ? "bg-green-500" : ""}
                >
                  {workflow.is_active ? (
                    <>
                      <Zap className="h-3 w-3 mr-1" />
                      Active
                    </>
                  ) : (
                    <>
                      <Pause className="h-3 w-3 mr-1" />
                      Inactive
                    </>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Template:</span>
                  <div className="font-medium capitalize">{workflow.template_type.replace('_', ' ')}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Run:</span>
                  <div className="font-medium">{formatLastRun(workflow.last_run_at, workflow.last_run_status)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Current Trigger:</span>
                  <div className="font-medium capitalize">{workflow.trigger_type.replace('_', ' ')}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Schedule:</span>
                  <div className="font-medium">
                    {workflow.trigger_type === 'schedule' && workflow.schedule ? workflow.schedule : 'N/A'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Settings */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Workflow Name</Label>
              <Input
                id="name"
                value={config.name || ''}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                placeholder="Enter workflow name"
                className={validationErrors.name ? "border-red-500" : ""}
              />
              {validationErrors.name && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={config.description || ''}
                onChange={(e) => setConfig({ ...config, description: e.target.value })}
                placeholder="Describe what this workflow does"
                className={validationErrors.description ? "border-red-500" : ""}
              />
              {validationErrors.description && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.description}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={config.is_active || false}
                onCheckedChange={(checked) => setConfig({ ...config, is_active: checked })}
              />
              <Label htmlFor="active" className="flex items-center space-x-2">
                <span>Activate Workflow</span>
                {config.is_active && <Badge variant="outline" className="text-green-600">Active</Badge>}
              </Label>
            </div>
          </div>

          <Separator />

          {/* Trigger Configuration */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="trigger">Trigger Type</Label>
              <Select 
                value={config.trigger_type || 'manual'} 
                onValueChange={(value: any) => setConfig({ ...config, trigger_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select trigger type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="new_idea">New Idea</SelectItem>
                  <SelectItem value="task_complete">Task Complete</SelectItem>
                  <SelectItem value="schedule">Schedule</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                {TRIGGER_DESCRIPTIONS[config.trigger_type as keyof typeof TRIGGER_DESCRIPTIONS]}
              </p>
            </div>

            {/* Schedule Configuration - Only shown when trigger_type is 'schedule' */}
            {config.trigger_type === 'schedule' && (
              <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                <div className="flex items-center space-x-2 text-sm font-medium">
                  <Calendar className="h-4 w-4" />
                  <span>Schedule Configuration</span>
                </div>

                <div>
                  <Label>Schedule Preset</Label>
                  <Select 
                    value={selectedPreset} 
                    onValueChange={handleSchedulePresetChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a schedule preset" />
                    </SelectTrigger>
                    <SelectContent>
                      {SCHEDULE_PRESETS.map((preset) => (
                        <SelectItem key={preset.value} value={preset.value}>
                          <div className="flex flex-col">
                            <span>{preset.label}</span>
                            <span className="text-xs text-muted-foreground">{preset.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedPreset === 'custom' && (
                  <div>
                    <Label htmlFor="custom-schedule">Custom Cron Expression</Label>
                    <Input
                      id="custom-schedule"
                      value={customSchedule}
                      onChange={(e) => {
                        setCustomSchedule(e.target.value)
                        setConfig({ ...config, schedule: e.target.value })
                      }}
                      placeholder="0 2 * * * (daily at 2 AM)"
                      className={validationErrors.schedule ? "border-red-500" : ""}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Format: minute hour day month dayOfWeek (e.g., "0 2 * * *" for daily at 2 AM)
                    </p>
                    {validationErrors.schedule && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.schedule}</p>
                    )}
                  </div>
                )}

                {selectedPreset && selectedPreset !== 'custom' && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-900">Selected Schedule</span>
                    </div>
                    <p className="text-sm text-blue-800 mt-1">
                      {SCHEDULE_PRESETS.find(p => p.value === selectedPreset)?.description}
                    </p>
                    <p className="text-xs text-blue-600 mt-1 font-mono">
                      Cron: {selectedPreset}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Warning for Active Changes */}
          {config.is_active && config.trigger_type === 'schedule' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <span className="font-medium text-orange-900">Schedule Warning</span>
              </div>
              <p className="text-sm text-orange-800 mt-1">
                This workflow will run automatically based on the schedule. Make sure the schedule is correct before saving.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Changes will take effect immediately
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}