-- Table: workflows
-- Purpose: Store workflow template definitions and configuration
-- Created: 2026-03-18 for Task 7-02

CREATE TABLE workflows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  trigger_type TEXT CHECK (trigger_type IN ('manual','new_idea','task_complete','schedule')),
  schedule TEXT, -- Cron expression for scheduled workflows
  config JSONB DEFAULT '{}', -- Workflow-specific configuration
  last_run_at TIMESTAMPTZ,
  last_run_status TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_workflows_template_type ON workflows(template_type);
CREATE INDEX idx_workflows_trigger_type ON workflows(trigger_type);
CREATE INDEX idx_workflows_is_active ON workflows(is_active);
CREATE INDEX idx_workflows_last_run_at ON workflows(last_run_at);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE workflows IS 'Workflow template definitions and configuration';
COMMENT ON COLUMN workflows.id IS 'Unique workflow identifier';
COMMENT ON COLUMN workflows.name IS 'Human-readable workflow name';
COMMENT ON COLUMN workflows.description IS 'Workflow description and purpose';
COMMENT ON COLUMN workflows.template_type IS 'Template type identifier (idea_to_mvp, bug_fix, etc.)';
COMMENT ON COLUMN workflows.is_active IS 'Whether workflow is currently active and can be triggered';
COMMENT ON COLUMN workflows.trigger_type IS 'How workflow is triggered: manual, new_idea, task_complete, schedule';
COMMENT ON COLUMN workflows.schedule IS 'Cron expression for scheduled workflows';
COMMENT ON COLUMN workflows.config IS 'JSON configuration specific to workflow template';
COMMENT ON COLUMN workflows.last_run_at IS 'Timestamp of most recent workflow execution';
COMMENT ON COLUMN workflows.last_run_status IS 'Status of most recent run: running, completed, failed, waiting_approval';