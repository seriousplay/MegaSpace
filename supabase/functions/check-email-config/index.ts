// 检查和配置邮件确认设置
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // 检查环境变量
    const configCheck = {
      supabaseUrl: supabaseUrl || 'NOT_SET',
      serviceKeyExists: !!supabaseServiceKey,
      serviceKeyLength: supabaseServiceKey ? supabaseServiceKey.length : 0,
      timestamp: new Date().toISOString()
    }

    // 尝试调用Supabase管理API检查邮件设置
    if (supabaseServiceKey) {
      try {
        const authResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey
          }
        })
        
        const authData = await authResponse.json()
        configCheck.authApiWorking = authResponse.ok
        configCheck.authResponse = authResponse.status
        
        if (!authResponse.ok) {
          configCheck.authError = authData
        }
      } catch (authError) {
        configCheck.authApiError = authError.message
      }
    }

    const result = {
      status: 'success',
      configCheck,
      recommendations: [
        '1. 检查 Supabase 项目设置 > Authentication > Settings',
        '2. 确保 "Enable email confirmations" 已启用', 
        '3. 配置 SMTP 设置或使用 Supabase 内置邮件服务',
        '4. 检查邮件模板设置',
        '5. 验证重定向 URLs 配置正确',
        '6. 检查垃圾邮件文件夹',
        '7. 确保使用真实邮箱地址测试（不要使用example.com等测试域名）'
      ],
      nextSteps: [
        '访问 Supabase Dashboard > Authentication > Settings',
        '检查 "Email confirmations" 是否已启用',
        '配置 SMTP 提供商（推荐使用 SendGrid, Mailgun, 或 Resend）',
        '测试使用真实邮箱地址注册'
      ]
    }

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('邮件配置检查错误:', error)
    
    const errorResponse = {
      error: {
        code: 'EMAIL_CONFIG_CHECK_ERROR',
        message: error.message,
        details: '检查邮件配置时发生错误'
      }
    }

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
