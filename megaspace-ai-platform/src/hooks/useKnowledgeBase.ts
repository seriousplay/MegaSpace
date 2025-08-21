import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export function useKnowledgeBase() {
  const [loading, setLoading] = useState(false)
  const { session } = useAuth()

  const createKnowledgeBase = async (knowledgeBaseData: any) => {
    if (!session) {
      throw new Error('用户未登录')
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('knowledge-base-manager', {
        body: {
          action: 'create_knowledge_base',
          knowledgeBaseData
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

  const getKnowledgeBases = async (filters?: any) => {
    if (!session) {
      throw new Error('用户未登录')
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('knowledge-base-manager', {
        body: {
          action: 'get_knowledge_bases',
          filters
        },
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (error) throw error
      return data.data.knowledgeBases
    } finally {
      setLoading(false)
    }
  }

  const getKnowledgeBaseDetail = async (knowledgeBaseId: string) => {
    if (!session) {
      throw new Error('用户未登录')
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('knowledge-base-manager', {
        body: {
          action: 'get_knowledge_base_detail',
          knowledgeBaseId
        },
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (error) throw error
      return data.data.knowledgeBase
    } finally {
      setLoading(false)
    }
  }

  const downloadKnowledgeBase = async (knowledgeBaseId: string) => {
    if (!session) {
      throw new Error('用户未登录')
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('knowledge-base-manager', {
        body: {
          action: 'download_knowledge_base',
          knowledgeBaseId
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

  const updateKnowledgeBase = async (knowledgeBaseId: string, knowledgeBaseData: any) => {
    if (!session) {
      throw new Error('用户未登录')
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('knowledge-base-manager', {
        body: {
          action: 'update_knowledge_base',
          knowledgeBaseId,
          knowledgeBaseData
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
    createKnowledgeBase,
    getKnowledgeBases,
    getKnowledgeBaseDetail,
    downloadKnowledgeBase,
    updateKnowledgeBase
  }
}