export interface Workflow {
  id: string
  name: string
  description?: string
  status: 'active' | 'paused' | 'draft' | 'error'
  trigger?: string
  schedule?: string
  lastRun?: string
  nextRun?: string
  runCount?: number
  successRate?: number
  actions?: any[]
  createdAt?: string
  updatedAt?: string
}
