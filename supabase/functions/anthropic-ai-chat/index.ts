const qianwenApiKey = 'sk-1256f7fbabdc409caaefc8fd68490516';
/// <reference types="https://deno.land/x/supabase_functions@0.2.0/mod.ts" />

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
        const { agentId, message, sessionId, context = {} } = await req.json();
        
        if (!agentId || !message) {
            throw new Error('Agent ID and message are required');
        }

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const qianwenApiKey = 'sk-1256f7fbabdc409caaefc8fd68490516';

        if (!qianwenApiKey) {
            throw new Error('千问API密钥未配置');
        }

        // Get user from auth header
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            throw new Error('No authorization header');
        }

        const token = authHeader.replace('Bearer ', '');
        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': serviceRoleKey
            }
        });

        if (!userResponse.ok) {
            throw new Error('Invalid token');
        }

        const userData = await userResponse.json();
        const userId = userData.id;

        // Get agent details
        const agentResponse = await fetch(`${supabaseUrl}/rest/v1/ai_agents?id=eq.${agentId}`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        if (!agentResponse.ok) {
            throw new Error('Failed to fetch agent details');
        }

        const agents = await agentResponse.json();
        if (agents.length === 0) {
            throw new Error('Agent not found');
        }

        const agent = agents[0];

        // Check permissions
        if (agent.permissions === 'private' && agent.creator_id !== userId) {
            if (agent.organization_id) {
                const memberResponse = await fetch(`${supabaseUrl}/rest/v1/organization_memberships?user_id=eq.${userId}&organization_id=eq.${agent.organization_id}`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });
                
                if (!memberResponse.ok) {
                    throw new Error('Access denied: No permission to use this agent');
                }
                
                const memberships = await memberResponse.json();
                if (memberships.length === 0) {
                    throw new Error('Access denied: Not a member of the agent\'s organization');
                }
            } else {
                throw new Error('Access denied: This is a private agent');
            }
        }

        // Get conversation history
        let conversationHistory = [];
        if (sessionId) {
            const historyResponse = await fetch(`${supabaseUrl}/rest/v1/ai_interactions?session_id=eq.${sessionId}&select=message_type,content&order=created_at.asc&limit=10`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            if (historyResponse.ok) {
                const history = await historyResponse.json();
                conversationHistory = history.map(h => ({
                    role: h.message_type === 'user' ? 'user' : 'assistant',
                    content: h.content
                }));
            }
        }

        // Build messages for Anthropic API
        const systemPrompt = agent.system_instructions || 
            '你是一个专业的AI教育助手，名为' + agent.name + '。你专门帮助用户解决' + agent.category + '相关的问题。请始终保持友好、专业和耐心的态度。';
        
        const userPrompt = agent.prompt_template ? 
            agent.prompt_template.replace('{message}', message) || message :
            message;

        const messages = [...conversationHistory, {
            role: 'user',
            content: userPrompt
        }];

        const startTime = Date.now();

        // 调用千问API
        const qianwenResponse = await fetch('https://dashscope.aliyun.com/api/v1/services/aigc/text-generation/generation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${qianwenApiKey}`
            },
            body: JSON.stringify({
                model: 'qwen-turbo',
                input: {
                    messages: messages,
                    system_prompt: systemPrompt
                },
                parameters: {
                    max_tokens: 1000,
                    temperature: 0.7
                }
            })
        });

        if (!qianwenResponse.ok) {
            const errorText = await qianwenResponse.text();
            console.error('千问API错误:', errorText);
            throw new Error('AI服务暂时不可用');
        }

        const qianwenData = await qianwenResponse.json();
        const aiResponse = qianwenData.output?.text || '抱歉，我暂时无法生成响应。';
        
        const responseTime = Date.now() - startTime;
        const currentSessionId = sessionId || crypto.randomUUID();

        // Save user message
        await fetch(`${supabaseUrl}/rest/v1/ai_interactions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: userId,
                agent_id: agentId,
                organization_id: agent.organization_id,
                session_id: currentSessionId,
                message_type: 'user',
                content: message,
                created_at: new Date().toISOString()
            })
        });

        // Save AI response
        await fetch(`${supabaseUrl}/rest/v1/ai_interactions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: userId,
                agent_id: agentId,
                organization_id: agent.organization_id,
                session_id: currentSessionId,
                message_type: 'assistant',
                content: aiResponse,
                response_time: responseTime,
                created_at: new Date().toISOString()
            })
        });

        // Update agent usage count
        await fetch(`${supabaseUrl}/rest/v1/ai_agents?id=eq.${agentId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                usage_count: (agent.usage_count || 0) + 1,
                updated_at: new Date().toISOString()
            })
        });

        return new Response(JSON.stringify({
            data: {
                response: aiResponse,
                sessionId: currentSessionId,
                agentName: agent.name,
                responseTime: responseTime
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Anthropic AI chat error:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'AI_CHAT_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});