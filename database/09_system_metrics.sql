-- Task 0D-10: Create Supabase table: system_metrics
-- Execute this SQL in Supabase SQL Editor

CREATE TABLE system_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cpu_percent DECIMAL,
    ram_percent DECIMAL,
    disk_percent DECIMAL,
    gateway_status TEXT,
    active_sessions INT DEFAULT 0,
    recorded_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for performance
CREATE INDEX idx_metrics_time ON system_metrics(recorded_at DESC);

-- Additional indexes for monitoring queries
CREATE INDEX idx_metrics_cpu ON system_metrics(cpu_percent);
CREATE INDEX idx_metrics_ram ON system_metrics(ram_percent);
CREATE INDEX idx_metrics_disk ON system_metrics(disk_percent);

-- Add table and column comments
COMMENT ON TABLE system_metrics IS 'System performance metrics collected over time';
COMMENT ON COLUMN system_metrics.cpu_percent IS 'CPU usage percentage';
COMMENT ON COLUMN system_metrics.ram_percent IS 'RAM usage percentage';
COMMENT ON COLUMN system_metrics.disk_percent IS 'Disk usage percentage';
COMMENT ON COLUMN system_metrics.gateway_status IS 'OpenClaw gateway status';
COMMENT ON COLUMN system_metrics.active_sessions IS 'Number of active user sessions';
COMMENT ON COLUMN system_metrics.recorded_at IS 'Timestamp when metrics were recorded';