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
        const { contentType, subject, gradeLevel, topic, requirements } = await req.json();

        if (!contentType || !subject || !gradeLevel || !topic) {
            throw new Error('内容类型、学科、年级和主题不能为空');
        }

        // 获取环境变量
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase配置缺失');
        }

        // 获取用户信息
        let userId = null;
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
                userId = userData.id;
            }
        }

        if (!userId) {
            throw new Error('用户身份验证失败');
        }

        let generatedContent = {};

        // 根据内容类型生成不同的内容
        switch (contentType) {
            case 'lesson_plan':
                generatedContent = {
                    title: `${gradeLevel}${subject} - ${topic}`,
                    objectives: [
                        `理解${topic}的基本概念`,
                        `掌握${topic}的应用方法`,
                        `能够运用${topic}解决实际问题`
                    ],
                    materials: [
                        '教科书',
                        '多媒体课件',
                        '练习册',
                        '实物教具'
                    ],
                    activities: [
                        {
                            name: '导入环节',
                            duration: 5,
                            description: `通过生活实例引入${topic}的概念`,
                            method: '问答互动'
                        },
                        {
                            name: '知识讲解',
                            duration: 20,
                            description: `详细讲解${topic}的核心知识点`,
                            method: '讲授法'
                        },
                        {
                            name: '练习巩固',
                            duration: 10,
                            description: `通过练习题巩固${topic}的理解`,
                            method: '练习法'
                        },
                        {
                            name: '总结提升',
                            duration: 5,
                            description: `总结${topic}的要点，布置作业`,
                            method: '归纳总结'
                        }
                    ],
                    assessment: `通过课堂问答、练习完成情况和课后作业评估学生对${topic}的掌握程度`,
                    homework: `完成教科书第X页练习题，预习下一节课内容`
                };
                break;

            case 'quiz':
                generatedContent = {
                    title: `${gradeLevel}${subject} - ${topic}测验`,
                    questions: [
                        {
                            type: 'multiple_choice',
                            question: `关于${topic}，下列说法正确的是：`,
                            options: [
                                'A. 选项一（示例）',
                                'B. 选项二（示例）',
                                'C. 选项三（示例）',
                                'D. 选项四（示例）'
                            ],
                            correctAnswer: 'A',
                            points: 10,
                            explanation: `${topic}的正确理解应该是...`
                        },
                        {
                            type: 'fill_blank',
                            question: `${topic}的主要特点是______和______。`,
                            correctAnswer: ['特点一', '特点二'],
                            points: 10,
                            explanation: `${topic}具有这些特点是因为...`
                        },
                        {
                            type: 'short_answer',
                            question: `请简述${topic}的实际应用。`,
                            keyWords: ['应用', '实际', '生活'],
                            points: 20,
                            minLength: 100
                        }
                    ],
                    totalPoints: 40,
                    timeLimit: 30
                };
                break;

            case 'courseware':
                generatedContent = {
                    title: `${gradeLevel}${subject} - ${topic}`,
                    slides: [
                        {
                            title: `${topic} - 概述`,
                            content: `今天我们来学习${topic}`,
                            type: 'title_slide'
                        },
                        {
                            title: '学习目标',
                            content: `通过本节课的学习，我们将：\n1. 了解${topic}的基本概念\n2. 掌握${topic}的核心要点\n3. 学会应用${topic}解决问题`,
                            type: 'bullet_points'
                        },
                        {
                            title: `什么是${topic}？`,
                            content: `${topic}是${subject}中的重要概念，它具有以下特点...`,
                            type: 'content_slide'
                        },
                        {
                            title: '重点知识',
                            content: `${topic}的核心要点包括：\n• 要点一\n• 要点二\n• 要点三`,
                            type: 'bullet_points'
                        },
                        {
                            title: '实例分析',
                            content: `让我们通过一个具体例子来理解${topic}...`,
                            type: 'example_slide'
                        },
                        {
                            title: '课堂练习',
                            content: `现在请同学们思考：如何运用${topic}来解决以下问题？`,
                            type: 'interactive_slide'
                        },
                        {
                            title: '总结',
                            content: `今天我们学习了${topic}，主要包括：\n1. 基本概念\n2. 核心要点\n3. 实际应用`,
                            type: 'summary_slide'
                        }
                    ]
                };
                break;

            default:
                throw new Error('不支持的内容类型');
        }

        // 保存生成的内容到数据库
        const contentData = {
            title: generatedContent.title,
            description: `AI生成的${contentType} - ${topic}`,
            subject: subject,
            grade_level: gradeLevel,
            teacher_id: userId,
            content_type: contentType,
            content_data: generatedContent,
            difficulty_level: 3, // 默认中等难度
            ai_generated: true,
            tags: [subject, gradeLevel, topic],
            created_at: new Date().toISOString()
        };

        const saveResponse = await fetch(`${supabaseUrl}/rest/v1/course_contents`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(contentData)
        });

        if (!saveResponse.ok) {
            const errorText = await saveResponse.text();
            console.error('保存内容失败:', errorText);
        }

        const savedContent = saveResponse.ok ? await saveResponse.json() : null;

        return new Response(JSON.stringify({
            data: {
                content: generatedContent,
                contentId: savedContent?.[0]?.id,
                message: '内容生成成功！'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('AI Content Generator error:', error);

        const errorResponse = {
            error: {
                code: 'AI_CONTENT_GENERATION_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});