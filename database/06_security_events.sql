-- Task 0D-07: Create Supabase table: security_events
-- Execute this SQL in Supabase SQL Editor

CREATE TABLE security_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL CHECK (event_type IN ('login','failed_login','threat','audit','health_check','alert')),
    severity TEXT DEFAULT 'info' CHECK (severity IN ('info','warning','critical')),
    description TEXT NOT NULL,
    source_ip TEXT,
    details JSONB DEFAULT '{}',
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for performance
CREATE INDEX idx_security_time ON security_events(created_at DESC);

-- Add table and column comments
COMMENT ON TABLE security_events IS 'Security event logging and monitoring for threat detection';
COMMENT ON COLUMN security_events.event_type IS 'Security event type: login, failed_login, threat, audit, health_check, alert';
COMMENT ON COLUMN security_events.severity IS 'Event severity: info, warning, critical';
COMMENT ON COLUMN security_events.description IS 'Human-readable description of the security event';
COMMENT ON COLUMN security_events.source_ip IS 'IP address where the event originated';
COMMENT ON COLUMN security_events.details IS 'Additional event context and forensic data';
COMMENT ON COLUMN security_events.resolved IS 'Whether the security event has been addressed';