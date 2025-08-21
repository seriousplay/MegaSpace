import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export function useOrganization() {
  const [loading, setLoading] = useState(false)
  const { session } = useAuth()

  const createOrganization = async (organizationData: any) => {
    if (!session) {
      throw new Error('用户未登录')
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('organization-manager', {
        body: {
          action: 'create_organization',
          organizationData
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

  const getUserOrganizations = async () => {
    if (!session) {
      console.warn('用户未登录，返回空组织列表')
      return []
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('organization-manager', {
        body: {
          action: 'get_user_organizations'
        },
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (error) {
        console.error('获取组织列表失败:', error)
        return []
      }
      
      return data?.data?.organizations || []
    } catch (error) {
      console.error('获取组织列表异常:', error)
      return []
    } finally {
      setLoading(false)
    }
  }

  const manageMembership = async (targetUserId: string, organizationId: string, role: string, status: string = 'active') => {
    if (!session) {
      throw new Error('用户未登录')
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('organization-manager', {
        body: {
          action: 'manage_membership',
          organizationData: {
            targetUserId,
            organizationId,
            role,
            status
          }
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

  const updateOrganization = async (organizationId: string, organizationData: any) => {
    if (!session) {
      throw new Error('用户未登录')
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('organization-manager', {
        body: {
          action: 'update_organization',
          organizationId,
          organizationData
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
    createOrganization,
    getUserOrganizations,
    manageMembership,
    updateOrganization
  }
}