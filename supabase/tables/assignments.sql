CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    course_content_id UUID,
    teacher_id UUID NOT NULL REFERENCES auth.users(id),
    class_id UUID,
    assignment_type TEXT CHECK (assignment_type IN ('homework',
    'quiz',
    'exam',
    'project')),
    questions JSONB,
    due_date TIMESTAMP WITH TIME ZONE,
    total_points INTEGER DEFAULT 100,
    is_published BOOLEAN DEFAULT false,
    ai_generated BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);