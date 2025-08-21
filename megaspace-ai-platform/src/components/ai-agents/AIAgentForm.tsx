import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAIAgent } from '@/hooks/useAIAgent'
import { useAuth } from '@/contexts/AuthContext'
import { useOrganization } from '@/hooks/useOrganization'
import { AIAgent } from './AIAgentCard'

interface AIAgentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agent?: AIAgent | null
  onSuccess?: () => void
}

export function AIAgentForm({ open, onOpenChange, agent, onSuccess }: AIAgentFormProps) {
  const { createAgent, updateAgent, loading } = useAIAgent()
  const { user } = useAuth()
  const { getUserOrganizations } = useOrganization()
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'education',
    permissions: 'private' as 'public' | 'organization' | 'private',
    prompt_template: '',
    system_instructions: '',
    organization_id: ''
  })
  
  const [organizations, setOrganizations] = useState<any[]>([])
  const [loadingOrgs, setLoadingOrgs] = useState(false)

  useEffect(() => {
    if (open) {
      loadOrganizations()
      if (agent) {
        // 编辑模式
        setFormData({
          name: agent.name,
          description: agent.description || '',
          category: agent.category || 'education',
          permissions: agent.permissions || 'private',
          prompt_template: agent.prompt_template || '',
          system_instructions: agent.system_instructions || '',
          organization_id: agent.organization_id || ''
        })
      } else {
        // 创建模式
        setFormData({
          name: '',
          description: '',
          category: 'education',
          permissions: 'private',
          prompt_template: '',
          system_instructions: '',
          organization_id: ''
        })
      }
    }
  }, [open, agent])

  const loadOrganizations = async () => {
    if (!user) return
    
    setLoadingOrgs(true)
    try {
      const orgs = await getUserOrganizations()
      setOrganizations(orgs || [])
    } catch (error) {
      console.error('加载组织失败:', error)
    } finally {
      setLoadingOrgs(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.prompt_template.trim()) {
      alert('请填写AI Agent名称和提示词模板')
      return
    }

    try {
      const agentData = {
        ...formData,
        organization_id: formData.permissions === 'organization' ? formData.organization_id : null
      }

      if (agent) {
        await updateAgent(agent.id, agentData)
      } else {
        await createAgent(agentData)
      }
      
      onSuccess?.()
      onOpenChange(false)
    } catch (error: any) {
      alert(error.message || '操作失败，请重试')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {agent ? '编辑 AI Agent' : '创建新的 AI Agent'}
          </DialogTitle>
          <DialogDescription>
            配置您的专属AI助手，设置个性化的行为和能力
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">AI Agent 名称</label>
              <Input
                placeholder="例如：数学教学助手"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">描述</label>
              <Textarea
                placeholder="简要描述这个AI Agent的功能和用途"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">类别</label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="education">教育教学</SelectItem>
                    <SelectItem value="language">语言学习</SelectItem>
                    <SelectItem value="math">数学计算</SelectItem>
                    <SelectItem value="science">科学研究</SelectItem>
                    <SelectItem value="writing">写作辅助</SelectItem>
                    <SelectItem value="general">通用助手</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">可见性</label>
                <Select 
                  value={formData.permissions} 
                  onValueChange={(value: 'public' | 'organization' | 'private') => 
                    setFormData(prev => ({ ...prev, permissions: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">私有 - 仅我可见</SelectItem>
                    <SelectItem value="organization">组织内 - 所在学校可见</SelectItem>
                    <SelectItem value="public">公开 - 所有人可见</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {formData.permissions === 'organization' && (
              <div>
                <label className="block text-sm font-medium mb-2">选择组织</label>
                {loadingOrgs ? (
                  <div className="flex items-center justify-center py-2">
                    <LoadingSpinner size="sm" />
                  </div>
                ) : (
                  <Select 
                    value={formData.organization_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, organization_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择一个组织" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-2">系统指令</label>
              <Textarea
                placeholder="描述AI Agent的基本行为和性格，例如：你是一个专业的数学教师，善于用简单易懂的方式解释复杂概念"
                value={formData.system_instructions}
                onChange={(e) => setFormData(prev => ({ ...prev, system_instructions: e.target.value }))}
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">提示词模板</label>
              <Textarea
                placeholder={`请输入AI Agent的具体提示词模板，例如：
根据用户的问题，请：
1. 分析问题的核心要点
2. 提供清晰的解答步骤
3. 给出具体示例
4. 鼓励用户继续学习`}
                value={formData.prompt_template}
                onChange={(e) => setFormData(prev => ({ ...prev, prompt_template: e.target.value }))}
                rows={8}
                required
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                agent ? '更新 Agent' : '创建 Agent'
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              取消
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
