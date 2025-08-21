CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    school_id UUID,
    grade_level TEXT NOT NULL,
    subject TEXT,
    teacher_id UUID NOT NULL REFERENCES auth.users(id),
    academic_year TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);