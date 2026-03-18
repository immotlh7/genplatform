/**
 * Validation Middleware
 * Provides reusable validation logic for API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { formatValidationError, validateRequest, validateParams, validateQuery } from './validators'
import { logInputValidationFailure } from './security-logger'

/**
 * Get client IP for security logging
 */
function getClientIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0] ||
         req.headers.get('x-real-ip') ||
         req.ip ||
         'unknown'
}

/**
 * Create a validated API handler
 * Automatically validates request body, params, and query parameters
 */
export function createValidatedHandler<
  TBody extends z.ZodSchema = z.ZodVoid,
  TParams extends z.ZodSchema = z.ZodVoid,
  TQuery extends z.ZodSchema = z.ZodVoid
>(config: {
  bodySchema?: TBody
  paramsSchema?: TParams
  querySchema?: TQuery
  handler: (req: NextRequest, context: {
    body?: z.infer<TBody>
    params?: z.infer<TParams>
    query?: z.infer<TQuery>
    validatedData: {
      body: z.infer<TBody>
      params: z.infer<TParams>
      query: z.infer<TQuery>
    }
  }) => Promise<NextResponse>
}) {
  return async (req: NextRequest, routeContext?: { params?: any }) => {
    const ip = getClientIP(req)
    const endpoint = req.nextUrl.pathname
    const userAgent = req.headers.get('user-agent')
    
    try {
      const validatedData: any = {}
      
      // Validate request body
      if (config.bodySchema) {
        const bodyValidation = await validateRequest(req, config.bodySchema)
        
        if (!bodyValidation.success) {
          // Log validation failure
          await logInputValidationFailure(
            ip,
            endpoint,
            ['Request body validation failed'],
            userAgent
          )
          
          return bodyValidation.response
        }
        
        validatedData.body = bodyValidation.data
      } else {
        validatedData.body = undefined
      }
      
      // Validate URL parameters
      if (config.paramsSchema && routeContext?.params) {
        try {
          validatedData.params = validateParams(routeContext.params, config.paramsSchema)
        } catch (error) {
          if (error instanceof z.ZodError) {
            const formattedError = formatValidationError(error)
            
            await logInputValidationFailure(
              ip,
              endpoint,
              formattedError.details?.map(d => d.message) || ['URL parameters validation failed'],
              userAgent
            )
            
            return NextResponse.json(formattedError, { status: 400 })
          }
          throw error
        }
      } else {
        validatedData.params = routeContext?.params
      }
      
      // Validate query parameters
      if (config.querySchema) {
        try {
          validatedData.query = validateQuery(req.nextUrl, config.querySchema)
        } catch (error) {
          if (error instanceof z.ZodError) {
            const formattedError = formatValidationError(error)
            
            await logInputValidationFailure(
              ip,
              endpoint,
              formattedError.details?.map(d => d.message) || ['Query parameters validation failed'],
              userAgent
            )
            
            return NextResponse.json(formattedError, { status: 400 })
          }
          throw error
        }
      } else {
        validatedData.query = Object.fromEntries(req.nextUrl.searchParams.entries())
      }
      
      // Call the actual handler with validated data
      return await config.handler(req, {
        body: validatedData.body,
        params: validatedData.params,
        query: validatedData.query,
        validatedData
      })
      
    } catch (error) {
      console.error('Validation middleware error:', error)
      
      // Log unexpected errors
      await logInputValidationFailure(
        ip,
        endpoint,
        [`Validation middleware error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        userAgent
      )
      
      return NextResponse.json({
        success: false,
        error: 'Request processing failed',
        message: 'An error occurred while processing your request'
      }, { status: 500 })
    }
  }
}

/**
 * Simple validation function for basic use cases
 */
export async function validateRequestBody<T extends z.ZodSchema>(
  req: NextRequest,
  schema: T
): Promise<{
  success: true
  data: z.infer<T>
} | {
  success: false
  response: NextResponse
}> {
  try {
    const body = await req.json()
    const validatedData = schema.parse(body)
    
    return {
      success: true,
      data: validatedData
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedError = formatValidationError(error)
      
      // Log validation failure
      const ip = getClientIP(req)
      await logInputValidationFailure(
        ip,
        req.nextUrl.pathname,
        formattedError.details?.map(d => d.message) || ['Request validation failed'],
        req.headers.get('user-agent')
      )
      
      return {
        success: false,
        response: NextResponse.json(formattedError, { status: 400 })
      }
    }
    
    return {
      success: false,
      response: NextResponse.json({
        success: false,
        error: 'Invalid request format',
        message: 'Request body must be valid JSON'
      }, { status: 400 })
    }
  }
}

/**
 * Validation decorator for method-specific validation
 */
export function withValidation<T extends z.ZodSchema>(schema: T) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value
    
    descriptor.value = async function (req: NextRequest, ...args: any[]) {
      const validation = await validateRequestBody(req, schema)
      
      if (!validation.success) {
        return validation.response
      }
      
      return originalMethod.call(this, req, validation.data, ...args)
    }
    
    return descriptor
  }
}

/**
 * Create a standardized API response
 */
export function createAPIResponse<T = any>(
  data: T,
  options?: {
    message?: string
    status?: number
    meta?: Record<string, any>
  }
): NextResponse {
  const response = {
    success: true,
    data,
    message: options?.message,
    meta: options?.meta,
    timestamp: new Date().toISOString()
  }
  
  return NextResponse.json(response, { status: options?.status || 200 })
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: string,
  options?: {
    message?: string
    status?: number
    code?: string
    details?: Array<{ field: string; message: string }>
  }
): NextResponse {
  const response = {
    success: false,
    error,
    message: options?.message || error,
    code: options?.code,
    details: options?.details,
    timestamp: new Date().toISOString()
  }
  
  return NextResponse.json(response, { status: options?.status || 400 })
}

/**
 * Validation helper for common patterns
 */
export const ValidationHelpers = {
  /**
   * Validate UUID from URL params
   */
  validateId: (id: string): boolean => {
    return z.string().uuid().safeParse(id).success
  },
  
  /**
   * Validate email format
   */
  validateEmail: (email: string): boolean => {
    return z.string().email().safeParse(email).success
  },
  
  /**
   * Validate URL format
   */
  validateUrl: (url: string): boolean => {
    return z.string().url().safeParse(url).success
  },
  
  /**
   * Sanitize string input
   */
  sanitizeString: (input: string, maxLength = 1000): string => {
    return input.trim().slice(0, maxLength)
  },
  
  /**
   * Validate and sanitize array of strings
   */
  sanitizeStringArray: (input: string[], maxItems = 100, maxLength = 100): string[] => {
    return input
      .slice(0, maxItems)
      .map(item => ValidationHelpers.sanitizeString(item, maxLength))
      .filter(item => item.length > 0)
  }
}

/**
 * Rate limiting validation
 */
export function validateRateLimit(req: NextRequest): boolean {
  // This can be enhanced with actual rate limiting logic
  // For now, just check for basic suspicious patterns
  
  const userAgent = req.headers.get('user-agent') || ''
  const suspiciousPatterns = [
    'bot',
    'crawler',
    'spider',
    'scraper'
  ]
  
  return !suspiciousPatterns.some(pattern => 
    userAgent.toLowerCase().includes(pattern)
  )
}