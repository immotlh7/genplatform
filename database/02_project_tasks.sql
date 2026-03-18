-- Task 0D-03: Create Supabase table: project_tasks
-- Execute this SQL in Supabase SQL Editor

CREATE TABLE project_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    number INT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'planned' CHECK (status IN ('planned','in_progress','review','done','blocked','skipped')),
    assigned_role TEXT,
    estimated_minutes INT DEFAULT 10,
    actual_minutes INT,
    sprint_number INT DEFAULT 1,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_tasks_project ON project_tasks(project_id, number);
CREATE INDEX idx_tasks_status ON project_tasks(status);
CREATE INDEX idx_tasks_sprint ON project_tasks(sprint_number);

-- Add table and column comments
COMMENT ON TABLE project_tasks IS 'Individual tasks within projects with status tracking and time estimation';
COMMENT ON COLUMN project_tasks.status IS 'Task status: planned, in_progress, review, done, blocked, skipped';
COMMENT ON COLUMN project_tasks.assigned_role IS 'Role responsible for this task (e.g. frontend-dev, backend-dev, researcher)';
COMMENT ON COLUMN project_tasks.estimated_minutes IS 'Estimated time to complete task in minutes';
COMMENT ON COLUMN project_tasks.actual_minutes IS 'Actual time taken to complete task in minutes';
COMMENT ON COLUMN project_tasks.sprint_number IS 'Sprint number this task belongs to';