import React, { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Header } from '@/components/layout/Header'
import { TeacherDashboard } from './TeacherDashboard'
import { StudentDashboard } from './StudentDashboard'
import { ParentDashboard } from './ParentDashboard'
import { PageLoading } from '@/components/ui/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

export function Dashboard() {
  const { userRole, loading, user, refreshUserRole } = useAuth()

  // 自动修复未设置角色的用户
  useEffect(() => {
    const autoFixUserRole = async () => {
      if (user && !loading && !userRole) {
        try {
          // 尝试创建默认的teacher角色
          const { error } = await supabase
            .from('user_roles')
            .upsert({
              user_id: user.id,
              role: 'teacher',
              is_active: true
            }, {
              onConflict: 'user_id'
            })
          
          if (!error) {
            // 成功创建后刷新角色信息
            await refreshUserRole()
          }
        } catch (error) {
          console.error('自动修复用户角色失败:', error)
        }
      }
    }

    autoFixUserRole()
  }, [user, loading, userRole, refreshUserRole])

  const handleSetRole = async (role: 'teacher' | 'student' | 'parent') => {
    if (!user) return
    
    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: user.id,
          role: role,
          is_active: true
        }, {
          onConflict: 'user_id'
        })
      
      if (error) {
        throw error
      }
      
      // 刷新角色信息
      await refreshUserRole()
    } catch (error) {
      console.error('设置用户角色失败:', error)
      alert('设置角色失败，请稍后重试')
    }
  }

  if (loading) {
    return <PageLoading />
  }

  if (!userRole) {
    return (
      <>
        <Header title="控制面板" />
        <div className="flex items-center justify-center py-20">
          <div className="text-center bg-white/80 backdrop-blur-md rounded-lg shadow-lg p-8 mx-4 max-w-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">选择您的角色</h2>
            <p className="text-gray-600 mb-6">请选择您在平台上的角色，以便为您提供个性化的体验</p>
            
            <div className="space-y-3">
              <Button 
                onClick={() => handleSetRole('teacher')}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                📚 教师 - 创建和管理课程、AI Agent
              </Button>
              
              <Button 
                onClick={() => handleSetRole('student')}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                📚 学生 - 学习和使用教学工具
              </Button>
              
              <Button 
                onClick={() => handleSetRole('parent')}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                👨‍👩‍👧 家长 - 关注孩子的学习进展
              </Button>
            </div>
            
            <p className="text-sm text-gray-500 mt-4">
              您可以在设置中随时更改角色
            </p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header title="控制面板" />
      
      <main className="pb-8">
        {userRole.role === 'teacher' && <TeacherDashboard />}
        {userRole.role === 'student' && <StudentDashboard />}
        {userRole.role === 'parent' && <ParentDashboard />}
      </main>
    </>
  )
}