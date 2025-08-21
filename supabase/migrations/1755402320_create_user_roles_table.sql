-- Migration: create_user_roles_table
-- Created at: 1755402320

-- 创建 user_roles 表
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('teacher', 'student', 'parent')),
    school_id TEXT,
    class_id TEXT,
    grade_level TEXT,
    subject_specialization TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id) -- 确保每个用户只有一个角色
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(is_active);

COMMENT ON TABLE user_roles IS '用户角色表，定义用户在平台上的身份和权限';;