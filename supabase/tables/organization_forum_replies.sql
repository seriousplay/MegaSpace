CREATE TABLE organization_forum_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    forum_post_id UUID NOT NULL REFERENCES organization_forums(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id),
    content TEXT NOT NULL,
    parent_reply_id UUID REFERENCES organization_forum_replies(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);