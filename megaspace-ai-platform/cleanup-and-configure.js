// 清理测试数据并重新配置Supabase邮件服务

const SUPABASE_ACCESS_TOKEN = 'sbp_oauth_0293651f9daa631e017bf0cdb92c2117a21f97be'
const PROJECT_ID = 'iwgdhzgxtdzrvccddkjm'
const SUPABASE_URL = 'https://iwgdhzgxtdzrvccddkjm.supabase.co'

// 生产环境邮件配置
const productionEmailConfig = {
  SITE_URL: 'https://megaspace-production.space.minimax.io',
  URI_ALLOW_LIST: 'https://megaspace-production.space.minimax.io/**,http://localhost:3000/**',
  ENABLE_EMAIL_CONFIRMATIONS: true,
  ENABLE_EMAIL_CHANGE_CONFIRMATIONS: true,
  ENABLE_SIGNUP: true,
  EMAIL_CONFIRM_REDIRECT_URL: 'https://megaspace-production.space.minimax.io',
  PASSWORD_RESET_REDIRECT_URL: 'https://megaspace-production.space.minimax.io'
}

// 清理测试用户
async function cleanupTestUsers() {
  console.log('🧹 步骤1: 清理测试用户数据...')
  console.log('=' .repeat(40))
  
  try {
    // 获取所有用户
    const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_ID}/auth/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      console.log('❌ 无法获取用户列表:', response.status)
      return false
    }
    
    const data = await response.json()
    const users = data.users || []
    
    console.log(`ℹ️ 当前系统中共有 ${users.length} 个用户`)
    
    // 筛选测试用户
    const testUsers = users.filter(user => 
      user.email?.includes('megaspace.test') || 
      user.email?.includes('test.email') ||
      user.email?.includes('@example.com') ||
      user.email?.includes('demo.')
    )
    
    console.log(`🔍 发现 ${testUsers.length} 个测试用户需要清理`)
    
    if (testUsers.length === 0) {
      console.log('✅ 没有需要清理的测试用户')
      return true
    }
    
    // 删除测试用户
    let deletedCount = 0
    for (const user of testUsers) {
      try {
        const deleteResponse = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_ID}/auth/users/${user.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (deleteResponse.ok) {
          console.log(`✅ 已删除: ${user.email} (ID: ${user.id.substring(0, 8)}...)`)
          deletedCount++
        } else {
          console.log(`❌ 删除失败: ${user.email} - ${deleteResponse.status}`)
        }
        
        // 避免过快调用API
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        console.log(`❌ 删除异常: ${user.email} - ${error.message}`)
      }
    }
    
    console.log('')
    console.log(`📋 清理结果: 成功删除 ${deletedCount}/${testUsers.length} 个测试用户`)
    
    return deletedCount === testUsers.length
    
  } catch (error) {
    console.error('❌ 清理过程中出现异常:', error.message)
    return false
  }
}

// 配置邮件服务
async function configureEmailService() {
  console.log('')
  console.log('📧 步骤2: 配置Supabase邮件服务...')
  console.log('=' .repeat(40))
  
  try {
    // 检查当前配置
    console.log('🔍 检查当前配置...')
    
    const getConfigResponse = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_ID}/config/auth`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (getConfigResponse.ok) {
      const currentConfig = await getConfigResponse.json()
      console.log('✅ 当前配置获取成功')
      console.log('- 邮件确认:', currentConfig.ENABLE_EMAIL_CONFIRMATIONS ? '已启用' : '未启用')
      console.log('- Site URL:', currentConfig.SITE_URL || '未设置')
    } else {
      console.log('⚠️ 无法获取当前配置:', getConfigResponse.status)
    }
    
    console.log('')
    console.log('🔧 更新邮件服务配置...')
    
    // 更新配置
    const updateResponse = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_ID}/config/auth`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productionEmailConfig)
    })
    
    if (updateResponse.ok) {
      const updatedConfig = await updateResponse.json()
      console.log('✅ 邮件服务配置更新成功！')
      console.log('')
      console.log('📋 更新后的配置:')
      console.log('- 邮件确认:', updatedConfig.ENABLE_EMAIL_CONFIRMATIONS ? '✅ 已启用' : '❌ 未启用')
      console.log('- 邮件更改确认:', updatedConfig.ENABLE_EMAIL_CHANGE_CONFIRMATIONS ? '✅ 已启用' : '❌ 未启用')
      console.log('- 注册功能:', updatedConfig.ENABLE_SIGNUP ? '✅ 已启用' : '❌ 未启用')
      console.log('- Site URL:', updatedConfig.SITE_URL)
      console.log('- 允许的URI:', updatedConfig.URI_ALLOW_LIST)
      
      return true
    } else {
      const errorData = await updateResponse.text()
      console.log('❌ 配置更新失败:')
      console.log('- 状态码:', updateResponse.status)
      console.log('- 错误信息:', errorData)
      
      return false
    }
    
  } catch (error) {
    console.error('❌ 配置过程中出现异常:', error.message)
    return false
  }
}

