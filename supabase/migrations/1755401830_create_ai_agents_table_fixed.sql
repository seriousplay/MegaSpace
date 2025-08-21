-- Migration: create_ai_agents_table_fixed
-- Created at: 1755401830

-- 创建 AI Agents 基础表（修复版本）
CREATE TABLE IF NOT EXISTS ai_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL DEFAULT 'education',
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NULL, -- 暂时允许为空，稍后可以添加外键约束
    prompt_template TEXT NOT NULL,
    system_instructions TEXT,
    tools JSONB DEFAULT '[]',
    workflow_config JSONB DEFAULT '{}',
    file_contexts JSONB DEFAULT '[]',
    permissions VARCHAR(20) DEFAULT 'private' CHECK (permissions IN ('public', 'organization', 'private')),
    usage_count INTEGER DEFAULT 0,
    rating DECIMAL(2,1) DEFAULT 0.0,
    tags TEXT[],
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引提升查询性能
CREATE INDEX IF NOT EXISTS idx_ai_agents_creator_id ON ai_agents(creator_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_organization_id ON ai_agents(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_category ON ai_agents(category);
CREATE INDEX IF NOT EXISTS idx_ai_agents_permissions ON ai_agents(permissions);
CREATE INDEX IF NOT EXISTS idx_ai_agents_status ON ai_agents(status);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_ai_agents_updated_at ON ai_agents;
CREATE TRIGGER update_ai_agents_updated_at 
    BEFORE UPDATE ON ai_agents 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE ai_agents IS 'AI智能代理表，存储用户创建的各种AI助手配置';;