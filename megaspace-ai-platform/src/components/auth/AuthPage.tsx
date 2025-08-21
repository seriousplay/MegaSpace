import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, CheckCircle } from 'lucide-react'

export function AuthPage() {
  const { signIn, signUp, loading } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: ''
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSubmitting(true)

    try {
      // 邮箱格式预验证
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        throw new Error('请输入有效的邮箱地址格式')
      }

      if (isLogin) {
        await signIn(formData.email, formData.password)
        setSuccess('登录成功！正在跳转...')
      } else {
        // 注册验证
        if (!formData.fullName || !formData.role) {
          throw new Error('请填写完整信息')
        }
        
        // 密码强度验证
        if (formData.password.length < 6) {
          throw new Error('密码长度至少需要6位字符')
        }
        
        // 确认密码验证
        if (formData.password !== formData.confirmPassword) {
          throw new Error('两次输入的密码不一致，请重新输入')
        }
        
        await signUp(formData.email, formData.password, formData.fullName, formData.role)
        setSuccess('注册成功！请检查您的邮箱以验证账户。')
        
        // 清空表单
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          fullName: '',
          role: ''
        })
      }
    } catch (err: any) {
      // 改进错误信息提示
      let errorMessage = err.message || '操作失败，请重试'
      
      // 针对常见错误的友好提示
      if (errorMessage.includes('Invalid email') || errorMessage.includes('email_address_invalid')) {
        errorMessage = '邮箱格式不正确，请使用有效的邮箱地址（建议使用常用邮箱如 Gmail、QQ邮箱等）'
      } else if (errorMessage.includes('User already registered') || errorMessage.includes('already_exists')) {
        errorMessage = '该邮箱已被注册，请使用其他邮箱或直接登录'
      } else if (errorMessage.includes('Invalid login credentials')) {
        errorMessage = '邮箱或密码错误，请检查后重试'
      } else if (errorMessage.includes('Email rate limit exceeded')) {
        errorMessage = '邮箱验证邮件发送过于频繁，请稍后再试'
      } else if (errorMessage.includes('duplicate key value')) {
        errorMessage = '该账户信息已存在，请尝试直接登录或使用其他邮箱'
      } else if (errorMessage.includes('SMTP')) {
        errorMessage = '邮件发送失败，请检查邮箱地址是否正确或稍后重试'
      }
      
      setError(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
    setSuccess(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/images/megaspace_main_logo.png" 
              alt="Mega Space" 
              className="h-20"
            />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            欢迎使用 Mega Space
          </CardTitle>
          <CardDescription>
            AI驱动的教育平台，让学习更智能、更高效
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={isLogin ? 'login' : 'register'} onValueChange={(value) => setIsLogin(value === 'login')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">登录</TabsTrigger>
              <TabsTrigger value="register">注册</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">邮箱地址</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="请输入有效的邮箱地址（如: user@example.com）"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`transition-colors duration-200 ${
                      formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'focus:border-blue-500'
                    }`}
                    required
                  />
                  {formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
                    <p className="text-sm text-red-600">请输入正确的邮箱格式</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">密码</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="请输入密码"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {success && (
                  <Alert className="border-green-200 bg-green-50 text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  disabled={submitting}
                >
                  {submitting ? <LoadingSpinner size="sm" /> : '登录'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">姓名</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="请输入您的姓名"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">身份</Label>
                  <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="请选择您的身份" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teacher">教师</SelectItem>
                      <SelectItem value="student">学生</SelectItem>
                      <SelectItem value="parent">家长</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">邮箱地址</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="请输入有效的邮箱地址（如: user@example.com）"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`transition-colors duration-200 ${
                      formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'focus:border-blue-500'
                    }`}
                    required
                  />
                  {formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
                    <p className="text-sm text-red-600">请输入正确的邮箱格式</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">密码</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="请输入密码（至少6位）"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      minLength={6}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {formData.password && formData.password.length < 6 && (
                    <p className="text-sm text-red-600">密码长度至少需要6位字符</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">确认密码</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="请再次输入密码"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className={`transition-colors duration-200 ${
                        formData.confirmPassword && formData.password && formData.password !== formData.confirmPassword
                          ? 'border-red-300 focus:border-red-500' 
                          : formData.confirmPassword && formData.password && formData.password === formData.confirmPassword
                          ? 'border-green-300 focus:border-green-500'
                          : 'focus:border-blue-500'
                      }`}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {formData.confirmPassword && formData.password && formData.password !== formData.confirmPassword && (
                    <p className="text-sm text-red-600">两次输入的密码不一致</p>
                  )}
                  {formData.confirmPassword && formData.password && formData.password === formData.confirmPassword && (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      密码输入一致
                    </p>
                  )}
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {success && (
                  <Alert className="border-green-200 bg-green-50 text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  disabled={submitting}
                >
                  {submitting ? <LoadingSpinner size="sm" /> : '注册'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}