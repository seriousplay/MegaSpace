CREATE TABLE resource_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    ai_agent_id UUID REFERENCES ai_agents(id),
    knowledge_base_id UUID REFERENCES knowledge_bases(id),
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    is_helpful BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);