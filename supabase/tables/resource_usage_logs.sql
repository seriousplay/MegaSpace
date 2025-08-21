CREATE TABLE resource_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    organization_id UUID REFERENCES organizations(id),
    resource_type TEXT CHECK (resource_type IN ('ai_agent',
    'knowledge_base')) NOT NULL,
    resource_id UUID NOT NULL,
    action_type TEXT CHECK (action_type IN ('view',
    'download',
    'use',
    'share')) NOT NULL,
    session_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);