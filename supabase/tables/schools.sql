CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    province TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    principal_name TEXT,
    school_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);