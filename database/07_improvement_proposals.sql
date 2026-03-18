-- Task 0D-08: Create Supabase table: improvement_proposals
-- Execute this SQL in Supabase SQL Editor

CREATE TABLE improvement_proposals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    finding TEXT NOT NULL,
    impact TEXT NOT NULL,
    suggested_action TEXT NOT NULL,
    category TEXT CHECK (category IN ('performance','security','ux','code_quality','workflow','skills')),
    status TEXT DEFAULT 'proposed' CHECK (status IN ('proposed','approved','implemented','rejected')),
    implementation_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX idx_proposals_status ON improvement_proposals(status);
CREATE INDEX idx_proposals_category ON improvement_proposals(category);
CREATE INDEX idx_proposals_created ON improvement_proposals(created_at DESC);

-- Add table and column comments
COMMENT ON TABLE improvement_proposals IS 'System improvement proposals and suggestions from self-improvement agent';
COMMENT ON COLUMN improvement_proposals.finding IS 'Description of what was discovered or identified';
COMMENT ON COLUMN improvement_proposals.impact IS 'Expected impact of implementing the improvement';
COMMENT ON COLUMN improvement_proposals.suggested_action IS 'Recommended action to take';
COMMENT ON COLUMN improvement_proposals.category IS 'Improvement category: performance, security, ux, code_quality, workflow, skills';
COMMENT ON COLUMN improvement_proposals.status IS 'Proposal status: proposed, approved, implemented, rejected';
COMMENT ON COLUMN improvement_proposals.implementation_notes IS 'Notes about implementation or rejection';