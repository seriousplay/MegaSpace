// Supabase邮件服务配置脚本

const SUPABASE_ACCESS_TOKEN = 'sbp_oauth_0293651f9daa631e017bf0cdb92c2117a21f97be'
const PROJECT_ID = 'iwgdhzgxtdzrvccddkjm'
const SUPABASE_URL = 'https://iwgdhzgxtdzrvccddkjm.supabase.co'

// 邮件配置参数
const emailConfig = {
  SITE_URL: 'https://23xmmcop5e4r.space.minimax.io',
  URI_ALLOW_LIST: 'https://23xmmcop5e4r.space.minimax.io/**,http://localhost:3000/**',
  ENABLE_EMAIL_CONFIRMATIONS: true,
  ENABLE_EMAIL_CHANGE_CONFIRMATIONS: true,
  ENABLE_SIGNUP: true,
  EMAIL_CONFIRM_REDIRECT_URL: 'https://23xmmcop5e4r.space.minimax.io',
  PASSWORD_RESET_REDIRECT_URL: 'https://23xmmcop5e4r.space.minimax.io'
}

// 配置邮件服务
async function configureEmailService() {
  console.log('🚀 开始配置Supabase邮件服务...')
  console.log('=' .repeat(50))
  
  try {
    // 首先检查当前配置
    console.log('🔍 检查当前配置...')
    
    const configResponse = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_ID}/config/auth`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (configResponse.ok) {
      const currentConfig = await configResponse.json()
      console.log('✅ 当前配置获取成功')
      console.log('- Site URL:', currentConfig.SITE_URL || '未设置')
      console.log('- 邮件确认:', currentConfig.ENABLE_EMAIL_CONFIRMATIONS ? '已启用' : '未启用')
      console.log('')
    } else {
      console.log('⚠️ 无法获取当前配置:', configResponse.status)
    }
    
    // 更新配置
    console.log('🔧 更新邮件服务配置...')
    
    const updateResponse = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_ID}/config/auth`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailConfig)
    })
    
    if (updateResponse.ok) {
      console.log('✅ 邮件服务配置更新成功！')
      
      const updatedConfig = await updateResponse.json()
      console.log('')
      console.log('📋 更新后的配置:')
      console.log('- Site URL:', updatedConfig.SITE_URL)
      console.log('- 允许的URI:', updatedConfig.URI_ALLOW_LIST)
      console.log('- 邮件确认:', updatedConfig.ENABLE_EMAIL_CONFIRMATIONS ? '已启用' : '未启用')
      console.log('- 邮件更改确认:', updatedConfig.ENABLE_EMAIL_CHANGE_CONFIRMATIONS ? '已启用' : '未启用')
      console.log('- 注册功能:', updatedConfig.ENABLE_SIGNUP ? '已启用' : '未启用')
      
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

// 测试邮件功能
async function testEmailFunction() {
  console.log('')
  console.log('🧪 测试邮件功能...')
  console.log('=' .repeat(30))
  
  // 可以在这里添加一个简单的注册测试
  console.log('ℹ️ 请手动运行以下命令来测试邮件功能:')
  console.log('   node verify-email-fix.js')
  console.log('')
  console.log('或者访问网站直接测试注册:')
  console.log('   https://23xmmcop5e4r.space.minimax.io')
}

// 主函数
async function main() {
  console.log('🎨 Mega Space 邮件服务自动配置工具')
  console.log('')
  
  const configSuccess = await configureEmailService()
  
  if (configSuccess) {
    console.log('')
    console.log('🎉 邮件服务配置完成！')
    console.log('')
    console.log('📋 配置清单:')
    console.log('✅ 启用了邮件确认功能')
    console.log('✅ 设置了正确的Site URL')
    console.log('✅ 配置了允许的重定向URL')
    console.log('✅ 启用了邮件更改确认')
    console.log('')
    console.log('🕰️ 现在用户注册后应该能收到确认邮件了！')
    
    await testEmailFunction()
  } else {
    console.log('')
    console.log('❌ 邮件服务配置失败')
    console.log('')
    console.log('🔧 手动配置建议:')
    console.log('1. 访问 https://app.supabase.com/')
    console.log('2. 选择项目: iwgdhzgxtdzrvccddkjm')
    console.log('3. 进入 Authentication > Settings')
    console.log('4. 启用 "Enable email confirmations"')
    console.log('5. 设置 Site URL: https://23xmmcop5e4r.space.minimax.io')
    console.log('6. 添加 Redirect URL: https://23xmmcop5e4r.space.minimax.io/**')
  }
  
  console.log('')
  console.log('📈 接下来的步骤:')
  console.log('1. 运行验证脚本检查配置是否生效')
  console.log('2. 使用真实邮箱测试注册功能')
  console.log('3. 检查邮箱收件箱和垃圾邮件文件夹')
  console.log('4. 点击确认链接测试完整流程')
}

// 执行配置
main().catch(console.error)
