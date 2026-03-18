-- Task 0D-05: Create Supabase table: chat_messages  
-- Execute this SQL in Supabase SQL Editor

CREATE TABLE chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    idea_id UUID REFERENCES ideas(id) ON DELETE SET NULL,
    sender TEXT NOT NULL CHECK (sender IN ('user','agent','system')),
    content TEXT NOT NULL,
    language TEXT DEFAULT 'en',
    message_type TEXT DEFAULT 'chat' CHECK (message_type IN ('chat','notification','alert','report','command')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_messages_project ON chat_messages(project_id, created_at DESC);
CREATE INDEX idx_messages_idea ON chat_messages(idea_id, created_at DESC);
CREATE INDEX idx_messages_sender ON chat_messages(sender);
CREATE INDEX idx_messages_type ON chat_messages(message_type);
CREATE INDEX idx_messages_language ON chat_messages(language);

-- Add table and column comments
COMMENT ON TABLE chat_messages IS 'Chat messages and communications related to projects and ideas';
COMMENT ON COLUMN chat_messages.sender IS 'Message sender: user (human), agent (AI), system (automated)';
COMMENT ON COLUMN chat_messages.language IS 'Language code of the message content (en, ar, etc.)';
COMMENT ON COLUMN chat_messages.message_type IS 'Message type: chat, notification, alert, report, command';
COMMENT ON COLUMN chat_messages.metadata IS 'Additional message metadata (attachments, mentions, formatting, etc.)';
COMMENT ON COLUMN chat_messages.project_id IS 'Optional project association, NULL for general messages';
COMMENT ON COLUMN chat_messages.idea_id IS 'Optional idea association, NULL for project-specific or general messages';