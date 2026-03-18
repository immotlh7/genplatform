import { z } from 'zod'

// Workflow validation schemas
export const createWorkflowSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().optional(),
  template_type: z.string().min(1, 'Template type is required'),
  trigger_type: z.enum(['manual', 'new_idea', 'task_complete', 'schedule'], {
    errorMap: () => ({ message: 'Trigger type must be manual, new_idea, task_complete, or schedule' })
  }),
  schedule: z.string().optional(),
  is_active: z.boolean().default(false),
  config: z.record(z.any()).default({})
})

export const runWorkflowSchema = z.object({
  workflowId: z.string().uuid('Invalid workflow ID'),
  projectId: z.string().uuid('Invalid project ID').optional(),
  triggeredBy: z.string().default('manual')
})

export const approveWorkflowSchema = z.object({
  runId: z.string().uuid('Invalid run ID'),
  action: z.enum(['approve', 'reject'], {
    errorMap: () => ({ message: 'Action must be approve or reject' })
  }),
  reason: z.string().optional()
})

// Project validation schemas
export const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().optional(),
  tech_stack: z.string().optional(),
  github_repo: z.string().url('Invalid GitHub URL').optional(),
  vercel_url: z.string().url('Invalid Vercel URL').optional(),
  domain: z.string().optional(),
  status: z.enum(['planning', 'active', 'completed', 'archived']).default('planning')
})

export const updateProjectSchema = z.object({
  id: z.string().uuid('Invalid project ID'),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
  description: z.string().optional(),
  tech_stack: z.string().optional(),
  github_repo: z.string().url('Invalid GitHub URL').optional(),
  vercel_url: z.string().url('Invalid Vercel URL').optional(),
  domain: z.string().optional(),
  status: z.enum(['planning', 'active', 'completed', 'archived']).optional()
})

// Task validation schemas
export const createTaskSchema = z.object({
  project_id: z.string().uuid('Invalid project ID'),
  number: z.number().int().min(1, 'Task number must be positive'),
  name: z.string().min(1, 'Task name is required').max(200, 'Task name must be less than 200 characters'),
  description: z.string().optional(),
  assigned_role: z.string().optional(),
  estimated_minutes: z.number().int().min(0, 'Estimated minutes must be non-negative').optional(),
  status: z.enum(['todo', 'in_progress', 'done', 'blocked']).default('todo'),
  sprint: z.string().optional(),
  dependencies: z.array(z.string()).default([])
})

export const updateTaskSchema = z.object({
  taskId: z.string().uuid('Invalid task ID'),
  status: z.enum(['todo', 'in_progress', 'done', 'blocked']).optional(),
  actual_minutes: z.number().int().min(0, 'Actual minutes must be non-negative').optional(),
  notes: z.string().optional()
})

// User validation schemas
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['ADMIN', 'MANAGER', 'VIEWER'], {
    errorMap: () => ({ message: 'Role must be ADMIN, MANAGER, or VIEWER' })
  }),
  display_name: z.string().min(1, 'Display name is required').max(100, 'Display name must be less than 100 characters')
})

export const updateUserSchema = z.object({
  id: z.string().uuid('Invalid user ID'),
  role: z.enum(['ADMIN', 'MANAGER', 'VIEWER']).optional(),
  display_name: z.string().min(1, 'Display name is required').max(100, 'Display name must be less than 100 characters').optional(),
  is_active: z.boolean().optional()
})

// Idea validation schemas
export const createIdeaSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().min(1, 'Description is required').max(5000, 'Description must be less than 5000 characters'),
  language: z.string().default('en')
})

// Security event validation schemas
export const createSecurityEventSchema = z.object({
  event_type: z.string().min(1, 'Event type is required'),
  severity: z.enum(['info', 'warning', 'critical'], {
    errorMap: () => ({ message: 'Severity must be info, warning, or critical' })
  }),
  description: z.string().min(1, 'Description is required'),
  source: z.string().optional(),
  metadata: z.record(z.any()).default({})
})

// Report validation schemas
export const generateReportSchema = z.object({
  type: z.enum(['daily', 'weekly', 'monthly', 'custom'], {
    errorMap: () => ({ message: 'Report type must be daily, weekly, monthly, or custom' })
  }),
  project_id: z.string().uuid('Invalid project ID').optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  format: z.enum(['html', 'pdf', 'json']).default('html')
})

// Improvement proposal validation schemas
export const createImprovementSchema = z.object({
  finding: z.string().min(1, 'Finding is required').max(1000, 'Finding must be less than 1000 characters'),
  impact: z.string().min(1, 'Impact is required').max(500, 'Impact must be less than 500 characters'),
  suggested_action: z.string().min(1, 'Suggested action is required').max(1000, 'Suggested action must be less than 1000 characters'),
  category: z.enum(['performance', 'security', 'ux', 'code_quality', 'workflow', 'skills'], {
    errorMap: () => ({ message: 'Category must be one of: performance, security, ux, code_quality, workflow, skills' })
  }),
  implementation_notes: z.string().optional()
})

export const updateImprovementSchema = z.object({
  improvementId: z.string().uuid('Invalid improvement ID'),
  status: z.enum(['proposed', 'approved', 'implemented', 'rejected']).optional(),
  implementation_notes: z.string().optional(),
  reason: z.string().optional()
})

// Generic pagination schema
export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc')
})

// Date range filter schema
export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
})

// Validation helper function
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return { success: false, error: firstError.message }
    }
    return { success: false, error: 'Validation failed' }
  }
}