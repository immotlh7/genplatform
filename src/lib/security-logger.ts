/**
 * Security Event Logger
 * Logs security-related events to Supabase for audit trail
 */

import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export type SecurityEventType = 
  | 'login_success' 
  | 'login_failure'
  | 'login_rate_limited'
  | 'password_change'
  | 'session_expired'
  | 'unauthorized_access'
  | 'csrf_violation'
  | 'input_validation_failed'
  | 'prompt_injection_detected'
  | 'suspicious_activity'
  | 'audit_trail'
  | 'system_access'
  | 'data_access'
  | 'configuration_change'

export type SecuritySeverity = 'info' | 'warning' | 'critical'

interface SecurityEvent {
  event_type: SecurityEventType
  severity: SecuritySeverity
  actor_ip: string
  actor_user_id?: string
  actor_email?: string
  actor_role?: string
  target_resource?: string
  action_description: string
  metadata?: Record<string, any>
  user_agent?: string
  session_id?: string
}

/**
 * Log a security event to Supabase
 */
export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  try {
    const { error } = await supabase
      .from('security_events')
      .insert({
        event_type: event.event_type,
        severity: event.severity,
        actor_ip: event.actor_ip,
        actor_user_id: event.actor_user_id,
        actor_email: event.actor_email,
        actor_role: event.actor_role,
        target_resource: event.target_resource,
        action_description: event.action_description,
        metadata: event.metadata || {},
        user_agent: event.user_agent,
        session_id: event.session_id,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Failed to log security event:', error)
    }
  } catch (error) {
    console.error('Security logger error:', error)
  }
}

/**
 * Log login attempt
 */
export async function logLoginAttempt(
  ip: string,
  success: boolean,
  email?: string,
  userAgent?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logSecurityEvent({
    event_type: success ? 'login_success' : 'login_failure',
    severity: success ? 'info' : 'warning',
    actor_ip: ip,
    actor_email: email,
    action_description: success 
      ? `Successful login for ${email || 'unknown user'}` 
      : `Failed login attempt for ${email || 'unknown user'}`,
    metadata: {
      ...metadata,
      success,
      timestamp: new Date().toISOString()
    },
    user_agent: userAgent
  })
}

/**
 * Log rate limiting event
 */
export async function logRateLimitEvent(
  ip: string,
  attempts: number,
  windowMinutes: number,
  userAgent?: string
): Promise<void> {
  await logSecurityEvent({
    event_type: 'login_rate_limited',
    severity: 'warning',
    actor_ip: ip,
    action_description: `IP blocked due to ${attempts} failed login attempts in ${windowMinutes} minutes`,
    metadata: {
      failed_attempts: attempts,
      window_minutes: windowMinutes,
      block_timestamp: new Date().toISOString()
    },
    user_agent: userAgent
  })
}

/**
 * Log suspicious activity
 */
export async function logSuspiciousActivity(
  ip: string,
  activity: string,
  severity: SecuritySeverity = 'warning',
  metadata?: Record<string, any>
): Promise<void> {
  await logSecurityEvent({
    event_type: 'suspicious_activity',
    severity,
    actor_ip: ip,
    action_description: activity,
    metadata: {
      ...metadata,
      detected_at: new Date().toISOString()
    }
  })
}

/**
 * Log CSRF violation
 */
export async function logCSRFViolation(
  ip: string,
  endpoint: string,
  userAgent?: string,
  userId?: string
): Promise<void> {
  await logSecurityEvent({
    event_type: 'csrf_violation',
    severity: 'critical',
    actor_ip: ip,
    actor_user_id: userId,
    target_resource: endpoint,
    action_description: `CSRF token violation on ${endpoint}`,
    metadata: {
      endpoint,
      violation_type: 'missing_or_invalid_csrf_token'
    },
    user_agent: userAgent
  })
}

/**
 * Log input validation failure
 */
