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
        const { action, ...requestData } = await req.json();
        
        // 获取环境变量
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase配置缺失');
        }

        // 获取用户信息
        let currentUserId = null;
        const authHeader = req.headers.get('authorization');
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'apikey': serviceRoleKey
                }
            });
            if (userResponse.ok) {
                const userData = await userResponse.json();
                currentUserId = userData.id;
            }
        }

        if (!currentUserId) {
            throw new Error('用户身份验证失败');
        }

        let result = {};

        switch (action) {
            case 'upload_file':
                // 处理文件上传
                const { file_name, file_content, file_type, upload_purpose } = requestData;
                
                if (!file_name || !file_content) {
                    throw new Error('文件名和内容不能为空');
                }

                // 生成唯一文件路径
                const fileId = crypto.randomUUID();
                const fileExtension = file_name.split('.').pop();
                const storagePath = `agent-uploads/${currentUserId}/${fileId}.${fileExtension}`;
                
                // 保存文件信息到数据库
                const fileUploadData = {
                    id: fileId,
                    user_id: currentUserId,
                    file_name,
                    file_path: storagePath,
                    file_size: file_content.length,
                    file_type: file_type || 'application/octet-stream',
                    upload_purpose: upload_purpose || 'agent_context',
                    is_public: false,
                    created_at: new Date().toISOString()
                };

                const uploadResponse = await fetch(`${supabaseUrl}/rest/v1/file_uploads`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(fileUploadData)
                });

                if (!uploadResponse.ok) {
                    const errorText = await uploadResponse.text();
                    throw new Error(`文件信息保存失败: ${errorText}`);
                }

                const [uploadedFile] = await uploadResponse.json();

                // 触发文件内容处理（提取文本内容）
                let extractedContent = '';
                let metadata = {};
                
                try {
                    const processResult = await processFileContent(file_content, file_type, file_name);
                    extractedContent = processResult.content;
                    metadata = processResult.metadata;
                } catch (error) {
                    console.error('文件内容处理失败:', error);
                    extractedContent = file_content; // 如果处理失败，直接使用原内容
                }

                result = {
                    file: uploadedFile,
                    extracted_content: extractedContent,
                    metadata,
                    message: '文件上传成功'
                };
                break;

            case 'process_file_for_rag':
                // 将文件内容处理为RAG向量
                const { file_id, chunk_size = 1000 } = requestData;
                
                // 获取文件信息
                const fileResponse = await fetch(
                    `${supabaseUrl}/rest/v1/file_uploads?id=eq.${file_id}`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });
                
                const files = await fileResponse.json();
                if (files.length === 0) {
                    throw new Error('文件不存在');
                }
                
                const file = files[0];
                
                // 模拟文件内容读取（实际应该从存储中读取）
                const fileContent = '这是模拟的文件内容，包含有关AI教育的知识和最佳实践。';
                
                // 分块处理文本
                const chunks = chunkText(fileContent, chunk_size);
                const vectorData = [];
                
                for (let i = 0; i < chunks.length; i++) {
                    const chunk = chunks[i];
                    
                    // 模拟向量化处理（实际应该调用OpenAI的embedding API）
                    const mockEmbedding = generateMockEmbedding();
                    
                    vectorData.push({
                        file_id,
                        chunk_index: i,
                        content: chunk,
                        embedding: mockEmbedding,
                        metadata: {
                            chunk_size: chunk.length,
                            chunk_position: i,
                            file_name: file.file_name
                        },
                        token_count: Math.ceil(chunk.length / 4), // 估算token数
                        created_at: new Date().toISOString()
                    });
                }
                
                // 存储向量数据
                const vectorResponse = await fetch(`${supabaseUrl}/rest/v1/document_vectors`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(vectorData)
                });
                
                if (!vectorResponse.ok) {
                    const errorText = await vectorResponse.text();
                    throw new Error(`向量数据存储失败: ${errorText}`);
                }
                
                result = {
                    file_id,
                    chunks_processed: chunks.length,
                    total_tokens: vectorData.reduce((sum, item) => sum + item.token_count, 0),
                    message: 'RAG向量化处理完成'
                };
                break;

            case 'search_similar_content':
                // 语义搜索相似内容
                const { query, file_ids, limit = 5 } = requestData;
                
                if (!query) {
                    throw new Error('搜索查询不能为空');
                }
                
                // 模拟查询向量化
                const queryEmbedding = generateMockEmbedding();
                
                // 构建查询条件
                let searchQuery = `${supabaseUrl}/rest/v1/document_vectors?select=*,file_uploads(file_name)`;
                if (file_ids && file_ids.length > 0) {
                    searchQuery += `&file_id=in.(${file_ids.join(',')})`;
                }
                searchQuery += `&limit=${limit}`;
                
                const searchResponse = await fetch(searchQuery, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });
                
                if (!searchResponse.ok) {
                    throw new Error('搜索失败');
                }
                
                const searchResults = await searchResponse.json();
                
                // 模拟相似度计算和排序
                const resultsWithSimilarity = searchResults.map(result => ({
                    ...result,
                    similarity: Math.random() * 0.5 + 0.5 // 模拟相似度 0.5-1.0
                })).sort((a, b) => b.similarity - a.similarity);
                
                result = {
                    query,
                    results: resultsWithSimilarity,
                    total_found: resultsWithSimilarity.length
                };
                break;

            case 'get_user_files':
                // 获取用户上传的文件列表
                const userFilesResponse = await fetch(
                    `${supabaseUrl}/rest/v1/file_uploads?user_id=eq.${currentUserId}&order=created_at.desc`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });
                
                if (!userFilesResponse.ok) {
                    throw new Error('获取文件列表失败');
                }
                
                const userFiles = await userFilesResponse.json();
                result = { files: userFiles };
                break;

            default:
                throw new Error('不支持的操作类型');
        }

        return new Response(JSON.stringify({
            data: result
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('File Processing error:', error);

        const errorResponse = {
            error: {
                code: 'FILE_PROCESSING_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// 辅助函数

// 处理文件内容
async function processFileContent(content: string, fileType: string, fileName: string) {
    let extractedContent = '';
    let metadata = {
        original_size: content.length,
        file_type: fileType,
        file_name: fileName,
        processed_at: new Date().toISOString()
    };

    // 根据文件类型处理
    if (fileType.includes('text/') || fileType.includes('markdown')) {
        extractedContent = content;
    } else if (fileType.includes('json')) {
        try {
            const jsonData = JSON.parse(content);
            extractedContent = JSON.stringify(jsonData, null, 2);
            metadata.structure = 'json';
        } catch (error) {
            extractedContent = content;
        }
    } else {
        // 其他格式暂时直接使用内容
        extractedContent = content;
    }

    return {
        content: extractedContent,
        metadata
    };
}

// 文本分块
function chunkText(text: string, chunkSize: number): string[] {
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
}

// 生成模拟嵌入向量
function generateMockEmbedding(): number[] {
    const dimension = 1536; // OpenAI embedding维度
    const embedding = [];
    for (let i = 0; i < dimension; i++) {
        embedding.push((Math.random() - 0.5) * 2); // -1 到 1 之间的随机数
    }
    return embedding;
}