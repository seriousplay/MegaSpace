import React, { useState, useEffect } from 'react'
import { useAI } from '@/hooks/useAI'
import { useAIAgent } from '@/hooks/useAIAgent'
import { useAuth } from '@/contexts/AuthContext'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BookOpen, Users, ClipboardCheck, BarChart3, Brain, MessageSquare, Plus, Bot } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { AIAgentCard, AIAgent } from '@/components/ai-agents/AIAgentCard'
import { AIAgentForm } from '@/components/ai-agents/AIAgentForm'

export function TeacherDashboard() {
  const { chatWithAI, generateContent, loading } = useAI()
  const { getAgents, useAgent, loading: agentLoading } = useAIAgent()
  const { user } = useAuth()
  const { stats, loading: statsLoading, error: statsError, refreshStats } = useDashboardStats()
  
  const [chatMessage, setChatMessage] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [contentForm, setContentForm] = useState({
    type: '',
    subject: '',
    grade: '',
    topic: ''
  })
  const [generatedContent, setGeneratedContent] = useState<any>(null)
  
  // AI Agents 状态
  const [agents, setAgents] = useState<AIAgent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null)
  const [showAgentForm, setShowAgentForm] = useState(false)
  const [editingAgent, setEditingAgent] = useState<AIAgent | null>(null)
  const [agentChatMessage, setAgentChatMessage] = useState('')
  const [agentChatResponse, setAgentChatResponse] = useState('')

  useEffect(() => {
    loadAgents()
  }, [])

  const loadAgents = async () => {
    try {
      const fetchedAgents = await getAgents()
      setAgents(fetchedAgents || [])
    } catch (error) {
      console.error('加载 AI Agents 失败:', error)
    }
  }

  const handleChat = async () => {
    if (!chatMessage.trim()) return
    
    try {
      const response = await chatWithAI(chatMessage, '教学咨询', contentForm.subject)
      setAiResponse(response.message)
    } catch (error: any) {
      setAiResponse('抱歉，服务暂时不可用，请稍后重试。')
    }
  }

  const handleGenerateContent = async () => {
    if (!contentForm.type || !contentForm.subject || !contentForm.grade || !contentForm.topic) {
      alert('请填写完整信息')
      return
    }
    
    try {
      const content = await generateContent(
        contentForm.type,
        contentForm.subject,
        contentForm.grade,
        contentForm.topic
      )
      setGeneratedContent(content)
    } catch (error: any) {
      alert('内容生成失败，请稍后重试')
    }
  }

  const handleUseAgent = async (agent: AIAgent) => {
    setSelectedAgent(agent)
    setAgentChatResponse('')
  }

  const handleAgentChat = async () => {
    if (!selectedAgent || !agentChatMessage.trim()) return
    
    try {
      const response = await useAgent(selectedAgent.id, agentChatMessage)
      
      // 检查是否有错误
      if (response.error) {
        setAgentChatResponse(`错误: ${response.message}`)
      } else {
        setAgentChatResponse(response.message)
      }
      
      // 清空输入框
      setAgentChatMessage('')
    } catch (error: any) {
      console.error('Agent 聊天失败:', error)
      setAgentChatResponse('抱歉，服务暂时不可用，请稍后重试。')
    }
  }

  const handleEditAgent = (agent: AIAgent) => {
    setEditingAgent(agent)
    setShowAgentForm(true)
  }

  const handleCreateAgent = () => {
    setEditingAgent(null)
    setShowAgentForm(true)
  }

  const handleAgentFormSuccess = () => {
    loadAgents() // 重新加载列表
  }

  return (
    <div className="px-4 sm:px-6 py-6 space-y-8">
      {/* 欢迎信息 */}
      <div className="bg-gradient-to-br from-primary via-blue-500 to-blue-600 text-white p-8 rounded-lg shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-3 tracking-tight">欢迎使用 Mega Space 教师工作台</h1>
          <p className="text-blue-100 text-lg">🤖 AI驱动的教学助手，让教学更高效、更智能</p>
        </div>
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-secondary/20 rounded-full blur-lg"></div>
      </div>

      {/* 功能卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">课程管理</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <LoadingSpinner size="sm" /> : stats.coursesCount}
            </div>
            <p className="text-xs text-muted-foreground">已创建课程</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">学生管理</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <LoadingSpinner size="sm" /> : stats.studentsCount}
            </div>
            <p className="text-xs text-muted-foreground">班级学生</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">作业批改</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <LoadingSpinner size="sm" /> : stats.pendingAssignments}
            </div>
            <p className="text-xs text-muted-foreground">待批改作业</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Agents</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <LoadingSpinner size="sm" /> : stats.aiAgentsCount}
            </div>
            <p className="text-xs text-muted-foreground">我的 AI 助手</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Agents 管理区域 */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">我的 AI Agents</h2>
          <Button onClick={handleCreateAgent}>
            <Plus className="h-4 w-4 mr-2" />
            创建新 Agent
          </Button>
        </div>
        
        {agentLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : agents.length === 0 ? (
          <Card className="p-8 text-center">
            <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">还没有 AI Agent</h3>
            <p className="text-muted-foreground mb-4">创建您的第一个 AI 助手，定制专属的教学工具</p>
            <Button onClick={handleCreateAgent}>
              <Plus className="h-4 w-4 mr-2" />
              创建第一个 Agent
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <AIAgentCard
                key={agent.id}
                agent={agent}
                onEdit={handleEditAgent}
                onUse={handleUseAgent}
                isOwner={agent.creator_id === user?.id}
              />
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI 教学助手 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI 教学助手
            </CardTitle>
            <CardDescription>
              随时向AI助手咨询教学相关问题
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Textarea
                placeholder="请输入您的教学问题..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                rows={3}
              />
              <Button 
                onClick={handleChat} 
                disabled={loading || !chatMessage.trim()}
                className="w-full"
              >
                {loading ? <LoadingSpinner size="sm" /> : '咨询 AI 助手'}
              </Button>
            </div>
            
            {aiResponse && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 mb-1">AI 助手回复</p>
                    <p className="text-sm text-blue-800 whitespace-pre-wrap">{aiResponse}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 专属 Agent 对话 */}
        {selectedAgent && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                {selectedAgent.name}
              </CardTitle>
              <CardDescription>
                {selectedAgent.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  placeholder={`与 ${selectedAgent.name} 对话...`}
                  value={agentChatMessage}
                  onChange={(e) => setAgentChatMessage(e.target.value)}
                  rows={3}
                />
                <Button 
                  onClick={handleAgentChat} 
                  disabled={agentLoading || !agentChatMessage.trim()}
                  className="w-full"
                >
                  {agentLoading ? <LoadingSpinner size="sm" /> : '发送消息'}
                </Button>
              </div>
              
              {agentChatResponse && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Bot className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-900 mb-1">{selectedAgent.name} 回复</p>
                      <p className="text-sm text-green-800 whitespace-pre-wrap">{agentChatResponse}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* AI 内容生成 */}
        {!selectedAgent && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                AI 内容生成
              </CardTitle>
              <CardDescription>
                智能生成课程计划、测验、课件等教学内容
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Select value={contentForm.type} onValueChange={(value) => setContentForm(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="内容类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lesson_plan">课程计划</SelectItem>
                    <SelectItem value="quiz">测验题</SelectItem>
                    <SelectItem value="courseware">课件</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={contentForm.subject} onValueChange={(value) => setContentForm(prev => ({ ...prev, subject: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="学科" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="数学">数学</SelectItem>
                    <SelectItem value="语文">语文</SelectItem>
                    <SelectItem value="英语">英语</SelectItem>
                    <SelectItem value="物理">物理</SelectItem>
                    <SelectItem value="化学">化学</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Select value={contentForm.grade} onValueChange={(value) => setContentForm(prev => ({ ...prev, grade: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="年级" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="七年级">七年级</SelectItem>
                    <SelectItem value="八年级">八年级</SelectItem>
                    <SelectItem value="九年级">九年级</SelectItem>
                    <SelectItem value="高一">高一</SelectItem>
                    <SelectItem value="高二">高二</SelectItem>
                    <SelectItem value="高三">高三</SelectItem>
                  </SelectContent>
                </Select>
                
                <Input
                  placeholder="课程主题"
                  value={contentForm.topic}
                  onChange={(e) => setContentForm(prev => ({ ...prev, topic: e.target.value }))}
                />
              </div>
              
              <Button 
                onClick={handleGenerateContent}
                disabled={loading}
                className="w-full"
              >
                {loading ? <LoadingSpinner size="sm" /> : '生成内容'}
              </Button>
              
              {generatedContent && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-900 mb-2">内容生成成功！</p>
                  <p className="text-sm text-green-800">
                    已生成「{generatedContent.content?.title || '新内容'}」，您可以在课程管理中查看和编辑。
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* AI Agent 创建/编辑对话框 */}
      <AIAgentForm
        open={showAgentForm}
        onOpenChange={setShowAgentForm}
        agent={editingAgent}
        onSuccess={handleAgentFormSuccess}
      />
    </div>
  )
}
