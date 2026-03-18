-- Task 0D-04: Create Supabase table: ideas
-- Execute this SQL in Supabase SQL Editor

CREATE TABLE ideas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description_ar TEXT,
    description_en TEXT,
    status TEXT DEFAULT 'analyzing' CHECK (status IN ('analyzing','planned','approved','in_dev','completed','rejected')),
    stage INT DEFAULT 1 CHECK (stage >= 1 AND stage <= 6),
    research_data JSONB DEFAULT '{}',
    plan_document TEXT,
    competitors JSONB DEFAULT '[]',
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance  
CREATE INDEX idx_ideas_status ON ideas(status);
CREATE INDEX idx_ideas_stage ON ideas(stage);
CREATE INDEX idx_ideas_created ON ideas(created_at DESC);

-- Add table and column comments
COMMENT ON TABLE ideas IS 'Ideas repository with bilingual support and stage-based workflow';
COMMENT ON COLUMN ideas.description_ar IS 'Arabic description of the idea';
COMMENT ON COLUMN ideas.description_en IS 'English description of the idea';
COMMENT ON COLUMN ideas.status IS 'Idea status: analyzing, planned, approved, in_dev, completed, rejected';
COMMENT ON COLUMN ideas.stage IS 'Development stage (1-6): 1=Research, 2=Analysis, 3=Planning, 4=Development, 5=Testing, 6=Launch';
COMMENT ON COLUMN ideas.research_data IS 'JSON object containing research findings, market data, user feedback, etc.';
COMMENT ON COLUMN ideas.competitors IS 'JSON array of competitor analysis data';
COMMENT ON COLUMN ideas.plan_document IS 'Detailed planning document or master plan for the idea';