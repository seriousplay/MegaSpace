CREATE TABLE assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL,
    student_id UUID NOT NULL REFERENCES auth.users(id),
    answers JSONB,
    submitted_at TIMESTAMP WITH TIME ZONE,
    score INTEGER,
    ai_feedback JSONB,
    teacher_feedback TEXT,
    grading_status TEXT CHECK (grading_status IN ('pending',
    'ai_graded',
    'teacher_reviewed',
    'final')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);