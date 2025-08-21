CREATE TABLE knowledge_bases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    creator_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    file_paths JSONB DEFAULT '[]',
    processed_content JSONB DEFAULT '{}',
    embedding_status VARCHAR(20) DEFAULT 'pending' CHECK (embedding_status IN ('pending',
    'processing',
    'completed',
    'failed')),
    permissions VARCHAR(20) DEFAULT 'private' CHECK (permissions IN ('public',
    'organization',
    'private')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);