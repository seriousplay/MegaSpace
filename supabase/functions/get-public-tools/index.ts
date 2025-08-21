Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const url = new URL(req.url);
    const searchParams = url.searchParams;
    
    // 获取查询参数
    const category = searchParams.get('category');
    const toolType = searchParams.get('tool_type');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sort_by') || 'popular';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 构建查询URL
    let queryUrl = `${supabaseUrl}/rest/v1/public_tools?select=id,name,description,category,tool_type,configuration,tags,features,icon_name,usage_count,rating,review_count,is_premium,created_at&is_public=eq.true&is_active=eq.true`;
    
    // 添加分类筛选
    if (category && category !== 'all') {
      queryUrl += `&category=eq.${encodeURIComponent(category)}`;
    }
    
    // 添加工具类型筛选
    if (toolType && toolType !== 'all') {
      queryUrl += `&tool_type=eq.${encodeURIComponent(toolType)}`;
    }
    
    // 添加搜索筛选 (需要使用or查询)
    if (search) {
      const searchQuery = encodeURIComponent(`name.ilike.*${search}*,description.ilike.*${search}*`);
      queryUrl += `&or=(${searchQuery})`;
    }
    
    // 添加排序
    switch (sortBy) {
      case 'rating':
        queryUrl += '&order=rating.desc,review_count.desc';
        break;
      case 'newest':
        queryUrl += '&order=created_at.desc';
        break;
      case 'popular':
      default:
        queryUrl += '&order=usage_count.desc,rating.desc';
        break;
    }
    
    // 添加分页
    queryUrl += `&limit=${limit}&offset=${offset}`;
    
    // 执行查询
    const response = await fetch(queryUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseKey
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Database query failed: ${response.statusText} - ${errorText}`);
    }
    
    const tools = await response.json();
    
    return new Response(JSON.stringify({ data: tools }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in get-public-tools:', error);
    
    const errorResponse = {
      error: {
        code: 'FUNCTION_ERROR',
        message: error.message || 'Failed to fetch public tools'
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});