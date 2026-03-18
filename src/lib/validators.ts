/**
 * Input validation schemas for all API endpoints using Zod
 * Task 9-03: Add input validation on all API routes
 */

import { z } from 'zod'

// Base validation schemas
export const baseSchemas = {
  uuid: z.string().uuid('Must be a valid UUID'),
  email: z.string().email('Must be a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password too long'),
  url: z.string().url('Must be a valid URL'),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Must be a valid slug (lowercase letters, numbers, hyphens only)'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color'),
  timestamp: z.string().datetime('Must be a valid ISO timestamp'),
  nonEmptyString: z.string().min(1, 'Cannot be empty').trim(),
  optionalString: z.string().optional(),
  positiveInt: z.number().int().positive('Must be a positive integer'),
  nonNegativeInt: z.number().int().min(0, 'Must be non-negative'),
  ipAddress: z.string().ip('Must be a valid IP address')
}

// User roles validation
export const userRoles = ['OWNER', 'ADMIN', 'MANAGER', 'VIEWER'] as const
export const userRoleSchema = z.enum(userRoles, {
  errorMap: () => ({ message: 'Role must be OWNER, ADMIN, MANAGER, or VIEWER' })
})

// Severity levels for security events
export const severityLevels = ['info', 'warning', 'critical'] as const
export const severitySchema = z.enum(severityLevels, {
  errorMap: () => ({ message: 'Severity must be info, warning, or critical' })
})

// Status types for various entities
export const taskStatuses = ['pending', 'in_progress', 'review', 'done', 'blocked'] as const
export const taskStatusSchema = z.enum(taskStatuses)

export const projectStatuses = ['planning', 'active', 'review', 'completed', 'archived'] as const
export const projectStatusSchema = z.enum(projectStatuses)

export const workflowStatuses = ['running', 'completed', 'failed', 'waiting_approval', 'paused'] as const
export const workflowStatusSchema = z.enum(workflowStatuses)

// Authentication schemas
export const authSchemas = {
  login: z.object({
    password: baseSchemas.password,
    csrfToken: z.string().optional() // CSRF token from client
  }),

  changePassword: z.object({
    currentPassword: baseSchemas.password,
    newPassword: baseSchemas.password,
    confirmPassword: baseSchemas.password,
    csrfToken: z.string().optional()
  }).refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  }),

  resetPassword: z.object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: baseSchemas.password,
    confirmPassword: baseSchemas.password
  }).refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  })
}

// Project schemas
export const projectSchemas = {
  create: z.object({
    name: baseSchemas.nonEmptyString.max(100, 'Name must be 100 characters or less'),
    description: z.string().max(1000, 'Description must be 1000 characters or less').optional(),
    domain: z.string().regex(/^[a-z0-9.-]+$/, 'Invalid domain format').optional(),
    github_repo: z.string().regex(/^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/, 'Invalid GitHub repo format').optional(),
    tech_stack: z.array(z.string()).default([]),
    priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
    status: projectStatusSchema.default('planning')
  }),

  update: z.object({
    name: baseSchemas.nonEmptyString.max(100).optional(),
    description: z.string().max(1000).optional(),
    domain: z.string().regex(/^[a-z0-9.-]+$/).optional(),
    github_repo: z.string().regex(/^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/).optional(),
    tech_stack: z.array(z.string()).optional(),
    priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
    status: projectStatusSchema.optional()
  }),

  query: z.object({
    status: projectStatusSchema.optional(),
    priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
    search: z.string().optional()
  })
}

// Task schemas
export const taskSchemas = {
  create: z.object({
    project_id: baseSchemas.uuid,
    name: baseSchemas.nonEmptyString.max(200),
    description: z.string().max(2000).optional(),
    assigned_role: z.string().max(50).optional(),
    estimated_minutes: baseSchemas.positiveInt.optional(),
    dependencies: z.array(baseSchemas.uuid).default([]),
    sprint_number: baseSchemas.positiveInt.optional()
  }),

  update: z.object({
    name: baseSchemas.nonEmptyString.max(200).optional(),
    description: z.string().max(2000).optional(),
    status: taskStatusSchema.optional(),
    assigned_role: z.string().max(50).optional(),
    estimated_minutes: baseSchemas.positiveInt.optional(),
    actual_minutes: baseSchemas.positiveInt.optional(),
    dependencies: z.array(baseSchemas.uuid).optional(),
    sprint_number: baseSchemas.positiveInt.optional()
  }),

  query: z.object({
    project_id: baseSchemas.uuid.optional(),
    status: taskStatusSchema.optional(),
    assigned_role: z.string().optional(),
    sprint_number: baseSchemas.positiveInt.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0)
  })
}

// Workflow schemas
export const workflowSchemas = {
  create: z.object({
    name: baseSchemas.nonEmptyString.max(100),
    description: z.string().max(500).optional(),
    template_type: z.string().max(50),
    trigger_type: z.enum(['manual', 'new_idea', 'task_complete', 'schedule']),
    schedule: z.string().optional(),
    config: z.record(z.any()).default({}),
    is_active: z.boolean().default(false)
  }),

  update: z.object({
    name: baseSchemas.nonEmptyString.max(100).optional(),
    description: z.string().max(500).optional(),
    trigger_type: z.enum(['manual', 'new_idea', 'task_complete', 'schedule']).optional(),
    schedule: z.string().optional(),
    config: z.record(z.any()).optional(),
    is_active: z.boolean().optional()
  }),

  run: z.object({
    workflowId: baseSchemas.uuid,
    projectId: baseSchemas.uuid.optional(),
    context: z.record(z.any()).optional()
  }),

  approve: z.object({
    runId: baseSchemas.uuid,
    approved: z.boolean(),
    reason: z.string().max(500).optional()
  })
}

