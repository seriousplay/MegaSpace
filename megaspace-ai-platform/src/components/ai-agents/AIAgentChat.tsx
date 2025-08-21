import React, { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Card, CardContent } from '@/components/ui/card'
import { Send, Bot, User, Clock, AlertCircle } from 'lucide-react'
import { useAIAgent } from '@/hooks/useAIAgent'
import { AIAgent } from './AIAgentCard'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  responseTime?: number
  error?: boolean
}

interface AIAgentChatProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agent: AIAgent | null
}

export function AIAgentChat({ open, onOpenChange, agent }: AIAgentChatProps) {
  const { useAgent, loading } = useAIAgent()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && agent) {
      // 重置聊天状态
      setMessages([])
      setSessionId(null)
      
      // 添加欢迎消息
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: `你好！我是 ${agent.name}，${agent.description || '我是您的AI助手'}。有什么可以帮助您的吗？`,
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
      
      // 聚焦输入框
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [open, agent])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !agent || loading) return

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    
    try {
      const response = await useAgent(agent.id, userMessage.content, sessionId || undefined)
      
      if (!sessionId) {
        setSessionId(response.sessionId)
      }
      
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        responseTime: response.responseTime,
        error: response.error
      }
      
      setMessages(prev => [...prev, assistantMessage])
    } catch (error: any) {
      console.error('发送消息失败:', error)
      
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '抱歉，处理您的消息时发生了错误。请稍后重试。',
        timestamp: new Date(),
        error: true
      }
      
      setMessages(prev => [...prev, errorMessage])
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  if (!agent) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            与 {agent.name} 对话
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {agent.description || '开始与您的AI助手对话'}
          </p>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto pr-4 max-h-[60vh]">
            <div className="space-y-4 p-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}>
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  
                  <Card className={`max-w-[80%] ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : message.error 
                        ? 'bg-red-50 border-red-200' 
                        : 'bg-muted'
                  }`}>
                    <CardContent className="p-3">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </div>
                      
                      <div className={`flex items-center gap-2 mt-2 text-xs ${
                        message.role === 'user' 
                          ? 'text-primary-foreground/70' 
                          : 'text-muted-foreground'
                      }`}>
                        {message.error && (
                          <AlertCircle className="h-3 w-3 text-red-500" />
                        )}
                        <Clock className="h-3 w-3" />
                        <span>{formatTime(message.timestamp)}</span>
                        {message.responseTime && (
                          <span>• 响应时间: {message.responseTime}ms</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
              
              {loading && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <Card className="bg-muted">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <LoadingSpinner size="sm" />
                        <span className="text-sm text-muted-foreground">AI正在思考...</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          <div className="border-t pt-4">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder={`向 ${agent.name} 发送消息...`}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                className="flex-1"
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || loading}
                size="sm"
              >
                {loading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground mt-2 text-center">
              按 Enter 发送消息，Shift + Enter 换行
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}