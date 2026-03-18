-- Security Events Table for Audit Trail and Security Monitoring
-- Task 9-01: Rate limiting and security event logging

-- Create security_events table
CREATE TABLE IF NOT EXISTS security_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'login_success',
        'login_failure', 
        'login_rate_limited',
        'password_change',
        'session_expired',
        'unauthorized_access',
        'csrf_violation',
        'input_validation_failed',
        'prompt_injection_detected',
        'suspicious_activity',
        'audit_trail',
        'system_access',
        'data_access',
        'configuration_change'
    )),
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    actor_ip INET NOT NULL,
    actor_user_id UUID,
    actor_email TEXT,
    actor_role TEXT CHECK (actor_role IN ('OWNER', 'ADMIN', 'MANAGER', 'VIEWER')),
    target_resource TEXT,
    action_description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    user_agent TEXT,
    session_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID,
    resolution_notes TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_actor_ip ON security_events(actor_ip);
CREATE INDEX IF NOT EXISTS idx_security_events_actor_user_id ON security_events(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_severity_created ON security_events(severity, created_at DESC);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_security_events_type_severity_time ON security_events(event_type, severity, created_at DESC);

-- Enable Row Level Security (will be configured in Task 9-12)
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Create a view for recent critical events
CREATE OR REPLACE VIEW recent_critical_events AS
SELECT 
    id,
    event_type,
    actor_ip,
    actor_email,
    action_description,
    metadata,
    created_at
FROM security_events
WHERE severity = 'critical'
AND created_at >= now() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Create a view for login attempt analysis
CREATE OR REPLACE VIEW login_attempt_summary AS
SELECT 
    actor_ip,
    actor_email,
    COUNT(*) as total_attempts,
    COUNT(*) FILTER (WHERE event_type = 'login_success') as successful_logins,
    COUNT(*) FILTER (WHERE event_type = 'login_failure') as failed_logins,
    COUNT(*) FILTER (WHERE event_type = 'login_rate_limited') as rate_limited_events,
    MIN(created_at) as first_attempt,
    MAX(created_at) as last_attempt
FROM security_events
WHERE event_type IN ('login_success', 'login_failure', 'login_rate_limited')
AND created_at >= now() - INTERVAL '24 hours'
GROUP BY actor_ip, actor_email
ORDER BY failed_logins DESC, total_attempts DESC;

-- Create function to automatically clean old security events (optional cleanup)
CREATE OR REPLACE FUNCTION cleanup_old_security_events()
RETURNS void AS $$
BEGIN
    -- Delete non-critical events older than 90 days
    DELETE FROM security_events
    WHERE severity = 'info'
    AND created_at < now() - INTERVAL '90 days';
    
    -- Delete warning events older than 180 days
    DELETE FROM security_events
    WHERE severity = 'warning'
    AND created_at < now() - INTERVAL '180 days';
    
    -- Keep critical events for 1 year
    DELETE FROM security_events
    WHERE severity = 'critical'
    AND created_at < now() - INTERVAL '1 year';
    
    -- Log the cleanup
    INSERT INTO security_events (event_type, severity, actor_ip, action_description, metadata)
    VALUES (
        'system_access',
        'info',
        '127.0.0.1',
        'Automated cleanup of old security events',
        jsonb_build_object('cleanup_timestamp', now())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get security stats efficiently
CREATE OR REPLACE FUNCTION get_security_stats(timeframe_hours INTEGER DEFAULT 24)
RETURNS TABLE (
    total_events BIGINT,
    critical_events BIGINT,
    warning_events BIGINT,
    info_events BIGINT,
    unique_ips BIGINT,
    login_failures BIGINT,
    rate_limit_events BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_events,
        COUNT(*) FILTER (WHERE severity = 'critical') as critical_events,
        COUNT(*) FILTER (WHERE severity = 'warning') as warning_events,
        COUNT(*) FILTER (WHERE severity = 'info') as info_events,
        COUNT(DISTINCT actor_ip) as unique_ips,
        COUNT(*) FILTER (WHERE event_type = 'login_failure') as login_failures,
        COUNT(*) FILTER (WHERE event_type = 'login_rate_limited') as rate_limit_events
    FROM security_events
    WHERE created_at >= now() - (timeframe_hours || ' hours')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant appropriate permissions (will be refined in RLS task)
-- For now, allow service role full access
GRANT ALL ON security_events TO service_role;
GRANT SELECT ON recent_critical_events TO service_role;
GRANT SELECT ON login_attempt_summary TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_security_events() TO service_role;
GRANT EXECUTE ON FUNCTION get_security_stats(INTEGER) TO service_role;

-- Add comment for documentation
COMMENT ON TABLE security_events IS 'Security audit trail and event logging for GenPlatform.ai';
COMMENT ON COLUMN security_events.event_type IS 'Type of security event that occurred';
COMMENT ON COLUMN security_events.severity IS 'Severity level: info, warning, or critical';
COMMENT ON COLUMN security_events.actor_ip IS 'IP address of the actor performing the action';
COMMENT ON COLUMN security_events.metadata IS 'Additional context data for the event';
COMMENT ON VIEW recent_critical_events IS 'View of critical security events in the last 24 hours';
COMMENT ON VIEW login_attempt_summary IS 'Summary of login attempts by IP and email in the last 24 hours';