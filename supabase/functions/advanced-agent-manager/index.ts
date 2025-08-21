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
        const { action, agentData, agentId } = await req.json();
        
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

        switch (action) {
            case 'create': {
                if (!agentData) {
                    throw new Error('Agent data is required for creation');
                }

                // Validate required fields
                const requiredFields = ['name', 'description', 'category', 'prompt_template'];
                for (const field of requiredFields) {
                    if (!agentData[field]) {
                        throw new Error(`${field} is required`);
                    }
                }

                // Create enhanced agent configuration
                const agentConfig = {
                    name: agentData.name,
                    description: agentData.description,
                    category: agentData.category,
                    creator_id: userId,
                    organization_id: agentData.organization_id || null,
                    prompt_template: agentData.prompt_template,
                    system_instructions: agentData.system_instructions || '',
                    tools: agentData.tools || [],
                    workflow_config: agentData.workflow_config || {},
                    file_contexts: agentData.file_contexts || [],
                    permissions: agentData.permissions || 'private',
                    tags: agentData.tags || [],
                    status: 'active',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };

                const createResponse = await fetch(`${supabaseUrl}/rest/v1/ai_agents`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(agentConfig)
                });

                if (!createResponse.ok) {
                    const errorText = await createResponse.text();
                    throw new Error(`Agent creation failed: ${errorText}`);
                }

                const createdAgent = await createResponse.json();
                
                return new Response(JSON.stringify({
                    data: {
                        agent: createdAgent[0],
                        message: 'Agent created successfully'
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'update': {
                if (!agentId || !agentData) {
                    throw new Error('Agent ID and data are required for update');
                }

                // Get existing agent to check ownership
                const getResponse = await fetch(`${supabaseUrl}/rest/v1/ai_agents?id=eq.${agentId}`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });

                if (!getResponse.ok) {
                    throw new Error('Failed to fetch existing agent');
                }

                const existingAgents = await getResponse.json();
                if (existingAgents.length === 0) {
                    throw new Error('Agent not found');
                }

                const existingAgent = existingAgents[0];
                if (existingAgent.creator_id !== userId) {
                    throw new Error('Unauthorized: You can only update your own agents');
                }

                // Prepare update data
                const updateData = {
                    ...agentData,
                    updated_at: new Date().toISOString()
                };

                // Remove fields that shouldn't be updated
                delete updateData.id;
                delete updateData.creator_id;
                delete updateData.created_at;

                const updateResponse = await fetch(`${supabaseUrl}/rest/v1/ai_agents?id=eq.${agentId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(updateData)
                });

                if (!updateResponse.ok) {
                    const errorText = await updateResponse.text();
                    throw new Error(`Agent update failed: ${errorText}`);
                }

                const updatedAgent = await updateResponse.json();
                
                return new Response(JSON.stringify({
                    data: {
                        agent: updatedAgent[0],
                        message: 'Agent updated successfully'
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'delete': {
                if (!agentId) {
                    throw new Error('Agent ID is required for deletion');
                }

                // Get existing agent to check ownership
                const getResponse = await fetch(`${supabaseUrl}/rest/v1/ai_agents?id=eq.${agentId}`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });

                if (!getResponse.ok) {
                    throw new Error('Failed to fetch existing agent');
                }

                const existingAgents = await getResponse.json();
                if (existingAgents.length === 0) {
                    throw new Error('Agent not found');
                }

                const existingAgent = existingAgents[0];
                if (existingAgent.creator_id !== userId) {
                    throw new Error('Unauthorized: You can only delete your own agents');
                }

                const deleteResponse = await fetch(`${supabaseUrl}/rest/v1/ai_agents?id=eq.${agentId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });

                if (!deleteResponse.ok) {
                    const errorText = await deleteResponse.text();
                    throw new Error(`Agent deletion failed: ${errorText}`);
                }
                
                return new Response(JSON.stringify({
                    data: {
                        message: 'Agent deleted successfully',
                        agentId: agentId
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'get_user_agents': {
                const getResponse = await fetch(`${supabaseUrl}/rest/v1/ai_agents?creator_id=eq.${userId}&select=*&order=created_at.desc`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });

                if (!getResponse.ok) {
                    throw new Error('Failed to fetch user agents');
                }

                const agents = await getResponse.json();
                
                return new Response(JSON.stringify({
                    data: {
                        agents: agents,
                        count: agents.length
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'attach_files': {
                if (!agentId || !agentData.fileIds) {
                    throw new Error('Agent ID and file IDs are required');
                }

                // Update agent with file contexts
                const updateResponse = await fetch(`${supabaseUrl}/rest/v1/ai_agents?id=eq.${agentId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        file_contexts: agentData.fileIds,
                        updated_at: new Date().toISOString()
                    })
                });

                if (!updateResponse.ok) {
                    const errorText = await updateResponse.text();
                    throw new Error(`Failed to attach files: ${errorText}`);
                }

                const updatedAgent = await updateResponse.json();
                
                return new Response(JSON.stringify({
                    data: {
                        agent: updatedAgent[0],
                        message: 'Files attached successfully'
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            default:
                throw new Error(`Unknown action: ${action}`);
        }

    } catch (error) {
        console.error('Advanced agent manager error:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'AGENT_MANAGER_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});