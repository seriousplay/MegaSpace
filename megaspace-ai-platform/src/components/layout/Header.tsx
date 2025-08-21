import React, { useState } from 'react'
import { Bell, Settings, LogOut, User, Globe, Menu, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useNavigate, useLocation } from 'react-router-dom'

interface HeaderProps {
  title?: string
}

export function Header({ title }: HeaderProps) {
  const { user, userRole, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('登出失败:', error)
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'teacher': return '教师'
      case 'student': return '学生'
      case 'parent': return '家长'
      default: return '用户'
    }
  }

  return (
    <>
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-100 sticky top-0 z-50">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-gradient-to-r from-primary to-blue-600 rounded-lg px-3 py-2 shadow-md">
                <img 
                  src="/images/megaspace_horizontal_logo.png" 
                  alt="Mega Space" 
                  className="h-6 filter brightness-0 invert"
                />
              </div>
              {title && (
                <>
                  <div className="w-px h-6 bg-gradient-to-b from-transparent via-gray-300 to-transparent" />
                  <h1 className="text-xl font-bold text-gray-800 tracking-tight">{title}</h1>
                </>
              )}
            </div>

            {/* 主导航菜单 - 桌面端 */}
            <nav className="hidden md:flex items-center space-x-2 bg-gray-50/50 rounded-lg p-1">
              <Button 
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className={`rounded-lg px-4 py-2 font-medium transition-all duration-200 ${
                  location.pathname === '/dashboard' 
                    ? 'bg-primary text-white shadow-md hover:bg-primary/90' 
                    : 'text-gray-600 hover:text-primary hover:bg-white hover:shadow-sm'
                }`}
              >
                工作台
              </Button>
              <Button 
                variant="ghost"
                onClick={() => navigate('/public-space')}
                className={`rounded-lg px-4 py-2 font-medium transition-all duration-200 flex items-center gap-2 ${
                  location.pathname === '/public-space' 
                    ? 'bg-primary text-white shadow-md hover:bg-primary/90' 
                    : 'text-gray-600 hover:text-primary hover:bg-white hover:shadow-sm'
                }`}
              >
                <Globe className="h-4 w-4" />
                公共空间
              </Button>
            </nav>

            <div className="flex items-center space-x-3">
              {/* 移动端菜单按钮 */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="md:hidden bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5 text-gray-600" /> : <Menu className="h-5 w-5 text-gray-600" />}
              </Button>

              {/* 通知铃铛 */}
              <Button variant="ghost" size="sm" className="relative hidden md:flex bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-secondary rounded-full text-xs flex items-center justify-center text-white font-medium animate-pulse">
                  3
                </span>
              </Button>

              {/* 用户菜单 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative rounded-lg hover:bg-gray-100 transition-colors p-1">
                    <Avatar className="h-8 w-8 ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
                      <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.user_metadata?.full_name} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-white font-semibold">
                        {user?.user_metadata?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 rounded-lg shadow-xl border-0 bg-white/95 backdrop-blur-md" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal p-4">
                    <div className="flex flex-col space-y-2">
                      <p className="text-sm font-semibold leading-none text-gray-800">
                        {user?.user_metadata?.full_name || '未知用户'}
                      </p>
                      <p className="text-xs leading-none text-gray-500">
                        {user?.email}
                      </p>
                      {userRole && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {getRoleText(userRole.role)}
                        </span>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-100" />
                  <DropdownMenuItem className="rounded-lg mx-2 my-1 hover:bg-gray-50 transition-colors">
                    <User className="mr-3 h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">个人资料</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-lg mx-2 my-1 hover:bg-gray-50 transition-colors">
                    <Settings className="mr-3 h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">设置</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-100 mx-2" />
                  <DropdownMenuItem onClick={handleSignOut} className="rounded-lg mx-2 my-1 hover:bg-red-50 text-red-600 transition-colors">
                    <LogOut className="mr-3 h-4 w-4" />
                    <span>退出登录</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* 移动端导航菜单 */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xl">
          <nav className="px-4 py-4 space-y-2">
            <Button 
              variant="ghost"
              onClick={() => {
                navigate('/dashboard')
                setMobileMenuOpen(false)
              }}
              className={`w-full justify-start rounded-lg font-medium transition-all duration-200 ${
                location.pathname === '/dashboard' 
                  ? 'bg-primary text-white shadow-md' 
                  : 'text-gray-600 hover:text-primary hover:bg-gray-50'
              }`}
            >
              工作台
            </Button>
            <Button 
              variant="ghost"
              onClick={() => {
                navigate('/public-space')
                setMobileMenuOpen(false)
              }}
              className={`w-full justify-start flex items-center gap-3 rounded-lg font-medium transition-all duration-200 ${
                location.pathname === '/public-space' 
                  ? 'bg-primary text-white shadow-md' 
                  : 'text-gray-600 hover:text-primary hover:bg-gray-50'
              }`}
            >
              <Globe className="h-4 w-4" />
              公共空间
            </Button>
            <div className="pt-3 mt-3 border-t border-gray-100">
              <Button variant="ghost" className="w-full justify-start text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg">
                <Bell className="h-4 w-4 mr-3" />
                通知
                <span className="ml-auto bg-secondary text-white text-xs px-2 py-0.5 rounded-full font-medium">
                  3
                </span>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </>
  )
}