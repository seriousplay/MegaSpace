-- Migration: create_public_tools_table
-- Created at: 1755231167

CREATE TABLE public_tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL, -- '语文教学', '数学教学', '英语教学', '科学教学', '教学管理', '学习分析'
    tool_type TEXT CHECK (tool_type IN ('ai_tool', 'knowledge_base', 'template', 'resource')) NOT NULL,
    creator_id UUID NOT NULL REFERENCES auth.users(id),
    organization_id UUID REFERENCES organizations(id),
    
    -- 工具配置和数据
    configuration JSONB NOT NULL, -- 工具的具体配置信息
    
    -- 关联数据
    ai_agent_id UUID REFERENCES ai_agents(id), -- 如果是AI工具，关联到ai_agents表
    knowledge_base_id UUID REFERENCES knowledge_bases(id), -- 如果是知识库，关联到knowledge_bases表
    course_content_id UUID REFERENCES course_contents(id), -- 如果是课程模板，关联到course_contents表
    
    -- 元数据
    tags TEXT[] DEFAULT '{}',
    features TEXT[] DEFAULT '{}', -- 主要功能特性
    icon_name TEXT DEFAULT 'Brain', -- Lucide图标名称
    
    -- 统计数据
    usage_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    
    -- 状态控制
    is_public BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false, -- 是否为精选工具
    is_premium BOOLEAN DEFAULT false, -- 是否为高级工具
    is_active BOOLEAN DEFAULT true,
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提升查询性能
CREATE INDEX idx_public_tools_category ON public_tools(category);
CREATE INDEX idx_public_tools_tool_type ON public_tools(tool_type);
CREATE INDEX idx_public_tools_is_public ON public_tools(is_public);
CREATE INDEX idx_public_tools_rating ON public_tools(rating DESC);
CREATE INDEX idx_public_tools_usage_count ON public_tools(usage_count DESC);
CREATE INDEX idx_public_tools_created_at ON public_tools(created_at DESC);

-- 创建RLS策略
ALTER TABLE public_tools ENABLE ROW LEVEL SECURITY;

-- 允许所有用户查看公开工具
CREATE POLICY "Public tools are viewable by everyone" ON public_tools
    FOR SELECT USING (is_public = true AND is_active = true);

-- 允许创建者管理自己的工具
CREATE POLICY "Users can manage their own tools" ON public_tools
    FOR ALL USING (auth.uid() = creator_id);

-- 允许组织管理员管理组织内的工具
CREATE POLICY "Organization admins can manage org tools" ON public_tools
    FOR ALL USING (
        organization_id IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM user_organizations 
            WHERE user_id = auth.uid() 
            AND organization_id = public_tools.organization_id 
            AND role IN ('admin', 'moderator')
        )
    );;