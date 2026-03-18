import { NextRequest, NextResponse } from 'next/server'
import { requireCSRF } from '@/lib/csrf'
import { logSecurityEvent } from '@/lib/security-logger'

/**
 * Test endpoint for CSRF protection
 * POST /api/test-csrf - Test CSRF protection (requires token)
 * GET /api/test-csrf - Get test form (no CSRF required)
 */

function getClientIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0] ||
         req.headers.get('x-real-ip') ||
         req.ip ||
         'unknown'
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'CSRF test endpoint - GET requests do not require CSRF tokens',
    instructions: {
      test: 'Send a POST request with csrfToken in body or X-CSRF-Token header',
      getToken: 'GET /api/csrf-token to obtain a token first'
    },
    timestamp: new Date().toISOString()
  })
}

export async function POST(req: NextRequest) {
  const ip = getClientIP(req)
  
  try {
    // CSRF protection is handled by middleware
    // If we reach here, CSRF validation passed
    
    const body = await req.json()
    
    // Log successful CSRF-protected request
    await logSecurityEvent({
      event_type: 'audit_trail',
      severity: 'info',
      actor_ip: ip,
      target_resource: '/api/test-csrf',
      action_description: 'CSRF-protected test endpoint accessed successfully',
      metadata: {
        body: body,
        hasCSRFToken: !!body.csrfToken,
        userAgent: req.headers.get('user-agent')
      },
      user_agent: req.headers.get('user-agent') || 'unknown'
    })
    
    return NextResponse.json({
      success: true,
      message: 'CSRF protection successful! Your request was authenticated.',
      data: {
        receivedData: body,
        clientIP: ip,
        timestamp: new Date().toISOString(),
        userAgent: req.headers.get('user-agent'),
        csrfTokenReceived: !!body.csrfToken
      }
    })
    
  } catch (error) {
    console.error('CSRF test endpoint error:', error)
    
    // Log error
    await logSecurityEvent({
      event_type: 'system_access',
      severity: 'warning',
      actor_ip: ip,
      target_resource: '/api/test-csrf',
      action_description: 'CSRF test endpoint error',
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  // Test PUT method CSRF protection
  const ip = getClientIP(req)
  const body = await req.json()
  
  await logSecurityEvent({
    event_type: 'audit_trail',
    severity: 'info',
    actor_ip: ip,
    target_resource: '/api/test-csrf',
    action_description: 'CSRF-protected PUT test successful',
    metadata: { method: 'PUT' }
  })
  
  return NextResponse.json({
    success: true,
    message: 'PUT request with CSRF protection successful',
    method: 'PUT',
    data: body
  })
}

export async function DELETE(req: NextRequest) {
  // Test DELETE method CSRF protection  
  const ip = getClientIP(req)
  
  await logSecurityEvent({
    event_type: 'audit_trail',
    severity: 'info',
    actor_ip: ip,
    target_resource: '/api/test-csrf',
    action_description: 'CSRF-protected DELETE test successful',
    metadata: { method: 'DELETE' }
  })
  
  return NextResponse.json({
    success: true,
    message: 'DELETE request with CSRF protection successful',
    method: 'DELETE'
  })
}