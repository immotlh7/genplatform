-- Task 9-01: Security Events Table for Rate Limiting and Audit Logging
-- This table stores all security-related events including failed logins, rate limiting, and audit trails

CREATE TABLE IF NOT EXISTS security_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Event classification
  event_type TEXT NOT NULL, -- 'login_failed', 'login_success', 'rate_limit_exceeded', etc.
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  
  -- Event details
  description TEXT NOT NULL,
  source_ip INET, -- Store as proper IP type
  user_agent TEXT,
  
  -- User context (if applicable)
  user_id UUID, -- References auth.users(id) for Supabase Auth users
  user_email TEXT,
  user_role TEXT,
  
  -- Additional data
  metadata JSONB DEFAULT '{}', -- Flexible storage for event-specific data
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_ip ON security_events(source_ip);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_user ON security_events(user_id);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_security_events_type_severity_date 
ON security_events(event_type, severity, created_at DESC);

-- Index for IP-based queries (rate limiting)
CREATE INDEX IF NOT EXISTS idx_security_events_ip_type_date 
ON security_events(source_ip, event_type, created_at DESC);

-- Create a view for recent critical events
CREATE OR REPLACE VIEW recent_critical_events AS
SELECT 
  id,
  event_type,
  description,
  source_ip,
  user_email,
  metadata,
  created_at
FROM security_events 
WHERE severity = 'critical' 
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- Create a view for failed login attempts by IP
CREATE OR REPLACE VIEW failed_login_attempts AS
SELECT 
  source_ip,
  COUNT(*) as attempt_count,
  MAX(created_at) as last_attempt,
  MIN(created_at) as first_attempt
FROM security_events 
WHERE event_type IN ('login_failed', 'rate_limit_exceeded')
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY source_ip
HAVING COUNT(*) > 3
ORDER BY attempt_count DESC, last_attempt DESC;

-- Function to clean up old security events (keep 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_security_events()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM security_events 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE security_events IS 'Security audit log for authentication, rate limiting, and suspicious activity';
COMMENT ON COLUMN security_events.event_type IS 'Type of security event: login_failed, login_success, rate_limit_exceeded, etc.';
COMMENT ON COLUMN security_events.severity IS 'Event severity level: info, warning, critical';
COMMENT ON COLUMN security_events.metadata IS 'JSON object with event-specific data';
COMMENT ON VIEW recent_critical_events IS 'Critical security events from the last 7 days';
COMMENT ON VIEW failed_login_attempts IS 'IPs with multiple failed login attempts in last 24 hours';