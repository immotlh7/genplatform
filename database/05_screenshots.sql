-- Task 0D-06: Create Supabase table: screenshots
-- Execute this SQL in Supabase SQL Editor

CREATE TABLE screenshots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES project_tasks(id) ON DELETE SET NULL,
    image_url TEXT NOT NULL,
    description TEXT,
    device TEXT DEFAULT 'desktop' CHECK (device IN ('desktop','tablet','mobile')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_screenshots_project ON screenshots(project_id, created_at DESC);
CREATE INDEX idx_screenshots_task ON screenshots(task_id);
CREATE INDEX idx_screenshots_device ON screenshots(device);

-- Add table and column comments
COMMENT ON TABLE screenshots IS 'Screenshots and visual documentation for projects and tasks';
COMMENT ON COLUMN screenshots.image_url IS 'URL or path to the screenshot image file';
COMMENT ON COLUMN screenshots.description IS 'Optional description or context for the screenshot';
COMMENT ON COLUMN screenshots.device IS 'Device type: desktop, tablet, mobile for responsive testing';
COMMENT ON COLUMN screenshots.project_id IS 'Required project association';
COMMENT ON COLUMN screenshots.task_id IS 'Optional task association for task-specific screenshots';