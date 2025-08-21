import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { UserRole } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  userRole: UserRole | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string, fullName: string, role: string) => Promise<any>
  signOut: () => Promise<void>
  refreshUserRole: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 获取初始会话
    async function getInitialSession() {
      setLoading(true)
      try {
        // 添加超时机制
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 10000)
        )
        
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any
        setSession(session)
        setUser(session?.user || null)
        
        if (session?.user) {
          await fetchUserRole(session.user.id)
        }
      } catch (error) {
        console.error('获取初始会话失败:', error)
        // 即使失败也要设置loading为false，避免无限loading
        setSession(null)
        setUser(null)
        setUserRole(null)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user || null)
        
        if (session?.user) {
          await fetchUserRole(session.user.id)
        } else {
          setUserRole(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserRole = async (userId: string) => {
    try {
      // 添加超时机制的数据库查询
      const rolePromise = supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .maybeSingle()
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Role fetch timeout')), 5000)
      )
      
      const { data, error } = await Promise.race([rolePromise, timeoutPromise]) as any

      if (error && error.code !== 'PGRST116') {
        console.error('获取用户角色失败:', error)
        // 即使失败也要设置为null，而不是不设置
        setUserRole(null)
        return
      }

      setUserRole(data)
    } catch (error) {
      console.error('获取用户角色异常:', error)
      // 发生异常时设置为null，避免无限等待
      setUserRole(null)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    return data
  }

  const signUp = async (email: string, password: string, fullName: string, role: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role
        }
      }
    })
    
    if (error) throw error
    
    // 如果注册成功且用户已确认（或者启用了自动确认），立即创建用户资料和角色
    if (data.user) {
      // 等待一小段时间确保用户记录完全创建
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      try {
        // 使用Edge Function创建用户资料和角色，确保一致性
        const { data: setupData, error: setupError } = await supabase.functions.invoke('setup-user-profile', {
          body: {
            userId: data.user.id,
            fullName: fullName,
            role: role
          }
        })
        
        if (setupError) {
          console.error('用户设置失败:', setupError)
          // 尝试直接创建
          await createUserProfileDirectly(data.user.id, fullName, role)
        }
      } catch (postRegError) {
        console.error('注册后续操作失败:', postRegError)
        // 尝试直接创建
        await createUserProfileDirectly(data.user.id, fullName, role)
      }
    }
    
    return data
  }

  const createUserProfileDirectly = async (userId: string, fullName: string, role: string) => {
    try {
      // 创建用户资料
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          full_name: fullName
        }, {
          onConflict: 'id'
        })
      
      if (profileError) {
        console.error('创建用户资料失败:', profileError)
      }
      
      // 创建用户角色
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: role as 'teacher' | 'student' | 'parent',
          is_active: true
        }, {
          onConflict: 'user_id'
        })
      
      if (roleError) {
        console.error('创建用户角色失败:', roleError)
      } else {
        // 成功创建角色后，立即刷新角色信息
        await fetchUserRole(userId)
      }
    } catch (error) {
      console.error('直接创建用户资料和角色失败:', error)
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const refreshUserRole = async () => {
    if (user) {
      await fetchUserRole(user.id)
    }
  }

  const value = {
    user,
    session,
    userRole,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUserRole
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}