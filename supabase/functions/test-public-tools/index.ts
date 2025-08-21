// 简化的测试函数 - 直接使用service role key
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    // 使用硬编码的环境变量值进行测试
    const supabaseUrl = 'https://iwgdhzgxtdzrvccddkjm.supabase.co'
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3Z2RoemdjdGR6cnZjY2Rka2ptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDA5MjM3NSwiZXhwIjoyMDQ5NjY4Mzc1fQ.q8OksWt1ZjhRXabnGcCdGMH6Qh-lbJL9x4Ml8v-vIh4'
    
    console.log('Environment check:', {
      url: supabaseUrl,
      hasServiceKey: !!serviceRoleKey,
      keyPrefix: serviceRoleKey?.substring(0, 20)
    })
    
    // 创建管理员客户端
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
    
    // 直接查询数据
    const { data, error } = await supabaseAdmin
      .from('public_tools')
      .select(`
        id, name, description, category, tool_type, 
        tags, features, icon_name, usage_count, 
        rating, review_count, is_premium, created_at
      `)
      .eq('is_public', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(20)
    
    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: error.message,
          details: error
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    console.log('Query successful, found tools:', data?.length)
    
    return new Response(
      JSON.stringify({
        success: true,
        data: data || [],
        count: data?.length || 0
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
    
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})