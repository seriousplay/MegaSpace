Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const { action, agentData, agentId, filters } = await req.json();
        
        // 获取环境变量
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase配置缺失');
        }

        // 获取用户信息
        let currentUserId = null;
        let userOrganizations = [];
        const authHeader = req.headers.get('authorization');
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'apikey': serviceRoleKey
                }
            });
            if (userResponse.ok) {
                const userData = await userResponse.json();
                currentUserId = userData.id;
                
                // 获取用户所属组织
                const userOrgsResponse = await fetch(
                    `${supabaseUrl}/rest/v1/user_organizations?user_id=eq.${currentUserId}`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });
                if (userOrgsResponse.ok) {
                    userOrganizations = await userOrgsResponse.json();
                }
            }
        }

        if (!currentUserId) {
            throw new Error('用户身份验证失败');
        }

        let result = {};

        switch (action) {
            case 'create_agent':
                // 创建AI智能体
                const agentCreateData = {
                    name: agentData.name,
                    description: agentData.description,
                    creator_id: currentUserId,
                    organization_id: agentData.organizationId || null,
                    agent_type: agentData.agentType,
                    configuration: agentData.configuration,
                    visibility: agentData.visibility || 'private',
                    tags: agentData.tags || [],
                    capabilities: agentData.capabilities || [],
                    created_at: new Date().toISOString()
                };

                const agentResponse = await fetch(`${supabaseUrl}/rest/v1/ai_agents`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(agentCreateData)
                });

                if (!agentResponse.ok) {
                    const errorText = await agentResponse.text();
                    throw new Error(`创建AI智能体失败: ${errorText}`);
                }

                const newAgent = await agentResponse.json();
                result = { agent: newAgent[0], message: 'AI智能体创建成功' };
                break;

            case 'get_agents':
                // 获取AI智能体列表（根据可见性和权限过滤）
                let agentsQuery = `${supabaseUrl}/rest/v1/ai_agents?`;
                const queryParams = [];
                
                // 构建查询条件
                if (filters?.agentType) {
                    queryParams.push(`agent_type=eq.${filters.agentType}`);
                }
                if (filters?.tags && filters.tags.length > 0) {
                    queryParams.push(`tags=cs.{${filters.tags.join(',')}}`);
                }
                
                // 可见性过滤：公开的 + 用户创建的 + 用户组织内的
                const orgIds = userOrganizations.map(uo => uo.organization_id);
                let visibilityFilter = `(visibility=eq.public`;
                visibilityFilter += `,or(creator_id=eq.${currentUserId}`;
                if (orgIds.length > 0) {
                    visibilityFilter += `,and(visibility=eq.organization,organization_id=in.(${orgIds.join(',')}))))`;
                } else {
                    visibilityFilter += '))';
                }
                queryParams.push(visibilityFilter);
                
                queryParams.push('is_active=eq.true');
                queryParams.push('order=created_at.desc');
                
                agentsQuery += queryParams.join('&');
                
                const agentsResponse = await fetch(agentsQuery, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });

                if (!agentsResponse.ok) {
                    throw new Error('获取AI智能体列表失败');
                }

                const agents = await agentsResponse.json();
                result = { agents };
                break;

            case 'get_agent_detail':
                // 获取AI智能体详情
                if (!agentId) {
                    throw new Error('缺少智能体ID');
                }

                const agentDetailResponse = await fetch(
                    `${supabaseUrl}/rest/v1/ai_agents?id=eq.${agentId}`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });

                if (!agentDetailResponse.ok) {
                    throw new Error('获取智能体详情失败');
                }

                const agentDetail = await agentDetailResponse.json();
                if (agentDetail.length === 0) {
                    throw new Error('智能体不存在');
                }

                const agent = agentDetail[0];
                
                // 检查访问权限
                if (agent.visibility === 'private' && agent.creator_id !== currentUserId) {
                    throw new Error('权限不足');
                }
                if (agent.visibility === 'organization') {
                    const hasOrgAccess = userOrganizations.some(uo => uo.organization_id === agent.organization_id);
                    if (!hasOrgAccess && agent.creator_id !== currentUserId) {
                        throw new Error('权限不足');
                    }
                }

                // 记录使用日志
                await fetch(`${supabaseUrl}/rest/v1/resource_usage_logs`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_id: currentUserId,
                        organization_id: agent.organization_id,
                        resource_type: 'ai_agent',
                        resource_id: agentId,
                        action_type: 'view',
                        created_at: new Date().toISOString()
                    })
                });

                result = { agent };
                break;

            case 'use_agent':
                // 使用AI智能体
                if (!agentId) {
                    throw new Error('缺少智能体ID');
                }

                // 获取智能体信息
                const useAgentResponse = await fetch(
                    `${supabaseUrl}/rest/v1/ai_agents?id=eq.${agentId}`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });

                const useAgentData = await useAgentResponse.json();
                if (useAgentData.length === 0) {
                    throw new Error('智能体不存在');
                }

                const useAgent = useAgentData[0];
                
                // 检查使用权限
                if (useAgent.visibility === 'private' && useAgent.creator_id !== currentUserId) {
                    throw new Error('权限不足');
                }
                if (useAgent.visibility === 'organization') {
                    const hasOrgAccess = userOrganizations.some(uo => uo.organization_id === useAgent.organization_id);
                    if (!hasOrgAccess && useAgent.creator_id !== currentUserId) {
                        throw new Error('权限不足');
                    }
                }

                // 更新使用计数
                await fetch(`${supabaseUrl}/rest/v1/ai_agents?id=eq.${agentId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        usage_count: useAgent.usage_count + 1
                    })
                });

                // 记录使用日志
                await fetch(`${supabaseUrl}/rest/v1/resource_usage_logs`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_id: currentUserId,
                        organization_id: useAgent.organization_id,
                        resource_type: 'ai_agent',
                        resource_id: agentId,
                        action_type: 'use',
                        session_data: agentData.sessionData || {},
                        created_at: new Date().toISOString()
                    })
                });

                // 这里可以集成实际的AI服务调用
                // 目前返回模拟响应
                const agentResponse = {
                    agent_id: agentId,
                    agent_name: useAgent.name,
                    response: `来自${useAgent.name}的AI响应：${agentData.input || '您好，我是您的AI助手，有什么可以帮助您的吗？'}`,
                    suggestions: ['继续对话', '查看更多功能', '分享给同事'],
                    timestamp: new Date().toISOString()
                };

                result = { response: agentResponse };
                break;

            case 'update_agent':
                // 更新AI智能体
                if (!agentId) {
                    throw new Error('缺少智能体ID');
                }

                // 检查编辑权限（只有创建者可以编辑）
                const editAgentResponse = await fetch(
                    `${supabaseUrl}/rest/v1/ai_agents?id=eq.${agentId}&creator_id=eq.${currentUserId}`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });

                const editAgentData = await editAgentResponse.json();
                if (editAgentData.length === 0) {
                    throw new Error('权限不足，只有创建者可以编辑智能体');
                }

                const updateData = {
                    ...agentData,
                    updated_at: new Date().toISOString()
                };

                const updateAgentResponse = await fetch(`${supabaseUrl}/rest/v1/ai_agents?id=eq.${agentId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(updateData)
                });

                if (!updateAgentResponse.ok) {
                    const errorText = await updateAgentResponse.text();
                    throw new Error(`更新智能体失败: ${errorText}`);
                }

                const updatedAgent = await updateAgentResponse.json();
                result = { agent: updatedAgent[0], message: '智能体更新成功' };
                break;

            default:
                throw new Error('不支持的操作类型');
        }

        return new Response(JSON.stringify({
            data: result
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('AI Agent Manager error:', error);

        const errorResponse = {
            error: {
                code: 'AI_AGENT_OPERATION_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});