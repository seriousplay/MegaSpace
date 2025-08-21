// 直接使用REST API获取公共工具数据
Deno.serve(async (req) => {
  // 设置CORS头
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  }

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    // 直接使用硬编码的值，不依赖环境变量
    const supabaseUrl = 'https://iwgdhzgxtdzrvccddkjm.supabase.co'
    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3Z2RoempneHRkenJ2Y2NkZGtqbSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzM0MDkyMzc1LCJleHAiOjIwNDk2NjgzNzV9.cOSygwKGWaJMoFfVWQElMKyIzaSlsWBNv--xqsajdI4'
    
    // 直接调用Supabase REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/public_tools?select=*&order=created_at.desc`, {
      method: 'GET',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    })

    if (!response.ok) {
      console.error('API request failed:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('Error details:', errorText)
      
      return new Response(
        JSON.stringify({
          error: {
            code: 'API_REQUEST_FAILED',
            message: `API请求失败: ${response.status}`,
            details: errorText
          }
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const tools = await response.json()
    
    console.log('Successfully fetched tools:', tools.length)
    
    // 返回成功响应
    return new Response(
      JSON.stringify({
        success: true,
        data: tools || [],
        count: tools?.length || 0
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Function execution error:', error)
    return new Response(
      JSON.stringify({
        error: {
          code: 'FUNCTION_ERROR',
          message: '服务器内部错误',
          details: error.message
        }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})