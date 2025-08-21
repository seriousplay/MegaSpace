CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES auth.users(id),
    receiver_id UUID NOT NULL REFERENCES auth.users(id),
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT CHECK (message_type IN ('announcement',
    'private_message',
    'feedback',
    'progress_report')),
    is_read BOOLEAN DEFAULT false,
    attachment_urls TEXT[],
    parent_message_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);