-- Task 0D-09: Create Supabase table: task_events
-- Execute this SQL in Supabase SQL Editor

CREATE TABLE task_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES project_tasks(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    actor_role TEXT,
    actor_user_id UUID,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for performance
CREATE INDEX idx_task_events ON task_events(project_id, created_at DESC);

-- Additional indexes for better query performance
CREATE INDEX idx_task_events_task ON task_events(task_id);
CREATE INDEX idx_task_events_type ON task_events(event_type);
CREATE INDEX idx_task_events_actor ON task_events(actor_role);

-- Add table and column comments
COMMENT ON TABLE task_events IS 'Event log for task lifecycle tracking and activity monitoring';
COMMENT ON COLUMN task_events.event_type IS 'Type of event (task_started, task_completed, status_changed, etc.)';
COMMENT ON COLUMN task_events.actor_role IS 'Role performing the action (frontend-dev, backend-dev, qa, etc.)';
COMMENT ON COLUMN task_events.actor_user_id IS 'User ID if performed by human, NULL for AI agents';
COMMENT ON COLUMN task_events.details IS 'Additional event details and context';