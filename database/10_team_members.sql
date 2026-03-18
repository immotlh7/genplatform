-- Task 0D-11: Create Supabase table: team_members
-- Execute this SQL in Supabase SQL Editor

CREATE TABLE team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    role TEXT DEFAULT 'VIEWER' CHECK (role IN ('OWNER','ADMIN','MANAGER','VIEWER')),
    is_active BOOLEAN DEFAULT true,
    avatar_url TEXT,
    invited_by UUID,
    invited_at TIMESTAMPTZ DEFAULT now(),
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_team_members_email ON team_members(email);
CREATE INDEX idx_team_members_role ON team_members(role);
CREATE INDEX idx_team_members_active ON team_members(is_active);
CREATE INDEX idx_team_members_invited ON team_members(invited_at DESC);

-- Add table and column comments
COMMENT ON TABLE team_members IS 'Team member management with role-based access control';
COMMENT ON COLUMN team_members.email IS 'Unique email address for team member';
COMMENT ON COLUMN team_members.display_name IS 'Display name shown in the interface';
COMMENT ON COLUMN team_members.role IS 'Team member role: OWNER, ADMIN, MANAGER, VIEWER';
COMMENT ON COLUMN team_members.is_active IS 'Whether the team member account is active';
COMMENT ON COLUMN team_members.avatar_url IS 'URL to team member avatar image';
COMMENT ON COLUMN team_members.invited_by IS 'UUID of team member who sent the invitation';
COMMENT ON COLUMN team_members.last_login_at IS 'Timestamp of last login activity';