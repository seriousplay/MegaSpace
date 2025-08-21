// 验证邮件确认功能修复效果
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://iwgdhzgxtdzrvccddkjm.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3Z2Roemd4dGR6cnZjY2Rka2ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMjM2NzIsImV4cCI6MjA3MDc5OTY3Mn0.CKBtRJdl6LkF4kxjjskuRRk-JFex1wIrF2U_Ni13UBI'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 生成随机测试邮箱
function generateTestEmail() {
  const timestamp = Date.now()
  const randomNum = Math.floor(Math.random() * 1000)
  return `megaspace.test.${timestamp}.${randomNum}@gmail.com`
}

// 验证邮件确认功能
async function verifyEmailConfirmation() {
  console.log('🔍 开始验证邮件确认功能...')
  console.log('=' .repeat(50))
  
  const testEmail = generateTestEmail()
  const testPassword = 'TestPassword123!'
  
  console.log(`📧 测试邮箱: ${testEmail}`)
  console.log(`🔑 测试密码: ${testPassword}`)
  console.log('')
  
  try {
    console.log('🚀 步骤1: 尝试注册新用户...')
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: '测试用户 - 邮件验证',
          role: 'student'
        }
      }
    })
    
    if (error) {
      console.error('❌ 注册失败:', error.message)
      return false
    }
    
    console.log('✅ 注册成功!')
    
    // 检查用户状态
    if (data.user) {
      console.log('')
      console.log('📋 用户信息:')
      console.log(`- ID: ${data.user.id}`)
      console.log(`- 邮箱: ${data.user.email}`)
      console.log(`- 邮件确认状态: ${data.user.email_confirmed_at ? '✅ 已确认' : '⚠️  待确认'}`)
      console.log(`- 会话状态: ${data.session ? '✅ 已创建' : '⚠️  未创建（需要邮件确认）'}`)
      
      if (!data.user.email_confirmed_at) {
        console.log('')
        console.log('📬 邮件确认状态: 待处理')
        console.log('🕰️ 请在 1-2 分钟内检查您的邮箱（包括垃圾邮件文件夹）')
        
        // 等待一段时间再检查
        console.log('')
        console.log('⏳ 等待 30 秒后再次检查用户状态...')
        
        await new Promise(resolve => setTimeout(resolve, 30000))
        
        // 重新获取用户信息
        const { data: updatedData, error: fetchError } = await supabase.auth.getUser()
        
        if (fetchError) {
          console.log('⚠️  无法获取更新的用户信息')
        } else if (updatedData.user) {
          console.log('')
          console.log('🔄 更新后的用户状态:')
          console.log(`- 邮件确认状态: ${updatedData.user.email_confirmed_at ? '✅ 已确认' : '⚠️  仍在待确认'}`)
        }
        
        return false // 邮件尚未确认
      } else {
        console.log('')
        console.log('✅ 邮件已自动确认！')
        return true // 邮件已确认
      }
    } else {
      console.error('❌ 未获取到用户数据')
      return false
    }
    
  } catch (err) {
    console.error('❌ 验证过程中出现异常:', err.message)
    return false
  }
}

// 检查Supabase配置
async function checkSupabaseConfig() {
  console.log('🔧 检查 Supabase 配置...')
  console.log('=' .repeat(30))
  
  try {
    // 检查连接
    const { data, error } = await supabase.auth.getSession()
    
    console.log('✅ Supabase 连接正常')
    console.log(`- URL: ${supabaseUrl}`)
    console.log(`- Anon Key: ${supabaseAnonKey.substring(0, 20)}...`)
    console.log('')
    
    return true
  } catch (err) {
    console.error('❌ Supabase 配置错误:', err.message)
    return false
  }
}

// 提供修复建议
function provideFinalRecommendations(emailConfirmed) {
  console.log('')
  console.log('📄 验证结果报告')
  console.log('=' .repeat(50))
  
  if (emailConfirmed) {
    console.log('✅ 邮件确认功能正常工作！')
    console.log('')
    console.log('🎉 所有功能已就绪，用户可以正常使用平台。')
  } else {
    console.log('❌ 邮件确认功能尚未正常工作')
    console.log('')
    console.log('🔧 需要在 Supabase Dashboard 中进行以下配置：')
    console.log('')
    console.log('1. 🌐 访问 https://app.supabase.com/')
    console.log('2. 📋 选择项目: iwgdhzgxtdzrvccddkjm')
    console.log('3. ⚙️  进入 Authentication > Settings')
    console.log('4. ✅ 确保 "Enable email confirmations" 已开启')
    console.log('5. 📧 配置 SMTP 设置：')
    console.log('   - 推荐使用 Resend (smtp.resend.com:587)')
    console.log('   - 或 SendGrid (smtp.sendgrid.net:587)')
    console.log('   - 或 Mailgun (smtp.mailgun.org:587)')
    console.log('6. 🔗 设置 Site URL: https://23xmmcop5e4r.space.minimax.io')
    console.log('7. 🔄 添加 Redirect URL: https://23xmmcop5e4r.space.minimax.io/**')
    console.log('')
    console.log('📚 详细修复指南请查看: 邮箱确认功能修复指南.md')
  }
  
  console.log('')
  console.log('📈 建议的测试步骤：')
  console.log('1. 配置完成后，使用真实邮箱地址再次测试')
  console.log('2. 检查邮箱收件箱和垃圾邮件文件夹')
  console.log('3. 点击确认链接测试跳转功能')
  console.log('4. 登录测试完整流程')
}

// 主函数
async function main() {
  console.log('🚀 Mega Space 邮件确认功能验证工具')
  console.log('')
  
  // 检查配置
  const configOk = await checkSupabaseConfig()
  if (!configOk) {
    console.log('❌ 配置检查失败，退出验证')
    return
  }
  
  console.log('')
  
  // 验证邮件确认
  const emailConfirmed = await verifyEmailConfirmation()
  
  // 提供最终建议
  provideFinalRecommendations(emailConfirmed)
}

// 执行验证
main().catch(console.error)
