-- Table: workflow_runs
-- Purpose: Track individual workflow execution instances and their progress
-- Created: 2026-03-18 for Task 7-03

CREATE TABLE workflow_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'running' CHECK (status IN ('running','completed','failed','waiting_approval')),
  current_step TEXT, -- Current step being executed
  steps_completed INT DEFAULT 0,
  steps_total INT, -- Total steps in workflow
  logs JSONB DEFAULT '[]', -- Array of step execution logs
  error_message TEXT, -- Last error message if failed
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  started_by TEXT, -- User who initiated the workflow
  approval_required_at TIMESTAMPTZ, -- When approval was requested
  approved_by TEXT, -- User who approved (if applicable)
  approved_at TIMESTAMPTZ -- When approval was given
);

-- Indexes for performance
CREATE INDEX idx_workflow_runs_workflow_id ON workflow_runs(workflow_id);
CREATE INDEX idx_workflow_runs_project_id ON workflow_runs(project_id);
CREATE INDEX idx_workflow_runs_status ON workflow_runs(status);
CREATE INDEX idx_workflow_runs_started_at ON workflow_runs(started_at);
CREATE INDEX idx_workflow_runs_waiting_approval ON workflow_runs(status, approval_required_at) WHERE status = 'waiting_approval';

-- Function to calculate duration
CREATE OR REPLACE FUNCTION workflow_run_duration(run workflow_runs)
RETURNS INTERVAL AS $$
BEGIN
    IF run.completed_at IS NOT NULL THEN
        RETURN run.completed_at - run.started_at;
    ELSE
        RETURN now() - run.started_at;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get completion percentage
CREATE OR REPLACE FUNCTION workflow_run_progress(run workflow_runs)
RETURNS NUMERIC AS $$
BEGIN
    IF run.steps_total IS NULL OR run.steps_total = 0 THEN
        RETURN 0;
    END IF;
    RETURN ROUND((run.steps_completed::NUMERIC / run.steps_total::NUMERIC) * 100, 1);
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update completed_at when status changes to completed/failed
CREATE OR REPLACE FUNCTION update_workflow_run_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IN ('completed', 'failed') AND OLD.status NOT IN ('completed', 'failed') THEN
        NEW.completed_at = now();
    END IF;
    
    -- Update the parent workflow's last_run_at and last_run_status
    UPDATE workflows 
    SET 
        last_run_at = now(),
        last_run_status = NEW.status
    WHERE id = NEW.workflow_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workflow_run_completed_at_trigger 
BEFORE UPDATE ON workflow_runs
FOR EACH ROW EXECUTE PROCEDURE update_workflow_run_completed_at();

-- Trigger to update workflow last_run info on insert
CREATE OR REPLACE FUNCTION update_workflow_last_run_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE workflows 
    SET 
        last_run_at = NEW.started_at,
        last_run_status = NEW.status
    WHERE id = NEW.workflow_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workflow_last_run_on_insert_trigger 
AFTER INSERT ON workflow_runs
FOR EACH ROW EXECUTE PROCEDURE update_workflow_last_run_on_insert();

-- Comments for documentation
COMMENT ON TABLE workflow_runs IS 'Individual workflow execution instances and their progress';
COMMENT ON COLUMN workflow_runs.id IS 'Unique run identifier';
COMMENT ON COLUMN workflow_runs.workflow_id IS 'Reference to parent workflow template';
COMMENT ON COLUMN workflow_runs.project_id IS 'Optional project context for the run';
COMMENT ON COLUMN workflow_runs.status IS 'Current execution status';
COMMENT ON COLUMN workflow_runs.current_step IS 'Name/ID of step currently being executed';
COMMENT ON COLUMN workflow_runs.steps_completed IS 'Number of steps completed so far';
COMMENT ON COLUMN workflow_runs.steps_total IS 'Total number of steps in workflow';
COMMENT ON COLUMN workflow_runs.logs IS 'JSON array of step execution logs and results';
COMMENT ON COLUMN workflow_runs.error_message IS 'Last error message if workflow failed';
COMMENT ON COLUMN workflow_runs.started_by IS 'User who initiated the workflow execution';
COMMENT ON COLUMN workflow_runs.approval_required_at IS 'When workflow paused for approval';
COMMENT ON COLUMN workflow_runs.approved_by IS 'User who provided approval';
COMMENT ON COLUMN workflow_runs.approved_at IS 'When approval was given';