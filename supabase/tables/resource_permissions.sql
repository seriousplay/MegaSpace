CREATE TABLE resource_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_type TEXT CHECK (resource_type IN ('ai_agent',
    'knowledge_base',
    'course_content')) NOT NULL,
    resource_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    organization_id UUID REFERENCES organizations(id),
    permission_type TEXT CHECK (permission_type IN ('view',
    'edit',
    'admin')) NOT NULL,
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);