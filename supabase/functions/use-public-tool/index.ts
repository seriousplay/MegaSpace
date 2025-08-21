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
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const requestData = await req.json();
    const { toolId, action, message } = requestData;
    
    if (!toolId) {
      throw new Error('Tool ID is required');
    }

    // 获取工具信息
    const toolResponse = await fetch(`${supabaseUrl}/rest/v1/public_tools?select=*&id=eq.${toolId}&is_public=eq.true&is_active=eq.true`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseKey
      }
    });

    if (!toolResponse.ok) {
      throw new Error('Failed to fetch tool information');
    }

    const tools = await toolResponse.json();
    if (!tools || tools.length === 0) {
      throw new Error('Tool not found');
    }

    const tool = tools[0];

    // 更新使用次数
    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/public_tools?id=eq.${toolId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseKey
      },
      body: JSON.stringify({
        usage_count: tool.usage_count + 1
      })
    });

    if (!updateResponse.ok) {
      console.error('Failed to update usage count');
    }

    // 根据工具类型处理不同的使用逻辑
    let result = {};
    
    switch (tool.tool_type) {
      case 'ai_tool':
        // AI工具处理逻辑
        if (tool.ai_agent_id) {
          // 如果有关联的AI Agent，调用AI Agent
          const agentResponse = await fetch(`${supabaseUrl}/functions/v1/ai-agent-manager`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              action: 'use_agent',
              agent_id: tool.ai_agent_id,
              message: message || `使用${tool.name}工具`
            })
          });
          
          if (agentResponse.ok) {
            const agentResult = await agentResponse.json();
            result = {
              type: 'ai_response',
              message: agentResult.data?.message || agentResult.message,
              tool_name: tool.name
            };
          } else {
            result = {
              type: 'ai_response',
              message: `您正在使用${tool.name}，这是一个功能强大的AI工具，可以帮助您${tool.description}。请描述您的具体需求。`,
              tool_name: tool.name
            };
          }
        } else {
          // 通用AI工具处理
          result = {
            type: 'ai_response',
            message: `欢迎使用${tool.name}！${tool.description}。请输入您的问题或需求，我将为您提供专业的帮助。`,
            tool_name: tool.name,
            features: tool.features
          };
        }
        break;
        
      case 'knowledge_base':
        // 知识库处理逻辑
        result = {
          type: 'knowledge_base',
          message: `正在为您打开${tool.name}知识库。${tool.description}`,
          tool_name: tool.name,
          action: 'open_knowledge_base',
          knowledge_base_id: tool.knowledge_base_id
        };
        break;
        
      case 'template':
        // 模板处理逻辑
        result = {
          type: 'template',
          message: `正在为您加载${tool.name}模板。${tool.description}`,
          tool_name: tool.name,
          action: 'load_template',
          course_content_id: tool.course_content_id
        };
        break;
        
      case 'resource':
        // 资源处理逻辑
        result = {
          type: 'resource',
          message: `正在为您打开${tool.name}资源。${tool.description}`,
          tool_name: tool.name,
          action: 'open_resource'
        };
        break;
        
      default:
        result = {
          type: 'general',
          message: `正在启动${tool.name}。${tool.description}`,
          tool_name: tool.name
        };
    }

    return new Response(JSON.stringify({ 
      data: result,
      tool: {
        id: tool.id,
        name: tool.name,
        type: tool.tool_type,
        category: tool.category
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in use-public-tool:', error);
    
    const errorResponse = {
      error: {
        code: 'FUNCTION_ERROR',
        message: error.message || 'Failed to use tool'
      }
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});