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
        const { assignmentId, studentAnswers, questions } = await req.json();

        if (!assignmentId || !studentAnswers || !questions) {
            throw new Error('作业ID、学生答案和题目信息不能为空');
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

        // AI批改逻辑
        const gradingResults = [];
        let totalScore = 0;
        let maxScore = 0;

        for (let i = 0; i < questions.length; i++) {
            const question = questions[i];
            const studentAnswer = studentAnswers[i] || '';
            
            let score = 0;
            let feedback = '';
            let isCorrect = false;

            // 根据题目类型进行批改
            switch (question.type) {
                case 'multiple_choice':
                    isCorrect = studentAnswer === question.correctAnswer;
                    score = isCorrect ? question.points : 0;
                    feedback = isCorrect ? '回答正确！' : `正确答案是：${question.correctAnswer}。${question.explanation || ''}`;
                    break;
                    
                case 'fill_blank':
                    const correctAnswers = Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer];
                    isCorrect = correctAnswers.some(answer => 
                        studentAnswer.toLowerCase().trim() === answer.toLowerCase().trim()
                    );
                    score = isCorrect ? question.points : 0;
                    feedback = isCorrect ? '回答正确！' : `参考答案：${correctAnswers.join(' 或 ')}。${question.explanation || ''}`;
                    break;
                    
                case 'short_answer':
                case 'essay':
                    // 简化的文本分析评分
                    const keyWords = question.keyWords || [];
                    let keyWordMatches = 0;
                    keyWords.forEach(word => {
                        if (studentAnswer.toLowerCase().includes(word.toLowerCase())) {
                            keyWordMatches++;
                        }
                    });
                    
                    const completeness = Math.min(studentAnswer.length / (question.minLength || 50), 1);
                    const keyWordScore = keyWords.length > 0 ? keyWordMatches / keyWords.length : 0.8;
                    
                    score = Math.round(question.points * (completeness * 0.4 + keyWordScore * 0.6));
                    
                    if (score >= question.points * 0.8) {
                        feedback = '回答很好！涵盖了主要知识点。';
                    } else if (score >= question.points * 0.6) {
                        feedback = '回答基本正确，但可以更详细一些。';
                    } else {
                        feedback = '回答不够完整，建议重新思考并补充关键内容。';
                    }
                    
                    if (keyWords.length > 0) {
                        const missedKeyWords = keyWords.filter(word => 
                            !studentAnswer.toLowerCase().includes(word.toLowerCase())
                        );
                        if (missedKeyWords.length > 0) {
                            feedback += ` 建议包含以下关键词：${missedKeyWords.join('、')}。`;
                        }
                    }
                    break;
                    
                default:
                    score = question.points * 0.5; // 默认给一半分数
                    feedback = '此题需要人工批改。';
            }
            
            gradingResults.push({
                questionIndex: i,
                score: score,
                maxScore: question.points,
                isCorrect: isCorrect,
                feedback: feedback,
                studentAnswer: studentAnswer
            });
            
            totalScore += score;
            maxScore += question.points;
        }

        // 生成总体反馈
        const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
        let overallFeedback = '';
        
        if (percentage >= 90) {
            overallFeedback = '优秀！您掌握得很好，继续保持！';
        } else if (percentage >= 80) {
            overallFeedback = '良好！大部分内容掌握得不错，个别地方需要加强。';
        } else if (percentage >= 70) {
            overallFeedback = '及格！基础知识掌握得可以，但还需要进一步巩固。';
        } else if (percentage >= 60) {
            overallFeedback = '需要努力！建议回顾相关知识点，多做练习。';
        } else {
            overallFeedback = '需要加强！建议系统性地复习相关内容，寻求老师或同学的帮助。';
        }

        const gradingResult = {
            totalScore: totalScore,
            maxScore: maxScore,
            percentage: Math.round(percentage),
            overallFeedback: overallFeedback,
            gradingDetails: gradingResults,
            gradedAt: new Date().toISOString()
        };

        // 更新作业提交记录
        await fetch(`${supabaseUrl}/rest/v1/assignment_submissions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                assignment_id: assignmentId,
                student_id: userId,
                answers: studentAnswers,
                submitted_at: new Date().toISOString(),
                score: totalScore,
                ai_feedback: gradingResult,
                grading_status: 'ai_graded'
            })
        });

        return new Response(JSON.stringify({
            data: gradingResult
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('AI Homework Grader error:', error);

        const errorResponse = {
            error: {
                code: 'AI_GRADING_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});