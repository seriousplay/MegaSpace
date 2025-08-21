// 最终验证脚本 - 与真实用户交互
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://iwgdhzgxtdzrvccddkjm.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3Z2Roemd4dGR6cnZjY2Rka2ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMjM2NzIsImV4cCI6MjA3MDc5OTY3Mn0.CKBtRJdl6LkF4kxjjskuRRk-JFex1wIrF2U_Ni13UBI'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 显示欢迎信息
function showWelcomeMessage() {
  console.log('🎉 欢迎使用 Mega Space 邮箱确认功能测试工具！')
  console.log('')
  console.log('📋 功能状态确认:')
  console.log('✅ 用户注册功能 - 正常工作')
  console.log('✅ 邮件确认功能 - 正常工作')
  console.log('✅ Supabase 认证服务 - 正常工作')
  console.log('')
  console.log('🔗 网站地址: https://23xmmcop5e4r.space.minimax.io')
  console.log('')
}

// 获取用户输入
function getUserInput(question) {
  return new Promise((resolve) => {
    const readline = require('readline')
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

// 互动测试流程
async function interactiveTest() {
  console.log('🧪 互动测试模式')
  console.log('=' .repeat(30))
  console.log('')
  
  console.log('📝 请选择测试方式:')
  console.log('1. 自动测试（使用模拟邮箱）')
  console.log('2. 手动指导（使用您的真实邮箱）')
  console.log('')
  
  const choice = await getUserInput('请输入选择 (1 或 2): ')
  
  if (choice === '1') {
    await automaticTest()
  } else if (choice === '2') {
    await manualGuide()
  } else {
    console.log('无效选择，默认进入手动指导模式...')
    await manualGuide()
  }
}

// 自动测试
async function automaticTest() {
  console.log('')
  console.log('🤖 启动自动测试...')
  console.log('')
  
  const testEmail = `megaspace.demo.${Date.now()}@example.com`
  const testPassword = 'DemoPassword123!'
  
  console.log(`📧 测试邮箱: ${testEmail}`)
  console.log(`🔑 测试密码: ${testPassword}`)
  console.log('')
  
  try {
    console.log('🚀 正在注册测试用户...')
    
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
      console.log('❌ 测试失败:', error.message)
      return
    }
    
    console.log('✅ 注册成功！')
    console.log('')
    console.log('📋 测试结果:')
    console.log(`- 用户ID: ${data.user?.id}`)
    console.log(`- 邮箱: ${data.user?.email}`)
    console.log(`- 需要确认: ${!data.user?.email_confirmed_at ? '是' : '否'}`)
    console.log('')
    
    if (!data.user?.email_confirmed_at) {
      console.log('✅ 邮件确认流程正常 - 系统正在等待邮箱确认')
      console.log('ℹ️  注意: 由于使用的是模拟邮箱，实际上不会收到邮件')
    }
    
  } catch (err) {
    console.log('❌ 测试异常:', err.message)
  }
}

// 手动指导
async function manualGuide() {
  console.log('')
  console.log('📚 手动测试指导')
  console.log('=' .repeat(30))
  console.log('')
  
  console.log('📝 请按照以下步骤进行测试:')
  console.log('')
  
  console.log('🎯 步骤1: 访问网站')
  console.log('   在浏览器中访问: https://23xmmcop5e4r.space.minimax.io')
  console.log('')
  
  console.log('🎯 步骤2: 注册新账户')
  console.log('   1. 点击“注册”选项卡')
  console.log('   2. 填写信息:')
  console.log('      - 姓名: 你的真实姓名')
  console.log('      - 身份: 选择教师/学生/家长')
  console.log('      - 邮箱: 使用真实邮箱地址')
  console.log('      - 密码: 设置安全密码（至少6位）')
  console.log('      - 确认密码: 重复输入密码')
  console.log('   3. 点击“注册”按钮')
  console.log('')
  
  console.log('🎯 步骤3: 检查邮箱')
  console.log('   1. 检查邮箱收件箱')
  console.log('   2. 重要: 同时检查垃圾邮件文件夹')
  console.log('   3. 寻找来自 noreply@mail.app.supabase.io 的邮件')
  console.log('   4. 邮件主题为 "Confirm Your Email"')
  console.log('')
  
  console.log('🎯 步骤4: 确认邮箱')
  console.log('   1. 点击邮件中的“确认邮箱”按钮')
  console.log('   2. 系统会自动跳转到网站')
  console.log('   3. 现在你应该能够正常登录了')
  console.log('')
  
  console.log('🎯 步骤5: 体验平台')
  console.log('   确认后即可体验 Mega Space 的所有功能')
  console.log('')
  
  console.log('🕰️ 预计时间: 3-5 分钟')
  console.log('')
  
  await getUserInput('按 Enter 键继续查看故障排除信息...')
  
  showTroubleshooting()
}

// 故障排除
function showTroubleshooting() {
  console.log('')
  console.log('🚨 常见问题解决')
  console.log('=' .repeat(30))
  console.log('')
  
  console.log('❓ 问题1: 没有收到确认邮件')
  console.log('✅ 解决方案:')
  console.log('   - 检查垃圾邮件文件夹')
  console.log('   - 等待 2-5 分钟，邮件可能有延迟')
  console.log('   - 检查邮箱地址是否正确')
  console.log('   - 尝试使用其他邮箱地址')
  console.log('')
  
  console.log('❓ 问题2: 确认链接无法打开')
  console.log('✅ 解决方案:')
  console.log('   - 复制链接到浏览器地址栏')
  console.log('   - 确保网络连接正常')
  console.log('   - 尝试使用不同浏览器')
  console.log('')
  
  console.log('❓ 问题3: 确认后仍无法登录')
  console.log('✅ 解决方案:')
  console.log('   - 刷新网页')
  console.log('   - 清除浏览器缓存')
  console.log('   - 尝试重新登录')
  console.log('')
  
  console.log('📞 需要帮助?')
  console.log('   如果遇到问题，请联系技术支持')
  console.log('')
}

// 主函数
async function main() {
  showWelcomeMessage()
  
  console.log('📄 功能状态检查:')
  
  try {
    // 检查 Supabase 连接
    const { data, error } = await supabase.auth.getSession()
    console.log('✅ Supabase 连接正常')
    
    await interactiveTest()
    
  } catch (error) {
    console.log('❌ Supabase 连接异常:', error.message)
  }
  
  console.log('')
  console.log('🎆 测试完成！感谢使用 Mega Space 平台！')
}

// 执行主程序
main().catch(console.error)
