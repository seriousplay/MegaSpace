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
        const { action, toolId, userInput, context = {} } = await req.json();
        
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        switch (action) {
            case 'get_public_tools': {
                const getResponse = await fetch(`${supabaseUrl}/rest/v1/public_tools?is_active=eq.true&select=*&order=is_featured.desc,usage_count.desc,created_at.desc`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });

                if (!getResponse.ok) {
                    throw new Error('Failed to fetch public tools');
                }

                const tools = await getResponse.json();
                
                return new Response(JSON.stringify({
                    data: {
                        tools: tools,
                        count: tools.length
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'get_tools_by_category': {
                const { category } = context;
                let query = `${supabaseUrl}/rest/v1/public_tools?is_active=eq.true&select=*`;
                
                if (category && category !== 'all') {
                    query += `&category=eq.${category}`;
                }
                
                query += '&order=is_featured.desc,usage_count.desc,created_at.desc';

                const getResponse = await fetch(query, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });

                if (!getResponse.ok) {
                    throw new Error('Failed to fetch tools by category');
                }

                const tools = await getResponse.json();
                
                return new Response(JSON.stringify({
                    data: {
                        tools: tools,
                        category: category,
                        count: tools.length
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'use_tool': {
                if (!toolId || !userInput) {
                    throw new Error('Tool ID and user input are required');
                }

                // Get tool details
                const toolResponse = await fetch(`${supabaseUrl}/rest/v1/public_tools?id=eq.${toolId}&is_active=eq.true`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });

                if (!toolResponse.ok) {
                    throw new Error('Failed to fetch tool details');
                }

                const tools = await toolResponse.json();
                if (tools.length === 0) {
                    throw new Error('Tool not found or inactive');
                }

                const tool = tools[0];
                
                // Process user input with the tool
                const result = await processToolInput(tool, userInput, context);
                
                // Update usage count
                await fetch(`${supabaseUrl}/rest/v1/public_tools?id=eq.${toolId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        usage_count: tool.usage_count + 1
                    })
                });
                
                return new Response(JSON.stringify({
                    data: {
                        result: result,
                        toolName: tool.name,
                        category: tool.category,
                        usageCount: tool.usage_count + 1
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'get_featured_tools': {
                const getResponse = await fetch(`${supabaseUrl}/rest/v1/public_tools?is_active=eq.true&is_featured=eq.true&select=*&order=usage_count.desc,created_at.desc&limit=6`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });

                if (!getResponse.ok) {
                    throw new Error('Failed to fetch featured tools');
                }

                const tools = await getResponse.json();
                
                return new Response(JSON.stringify({
                    data: {
                        tools: tools,
                        count: tools.length
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            case 'search_tools': {
                const { query } = context;
                if (!query) {
                    throw new Error('Search query is required');
                }

                const searchResponse = await fetch(`${supabaseUrl}/rest/v1/public_tools?is_active=eq.true&or=(name.ilike.%25${query}%25,description.ilike.%25${query}%25,tags.cs.{${query}})&select=*&order=usage_count.desc`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey
                    }
                });

                if (!searchResponse.ok) {
                    throw new Error('Failed to search tools');
                }

                const tools = await searchResponse.json();
                
                return new Response(JSON.stringify({
                    data: {
                        tools: tools,
                        query: query,
                        count: tools.length
                    }
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            default:
                throw new Error(`Unknown action: ${action}`);
        }

    } catch (error) {
        console.error('Public tools API error:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'PUBLIC_TOOLS_ERROR',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Process tool input based on tool configuration
async function processToolInput(tool: any, userInput: string, context: any): Promise<string> {
    const { prompt_template, system_instructions, category } = tool;
    
    // Build the prompt
    let fullPrompt = system_instructions || `你是一个专业的${category}AI助手。`;
    fullPrompt += `\n\n用户输入: ${userInput}\n\n`;
    fullPrompt += prompt_template || '请根据用户输入提供有用的建议和指导。';
    
    // Simulate AI processing based on tool category
    switch (category) {
        case '课程规划':
            return generateLessonPlan(userInput);
        case '作业生成':
            return generateHomework(userInput);
        case '学习辅导':
            return generateTutoring(userInput);
        case '家校沟通':
            return generateCommunication(userInput);
        case '评价反馈':
            return generateEvaluation(userInput);
        default:
            return generateGenericResponse(userInput, category);
    }
}

// Tool-specific response generators
function generateLessonPlan(input: string): string {
    return `# 课程计划

基于您的需求“${input}”，为您提供以下课程计划建议：

## 教学目标
- 帮助学生理解和掌握核心概念
- 培养学生的批判性思维能力
- 提高学生的实际应用能力

## 教学步骤
1. **引入阶段** (10分钟)
   - 复习相关知识点
   - 提出引导性问题

2. **讲授阶段** (25分钟)
   - 详细讲解核心概念
   - 配合实例演示

3. **练习阶段** (10分钟)
   - 学生独立练习
   - 小组讨论交流

## 教学资源
- PPT演示文件
- 相关视频材料
- 练习题库

请根据实际情况调整以上计划！`;
}

function generateHomework(input: string): string {
    return `# 作业题目

针对您的需求“${input}”，为您生成以下作业题目：

## 基础题 (选择题)
1. 下列哪个说法是正确的？
   A. 选项1
   B. 选项2 (✓ 正确答案)
   C. 选项3
   D. 选项4

## 理解题 (简答题)
1. 请简述...的主要特点。
2. 说明...的实际应用场景。

## 应用题 (分析题)
1. 给出以下情况，请分析...

## 作业要求
- 作业时间：30分钟
- 提交方式：上传电子版
- 截止日期：下节课前

祈望能帮助到您！`;
}

function generateTutoring(input: string): string {
    return `# 学习辅导

对于您的问题“${input}”，我来为您提供详细的辅导：

## 知识点分析
这个问题涉及到以下核心知识点：
- 知识点1：基本概念理解
- 知识点2：实际应用方法
- 知识点3：常见错误避免

## 解题思路
1. **理解问题**: 首先需要...
2. **分析突破**: 找出关键信息...
3. **应用方法**: 使用合适的...
4. **验证答案**: 检查结果是否...

## 相似题目练习
建议您练习以下类似问题来巩固掌握：
- 练习题1
- 练习题2
- 练习题3

如果还有疑问，随时问我！`;
}

function generateCommunication(input: string): string {
    return `# 家校沟通内容

亲爱的家长，您好！

关于“${input}”，我想与您分享以下信息：

## 学生表现
近期在课堂上的表现情况：
- 学习态度积极，认真听讲
- 作业完成质量较好
- 与同学交流合作合理

## 需要关注的方面
1. 学习方法需要进一步优化
2. 某些知识点需要加强练习
3. 建议家长配合监督

## 家长可以配合的地方
- 督促孩子按时完成作业
- 鼓励孩子多问问题
- 保证充足的休息时间

如有任何疑问，欢迎随时联系！

谢谢您的配合！

[教师姓名]
[联系方式]`;
}

function generateEvaluation(input: string): string {
    return `# 评价反馈

对于“${input}”，提供以下评价反馈：

## 优点
✅ 内容理解准确，表达清晰
✅ 逻辑思维清晰，结构合理
✅ 举例恰当，说服力强

## 需要改进的地方
⚠️ 某些细节可以更加完善
⚠️ 建议添加更多具体例子
⚠️ 可以探讨更深层次的问题

## 评分明细
- **内容理解** (25/30): 表现较好，有小幅提升空间
- **表达能力** (22/25): 清晰易懂，结构合理
- **创新思维** (20/25): 有自己的见解
- **书面表达** (18/20): 字迹清晰，格式规范

## 总评
总体表现优秀，希望继续加油！建议在以上提到的方面再提升一些。

继续努力，相信你能做得更好！`;
}

function generateGenericResponse(input: string, category: string): string {
    return `# ${category}帮助

对于您的需求“${input}”，我为您提供以下建议和指导：

## 分析
基于您提供的信息，我理解您需要...

## 建议方案
1. **方案一**: 可以考虑...
2. **方案二**: 建议尝试...
3. **方案三**: 另一个选择是...

## 注意事项
- 请注意...
- 建议避免...
- 记得考虑...

希望这些建议能对您有所帮助！如有其他问题，请随时提出。`;
}