export async function logInputValidationFailure(
  ip: string,
  endpoint: string,
  validationErrors: string[],
  userAgent?: string,
  userId?: string
): Promise<void> {
  await logSecurityEvent({
    event_type: 'input_validation_failed',
    severity: 'warning',
    actor_ip: ip,
    actor_user_id: userId,
    target_resource: endpoint,
    action_description: `Input validation failed on ${endpoint}`,
    metadata: {
      endpoint,
      validation_errors: validationErrors,
      error_count: validationErrors.length
    },
    user_agent: userAgent
  })
}

/**
 * Log prompt injection attempt
 */
export async function logPromptInjection(
  ip: string,
  injectionContent: string,
  detectedPatterns: string[],
  source: string,
  userId?: string
): Promise<void> {
  await logSecurityEvent({
    event_type: 'prompt_injection_detected',
    severity: 'critical',
    actor_ip: ip,
    actor_user_id: userId,
    target_resource: source,
    action_description: `Prompt injection attempt detected from ${source}`,
    metadata: {
      injection_content: injectionContent.substring(0, 500), // Truncate for security
      detected_patterns: detectedPatterns,
      source,
      blocked: true
    }
  })
}

/**
 * Get recent security events
 */
export async function getRecentSecurityEvents(
  limit = 50,
  severity?: SecuritySeverity,
  eventType?: SecurityEventType
): Promise<any[]> {
  try {
    let query = supabase
      .from('security_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (severity) {
      query = query.eq('severity', severity)
    }

    if (eventType) {
      query = query.eq('event_type', eventType)
    }

    const { data, error } = await query

    if (error) {
      console.error('Failed to fetch security events:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching security events:', error)
    return []
  }
}

/**
 * Get security statistics
 */
export async function getSecurityStats(timeframe: 'hour' | 'day' | 'week' = 'day'): Promise<{
  totalEvents: number
  criticalEvents: number
  warningEvents: number
  topEventTypes: Array<{ event_type: string; count: number }>
  topIPs: Array<{ ip: string; count: number }>
}> {
  try {
    const timeframes = {
      hour: new Date(Date.now() - 60 * 60 * 1000),
      day: new Date(Date.now() - 24 * 60 * 60 * 1000),
      week: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    }

    const since = timeframes[timeframe].toISOString()

    // Get total events
    const { count: totalEvents } = await supabase
      .from('security_events')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', since)

    // Get critical events
    const { count: criticalEvents } = await supabase
      .from('security_events')
      .select('*', { count: 'exact', head: true })
      .eq('severity', 'critical')
      .gte('created_at', since)

    // Get warning events
    const { count: warningEvents } = await supabase
      .from('security_events')
      .select('*', { count: 'exact', head: true })
      .eq('severity', 'warning')
      .gte('created_at', since)

    // Get top event types (simplified - in production use SQL aggregation)
    const { data: events } = await supabase
      .from('security_events')
      .select('event_type, actor_ip')
      .gte('created_at', since)

    const eventTypeCounts = new Map<string, number>()
    const ipCounts = new Map<string, number>()

    events?.forEach(event => {
      // Count event types
      const typeCount = eventTypeCounts.get(event.event_type) || 0
      eventTypeCounts.set(event.event_type, typeCount + 1)

      // Count IPs
      const ipCount = ipCounts.get(event.actor_ip) || 0
      ipCounts.set(event.actor_ip, ipCount + 1)
    })

    const topEventTypes = Array.from(eventTypeCounts.entries())
      .map(([event_type, count]) => ({ event_type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    const topIPs = Array.from(ipCounts.entries())
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return {
      totalEvents: totalEvents || 0,
      criticalEvents: criticalEvents || 0,
      warningEvents: warningEvents || 0,
      topEventTypes,
      topIPs
    }
  } catch (error) {
    console.error('Error fetching security stats:', error)
    return {
      totalEvents: 0,
      criticalEvents: 0,
      warningEvents: 0,
      topEventTypes: [],
      topIPs: []
    }
  }
}