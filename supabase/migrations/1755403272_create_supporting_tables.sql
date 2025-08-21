-- Migration: create_supporting_tables
-- Created at: 1755403272

-- 创建支持表
-- 1. File Uploads 表 (文件上传管理)
CREATE TABLE IF NOT EXISTS file_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    storage_bucket VARCHAR(100) DEFAULT 'general',
    uploader_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    file_category VARCHAR(50) CHECK (file_category IN ('document', 'image', 'video', 'audio', 'archive', 'other')) DEFAULT 'document',
    extracted_text TEXT, -- 从文件中提取的文本内容
    metadata JSONB DEFAULT '{}',
    processing_status VARCHAR(20) CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
    is_public BOOLEAN DEFAULT false,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Organization Memberships 表 (组织成员关系)
CREATE TABLE IF NOT EXISTS organization_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'teacher', 'student', 'parent', 'guest')),
    permissions JSONB DEFAULT '{}',
    invited_by UUID REFERENCES auth.users(id),
    invitation_token VARCHAR(255),
    invitation_expires_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, organization_id)
);

-- 3. User Settings 表 (用户设置)
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    preference_key VARCHAR(100) NOT NULL,
    preference_value JSONB NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    is_system_setting BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, preference_key)
);

-- 4. Notifications 表 (通知系统)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    notification_type VARCHAR(50) CHECK (notification_type IN ('info', 'success', 'warning', 'error', 'announcement')) DEFAULT 'info',
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    target_audience VARCHAR(50) CHECK (target_audience IN ('all', 'teachers', 'students', 'parents', 'organization', 'specific')) DEFAULT 'specific',
    priority_level INTEGER CHECK (priority_level BETWEEN 1 AND 5) DEFAULT 3,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    action_url VARCHAR(500),
    action_label VARCHAR(100),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. User Profiles 表 (扩展用户资料)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url VARCHAR(500),
    bio TEXT,
    phone VARCHAR(50),
    location VARCHAR(255),
    timezone VARCHAR(50) DEFAULT 'UTC',
    language_preference VARCHAR(10) DEFAULT 'zh-CN',
    theme_preference VARCHAR(20) DEFAULT 'light',
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    privacy_settings JSONB DEFAULT '{}',
    social_links JSONB DEFAULT '{}',
    professional_info JSONB DEFAULT '{}',
    last_active_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_file_uploads_uploader_id ON file_uploads(uploader_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_category ON file_uploads(file_category);
CREATE INDEX IF NOT EXISTS idx_file_uploads_status ON file_uploads(processing_status);
CREATE INDEX IF NOT EXISTS idx_organization_memberships_user_id ON organization_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_memberships_org_id ON organization_memberships(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_memberships_role ON organization_memberships(role);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_category ON user_settings(category);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sender_id ON notifications(sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_user_profiles_display_name ON user_profiles(display_name);

-- 创建更新触发器
DROP TRIGGER IF EXISTS update_file_uploads_updated_at ON file_uploads;
CREATE TRIGGER update_file_uploads_updated_at 
    BEFORE UPDATE ON file_uploads 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at 
    BEFORE UPDATE ON user_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 添加表注释
COMMENT ON TABLE file_uploads IS '文件上传表，管理用户上传的各种文件';
COMMENT ON TABLE organization_memberships IS '组织成员关系表，管理详细的成员权限和状态';
COMMENT ON TABLE user_settings IS '用户设置表，存储用户个性化配置';
COMMENT ON TABLE notifications IS '通知表，管理系统和用户间的通知消息';
COMMENT ON TABLE user_profiles IS '扩展用户资料表，存储详细的用户信息';;