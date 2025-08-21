import { createClient } from '@supabase/supabase-js'

// Supabase配置 - 使用正确的项目配置
const supabaseUrl = 'https://oiygvkltvbnionptogcs.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9peWd2a2x0dmJuaW9ucHRvZ2NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MDE1NDMsImV4cCI6MjA3MDk3NzU0M30.qfJxoLKuPvGfzD3AWQ_Tv15XmDuOdbZPn574ixymO5w'

// 验证配置是否存在
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase配置缺失。请确保设置了VITE_SUPABASE_URL和VITE_SUPABASE_ANON_KEY环境变量。'
  )
}

// 创建Supabase客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// 数据库类型定义
export interface Profile {
  id: string
  full_name: string
  avatar_url?: string
  phone?: string
  bio?: string
  created_at: string
  updated_at: string
}

export interface UserRole {
  id: string
  user_id: string
  role: 'teacher' | 'student' | 'parent'
  school_id?: string
  class_id?: string
  grade_level?: string
  subject_specialization?: string[]
  is_active: boolean
  created_at: string
}

export interface CourseContent {
  id: string
  title: string
  description?: string
  subject: string
  grade_level: string
  teacher_id: string
  class_id?: string
  content_type: 'lesson' | 'courseware' | 'video' | 'document'
  content_data: any
  difficulty_level: number
  ai_generated: boolean
  tags: string[]
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface Assignment {
  id: string
  title: string
  description?: string
  course_content_id?: string
  teacher_id: string
  class_id?: string
  assignment_type: 'homework' | 'quiz' | 'exam' | 'project'
  questions: any
  due_date?: string
  total_points: number
  is_published: boolean
  ai_generated: boolean
  created_at: string
}

export interface AssignmentSubmission {
  id: string
  assignment_id: string
  student_id: string
  answers: any
  submitted_at?: string
  score?: number
  ai_feedback?: any
  teacher_feedback?: string
  grading_status: 'pending' | 'ai_graded' | 'teacher_reviewed' | 'final'
  created_at: string
}

export interface StudentAnalytics {
  id: string
  student_id: string
  subject: string
  knowledge_points: any
  mastery_level: any
  learning_progress: number
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  last_updated: string
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  subject: string
  content: string
  message_type: 'announcement' | 'private_message' | 'feedback' | 'progress_report'
  is_read: boolean
  attachment_urls: string[]
  parent_message_id?: string
  created_at: string
}

export interface Notification {
  id: string
  title: string
  content: string
  sender_id: string
  target_audience: 'all' | 'teachers' | 'students' | 'parents' | 'class'
  target_class_id?: string
  priority_level: 'low' | 'medium' | 'high' | 'urgent'
  is_published: boolean
  scheduled_at?: string
  expires_at?: string
  created_at: string
}

// Supabase连接测试函数
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true })
    
    if (error) {
      console.error('Supabase连接测试失败:', error)
      return false
    }
    
    console.log('Supabase连接测试成功')
    return true
  } catch (error) {
    console.error('Supabase连接异常:', error)
    return false
  }
}
