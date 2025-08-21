import React, { useState } from 'react'
import { useAI } from '@/hooks/useAI'
import { useStudentData } from '@/hooks/useStudentData'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen, 
  Brain, 
  Trophy, 
  Target, 
  Clock, 
  MessageSquare,
  TrendingUp,
  Star,
  Users,
  CheckCircle
} from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export function StudentDashboard() {
  const { chatWithAI, loading } = useAI()
  const { stats, assignments, learningProgress, achievements, loading: dataLoading, error: dataError } = useStudentData()
  const [chatMessage, setChatMessage] = useState('')
  const [aiResponse, setAiResponse] = useState('')

  const handleChat = async () => {
    if (!chatMessage.trim()) return
    
    try {
      const response = await chatWithAI(chatMessage, '学习辅导')
      setAiResponse(response.message)
    } catch (error: any) {
      setAiResponse('抱歉，服务暂时不可用，请稍后重试。')
    }
  }

  const getAchievementIcon = (iconName: string) => {
    switch (iconName) {
      case 'Star': return Star
      case 'Trophy': return Trophy
      case 'Users': return Users
      case 'CheckCircle': return CheckCircle
      default: return Star
    }
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* 欢迎信息 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
        <h1 className="text-2xl font-bold mb-2">欢迎回来！你的学习伙伴正在等待</h1>
        <p className="text-blue-100">今天又是充满可能性的一天，让我们一起探索知识的海洋！</p>
      </div>

      {/* 学习统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">学习时长</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudyTime}h</div>
            <p className="text-xs text-muted-foreground">本学期总计</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">完成作业</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedAssignments}</div>
            <p className="text-xs text-muted-foreground">已提交作业</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均成绩</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageScore}分</div>
            <p className="text-xs text-muted-foreground">比上月提升2分</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">连续学习</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.currentStreak}天</div>
            <p className="text-xs text-muted-foreground">再坚持3天获得勋章</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI 学习助手 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI 学习伙伴
            </CardTitle>
            <CardDescription>
              遇到任何学习问题，都可以问我！
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Textarea
                placeholder="例如：请帮我解释一下二次函数的概念..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                rows={3}
              />
              <Button 
                onClick={handleChat} 
                disabled={loading || !chatMessage.trim()}
                className="w-full"
              >
                {loading ? <LoadingSpinner size="sm" /> : '发问信息'}
              </Button>
            </div>
            
            {aiResponse && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 mb-1">AI 学习伙伴</p>
                    <p className="text-sm text-blue-800 whitespace-pre-wrap">{aiResponse}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 学习进度 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              学习进度
            </CardTitle>
            <CardDescription>
              各学科的学习进度一目了然
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {learningProgress.map((subject) => (
              <div key={subject.subject} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{subject.subject}</span>
                  <span className="text-sm text-muted-foreground">{subject.progress}%</span>
                </div>
                <Progress value={subject.progress} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最近作业 */}
        <Card>
          <CardHeader>
            <CardTitle>最近作业</CardTitle>
            <CardDescription>查看最近的作业完成情况</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{assignment.title}</h4>
                    <p className="text-sm text-muted-foreground">{assignment.subject} • 截止日期: {assignment.dueDate}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {assignment.status === 'completed' && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        已完成 {assignment.score ? `(${assignment.score}分)` : ''}
                      </Badge>
                    )}
                    {assignment.status === 'in_progress' && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        进行中
                      </Badge>
                    )}
                    {assignment.status === 'pending' && (
                      <Badge variant="outline">待完成</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 成就勋章 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              成就勋章
            </CardTitle>
            <CardDescription>你的学习成就和进步历程</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {achievements.map((achievement) => {
                const IconComponent = getAchievementIcon(achievement.icon)
                return (
                  <div 
                    key={achievement.id} 
                    className={`p-4 border rounded-lg text-center ${
                      achievement.earned 
                        ? 'bg-yellow-50 border-yellow-200' 
                        : 'bg-gray-50 border-gray-200 opacity-60'
                    }`}
                  >
                    <IconComponent 
                      className={`h-8 w-8 mx-auto mb-2 ${
                        achievement.earned ? 'text-yellow-600' : 'text-gray-400'
                      }`} 
                    />
                    <h4 className="font-medium text-sm">{achievement.title}</h4>
                    <p className="text-xs text-muted-foreground">{achievement.description}</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}