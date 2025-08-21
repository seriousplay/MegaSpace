CREATE TABLE student_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES auth.users(id),
    subject TEXT NOT NULL,
    knowledge_points JSONB,
    mastery_level JSONB,
    learning_progress DECIMAL(5,2),
    strengths TEXT[],
    weaknesses TEXT[],
    recommendations TEXT[],
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);