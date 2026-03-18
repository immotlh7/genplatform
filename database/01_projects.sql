-- Task 0D-02: Create Supabase table: projects
-- Execute this SQL in Supabase SQL Editor

CREATE TABLE projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'planning' CHECK (status IN ('planning','active','paused','completed','archived')),
    github_repo TEXT,
    vercel_url TEXT,
    domain TEXT,
    tech_stack JSONB DEFAULT '[]',
    progress INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    priority TEXT DEFAULT 'MEDIUM' CHECK (priority IN ('HIGH','MEDIUM','LOW')),
    idea_id UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add comment for table documentation
COMMENT ON TABLE projects IS 'Main projects table storing project information, status, and metadata';
COMMENT ON COLUMN projects.status IS 'Project status: planning, active, paused, completed, archived';
COMMENT ON COLUMN projects.tech_stack IS 'JSON array of technologies used in the project';
COMMENT ON COLUMN projects.progress IS 'Project completion percentage (0-100)';
COMMENT ON COLUMN projects.priority IS 'Project priority level: HIGH, MEDIUM, LOW';