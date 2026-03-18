/**
 * Input Validation Schemas using Zod
 * Comprehensive validation for all API endpoints
 */

import { z } from 'zod'

// Common validation patterns
const emailSchema = z.string().email('Please enter a valid email address')
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters')
const uuidSchema = z.string().uuid('Invalid UUID format')
const urlSchema = z.string().url('Please enter a valid URL')
const ipSchema = z.string().ip('Invalid IP address format')

// User roles enum
const userRoleSchema = z.enum(['OWNER', 'ADMIN', 'MANAGER', 'VIEWER'], {
  errorMap: () => ({ message: 'Role must be OWNER, ADMIN, MANAGER, or VIEWER' })
})

// Severity levels
const severitySchema = z.enum(['info', 'warning', 'critical'], {
  errorMap: () => ({ message: 'Severity must be info, warning, or critical' })
})

// Project status
const projectStatusSchema = z.enum(['planning', 'active', 'paused', 'completed', 'cancelled'], {
  errorMap: () => ({ message: 'Invalid project status' })
})

// Task status  
const taskStatusSchema = z.enum(['pending', 'in_progress', 'review', 'done', 'blocked'], {
  errorMap: () => ({ message: 'Invalid task status' })
})

// Workflow trigger types
const triggerTypeSchema = z.enum(['manual', 'new_idea', 'task_complete', 'schedule'], {
  errorMap: () => ({ message: 'Invalid trigger type' })
})

// Workflow status
const workflowStatusSchema = z.enum(['running', 'completed', 'failed', 'waiting_approval', 'paused'], {
  errorMap: () => ({ message: 'Invalid workflow status' })
})

// Authentication & User Management
export const loginSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  csrfToken: z.string().optional()
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
  csrfToken: z.string().min(1, 'CSRF token is required')
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'New password and confirmation must match',
  path: ['confirmPassword']
})

export const createUserSchema = z.object({
  email: emailSchema,
  role: userRoleSchema,
  displayName: z.string().min(1, 'Display name is required').max(100, 'Display name too long'),
  projectIds: z.array(uuidSchema).optional().default([])
})

export const updateUserSchema = z.object({
  email: emailSchema.optional(),
  role: userRoleSchema.optional(),
  displayName: z.string().min(1).max(100).optional(),
  projectIds: z.array(uuidSchema).optional()
})

// Project Management
export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  status: projectStatusSchema.default('planning'),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  techStack: z.array(z.string()).optional().default([]),
  repositoryUrl: urlSchema.optional(),
  deploymentUrl: urlSchema.optional(),
  domain: z.string().max(100).optional(),
  environmentVariables: z.record(z.string()).optional().default({})
})

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional(),
  status: projectStatusSchema.optional(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  techStack: z.array(z.string()).optional(),
  repositoryUrl: urlSchema.optional(),
  deploymentUrl: urlSchema.optional(),
  domain: z.string().max(100).optional(),
  environmentVariables: z.record(z.string()).optional()
})

// Task Management
export const createTaskSchema = z.object({
  projectId: uuidSchema,
  name: z.string().min(1, 'Task name is required').max(200, 'Task name too long'),
  description: z.string().max(2000, 'Description too long').optional(),
  status: taskStatusSchema.default('pending'),
  assignedRole: z.string().max(50).optional(),
  estimatedMinutes: z.number().int().min(0).max(9999).optional(),
  dependencies: z.array(uuidSchema).optional().default([]),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  sprintNumber: z.number().int().min(1).optional()
})

export const updateTaskSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: taskStatusSchema.optional(),
  assignedRole: z.string().max(50).optional(),
  estimatedMinutes: z.number().int().min(0).max(9999).optional(),
  actualMinutes: z.number().int().min(0).max(9999).optional(),
  dependencies: z.array(uuidSchema).optional(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  sprintNumber: z.number().int().min(1).optional()
})

// Ideas & Innovation
export const createIdeaSchema = z.object({
  title: z.string().min(1, 'Idea title is required').max(200, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000, 'Description too long'),
  language: z.enum(['en', 'ar']).default('en'),
  referenceUrl: urlSchema.optional(),
  referenceImage: z.string().optional() // Base64 or URL
})

export const updateIdeaSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(10).max(5000).optional(),
  status: z.enum(['analyzing', 'planned', 'approved', 'in_dev', 'completed', 'rejected']).optional(),
  stage: z.number().int().min(1).max(6).optional(),
  researchData: z.record(z.any()).optional(),
  planDocument: z.string().optional()
})

// Workflow & Automation
export const createWorkflowSchema = z.object({
  name: z.string().min(1, 'Workflow name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  templateType: z.string().min(1, 'Template type is required'),
  triggerType: triggerTypeSchema,
  schedule: z.string().optional(),
  config: z.record(z.any()).default({})
})

export const updateWorkflowSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
  triggerType: triggerTypeSchema.optional(),
  schedule: z.string().optional(),
  config: z.record(z.any()).optional()
}).refine(data => {
  // If trigger type is schedule, schedule is required
  if (data.triggerType === 'schedule' && !data.schedule) {
    return false
  }
  return true
}, {
  message: 'Schedule is required when trigger type is "schedule"',
  path: ['schedule']
})

