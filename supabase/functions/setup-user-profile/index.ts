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
        const { userId, fullName, role } = await req.json();
        
        if (!userId || !fullName || !role) {
            throw new Error('用户ID、姓名和角色都是必需的');
        }

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase配置缺失');
        }

        // 创建用户资料
        const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify({
                id: userId,
                full_name: fullName,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
        });

        // 创建用户角色
        const roleResponse = await fetch(`${supabaseUrl}/rest/v1/user_roles`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify({
                user_id: userId,
                role: role,
                is_active: true,
                created_at: new Date().toISOString()
            })
        });

        const profileSuccess = profileResponse.ok || profileResponse.status === 409;
        const roleSuccess = roleResponse.ok || roleResponse.status === 409;

        if (!profileSuccess) {
            const profileError = await profileResponse.text();
            console.error('用户资料创建失败:', profileError);
        }

        if (!roleSuccess) {
            const roleError = await roleResponse.text();
            console.error('用户角色创建失败:', roleError);
        }

        return new Response(JSON.stringify({
            data: {
                profileCreated: profileSuccess,
                roleCreated: roleSuccess,
                message: '用户设置完成'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('用户设置错误:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'USER_SETUP_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
