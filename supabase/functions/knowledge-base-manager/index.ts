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
        const { action, knowledgeBaseData, knowledgeBaseId, filters } = await req.json();
        
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
            case 'create_knowledge_base':
                // 创建知识库
                const kbCreateData = {
                    title: knowledgeBaseData.title,
                    description: knowledgeBaseData.description,
                    creator_id: currentUserId,
                    organization_id: knowledgeBaseData.organizationId || null,
                    subject: knowledgeBaseData.subject,
                    grade_level: knowledgeBaseData.gradeLevel,
                    content_data: knowledgeBaseData.contentData,
                    file_urls: knowledgeBaseData.fileUrls || [],
                    visibility: knowledgeBaseData.visibility || 'private',
                    tags: knowledgeBaseData.tags || [],
                    created_at: new Date().toISOString()
                };

                const kbResponse = await fetch(`${supabaseUrl}/rest/v1/knowledge_bases`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(kbCreateData)
                });

                if (!kbResponse.ok) {
                    const errorText = await kbResponse.text();
                    throw new Error(`创建知识库失败: ${errorText}`);
                }

                const newKB = await kbResponse.json();
                result = { knowledgeBase: newKB[0], message: '知识库创建成功' };
                break;

            case 'get_knowledge_bases':
                // 获取知识库列表（根据可见性和权限过滤）
                let kbQuery = `${supabaseUrl}/rest/v1/knowledge_bases?`;
                const queryParams = [];
                
                // 构建查询条件
                if (filters?.subject) {
                    queryParams.push(`subject=eq.${filters.subject}`);
                }
                if (filters?.gradeLevel) {
                    queryParams.push(`grade_level=eq.${filters.gradeLevel}`);
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
                
                queryParams.push('order=created_at.desc');
                
                kbQuery += queryParams.join('&');
                
                const kbListResponse = await fetch(kbQuery, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });

                if (!kbListResponse.ok) {
                    throw new Error('获取知识库列表失败');
                }

                const knowledgeBases = await kbListResponse.json();
                result = { knowledgeBases };
                break;

            case 'get_knowledge_base_detail':
                // 获取知识库详情
                if (!knowledgeBaseId) {
                    throw new Error('缺少知识库ID');
                }

                const kbDetailResponse = await fetch(
                    `${supabaseUrl}/rest/v1/knowledge_bases?id=eq.${knowledgeBaseId}`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });

                if (!kbDetailResponse.ok) {
                    throw new Error('获取知识库详情失败');
                }

                const kbDetail = await kbDetailResponse.json();
                if (kbDetail.length === 0) {
                    throw new Error('知识库不存在');
                }

                const knowledgeBase = kbDetail[0];
                
                // 检查访问权限
                if (knowledgeBase.visibility === 'private' && knowledgeBase.creator_id !== currentUserId) {
                    throw new Error('权限不足');
                }
                if (knowledgeBase.visibility === 'organization') {
                    const hasOrgAccess = userOrganizations.some(uo => uo.organization_id === knowledgeBase.organization_id);
                    if (!hasOrgAccess && knowledgeBase.creator_id !== currentUserId) {
                        throw new Error('权限不足');
                    }
                }

                // 更新查看计数
                await fetch(`${supabaseUrl}/rest/v1/knowledge_bases?id=eq.${knowledgeBaseId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        view_count: knowledgeBase.view_count + 1
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
                        organization_id: knowledgeBase.organization_id,
                        resource_type: 'knowledge_base',
                        resource_id: knowledgeBaseId,
                        action_type: 'view',
                        created_at: new Date().toISOString()
                    })
                });

                result = { knowledgeBase };
                break;

            case 'download_knowledge_base':
                // 下载知识库资源
                if (!knowledgeBaseId) {
                    throw new Error('缺少知识库ID');
                }

                const downloadKBResponse = await fetch(
                    `${supabaseUrl}/rest/v1/knowledge_bases?id=eq.${knowledgeBaseId}`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });

                const downloadKBData = await downloadKBResponse.json();
                if (downloadKBData.length === 0) {
                    throw new Error('知识库不存在');
                }

                const downloadKB = downloadKBData[0];
                
                // 检查下载权限
                if (downloadKB.visibility === 'private' && downloadKB.creator_id !== currentUserId) {
                    throw new Error('权限不足');
                }
                if (downloadKB.visibility === 'organization') {
                    const hasOrgAccess = userOrganizations.some(uo => uo.organization_id === downloadKB.organization_id);
                    if (!hasOrgAccess && downloadKB.creator_id !== currentUserId) {
                        throw new Error('权限不足');
                    }
                }

                // 更新下载计数
                await fetch(`${supabaseUrl}/rest/v1/knowledge_bases?id=eq.${knowledgeBaseId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        download_count: downloadKB.download_count + 1
                    })
                });

                // 记录下载日志
                await fetch(`${supabaseUrl}/rest/v1/resource_usage_logs`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_id: currentUserId,
                        organization_id: downloadKB.organization_id,
                        resource_type: 'knowledge_base',
                        resource_id: knowledgeBaseId,
                        action_type: 'download',
                        created_at: new Date().toISOString()
                    })
                });

                result = { 
                    downloadUrls: downloadKB.file_urls,
                    contentData: downloadKB.content_data,
                    message: '知识库资源下载成功'
                };
                break;

            case 'update_knowledge_base':
                // 更新知识库
                if (!knowledgeBaseId) {
                    throw new Error('缺少知识库ID');
                }

                // 检查编辑权限（只有创建者可以编辑）
                const editKBResponse = await fetch(
                    `${supabaseUrl}/rest/v1/knowledge_bases?id=eq.${knowledgeBaseId}&creator_id=eq.${currentUserId}`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });

                const editKBData = await editKBResponse.json();
                if (editKBData.length === 0) {
                    throw new Error('权限不足，只有创建者可以编辑知识库');
                }

                const updateData = {
                    ...knowledgeBaseData,
                    updated_at: new Date().toISOString()
                };

                const updateKBResponse = await fetch(`${supabaseUrl}/rest/v1/knowledge_bases?id=eq.${knowledgeBaseId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(updateData)
                });

                if (!updateKBResponse.ok) {
                    const errorText = await updateKBResponse.text();
                    throw new Error(`更新知识库失败: ${errorText}`);
                }

                const updatedKB = await updateKBResponse.json();
                result = { knowledgeBase: updatedKB[0], message: '知识库更新成功' };
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
        console.error('Knowledge Base Manager error:', error);

        const errorResponse = {
            error: {
                code: 'KNOWLEDGE_BASE_OPERATION_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});