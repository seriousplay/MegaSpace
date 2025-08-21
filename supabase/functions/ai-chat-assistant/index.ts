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

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
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
            // Check if user is in the same organization
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

        // Get file contexts if available
        let fileContexts = '';
        if (agent.file_contexts && agent.file_contexts.length > 0) {
            const fileIds = agent.file_contexts.join(',');
            const filesResponse = await fetch(`${supabaseUrl}/rest/v1/file_uploads?id=in.(${fileIds})&select=filename,extracted_text`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            if (filesResponse.ok) {
                const files = await filesResponse.json();
                fileContexts = files.map(file => 
                    `文件: ${file.filename}\n内容: ${file.extracted_text}\n---\n`
                ).join('\n');
            }
        }

        // Prepare conversation context
        let conversationHistory = '';
        if (sessionId) {
            const historyResponse = await fetch(`${supabaseUrl}/rest/v1/ai_interactions?session_id=eq.${sessionId}&select=message_type,content&order=created_at.asc&limit=10`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            });

            if (historyResponse.ok) {
                const history = await historyResponse.json();
                conversationHistory = history.map(h => 
                    `${h.message_type === 'user' ? '用户' : '助手'}: ${h.content}`
                ).join('\n');
            }
        }

        // Build the complete prompt
        const systemPrompt = agent.system_instructions || '你是一个有用的AI助手，专门为教育场景设计。';
        const promptTemplate = agent.prompt_template;
        
        let fullPrompt = `${systemPrompt}\n\n`;
        
        if (fileContexts) {
            fullPrompt += `相关文件内容:\n${fileContexts}\n\n`;
        }
        
        if (conversationHistory) {
            fullPrompt += `对话历史:\n${conversationHistory}\n\n`;
        }
        
        fullPrompt += `当前用户消息: ${message}\n\n请根据以下模板回复:\n${promptTemplate}`;

        // Simulate AI response (In a real implementation, you would integrate with an actual AI service)
        const aiResponse = await generateAIResponse(fullPrompt, agent, context);
        
        const currentSessionId = sessionId || crypto.randomUUID();
        const startTime = Date.now();

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
                content: message
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
                response_time: Date.now() - startTime
            })
        });

        // Update usage count
        await fetch(`${supabaseUrl}/rest/v1/ai_agents?id=eq.${agentId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                usage_count: agent.usage_count + 1,
                updated_at: new Date().toISOString()
            })
        });

        return new Response(JSON.stringify({
            data: {
                response: aiResponse,
                sessionId: currentSessionId,
                agentName: agent.name,
                responseTime: Date.now() - startTime
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('AI chat assistant error:', error);

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

// Simulate AI response generation
async function generateAIResponse(prompt: string, agent: any, context: any): Promise<string> {
    // This is a simulation - in production, you would integrate with OpenAI, Claude, or another AI service
    const responses = [
        `基于您的问题和提供的上下文，我来帮您分析一下。作为${agent.name}，我专门处理${agent.category}相关的教育问题。`,
        `很好的问题！根据我的理解和训练，这个${agent.category}领域的问题可以从以下几个角度来思考...`,
        `让我为您详细解答这个问题。首先，我们需要了解...`,
        `基于您提供的信息和我的专业知识，我建议...`,
        `这是一个很有价值的教育问题。让我从${agent.category}的角度为您分析...`
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    // Add some context-specific content
    let contextualResponse = randomResponse;
    if (context.userRole) {
        contextualResponse += ` 考虑到您是${context.userRole}，我特别推荐...`;
    }
    
    return contextualResponse + '\n\n如果您需要更详细的解释或有其他相关问题，请随时告诉我！';
}