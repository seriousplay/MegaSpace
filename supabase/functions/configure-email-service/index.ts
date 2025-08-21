// Supabase邮件服务自动配置脚本
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
    const projectRef = supabaseUrl.split('//')[1].split('.')[0]; // 提取项目引用
    
    console.log('开始配置Supabase邮件服务...')
    console.log('项目URL:', supabaseUrl)
    console.log('项目引用:', projectRef)
    
    // 配置数据
    const emailConfig = {
      SITE_URL: 'https://23xmmcop5e4r.space.minimax.io',
      URI_ALLOW_LIST: 'https://23xmmcop5e4r.space.minimax.io/**',
      ENABLE_EMAIL_CONFIRMATIONS: true,
      ENABLE_EMAIL_CHANGE_CONFIRMATIONS: true,
      ENABLE_SIGNUP: true,
      EMAIL_CONFIRM_REDIRECT_URL: 'https://23xmmcop5e4r.space.minimax.io',
      PASSWORD_RESET_REDIRECT_URL: 'https://23xmmcop5e4r.space.minimax.io'
    }
    
    console.log('邮件配置参数:', emailConfig)
    
    let configResults = {
      timestamp: new Date().toISOString(),
      projectRef,
      configurations: [],
      summary: {
        success: 0,
        failed: 0,
        total: 0
      }
    }
    
    // 尝试通过不同的API端点配置邮件服务
    const configAttempts = [
      {
        name: '启用邮件确认',
        method: 'PATCH',
        endpoint: `/auth/v1/config`,
        data: {
          ENABLE_EMAIL_CONFIRMATIONS: true,
          ENABLE_EMAIL_CHANGE_CONFIRMATIONS: true
        }
      },
      {
        name: '配置站点URL',
        method: 'PATCH', 
        endpoint: `/auth/v1/config`,
        data: {
          SITE_URL: emailConfig.SITE_URL,
          URI_ALLOW_LIST: emailConfig.URI_ALLOW_LIST
        }
      },
      {
        name: '配置重定向URL',
        method: 'PATCH',
        endpoint: `/auth/v1/config`, 
        data: {
          EMAIL_CONFIRM_REDIRECT_URL: emailConfig.EMAIL_CONFIRM_REDIRECT_URL,
          PASSWORD_RESET_REDIRECT_URL: emailConfig.PASSWORD_RESET_REDIRECT_URL
        }
      }
    ]
    
    // 执行配置
    for (const attempt of configAttempts) {
      try {
        console.log(`正在执行: ${attempt.name}...`)
        
        const response = await fetch(`${supabaseUrl}${attempt.endpoint}`, {
          method: attempt.method,
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey
          },
          body: JSON.stringify(attempt.data)
        })
        
        const responseData = await response.text()
        let parsedData = {}
        
        try {
          parsedData = JSON.parse(responseData)
        } catch {
          parsedData = { message: responseData }
        }
        
        const result = {
          name: attempt.name,
          success: response.ok,
          status: response.status,
          statusText: response.statusText,
          data: parsedData,
          attempt: attempt
        }
        
        configResults.configurations.push(result)
        
        if (response.ok) {
          configResults.summary.success++
          console.log(`✅ ${attempt.name} - 成功`)
        } else {
          configResults.summary.failed++
          console.log(`❌ ${attempt.name} - 失败: ${response.status}`)
        }
        
        configResults.summary.total++
        
      } catch (error) {
        console.log(`❌ ${attempt.name} - 异常:`, error.message)
        
        configResults.configurations.push({
          name: attempt.name,
          success: false,
          error: error.message,
          attempt: attempt
        })
        
        configResults.summary.failed++
        configResults.summary.total++
      }
    }
    
    // 检查当前认证配置状态
    try {
      console.log('检查当前认证配置...')
      
      const configResponse = await fetch(`${supabaseUrl}/auth/v1/config`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        }
      })
      
      if (configResponse.ok) {
        const currentConfig = await configResponse.json()
        configResults.currentConfig = currentConfig
        console.log('✅ 成功获取当前配置')
      } else {
        console.log('⚠️ 无法获取当前配置')
        configResults.configError = await configResponse.text()
      }
      
    } catch (error) {
      console.log('⚠️ 检查配置时出错:', error.message)
      configResults.configCheckError = error.message
    }
    
    // 生成配置报告
    const report = {
      success: configResults.summary.success > 0,
      message: configResults.summary.success > 0 
        ? '邮件服务配置已尝试完成' 
        : '邮件服务配置遇到问题',
      details: configResults,
      nextSteps: [
        '1. 检查Supabase Dashboard > Authentication > Settings',
        '2. 验证"Enable email confirmations"是否已启用',
        '3. 确认Site URL和Redirect URLs配置正确',
        '4. 运行邮件确认测试脚本验证功能'
      ],
      testInstructions: {
        website: 'https://23xmmcop5e4r.space.minimax.io',
        testScript: 'node verify-email-fix.js',
        expectedResult: '用户注册后应该收到确认邮件'
      }
    }
    
    console.log('配置完成，生成报告...')
    
    return new Response(JSON.stringify({ data: report }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('邮件服务配置错误:', error)
    
    const errorResponse = {
      error: {
        code: 'EMAIL_SERVICE_CONFIG_ERROR',
        message: error.message,
        details: '配置Supabase邮件服务时发生错误'
      }
    }

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})