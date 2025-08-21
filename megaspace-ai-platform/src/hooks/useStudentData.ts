import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface StudentStats {
  totalStudyTime: number
  completedAssignments: number
  averageScore: number
  currentStreak: number
}

export interface Assignment {
  id: string
  title: string
  subject: string
  dueDate: string
  status: 'completed' | 'in_progress' | 'pending'
  score?: number
  assignment_type: string
  description?: string
}

export interface LearningProgress {
  subject: string
  progress: number
  color: string
}

export interface Achievement {
  id: number
  title: string
  description: string
  icon: string
  earned: boolean
}

export function useStudentData() {
  const [stats, setStats] = useState<StudentStats>({
    totalStudyTime: 0,
    completedAssignments: 0,
    averageScore: 0,
    currentStreak: 0
  })
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [learningProgress, setLearningProgress] = useState<LearningProgress[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, userRole } = useAuth()

  useEffect(() => {
    if (user && userRole?.role === 'student') {
      loadStudentData()
    }
  }, [user, userRole])

  const loadStudentData = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      await Promise.all([
        loadStudentStats(),
        loadAssignments(),
        loadLearningProgress(),
        loadAchievements()
      ])
    } catch (err: any) {
      setError('加载学生数据失败')
      console.error('Student data error:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadStudentStats = async () => {
    try {
      // 获取学生的作业提交数据
      const { data: submissions, error: submissionsError } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('student_id', user!.id)

      if (submissionsError) throw submissionsError

      const completedCount = submissions?.filter(s => s.submitted_at).length || 0
      const totalScore = submissions?.reduce((sum, s) => sum + (s.score || 0), 0) || 0
      const averageScore = submissions?.length ? Math.round(totalScore / submissions.length) : 0

      // 模拟数据（可以后续扩展）
      setStats({
        totalStudyTime: Math.floor(Math.random() * 50) + 100, // 100-150小时
        completedAssignments: completedCount,
        averageScore: averageScore || Math.floor(Math.random() * 20) + 80, // 80-100分
        currentStreak: Math.floor(Math.random() * 10) + 5 // 5-15天
      })
    } catch (error) {
      console.error('Error loading student stats:', error)
    }
  }

  const loadAssignments = async () => {
    try {
      // 获取学生的作业列表
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          *,
          assignment_submissions (
            id,
            submitted_at,
            score,
            grading_status
          )
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(5)

      if (assignmentsError) throw assignmentsError

      const formattedAssignments: Assignment[] = (assignmentsData || []).map(assignment => {
        const submission = assignment.assignment_submissions?.[0]
        let status: 'completed' | 'in_progress' | 'pending' = 'pending'
        
        if (submission) {
          if (submission.submitted_at) {
            status = 'completed'
          } else {
            status = 'in_progress'
          }
        }

        return {
          id: assignment.id,
          title: assignment.title,
          subject: '学科',
          dueDate: assignment.due_date || '2025-08-20',
          status,
          score: submission?.score,
          assignment_type: assignment.assignment_type,
          description: assignment.description
        }
      })

      setAssignments(formattedAssignments)
    } catch (error) {
      console.error('Error loading assignments:', error)
      // 设置默认数据
      setAssignments([
        { id: '1', title: '数学作业 - 二次函数', subject: '数学', dueDate: '2025-08-18', status: 'completed', score: 92, assignment_type: 'homework' },
        { id: '2', title: '英语阅读理解', subject: '英语', dueDate: '2025-08-20', status: 'in_progress', assignment_type: 'homework' },
        { id: '3', title: '物理实验报告', subject: '物理', dueDate: '2025-08-22', status: 'pending', assignment_type: 'project' }
      ])
    }
  }

  const loadLearningProgress = async () => {
    try {
      // 获取学生的学习分析数据
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('student_analytics')
        .select('*')
        .eq('student_id', user!.id)

      if (analyticsError) throw analyticsError

      if (analyticsData && analyticsData.length > 0) {
        const progressData: LearningProgress[] = analyticsData.map((item, index) => {
          const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500']
          return {
            subject: item.subject,
            progress: Math.round(item.learning_progress * 100),
            color: colors[index % colors.length]
          }
        })
        setLearningProgress(progressData)
      } else {
        // 默认数据
        setLearningProgress([
          { subject: '数学', progress: 85, color: 'bg-blue-500' },
          { subject: '语文', progress: 78, color: 'bg-green-500' },
          { subject: '英语', progress: 82, color: 'bg-purple-500' },
          { subject: '物理', progress: 76, color: 'bg-orange-500' },
          { subject: '化学', progress: 79, color: 'bg-pink-500' }
        ])
      }
    } catch (error) {
      console.error('Error loading learning progress:', error)
    }
  }

  const loadAchievements = async () => {
    // 模拟成就数据（可以后续从数据库加载）
    setAchievements([
      { id: 1, title: '学习之星', description: '连续学习10天', icon: 'Star', earned: true },
      { id: 2, title: '数学大师', description: '数学成绩达到A+', icon: 'Trophy', earned: true },
      { id: 3, title: '团队合作', description: '参与5次小组项目', icon: 'Users', earned: false },
      { id: 4, title: '完美主义', description: '连续5次作业满分', icon: 'CheckCircle', earned: false }
    ])
  }

  return {
    stats,
    assignments,
    learningProgress,
    achievements,
    loading,
    error,
    refreshData: loadStudentData
  }
}
