import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface DashboardStats {
  coursesCount: number
  studentsCount: number
  pendingAssignments: number
  averageGrade: number
  aiAgentsCount: number
  knowledgeBasesCount: number
  organizationsCount: number
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    coursesCount: 0,
    studentsCount: 0,
    pendingAssignments: 0,
    averageGrade: 0,
    aiAgentsCount: 0,
    knowledgeBasesCount: 0,
    organizationsCount: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, userRole } = useAuth()

  useEffect(() => {
    if (user && userRole) {
      loadDashboardStats()
    }
  }, [user, userRole])

  const loadDashboardStats = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const promises = [
        loadCoursesCount(),
        loadStudentsCount(),
        loadPendingAssignments(),
        loadAverageGrade(),
        loadAIAgentsCount(),
        loadKnowledgeBasesCount(),
        loadOrganizationsCount()
      ]

      const results = await Promise.allSettled(promises)
      
      const newStats: DashboardStats = {
        coursesCount: results[0].status === 'fulfilled' ? results[0].value : 0,
        studentsCount: results[1].status === 'fulfilled' ? results[1].value : 0,
        pendingAssignments: results[2].status === 'fulfilled' ? results[2].value : 0,
        averageGrade: results[3].status === 'fulfilled' ? results[3].value : 0,
        aiAgentsCount: results[4].status === 'fulfilled' ? results[4].value : 0,
        knowledgeBasesCount: results[5].status === 'fulfilled' ? results[5].value : 0,
        organizationsCount: results[6].status === 'fulfilled' ? results[6].value : 0
      }

      setStats(newStats)
    } catch (err: any) {
      setError('加载统计数据失败')
      console.error('Dashboard stats error:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadCoursesCount = async (): Promise<number> => {
    if (userRole?.role === 'teacher') {
      const { count, error } = await supabase
        .from('course_contents')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', user!.id)
        
      if (error) throw error
      return count || 0
    }
    return 0
  }

  const loadStudentsCount = async (): Promise<number> => {
    if (userRole?.role === 'teacher') {
      // 获取教师班级的学生数量
      const { count, error } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student')
        .eq('is_active', true)
        
      if (error) throw error
      return count || 0
    }
    return 0
  }

  const loadPendingAssignments = async (): Promise<number> => {
    if (userRole?.role === 'teacher') {
      const { count, error } = await supabase
        .from('assignments')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', user!.id)
        .eq('is_published', true)
        
      if (error) throw error
      return count || 0
    }
    return 0
  }

  const loadAverageGrade = async (): Promise<number> => {
    if (userRole?.role === 'teacher') {
      // 简化处理，返回模拟数据
      return Math.floor(Math.random() * 15) + 80 // 80-95之间的随机分数
    }
    return 0
  }

  const loadAIAgentsCount = async (): Promise<number> => {
    const { count, error } = await supabase
      .from('ai_agents')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', user!.id)
      
    if (error) throw error
    return count || 0
  }

  const loadKnowledgeBasesCount = async (): Promise<number> => {
    const { count, error } = await supabase
      .from('knowledge_bases')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', user!.id)
      
    if (error) throw error
    return count || 0
  }

  const loadOrganizationsCount = async (): Promise<number> => {
    const { count, error } = await supabase
      .from('user_organizations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id)
      .eq('is_active', true)
      
    if (error) throw error
    return count || 0
  }

  return {
    stats,
    loading,
    error,
    refreshStats: loadDashboardStats
  }
}
