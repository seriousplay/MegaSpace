-- Migration: add_advanced_agent_features_fixed
-- Created at: 1755241839

-- 高级Agent功能数据库升级 (修复版本)

-- 1. Agent文件关联表 (支持文件上传作为上下文)
CREATE TABLE IF NOT EXISTS agent_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES file_uploads(id) ON DELETE CASCADE,
    context_type TEXT CHECK (context_type IN ('knowledge_base', 'training_data', 'reference_material', 'template')) DEFAULT 'knowledge_base',
    processing_status TEXT CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
    vector_chunks_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(agent_id, file_id)
);

-- 2. 工作流配置表 (支持可视化工作流设计)
CREATE TABLE IF NOT EXISTS agent_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    workflow_config JSONB NOT NULL, -- 存储节点、连接、配置等
    is_active BOOLEAN DEFAULT true,
    execution_count INTEGER DEFAULT 0,
    last_executed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Agent模板库 (基于Mega Space最佳实践)
CREATE TABLE IF NOT EXISTS agent_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT CHECK (category IN ('teaching_design', 'content_creation', 'assessment', 'communication', 'personalized_support', 'student_tools')) NOT NULL,
    description TEXT,
    template_config JSONB NOT NULL, -- Agent配置模板
    workflow_template JSONB, -- 工作流模板
    tags TEXT[] DEFAULT '{}',
    difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
    estimated_setup_time INTEGER, -- 预计设置时间(分钟)
    usage_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    creator_id UUID REFERENCES auth.users(id),
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. MCP工具配置表 (支持工具集成)
CREATE TABLE IF NOT EXISTS mcp_tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    tool_type TEXT CHECK (tool_type IN ('api', 'database', 'file_system', 'web_service', 'calculation', 'search')) NOT NULL,
    endpoint_url TEXT,
    authentication_config JSONB,
    parameters_schema JSONB, -- JSON Schema定义参数
    response_schema JSONB, -- JSON Schema定义响应
    usage_limit INTEGER, -- 使用限制
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Agent-MCP工具关联表
CREATE TABLE IF NOT EXISTS agent_mcp_tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    mcp_tool_id UUID NOT NULL REFERENCES mcp_tools(id) ON DELETE CASCADE,
    configuration JSONB DEFAULT '{}', -- Agent特定的工具配置
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(agent_id, mcp_tool_id)
);

-- 6. 向量存储表 (使用JSONB存储向量数据)
CREATE TABLE IF NOT EXISTS document_vectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES file_uploads(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES ai_agents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding JSONB, -- 存储向量数组，如 [0.1, 0.2, ...]
    metadata JSONB DEFAULT '{}',
    token_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(file_id, chunk_index)
);

-- 创建索引提升查询性能
CREATE INDEX IF NOT EXISTS idx_agent_files_agent_id ON agent_files(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_files_status ON agent_files(processing_status);
CREATE INDEX IF NOT EXISTS idx_agent_workflows_agent_id ON agent_workflows(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_templates_category ON agent_templates(category);
CREATE INDEX IF NOT EXISTS idx_agent_templates_featured ON agent_templates(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_mcp_tools_type ON mcp_tools(tool_type);
CREATE INDEX IF NOT EXISTS idx_agent_mcp_tools_agent_id ON agent_mcp_tools(agent_id);
CREATE INDEX IF NOT EXISTS idx_document_vectors_file_id ON document_vectors(file_id);
CREATE INDEX IF NOT EXISTS idx_document_vectors_agent_id ON document_vectors(agent_id);

COMMENT ON TABLE agent_files IS 'Agent文件关联表，支持文件上传作为Agent上下文';
COMMENT ON TABLE agent_workflows IS '工作流配置表，支持可视化工作流设计';
COMMENT ON TABLE agent_templates IS 'Agent模板库，基于Mega Space最佳实践';
COMMENT ON TABLE mcp_tools IS 'MCP工具配置表，支持外部工具集成';
COMMENT ON TABLE agent_mcp_tools IS 'Agent与MCP工具的关联配置';
COMMENT ON TABLE document_vectors IS '向量存储表，支持RAG技术和语义搜索';;