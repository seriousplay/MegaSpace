import React from 'react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
          sizeClasses[size]
        )}
      />
    </div>
  )
}

export function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-center">
        <img 
          src="/images/megaspace_main_logo.png" 
          alt="Mega Space" 
          className="h-16 mx-auto mb-4 animate-pulse" 
        />
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">加载中...</p>
      </div>
    </div>
  )
}