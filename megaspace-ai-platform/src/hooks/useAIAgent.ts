import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export function useAIAgent() {
  const [loading, setLoading] = useState(false)
  const { session } = useAuth()

  const createAgent = async (agentData: any) => {
    if (!session) {
      throw new Error('用户未登录')
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('advanced-agent-manager', {
        body: {
          action: 'create',
          agentData
        },
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (error) throw error
      return data.data
    } finally {
      setLoading(false)
    }
  }

  const getAgents = async (filters?: any) => {
    if (!session) {
      throw new Error('用户未登录')
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('advanced-agent-manager', {
        body: {
          action: 'get_user_agents',
          filters
        },
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (error) throw error
      return data.data.agents
    } finally {
      setLoading(false)
    }
  }

  const getAgentDetail = async (agentId: string) => {
    if (!session) {
      throw new Error('用户未登录')
    }

    setLoading(true)
    try {
      // 直接通过数据库查询获取Agent详情
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('id', agentId)
        .maybeSingle()

      if (error) throw error
      return data
    } finally {
      setLoading(false)
    }
  }

  const useAgent = async (agentId: string, message: string, sessionId?: string) => {
    if (!session) {
      throw new Error('用户未登录')
    }

    if (!agentId || !message.trim()) {
      throw new Error('Agent ID 和消息内容都是必需的')
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('anthropic-ai-chat', {
        body: {
          agentId,
          message: message.trim(),
          sessionId,
          context: {}
        },
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (error) {
        console.error('AI 助手调用失败:', error)
        throw new Error(error.message || 'AI 服务不可用，请稍后重试')
      }
      
      if (!data?.data) {
        throw new Error('未收到有效的AI响应')
      }
      
      // 返回标准化的响应格式
      return {
        message: data.data.response || '抱歉，暂时无法生成响应。',
        sessionId: data.data.sessionId,
        agentName: data.data.agentName,
        responseTime: data.data.responseTime
      }
    } catch (error: any) {
      console.error('AI Agent 使用异常:', error)
      
      // 提供备用响应
      return {
        message: '抱歉，AI 助手暂时不可用。请稍后重试或联系技术支持。',
        sessionId: sessionId || crypto.randomUUID(),
        agentName: 'AI 助手',
        responseTime: 0,
        error: true
      }
    } finally {
      setLoading(false)
    }
  }

  const updateAgent = async (agentId: string, agentData: any) => {
    if (!session) {
      throw new Error('用户未登录')
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('advanced-agent-manager', {
        body: {
          action: 'update',
          agentId,
          agentData
        },
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (error) throw error
      return data.data
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    createAgent,
    getAgents,
    getAgentDetail,
    useAgent,
    updateAgent
  }
}