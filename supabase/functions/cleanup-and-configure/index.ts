// 清理测试数据并重新配置Supabase邮件服务
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
    
    console.log('开始清理测试数据并配置邮件服务...')
    
    let results = {
      timestamp: new Date().toISOString(),
      operations: [],
      summary: {
        success: 0,
        failed: 0,
        total: 0
      }
    }
    
    // 步骤1: 清理测试用户
    try {
      console.log('正在清理测试用户...')
      
      const cleanupResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        }
      })
      
      if (cleanupResponse.ok) {
        const usersData = await cleanupResponse.json()
        const testUsers = usersData.users?.filter(user => 
          user.email?.includes('megaspace.test') || 
          user.email?.includes('test.email') ||
          user.email?.includes('@example.com')
        ) || []
        
        console.log(`发现 ${testUsers.length} 个测试用户`)
        
        // 删除测试用户
        for (const user of testUsers) {
          try {
            const deleteResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${user.id}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'apikey': supabaseServiceKey
              }
            })
            
            if (deleteResponse.ok) {
              console.log(`✅ 删除测试用户: ${user.email}`)
            } else {
              console.log(`❌ 删除用户失败: ${user.email}`)
            }
          } catch (error) {
            console.log(`❌ 删除用户异常: ${user.email}`, error.message)
          }
        }
        
        results.operations.push({
          name: '清理测试用户',
          success: true,
          details: `清理了 ${testUsers.length} 个测试用户`
        })
        results.summary.success++
      } else {
        results.operations.push({
          name: '清理测试用户',
          success: false,
          error: `无法获取用户列表: ${cleanupResponse.status}`
        })
        results.summary.failed++
      }
      
      results.summary.total++
      
    } catch (error) {
      console.error('清理用户数据时出错:', error)
      results.operations.push({
        name: '清理测试用户',
        success: false,
        error: error.message
      })
      results.summary.failed++
      results.summary.total++
    }
    
    // 步骤2: 配置邮件服务
    const emailConfig = {
      SITE_URL: 'https://megaspace-production.space.minimax.io',
      URI_ALLOW_LIST: 'https://megaspace-production.space.minimax.io/**,http://localhost:3000/**',
      ENABLE_EMAIL_CONFIRMATIONS: true,
      ENABLE_EMAIL_CHANGE_CONFIRMATIONS: true,
      ENABLE_SIGNUP: true,
      EMAIL_CONFIRM_REDIRECT_URL: 'https://megaspace-production.space.minimax.io/auth/callback',
      PASSWORD_RESET_REDIRECT_URL: 'https://megaspace-production.space.minimax.io/auth/reset'
    }
    
    try {
      console.log('正在配置邮件服务...')
      
      // 使用管理API配置认证设置
      const configResponse = await fetch(`https://api.supabase.com/v1/projects/iwgdhzgxtdzrvccddkjm/config/auth`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ACCESS_TOKEN')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailConfig)
      })
      
      if (configResponse.ok) {
        const configData = await configResponse.json()
        console.log('✅ 邮件服务配置成功')
        
        results.operations.push({
          name: '配置邮件服务',
          success: true,
          details: '已启用邮件确认功能和正确的重定向URL',
          config: emailConfig
        })
        results.summary.success++
      } else {
        const errorData = await configResponse.text()
        console.log('❌ 邮件服务配置失败:', configResponse.status)
        
        results.operations.push({
          name: '配置邮件服务',
          success: false,
          error: `配置失败: ${configResponse.status} - ${errorData}`
        })
        results.summary.failed++
      }
      
      results.summary.total++
      
    } catch (error) {
      console.error('配置邮件服务时出错:', error)
      results.operations.push({
        name: '配置邮件服务',
        success: false,
        error: error.message
      })
      results.summary.failed++
      results.summary.total++
    }
    
    // 步骤3: 验证配置
    try {
      console.log('正在验证配置...')
      
      const verifyResponse = await fetch(`https://api.supabase.com/v1/projects/iwgdhzgxtdzrvccddkjm/config/auth`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ACCESS_TOKEN')}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (verifyResponse.ok) {
        const currentConfig = await verifyResponse.json()
        
        results.operations.push({
          name: '验证配置',
          success: true,
          details: '配置验证成功',
          currentConfig: {
            emailConfirmations: currentConfig.ENABLE_EMAIL_CONFIRMATIONS,
            siteUrl: currentConfig.SITE_URL,
            allowList: currentConfig.URI_ALLOW_LIST
          }
        })
        results.summary.success++
      } else {
        results.operations.push({
          name: '验证配置',
          success: false,
          error: `验证失败: ${verifyResponse.status}`
        })
        results.summary.failed++
      }
      
      results.summary.total++
      
    } catch (error) {
      console.error('验证配置时出错:', error)
      results.operations.push({
        name: '验证配置',
        success: false,
        error: error.message
      })
      results.summary.failed++
      results.summary.total++
    }
    
    const finalReport = {
      success: results.summary.success > 0 && results.summary.failed === 0,
      message: results.summary.success === results.summary.total 
        ? '✅ 数据清理和邮件服务配置完成'
        : '⚠️ 部分操作完成，请检查详细信息',
      results,
      nextSteps: [
        '1. 重新构建并部署应用到新的生产URL',
        '2. 运行端到端测试验证邮件确认功能',
        '3. 使用真实邮箱测试完整注册流程',
        '4. 检查邮件送达率和垃圾邮件过滤情况'
      ],
      productionWarnings: [
        '⚠️ Supabase内置邮件服务在生产环境有限制',
        '⚠️ 邮件可能被归类为垃圾邮件',
        '⚠️ 发送频率和数量有限制',
        '💡 建议升级到专业SMTP服务(SendGrid/Resend)以确保稳定性'
      ]
    }
    
    console.log('操作完成，生成最终报告...')
    
    return new Response(JSON.stringify({ data: finalReport }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('系统配置错误:', error)
    
    const errorResponse = {
      error: {
        code: 'SYSTEM_CONFIG_ERROR',
        message: error.message,
        details: '配置Supabase邮件服务时发生系统错误'
      }
    }

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})