import React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
}

interface ErrorFallbackProps {
  error?: Error
  resetError: () => void
}

function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const handleReload = () => {
    window.location.reload()
  }

  const handleHome = () => {
    window.location.href = '/dashboard'
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 via-white to-orange-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-xl font-bold text-gray-900">
            抱歉，出现了错误
          </CardTitle>
          <CardDescription className="text-gray-600">
            应用程序遇到了意外错误，我们正在努力修复
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm text-gray-700 font-medium mb-1">错误详情：</p>
              <p className="text-xs text-gray-600 font-mono break-words">
                {error.message}
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            <Button 
              onClick={resetError} 
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              重试
            </Button>
            
            <Button 
              onClick={handleReload} 
              variant="outline" 
              className="w-full"
            >
              刷新页面
            </Button>
            
            <Button 
              onClick={handleHome} 
              variant="ghost" 
              className="w-full"
            >
              <Home className="w-4 h-4 mr-2" />
              返回首页
            </Button>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-gray-500">
              如果问题持续存在，请联系技术支持
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React Error Boundary 捕获到错误:', error, errorInfo)
    
    // 记录错误到监控服务（如果有的话）
    this.setState({
      hasError: true,
      error,
      errorInfo
    })
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return (
        <FallbackComponent 
          error={this.state.error} 
          resetError={this.resetError} 
        />
      )
    }

    return this.props.children
  }
}

// 高阶组件：为组件添加错误边界
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<ErrorFallbackProps>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// Hook：在函数组件中使用错误处理
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)
  
  const resetError = React.useCallback(() => {
    setError(null)
  }, [])
  
  const handleError = React.useCallback((error: Error | string) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error
    console.error('组件错误:', errorObj)
    setError(errorObj)
  }, [])
  
  // 如果有错误，抛出给错误边界处理
  if (error) {
    throw error
  }
  
  return { handleError, resetError }
}
