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
        const { action, data } = await req.json();
        
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase配置缺失');
        }

        // 获取用户信息
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            throw new Error('缺少认证头');
        }

        const token = authHeader.replace('Bearer ', '');
        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': serviceRoleKey
            }
        });

        if (!userResponse.ok) {
            throw new Error('无效的认证令牌');
        }

        const userData = await userResponse.json();
        const userId = userData.id;

        switch (action) {
            case 'get_user_organizations': {
                // 获取用户所属的所有组织
                const response = await fetch(`${supabaseUrl}/rest/v1/organization_memberships?user_id=eq.${userId}&is_active=eq.true&select=*,organizations(*)`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });

                if (!response.ok) {
                    throw new Error('获取组织列表失败');
                }

                const memberships = await response.json();
                const organizations = memberships.map(m => ({
                    ...m.organizations,
                    membership_role: m.role,
                    joined_at: m.joined_at
                }));

                return new Response(JSON.stringify({
                    data: {
                        organizations: organizations,
                        count: organizations.length
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'create_organization': {
                if (!data || !data.name) {
                    throw new Error('组织名称是必需的');
                }

                // 创建组织
                const orgResponse = await fetch(`${supabaseUrl}/rest/v1/organizations`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        name: data.name,
                        type: data.type || 'school',
                        description: data.description,
                        contact_email: data.contact_email,
                        contact_phone: data.contact_phone,
                        address: data.address,
                        website_url: data.website_url,
                        settings: data.settings || {}
                    })
                });

                if (!orgResponse.ok) {
                    const errorText = await orgResponse.text();
                    throw new Error(`组织创建失败: ${errorText}`);
                }

                const organization = await orgResponse.json();
                const newOrg = organization[0];

                // 为创建者添加管理员成员身份
                const memberResponse = await fetch(`${supabaseUrl}/rest/v1/organization_memberships`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_id: userId,
                        organization_id: newOrg.id,
                        role: 'owner',
                        joined_at: new Date().toISOString(),
                        is_active: true
                    })
                });

                if (!memberResponse.ok) {
                    console.error('添加成员身份失败');
                }

                return new Response(JSON.stringify({
                    data: {
                        organization: newOrg,
                        message: '组织创建成功'
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'join_organization': {
                if (!data || !data.organization_id) {
                    throw new Error('组织ID是必需的');
                }

                // 检查组织是否存在
                const orgResponse = await fetch(`${supabaseUrl}/rest/v1/organizations?id=eq.${data.organization_id}`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });

                if (!orgResponse.ok) {
                    throw new Error('获取组织信息失败');
                }

                const organizations = await orgResponse.json();
                if (organizations.length === 0) {
                    throw new Error('组织不存在');
                }

                // 添加成员身份
                const memberResponse = await fetch(`${supabaseUrl}/rest/v1/organization_memberships`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'resolution=merge-duplicates'
                    },
                    body: JSON.stringify({
                        user_id: userId,
                        organization_id: data.organization_id,
                        role: data.role || 'member',
                        joined_at: new Date().toISOString(),
                        is_active: true
                    })
                });

                if (!memberResponse.ok) {
                    const errorText = await memberResponse.text();
                    throw new Error(`加入组织失败: ${errorText}`);
                }

                return new Response(JSON.stringify({
                    data: {
                        message: '成功加入组织',
                        organization: organizations[0]
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'get_organization_stats': {
                if (!data || !data.organization_id) {
                    throw new Error('组织ID是必需的');
                }

                // 获取组织统计信息
                const memberCountResponse = await fetch(`${supabaseUrl}/rest/v1/organization_memberships?organization_id=eq.${data.organization_id}&is_active=eq.true&select=count`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Prefer': 'count=exact'
                    }
                });

                const memberCount = memberCountResponse.headers.get('content-range')?.split('/')[1] || 0;

                return new Response(JSON.stringify({
                    data: {
                        member_count: parseInt(memberCount),
                        organization_id: data.organization_id
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            default:
                throw new Error(`未知的操作: ${action}`);
        }

    } catch (error) {
        console.error('组织管理器错误:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'ORGANIZATION_MANAGER_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
