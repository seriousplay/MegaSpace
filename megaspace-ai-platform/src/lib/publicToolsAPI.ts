import { supabase } from './supabase'

export interface PublicTool {
  id: string
  name: string
  description: string
  category: string
  tool_type: 'ai_tool' | 'knowledge_base' | 'template' | 'resource'
  configuration: any
  tags: string[]
  features: string[]
  icon_name: string
  usage_count: number
  rating: number
  review_count: number
  is_premium: boolean
  created_at: string
}

export interface PublicToolsFilters {
  category?: string
  tool_type?: string
  search?: string
  sort_by?: 'popular' | 'rating' | 'newest'
  limit?: number
  offset?: number
}

export interface UseToolResponse {
  type: string
  message: string
  tool_name: string
  action?: string
  features?: string[]
  ai_agent_id?: string
  knowledge_base_id?: string
  course_content_id?: string
}

class PublicToolsAPI {
  private baseUrl: string
  private apiKey: string

  constructor() {
    // 使用正确的API keys
    this.baseUrl = 'https://iwgdhzgxtdzrvccddkjm.supabase.co/functions/v1'
    this.apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3Z2Roemd4dGR6cnZjY2Rka2ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMjM2NzIsImV4cCI6MjA3MDc5OTY3Mn0.CKBtRJdl6LkF4kxjjskuRRk-JFex1wIrF2U_Ni13UBI'
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'apikey': this.apiKey,
      'Authorization': `Bearer ${this.apiKey}`,
      ...options.headers
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(errorData?.error?.message || `Request failed: ${response.statusText}`)
    }

    return response.json()
  }

  async getPublicTools(filters: PublicToolsFilters = {}): Promise<PublicTool[]> {
    const params = new URLSearchParams()
    
    if (filters.category) params.append('category', filters.category)
    if (filters.tool_type) params.append('tool_type', filters.tool_type)
    if (filters.search) params.append('search', filters.search)
    if (filters.sort_by) params.append('sort_by', filters.sort_by)
    if (filters.limit) params.append('limit', filters.limit.toString())
    if (filters.offset) params.append('offset', filters.offset.toString())

    const queryString = params.toString()
    const endpoint = `/get-public-tools-fixed${queryString ? `?${queryString}` : ''}`
    
    const result = await this.makeRequest(endpoint, { method: 'GET' })
    return result.data || []
  }

  async useTool(toolId: string, message?: string): Promise<UseToolResponse> {
    const result = await this.makeRequest('/use-public-tool', {
      method: 'POST',
      body: JSON.stringify({
        toolId,
        action: 'use',
        message
      })
    })
    
    return result.data
  }

  async rateTool(toolId: string, rating: number): Promise<boolean> {
    try {
      // 这里可以添加评分逻辑，暂时返回true
      console.log(`Rating tool ${toolId} with ${rating} stars`)
      return true
    } catch (error) {
      console.error('Failed to rate tool:', error)
      return false
    }
  }

  async favorTool(toolId: string): Promise<boolean> {
    try {
      // 这里可以添加收藏逻辑，暂时返回true
      console.log(`Favoring tool ${toolId}`)
      return true
    } catch (error) {
      console.error('Failed to favor tool:', error)
      return false
    }
  }
}

export const publicToolsAPI = new PublicToolsAPI()