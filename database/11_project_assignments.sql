-- Task 0D-12: Create Supabase table: project_assignments
-- Execute this SQL in Supabase SQL Editor

CREATE TABLE project_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
    access_level TEXT DEFAULT 'VIEWER' CHECK (access_level IN ('ADMIN','MANAGER','VIEWER')),
    assigned_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(project_id, member_id)
);

-- Create indexes for performance
CREATE INDEX idx_assignments_project ON project_assignments(project_id);
CREATE INDEX idx_assignments_member ON project_assignments(member_id);
CREATE INDEX idx_assignments_access ON project_assignments(access_level);

-- Add table and column comments
COMMENT ON TABLE project_assignments IS 'Connects team members to specific projects with specific access levels';
COMMENT ON COLUMN project_assignments.project_id IS 'Reference to the assigned project';
COMMENT ON COLUMN project_assignments.member_id IS 'Reference to the team member';
COMMENT ON COLUMN project_assignments.access_level IS 'Access level for this specific project: ADMIN, MANAGER, VIEWER';
COMMENT ON COLUMN project_assignments.assigned_at IS 'When the assignment was created';

-- Add constraint comment
COMMENT ON CONSTRAINT project_assignments_project_id_member_id_key ON project_assignments IS 'Ensures each member can only have one assignment per project';