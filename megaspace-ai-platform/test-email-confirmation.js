// 测试Supabase连接和邮件配置
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://iwgdhzgxtdzrvccddkjm.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3Z2Roemd4dGR6cnZjY2Rka2ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMjM2NzIsImV4cCI6MjA3MDc5OTY3Mn0.CKBtRJdl6LkF4kxjjskuRRk-JFex1wIrF2U_Ni13UBI'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 测试注册流程和邮件确认
async function testEmailConfirmation() {
  console.log('正在测试邮件确认功能...')
  
  try {
    // 测试邮箱（使用真实邮箱格式）
    const testEmail = 'test.email.confirmation@gmail.com'
    const testPassword = 'TestPass123!'
    
    console.log('尝试注册用户:', testEmail)
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: '测试用户',
          role: 'student'
        }
      }
    })
    
    if (error) {
      console.error('注册错误:', error)
      return
    }
    
    console.log('注册结果:', {
      user: data.user ? {
        id: data.user.id,
        email: data.user.email,
        emailConfirmedAt: data.user.email_confirmed_at,
        confirmed: data.user.email_confirmed_at ? true : false
      } : null,
      session: data.session ? '存在' : '不存在'
    })
    
    if (data.user && !data.user.email_confirmed_at) {
      console.log('✅ 注册成功，邮件确认待处理')
      console.log('⚠️  邮件未确认 - 请检查邮箱（包括垃圾邮件文件夹）')
    } else if (data.user && data.user.email_confirmed_at) {
      console.log('✅ 邮件已自动确认')
    }
    
  } catch (err) {
    console.error('测试异常:', err)
  }
}

// 检查当前认证配置
async function checkAuthConfig() {
  console.log('\n检查认证配置...')
  
  try {
    // 检查当前会话
    const { data: { session } } = await supabase.auth.getSession()
    console.log('当前会话:', session ? '存在' : '不存在')
    
    // 检查配置
    console.log('Supabase 配置:')
    console.log('- URL:', supabaseUrl)
    console.log('- Anon Key 长度:', supabaseAnonKey.length)
    
  } catch (err) {
    console.error('配置检查错误:', err)
  }
}

// 执行测试
async function runTests() {
  await checkAuthConfig()
  await testEmailConfirmation()
  
  console.log('\nℹ️ 重要提示:')
  console.log('1. 检查 Supabase Dashboard > Authentication > Settings')
  console.log('2. 确保 "Enable email confirmations" 已开启')
  console.log('3. 配置 SMTP 设置或使用内置邮件服务')
  console.log('4. 检查邮件模板和重定向URL设置')
  console.log('5. 使用真实邮箱地址测试（不要使用example.com）')
}

runTests()
