CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('school',
    'district',
    'private')),
    address TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    logo_url TEXT,
    website_url TEXT,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active',
    'inactive',
    'pending')),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);