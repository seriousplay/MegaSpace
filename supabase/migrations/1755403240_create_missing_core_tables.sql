-- Migration: create_missing_core_tables
-- Created at: 1755403240

-- 创建缺失的核心表
-- 1. Organizations 表 (组织/学校管理)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) CHECK (type IN ('school', 'district', 'academy', 'institution')) DEFAULT 'school',
    description TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address TEXT,
    website_url VARCHAR(255),
    logo_url VARCHAR(255),
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User Organizations 关联表
CREATE TABLE IF NOT EXISTS user_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('admin', 'manager', 'teacher', 'member')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, organization_id)
);

-- 3. Assignments 表 (作业管理)
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    subject VARCHAR(100),
    grade_level VARCHAR(50),
    assignment_type VARCHAR(50) CHECK (assignment_type IN ('homework', 'quiz', 'exam', 'project', 'practice')) DEFAULT 'homework',
    questions JSONB DEFAULT '[]',
    due_date TIMESTAMPTZ,
    total_points INTEGER DEFAULT 100,
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5) DEFAULT 3,
    tags TEXT[] DEFAULT '{}',
    is_published BOOLEAN DEFAULT false,
    ai_generated BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Knowledge Bases 表 (知识库管理)
CREATE TABLE IF NOT EXISTS knowledge_bases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    category VARCHAR(100) DEFAULT 'general',
    content_type VARCHAR(50) CHECK (content_type IN ('documents', 'qa_pairs', 'structured_data', 'mixed')) DEFAULT 'documents',
    knowledge_data JSONB DEFAULT '{}',
    embedding_model VARCHAR(100) DEFAULT 'text-embedding-ada-002',
    chunk_size INTEGER DEFAULT 1000,
    chunk_overlap INTEGER DEFAULT 200,
    is_public BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    last_updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Course Contents 表 (课程内容管理)
CREATE TABLE IF NOT EXISTS course_contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100) NOT NULL,
    grade_level VARCHAR(50),
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    content_type VARCHAR(50) CHECK (content_type IN ('lesson', 'courseware', 'video', 'document', 'interactive')) DEFAULT 'lesson',
    content_data JSONB DEFAULT '{}',
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5) DEFAULT 3,
    estimated_duration INTEGER, -- 预估学习时间(分钟)
    tags TEXT[] DEFAULT '{}',
    ai_generated BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. AI Interactions 表 (AI交互历史)
CREATE TABLE IF NOT EXISTS ai_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES ai_agents(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    session_id UUID NOT NULL,
    message_type VARCHAR(20) CHECK (message_type IN ('user', 'assistant')) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    response_time INTEGER, -- 响应时间(毫秒)
    token_count INTEGER,
    cost DECIMAL(10,6) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(type);
CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_org_id ON user_organizations(organization_id);
CREATE INDEX IF NOT EXISTS idx_assignments_teacher_id ON assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assignments_organization_id ON assignments(organization_id);
CREATE INDEX IF NOT EXISTS idx_assignments_subject ON assignments(subject);
CREATE INDEX IF NOT EXISTS idx_knowledge_bases_creator_id ON knowledge_bases(creator_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_bases_category ON knowledge_bases(category);
CREATE INDEX IF NOT EXISTS idx_course_contents_teacher_id ON course_contents(teacher_id);
CREATE INDEX IF NOT EXISTS idx_course_contents_subject ON course_contents(subject);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_user_id ON ai_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_agent_id ON ai_interactions(agent_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_session_id ON ai_interactions(session_id);

-- 创建更新触发器
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at 
    BEFORE UPDATE ON organizations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assignments_updated_at ON assignments;
CREATE TRIGGER update_assignments_updated_at 
    BEFORE UPDATE ON assignments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_course_contents_updated_at ON course_contents;
CREATE TRIGGER update_course_contents_updated_at 
    BEFORE UPDATE ON course_contents 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 添加表注释
COMMENT ON TABLE organizations IS '组织/学校表，管理教育机构信息';
COMMENT ON TABLE user_organizations IS '用户组织关联表，管理用户在不同组织中的角色';
COMMENT ON TABLE assignments IS '作业表，管理教师创建的各种作业和练习';
COMMENT ON TABLE knowledge_bases IS '知识库表，存储结构化的知识内容';
COMMENT ON TABLE course_contents IS '课程内容表，管理教学材料和资源';
COMMENT ON TABLE ai_interactions IS 'AI交互历史表，记录用户与AI的对话历史';;