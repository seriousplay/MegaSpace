import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bot, Edit, Eye, Globe, Lock, Users } from 'lucide-react'
import { useAIAgent } from '@/hooks/useAIAgent'

export interface AIAgent {
  id: string
  name: string
  description: string
  category: string
  permissions: 'public' | 'organization' | 'private'
  prompt_template: string
  system_instructions?: string
  created_at: string
  updated_at: string
  creator_id: string
  creator_name?: string
  organization_id?: string
  organization_name?: string
  usage_count?: number
  tools?: any[]
  workflow_config?: any
  file_contexts?: any[]
  tags?: string[]
  status?: string
}

interface AIAgentCardProps {
  agent: AIAgent
  onEdit?: (agent: AIAgent) => void
  onUse?: (agent: AIAgent) => void
  onView?: (agent: AIAgent) => void
  isOwner?: boolean
}

export function AIAgentCard({ agent, onEdit, onUse, onView, isOwner = false }: AIAgentCardProps) {
  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return <Globe className="h-4 w-4" />
      case 'organization':
        return <Users className="h-4 w-4" />
      case 'private':
        return <Lock className="h-4 w-4" />
      default:
        return <Lock className="h-4 w-4" />
    }
  }

  const getVisibilityLabel = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return '公开'
      case 'organization':
        return '组织内'
      case 'private':
        return '私有'
      default:
        return '私有'
    }
  }

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return 'bg-green-100 text-green-800'
      case 'organization':
        return 'bg-blue-100 text-blue-800'
      case 'private':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{agent.name}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className={`text-xs ${getVisibilityColor(agent.permissions)}`}
            >
              <span className="flex items-center gap-1">
                {getVisibilityIcon(agent.permissions)}
                {getVisibilityLabel(agent.permissions)}
              </span>
            </Badge>
          </div>
        </div>
        
        <CardDescription className="text-sm text-muted-foreground">
          {agent.description || '暂无描述'}
        </CardDescription>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>类别: {agent.category}</span>
          {agent.usage_count !== undefined && (
            <span>使用次数: {agent.usage_count}</span>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground">
            创建时间: {new Date(agent.created_at).toLocaleDateString('zh-CN')}
            {agent.creator_name && (
              <span className="ml-2">创建者: {agent.creator_name}</span>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={() => onUse?.(agent)}
              className="flex-1"
            >
              <Bot className="h-4 w-4 mr-1" />
              使用
            </Button>
            
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onView?.(agent)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            
            {isOwner && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onEdit?.(agent)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
