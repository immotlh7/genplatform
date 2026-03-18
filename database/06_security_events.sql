-- Task 0D-07: Create Supabase table: security_events
-- Execute this SQL in Supabase SQL Editor

CREATE TABLE security_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL CHECK (event_type IN ('login_attempt','failed_login','unauthorized_access','api_abuse','suspicious_activity','security_scan','vulnerability_detected','access_granted','access_denied','password_change','session_expired')),
    severity TEXT DEFAULT 'INFO' CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
    source_ip TEXT,
    user_agent TEXT,
    endpoint TEXT,
    method TEXT,
    status_code INT,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolved_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance and security monitoring
CREATE INDEX idx_security_events_type ON security_events(event_type);
CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_source_ip ON security_events(source_ip);
CREATE INDEX idx_security_events_created ON security_events(created_at DESC);
CREATE INDEX idx_security_events_unresolved ON security_events(resolved) WHERE resolved = false;

-- Add table and column comments
COMMENT ON TABLE security_events IS 'Security event logging and monitoring for threat detection';
COMMENT ON COLUMN security_events.event_type IS 'Type of security event for categorization and alerting';
COMMENT ON COLUMN security_events.severity IS 'Event severity: LOW, MEDIUM, HIGH, CRITICAL';
COMMENT ON COLUMN security_events.source_ip IS 'IP address where the event originated';
COMMENT ON COLUMN security_events.user_agent IS 'User agent string from the request';
COMMENT ON COLUMN security_events.endpoint IS 'API endpoint or resource accessed';
COMMENT ON COLUMN security_events.method IS 'HTTP method used (GET, POST, etc.)';
COMMENT ON COLUMN security_events.status_code IS 'HTTP response status code';
COMMENT ON COLUMN security_events.metadata IS 'Additional event context and forensic data';
COMMENT ON COLUMN security_events.resolved IS 'Whether the security event has been addressed';
COMMENT ON COLUMN security_events.resolved_by IS 'Who resolved the security event';