import { NextRequest, NextResponse } from 'next/server'
import { generateCSRFToken, getCSRFConfig, getCSRFStats } from '@/lib/csrf'

/**
 * CSRF Token API
 * GET /api/csrf-token - Get a new CSRF token
 */

export async function GET(req: NextRequest) {
  try {
    // Generate new CSRF token
    const csrfToken = generateCSRFToken()
    const config = getCSRFConfig()
    const stats = getCSRFStats()
    
    // Create response with token
    const response = NextResponse.json({
      success: true,
      csrfToken,
      config,
      stats,
      instructions: {
        header: `Include token in ${config.headerName} header`,
        form: `Include token in ${config.formFieldName} form field`,
        cookie: `Token also available in ${config.cookieName} cookie`
      }
    })
    
    // Set CSRF token in cookie for easy client access
    response.cookies.set(config.cookieName, csrfToken, {
      httpOnly: false, // Client needs to read this for forms
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    })
    
    return response
    
  } catch (error) {
    console.error('CSRF token generation failed:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to generate CSRF token'
    }, { status: 500 })
  }
}