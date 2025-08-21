import React, { useState } from 'react'
import { useAI } from '@/hooks/useAI'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  MessageCircle, 
  TrendingUp, 
  Calendar, 
  Bell,
  BookOpen,
  BarChart3,
  Clock,
  Target,
  MessageSquare,
  Heart
} from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export function ParentDashboard() {
  const { chatWithAI, loading } = useAI()
  const [chatMessage, setChatMessage] = useState('')
  const [aiResponse, setAiResponse] = useState('')

  const handleChat = async () => {
    if (!chatMessage.trim()) return
    
    try {
      const response = await chatWithAI(chatMessage, '家庭教育咨询')
      setAiResponse(response.message)
    } catch (error: any) {
      setAiResponse('抱歉，服务暂时不可用，请稍后重试。')
    }
  }

  // 模拟数据 - 孩子信息
  const childrenInfo = [
    {
      id: 1,
      name: '张小明',
      grade: '八年级',
      class: '3班',
      recentScore: 87,
      studyTime: 6.5, // 小时/日
      status: 'good'
    }
  ]

  // 本周学习数据
  const weeklyData = {
    totalStudyTime: 32, // 小时
    completedAssignments: 12,
    averageScore: 85,
    improvement: 3 // 百分比
  }

  // 学科表现
  const subjectPerformance = [
    { subject: '数学', score: 92, trend: 'up', color: 'bg-blue-500' },
    { subject: '语文', score: 85, trend: 'stable', color: 'bg-green-500' },
    { subject: '英语', score: 88, trend: 'up', color: 'bg-purple-500' },
    { subject: '物理', score: 78, trend: 'down', color: 'bg-orange-500' },
    { subject: '化学', score: 83, trend: 'up', color: 'bg-pink-500' }
  ]

  // 最近消息
  const recentMessages = [
    {
      id: 1,
      from: '王老师 (数学)',
      subject: '本周学习表现反馈',
      preview: '张小明本周在数学课上表现出色，特别是在二次函数的学习中...',
      time: '2小时前',
      isRead: false
    },
    {
      id: 2,
      from: '班主任老师',
      subject: '家长会通知',
      preview: '您好，本学期期中家长会定于8月28日下午3点举行...',
      time: '1天前',
      isRead: true
    },
    {
      id: 3,
      from: '学校通知',
      subject: '运动会活动安排',
      preview: '亲爱的家长，学校秋季运动会将于9月5日举行...',
      time: '2天前',
      isRead: true
    }
  ]

  // 家庭教育建议
  const educationTips = [
    {
      title: '鼓励孩子独立思考',
      content: '当孩子遇到困难时，先鼓励他们自己思考解决方案，再提供必要的帮助。',
      category: '学习方法'
    },
    {
      title: '保持良好作息',
      content: '确保孩子每天有8-9小时的充足睡眠，有助于记忆巩固和大脑发育。',
      category: '生活习惯'
    },
    {
      title: '适度表扬和认可',
      content: '及时表扬孩子的努力和进步，建立积极的学习态度和自信心。',
      category: '心理建设'
    }
  ]

  return (
    <div className="p-6 space-y-6">
      {/* 欢迎信息 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
        <h1 className="text-2xl font-bold mb-2">家长中心 - 关爱孩子成长</h1>
        <p className="text-blue-100">实时了解孩子的学习情况，与学校保持良好沟通</p>
      </div>

      {/* 孩子信息卡片 */}
      <div className="grid grid-cols-1 gap-6">
        {childrenInfo.map((child) => (
          <Card key={child.id} className="">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {child.name}
                  </CardTitle>
                  <CardDescription>{child.grade} {child.class}</CardDescription>
                </div>
                <Badge 
                  variant={child.status === 'good' ? 'secondary' : 'destructive'}
                  className={child.status === 'good' ? 'bg-green-100 text-green-800' : ''}
                >
                  {child.status === 'good' ? '表现良好' : '需要关注'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{child.recentScore}</div>
                  <div className="text-sm text-muted-foreground">最近平均分</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{child.studyTime}h</div>
                  <div className="text-sm text-muted-foreground">日均学习时长</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{weeklyData.completedAssignments}</div>
                  <div className="text-sm text-muted-foreground">本周完成作业</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">+{weeklyData.improvement}%</div>
                  <div className="text-sm text-muted-foreground">本周提升</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 家庭教育顾问 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              家庭教育顾问
            </CardTitle>
            <CardDescription>
              专业的教育指导，帮助您更好地陪伴孩子成长
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Textarea
                placeholder="例如：孩子最近对数学不太感兴趣，怎么办？"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                rows={3}
              />
              <Button 
                onClick={handleChat} 
                disabled={loading || !chatMessage.trim()}
                className="w-full"
              >
                {loading ? <LoadingSpinner size="sm" /> : '咨询教育专家'}
              </Button>
            </div>
            
            {aiResponse && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 mb-1">教育专家</p>
                    <p className="text-sm text-blue-800 whitespace-pre-wrap">{aiResponse}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 学科表现 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              学科表现
            </CardTitle>
            <CardDescription>各学科的最近成绩和趋势</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subjectPerformance.map((subject) => (
                <div key={subject.subject} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${subject.color}`} />
                    <span className="font-medium">{subject.subject}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{subject.score}分</span>
                    <TrendingUp 
                      className={`h-4 w-4 ${
                        subject.trend === 'up' ? 'text-green-500' : 
                        subject.trend === 'down' ? 'text-red-500 rotate-180' : 
                        'text-gray-400'
                      }`} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最近消息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              最近消息
            </CardTitle>
            <CardDescription>来自老师和学校的消息</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentMessages.map((message) => (
                <div 
                  key={message.id} 
                  className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                    !message.isRead ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{message.from}</span>
                      {!message.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{message.time}</span>
                  </div>
                  <h4 className="font-medium text-sm mb-1">{message.subject}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">{message.preview}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 家庭教育建议 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              教育建议
            </CardTitle>
            <CardDescription>专业的家庭教育指导</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {educationTips.map((tip, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">{tip.category}</Badge>
                  </div>
                  <h4 className="font-medium text-sm mb-1">{tip.title}</h4>
                  <p className="text-sm text-muted-foreground">{tip.content}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}