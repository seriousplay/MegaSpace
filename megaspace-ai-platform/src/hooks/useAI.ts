import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export function useAI() {
  const [loading, setLoading] = useState(false)
  const { session, userRole } = useAuth()

  const chatWithAI = async (message: string, context?: string, subject?: string) => {
    if (!session || !userRole) {
      throw new Error('用户未登录或角色未确定')
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('anthropic-ai-chat', {
        body: {
          message,
          context,
          userRole: userRole.role,
          subject
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

  const gradeAssignment = async (assignmentId: string, studentAnswers: any[], questions: any[]) => {
    if (!session) {
      throw new Error('用户未登录')
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('ai-homework-grader', {
        body: {
          assignmentId,
          studentAnswers,
          questions
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

  const generateContent = async (
    contentType: string,
    subject: string,
    gradeLevel: string,
    topic: string,
    requirements?: any
  ) => {
    if (!session) {
      throw new Error('用户未登录')
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('ai-content-generator', {
        body: {
          contentType,
          subject,
          gradeLevel,
          topic,
          requirements
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
    chatWithAI,
    gradeAssignment,
    generateContent
  }
}