export const runWorkflowSchema = z.object({
  workflowId: uuidSchema,
  projectId: uuidSchema.optional(),
  context: z.record(z.any()).optional().default({})
})

export const approveWorkflowSchema = z.object({
  runId: uuidSchema,
  approved: z.boolean().default(true),
  reason: z.string().max(500).optional()
})

// Chat & Communication
export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required').max(10000, 'Message too long'),
  conversationId: uuidSchema.optional(),
  projectId: uuidSchema.optional(),
  language: z.enum(['en', 'ar']).optional().default('en')
})

export const createConversationSchema = z.object({
  title: z.string().min(1, 'Conversation title is required').max(100, 'Title too long'),
  projectId: uuidSchema.optional(),
  participants: z.array(z.string()).optional().default([])
})

// Security & Audit
export const securityEventSchema = z.object({
  eventType: z.string().min(1, 'Event type is required'),
  severity: severitySchema,
  actorIp: ipSchema,
  actorUserId: uuidSchema.optional(),
  actorEmail: emailSchema.optional(),
  actorRole: userRoleSchema.optional(),
  targetResource: z.string().max(200).optional(),
  actionDescription: z.string().min(1, 'Action description is required').max(1000),
  metadata: z.record(z.any()).optional().default({}),
  userAgent: z.string().max(500).optional(),
  sessionId: z.string().max(100).optional()
})

// Settings & Configuration
export const updateSettingsSchema = z.object({
  siteName: z.string().min(1).max(100).optional(),
  siteDescription: z.string().max(500).optional(),
  defaultLanguage: z.enum(['en', 'ar']).optional(),
  timezone: z.string().optional(),
  maintenanceMode: z.boolean().optional(),
  registrationEnabled: z.boolean().optional(),
  maxProjectsPerUser: z.number().int().min(1).max(100).optional(),
  maxTasksPerProject: z.number().int().min(1).max(10000).optional()
})

// Pagination & Filtering
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional().default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc')
})

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
})

export const projectFilterSchema = z.object({
  status: projectStatusSchema.optional(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  assignedTo: uuidSchema.optional(),
  search: z.string().max(100).optional()
}).merge(paginationSchema).merge(dateRangeSchema)

export const taskFilterSchema = z.object({
  status: taskStatusSchema.optional(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  assignedRole: z.string().max(50).optional(),
  projectId: uuidSchema.optional(),
  sprintNumber: z.number().int().min(1).optional(),
  search: z.string().max(100).optional()
}).merge(paginationSchema).merge(dateRangeSchema)

export const securityEventFilterSchema = z.object({
  eventType: z.string().optional(),
  severity: severitySchema.optional(),
  actorIp: ipSchema.optional(),
  actorUserId: uuidSchema.optional(),
  search: z.string().max(100).optional()
}).merge(paginationSchema).merge(dateRangeSchema)

// Generic ID validation
export const idParamSchema = z.object({
  id: uuidSchema
})

// Common response schemas for type safety
export const successResponseSchema = z.object({
  success: z.literal(true),
  data: z.any().optional(),
  message: z.string().optional(),
  meta: z.record(z.any()).optional()
})

export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  message: z.string().optional(),
  code: z.string().optional(),
  details: z.array(z.object({
    field: z.string(),
    message: z.string()
  })).optional()
})

/**
 * Helper function to validate and format validation errors
 */
export function formatValidationError(error: z.ZodError): {
  success: false
  error: string
  message: string
  code: string
  details: Array<{ field: string; message: string }>
} {
  const details = error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message
  }))
  
  return {
    success: false,
    error: 'Input validation failed',
    message: `Invalid input: ${details.map(d => d.message).join(', ')}`,
    code: 'VALIDATION_ERROR',
    details
  }
}

/**
 * Middleware helper for request validation
 */
export async function validateRequest<T extends z.ZodSchema>(
  request: Request,
  schema: T
): Promise<{
  success: true
  data: z.infer<T>
} | {
  success: false
  response: Response
}> {
  try {
    const body = await request.json()
    const validatedData = schema.parse(body)
    
    return {
      success: true,
      data: validatedData
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedError = formatValidationError(error)
      
      return {
        success: false,
        response: new Response(JSON.stringify(formattedError), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }
    }
    
    return {
      success: false,
      response: new Response(JSON.stringify({
        success: false,
        error: 'Invalid request format',
        message: 'Request body must be valid JSON'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
}

/**
 * Helper for validating URL parameters
 */
export function validateParams<T extends z.ZodSchema>(
  params: any,
  schema: T
): z.infer<T> {
  return schema.parse(params)
}

/**
 * Helper for validating query parameters
 */
export function validateQuery<T extends z.ZodSchema>(
  url: URL,
  schema: T
): z.infer<T> {
  const queryParams: Record<string, any> = {}
  
  for (const [key, value] of url.searchParams.entries()) {
    queryParams[key] = value
  }
  
  return schema.parse(queryParams)
}