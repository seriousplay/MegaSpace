CREATE TABLE ai_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES ai_agents(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    session_id UUID DEFAULT gen_random_uuid(),
    message_type VARCHAR(20) CHECK (message_type IN ('user',
    'assistant')),
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]',
    response_time INTEGER,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);