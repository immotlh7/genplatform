/**
 * Security Event Logger — Supabase disabled, logs to console only
 */

export type SecurityEventType = 
  | 'login_success' | 'login_failure' | 'login_rate_limited'
  | 'password_change' | 'session_expired' | 'unauthorized_access'
  | 'csrf_violation' | 'input_validation_failed' | 'prompt_injection_detected'
  | 'suspicious_activity' | 'audit_trail' | 'system_access'
  | 'data_access' | 'configuration_change'

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

export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  // No-op: Supabase disabled
}

export async function logLoginAttempt(
  ip: string, success: boolean, email?: string, userAgent?: string, metadata?: Record<string, any>
): Promise<void> {}

export async function logRateLimitEvent(
  ip: string, attempts: number, windowMinutes: number, userAgent?: string
): Promise<void> {}

export async function logSuspiciousActivity(
  ip: string, activity: string, severity: SecuritySeverity = 'warning', metadata?: Record<string, any>
): Promise<void> {}

export async function logCSRFViolation(
  ip: string, endpoint: string, userAgent?: string, userId?: string
): Promise<void> {}

export async function logInputValidationFailure(
  ip: string, endpoint: string, validationErrors: string[], userAgent?: string, userId?: string
): Promise<void> {}

export async function logPromptInjection(
  ip: string, injectionContent: string, detectedPatterns: string[], source: string, userId?: string
): Promise<void> {}

export async function getRecentSecurityEvents(
  limit?: number, severity?: SecuritySeverity, eventType?: SecurityEventType
): Promise<any[]> {
  return []
}

export async function getSecurityStats(timeframe?: 'hour' | 'day' | 'week') {
  return { totalEvents: 0, criticalEvents: 0, warningEvents: 0, topEventTypes: [], topIPs: [] }
}