// Ideas schemas
export const ideaSchemas = {
  create: z.object({
    title: baseSchemas.nonEmptyString.max(200),
    description: baseSchemas.nonEmptyString.max(5000),
    language: z.enum(['en', 'ar']).default('en'),
    reference_url: baseSchemas.url.optional(),
    reference_image: z.string().optional() // Base64 or URL
  }),

  update: z.object({
    title: baseSchemas.nonEmptyString.max(200).optional(),
    description: baseSchemas.nonEmptyString.max(5000).optional(),
    status: z.enum(['analyzing', 'planned', 'approved', 'in_dev', 'completed', 'rejected']).optional(),
    stage: z.number().int().min(1).max(6).optional(),
    research_data: z.record(z.any()).optional(),
    plan_document: z.record(z.any()).optional()
  })
}

// Security schemas
export const securitySchemas = {
  event: z.object({
    event_type: baseSchemas.nonEmptyString.max(100),
    severity: severitySchema,
    description: baseSchemas.nonEmptyString.max(1000),
    source_ip: baseSchemas.ipAddress.optional(),
    user_agent: z.string().max(500).optional(),
    user_id: baseSchemas.uuid.optional(),
    user_email: baseSchemas.email.optional(),
    user_role: userRoleSchema.optional(),
    metadata: z.record(z.any()).default({})
  }),

  auditQuery: z.object({
    event_type: z.string().optional(),
    severity: severitySchema.optional(),
    source_ip: baseSchemas.ipAddress.optional(),
    user_id: baseSchemas.uuid.optional(),
    start_date: baseSchemas.timestamp.optional(),
    end_date: baseSchemas.timestamp.optional(),
    limit: z.coerce.number().int().min(1).max(1000).default(100),
    offset: z.coerce.number().int().min(0).default(0)
  })
}

// File upload schemas
export const fileSchemas = {
  upload: z.object({
    file: z.instanceof(File),
    type: z.enum(['image', 'document', 'screenshot']),
    project_id: baseSchemas.uuid.optional(),
    task_id: baseSchemas.uuid.optional()
  }).refine(data => {
    // Validate file size (10MB max)
    return data.file.size <= 10 * 1024 * 1024
  }, {
    message: 'File size must be less than 10MB'
  }).refine(data => {
    // Validate file type
    const allowedTypes = {
      image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      document: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      screenshot: ['image/png', 'image/jpeg']
    }
    return allowedTypes[data.type].includes(data.file.type)
  }, {
    message: 'Invalid file type for the specified category'
  })
}

// Chat schemas
export const chatSchemas = {
  sendMessage: z.object({
    conversation_id: baseSchemas.uuid,
    content: baseSchemas.nonEmptyString.max(10000),
    language: z.enum(['en', 'ar']).optional(),
    project_id: baseSchemas.uuid.optional()
  }),

  createConversation: z.object({
    title: baseSchemas.nonEmptyString.max(100),
    project_id: baseSchemas.uuid.optional()
  })
}

// Common query parameters
export const commonQuerySchemas = {
  pagination: z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
    page: z.coerce.number().int().min(1).optional()
  }),

  dateRange: z.object({
    start_date: baseSchemas.timestamp.optional(),
    end_date: baseSchemas.timestamp.optional()
  }),

  search: z.object({
    q: z.string().min(1).max(200).optional(),
    filter: z.string().optional(),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).default('desc')
  })
}

// Validation helper functions
export function validateRequest<T>(schema: z.ZodType<T>, data: unknown): { success: true; data: T } | { success: false; error: string; details: z.ZodError } {
  try {
    const result = schema.safeParse(data)
    if (result.success) {
      return { success: true, data: result.data }
    } else {
      return {
        success: false,
        error: formatZodError(result.error),
        details: result.error
      }
    }
  } catch (error) {
    return {
      success: false,
      error: 'Validation failed',
      details: error as z.ZodError
    }
  }
}

export function formatZodError(error: z.ZodError): string {
  const firstError = error.errors[0]
  if (firstError) {
    const path = firstError.path.length > 0 ? `${firstError.path.join('.')}: ` : ''
    return `${path}${firstError.message}`
  }
  return 'Validation failed'
}

// Middleware wrapper for API routes with validation
export function withValidation<T>(
  schema: z.ZodType<T>,
  handler: (req: Request, validData: T, ...args: any[]) => Promise<Response>
) {
  return async function validatedHandler(req: Request, ...args: any[]): Promise<Response> {
    try {
      const body = await req.json()
      const validation = validateRequest(schema, body)

      if (!validation.success) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Validation failed',
            error: validation.error,
            details: validation.details.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
              code: err.code
            }))
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }

      return handler(req, validation.data, ...args)
    } catch (error) {
      if (error instanceof SyntaxError) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Invalid JSON in request body',
            error: 'Invalid JSON syntax'
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }

      throw error // Re-throw other errors
    }
  }
}

export default {
  auth: authSchemas,
  project: projectSchemas,
  task: taskSchemas,
  workflow: workflowSchemas,
  idea: ideaSchemas,
  security: securitySchemas,
  file: fileSchemas,
  chat: chatSchemas,
  common: commonQuerySchemas,
  base: baseSchemas,
  validate: validateRequest,
  withValidation
}