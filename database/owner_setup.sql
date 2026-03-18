-- Task 0E-02: Create owner record in team_members table
-- Execute this SQL in Supabase SQL Editor to establish owner identity

-- Insert owner record
INSERT INTO team_members (
    email,
    display_name,
    role,
    is_active,
    invited_by,
    invited_at,
    created_at
) VALUES (
    'medtlh1@example.com',  -- Replace with actual owner email
    'Med',                  -- Replace with actual owner name
    'OWNER',
    true,
    NULL,  -- Owner wasn't invited by anyone
    now(),
    now()
) ON CONFLICT (email) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    role = 'OWNER',
    is_active = true,
    updated_at = now();

-- Verify the owner record was created
SELECT 
    id,
    email,
    display_name,
    role,
    is_active,
    created_at
FROM team_members 
WHERE role = 'OWNER';

-- Add comment for documentation
COMMENT ON TABLE team_members IS 'Team member management with role-based access control. Owner record establishes platform ownership.';

-- Optional: Update any existing project ownership
-- Uncomment and modify if you have existing projects that need owner assignment
/*
UPDATE projects 
SET owner_id = (SELECT id FROM team_members WHERE role = 'OWNER' LIMIT 1)
WHERE owner_id IS NULL;
*/