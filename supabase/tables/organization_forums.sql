CREATE TABLE organization_forums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES auth.users(id),
    category TEXT CHECK (category IN ('announcement',
    'resource_share',
    'discussion',
    'help')) DEFAULT 'discussion',
    tags TEXT[],
    is_pinned BOOLEAN DEFAULT false,
    reply_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);