const { supabase, testSupabaseConnection } = require('./src/lib/supabase');

async function runTests() {
  console.log('开始测试Supabase连接...');
  
  // 测试基本连接
  const connectionTest = await testSupabaseConnection();
  console.log('连接测试结果:', connectionTest ? '✅ 成功' : '❌ 失败');
  
  // 测试认证功能
  try {
    console.log('\n测试认证服务...');
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('认证服务错误:', error.message);
    } else {
      console.log('✅ 认证服务正常');
    }
  } catch (error) {
    console.log('❌ 认证服务异常:', error);
  }
  
  // 测试数据库访问
  try {
    console.log('\n测试数据库访问...');
    const { data, error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log('数据库访问错误:', error.message);
    } else {
      console.log('✅ 数据库访问正常');
    }
  } catch (error) {
    console.log('❌ 数据库访问异常:', error);
  }
  
  console.log('\n测试完成!');
}

runTests().catch(console.error);