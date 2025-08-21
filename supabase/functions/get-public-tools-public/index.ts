// 公共工具获取API - 使用service role key绕过认证
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

Deno.serve(async (req) => {
  // 设置CORS头，允许所有来源访问
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
    // 安全地获取环境变量
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!serviceRoleKey,
      urlPrefix: supabaseUrl?.substring(0, 20)
    })

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing required environment variables')
      return new Response(
        JSON.stringify({
          error: {
            code: 'CONFIG_ERROR',
            message: '服务器配置错误'
          }
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 创建管理员客户端，使用service role key绕过RLS策略
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`
        }
      }
    })

    // 查询所有公共工具数据
    const { data: tools, error } = await supabaseAdmin
      .from('public_tools')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database query error:', error)
      return new Response(
        JSON.stringify({
          error: {
            code: 'DATABASE_ERROR',
            message: '数据查询失败'
          }
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

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
          message: '服务器内部错误'
        }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})