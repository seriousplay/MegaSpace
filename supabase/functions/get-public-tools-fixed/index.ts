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
    // 使用正确的API keys
    const supabaseUrl = 'https://iwgdhzgxtdzrvccddkjm.supabase.co'
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3Z2Roemd4dGR6cnZjY2Rka2ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMjM2NzIsImV4cCI6MjA3MDc5OTY3Mn0.CKBtRJdl6LkF4kxjjskuRRk-JFex1wIrF2U_Ni13UBI'
    
    // 创建 Supabase 客户端
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // 解析查询参数
    const url = new URL(req.url)
    const category = url.searchParams.get('category')
    const toolType = url.searchParams.get('tool_type')
    const search = url.searchParams.get('search')
    const sortBy = url.searchParams.get('sort_by') || 'popular'
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    
    console.log('Query params:', { category, toolType, search, sortBy, limit, offset })
    
    // 构建查询
    let query = supabase
      .from('public_tools')
      .select(`
        id, name, description, category, tool_type,
        tags, features, icon_name, usage_count,
        rating, review_count, is_premium, created_at
      `)
      .eq('is_public', true)
      .eq('is_active', true)
    
    // 应用筛选条件
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }
    
    if (toolType && toolType !== 'all') {
      query = query.eq('tool_type', toolType)
    }
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,tags.cs.{${search}}`)
    }
    
    // 应用排序
    switch (sortBy) {
      case 'rating':
        query = query.order('rating', { ascending: false })
        break
      case 'newest':
        query = query.order('created_at', { ascending: false })
        break
      case 'popular':
      default:
        query = query.order('usage_count', { ascending: false })
        break
    }
    
    // 应用分页
    query = query.range(offset, offset + limit - 1)
    
    const { data, error } = await query
    
    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({
          error: {
            code: 'DATABASE_ERROR',
            message: '数据查询失败',
            details: error.message
          }
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