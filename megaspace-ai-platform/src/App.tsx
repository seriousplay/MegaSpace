import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { AuthPage } from '@/components/auth/AuthPage'
import { Dashboard } from '@/pages/Dashboard'
import { PublicSpace } from '@/pages/PublicSpace'
import { PageLoading } from '@/components/ui/LoadingSpinner'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import './App.css'

// 创建 React Query 客户端
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// 路由保护组件
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <PageLoading />
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />
  }
  
  return <>{children}</>
}

// 认证路由组件
function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <PageLoading />
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />
  }
  
  return <>{children}</>
}

function AppContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <ErrorBoundary>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route 
              path="/auth" 
              element={
                <AuthRoute>
                  <div className="min-h-screen flex items-center justify-center p-4">
                    <div className="w-full max-w-md">
                      <AuthPage />
                    </div>
                  </div>
                </AuthRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <Dashboard />
                  </ErrorBoundary>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/public-space" 
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <PublicSpace />
                  </ErrorBoundary>
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </ErrorBoundary>
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App