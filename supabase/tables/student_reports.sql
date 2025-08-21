CREATE TABLE student_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES auth.users(id),
    report_type TEXT CHECK (report_type IN ('weekly',
    'monthly',
    'semester',
    'custom')),
    report_period_start DATE,
    report_period_end DATE,
    academic_performance JSONB,
    behavioral_notes TEXT[],
    teacher_comments TEXT[],
    parent_feedback TEXT,
    ai_insights JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);