// 验证邮件配置
async function verifyEmailConfiguration() {
  console.log('')
  console.log('✅ 步骤3: 验证邮件配置...')
  console.log('=' .repeat(40))
  
  try {
    const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_ID}/config/auth`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (response.ok) {
      const config = await response.json()
      
      console.log('📊 配置验证结果:')
      
      const checks = [
        { name: '邮件确认功能', value: config.ENABLE_EMAIL_CONFIRMATIONS, expected: true },
        { name: '邮件更改确认', value: config.ENABLE_EMAIL_CHANGE_CONFIRMATIONS, expected: true },
        { name: '用户注册功能', value: config.ENABLE_SIGNUP, expected: true },
        { name: 'Site URL设置', value: config.SITE_URL, expected: productionEmailConfig.SITE_URL },
        { name: 'URI允许列表', value: config.URI_ALLOW_LIST, expected: productionEmailConfig.URI_ALLOW_LIST }
      ]
      
      let allValid = true
      
      checks.forEach(check => {
        const isValid = check.value === check.expected
        const status = isValid ? '✅' : '❌'
        console.log(`${status} ${check.name}: ${check.value || '未设置'}`)
        if (!isValid) allValid = false
      })
      
      console.log('')
      console.log(`📋 验证结果: ${allValid ? '✅ 所有配置都正确' : '❌ 部分配置不正确'}`)
      
      return allValid
    } else {
      console.log('❌ 无法验证配置:', response.status)
      return false
    }
    
  } catch (error) {
    console.error('❌ 验证过程中出现异常:', error.message)
    return false
  }
}

// 显示生产环境警告
function showProductionWarnings() {
  console.log('')
  console.log('⚠️ 生产环境重要提示')
  console.log('=' .repeat(40))
  console.log('')
  console.log('🔴 Supabase内置邮件服务的限制:')
  console.log('   • 邮件可能被归类为垃圾邮件')
  console.log('   • 发送速度和频率有限制')
  console.log('   • 缺乏高级邮件统计和分析')
  console.log('   • 可能影响用户体验和转化率')
  console.log('')
  console.log('💡 建议的生产环境解决方案:')
  console.log('   • SendGrid (免费100邮件/天, 专业可靠)')
  console.log('   • Resend (免费3000邮件/月, 现代化API)')
  console.log('   • Mailgun (免费5000邮件/月, 企业级)')
  console.log('')
  console.log('🕰️ 对于生产环境，强烈建议在正式上线前配置专业SMTP服务。')
}

// 主函数
async function main() {
  console.log('🚀 Mega Space 系统清理和邮件服务配置工具')
  console.log('')
  console.log('🎯 任务目标:')
  console.log('   1. 清理所有测试用户数据')
  console.log('   2. 配置生产环境邮件服务')
  console.log('   3. 验证配置正确性')
  console.log('')
  
  const results = {
    cleanup: false,
    configure: false,
    verify: false
  }
  
  // 执行清理
  results.cleanup = await cleanupTestUsers()
  
  // 执行配置
  results.configure = await configureEmailService()
  
  // 执行验证
  results.verify = await verifyEmailConfiguration()
  
  // 显示最终结果
  console.log('')
  console.log('📋 最终结果')
  console.log('=' .repeat(40))
  
  const allSuccess = Object.values(results).every(result => result === true)
  
  console.log(`🧹 数据清理: ${results.cleanup ? '✅ 成功' : '❌ 失败'}`)
  console.log(`📧 邮件配置: ${results.configure ? '✅ 成功' : '❌ 失败'}`)
  console.log(`✅ 配置验证: ${results.verify ? '✅ 成功' : '❌ 失败'}`)
  console.log('')
  
  if (allSuccess) {
    console.log('🎉 所有配置完成！系统已准备好进入生产环境。')
    console.log('')
    console.log('📈 接下来的步骤:')
    console.log('   1. 重新构建并部署应用')
    console.log('   2. 更新前端配置中的基础URL')
    console.log('   3. 使用真实邮箱测试注册流程')
    console.log('   4. 检查邮件送达情况')
  } else {
    console.log('❌ 部分配置失败，请检查上述错误信息并重试。')
  }
  
  // 显示警告
  showProductionWarnings()
  
  return allSuccess
}

// 执行配置
main().catch(console.error)
