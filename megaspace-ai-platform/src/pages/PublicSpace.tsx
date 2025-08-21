import React, { useState, useEffect } from 'react'
import { Search, Filter, Star, Play, Heart, AlertCircle, Brain } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Header } from '@/components/layout/Header'
import { publicToolsAPI, PublicTool, UseToolResponse } from '@/lib/publicToolsAPI'
import { getToolIcon } from '@/lib/iconMap'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

const categories = [
  { id: 'all', name: '全部分类' },
  { id: '语文教学', name: '语文教学' },
  { id: '数学教学', name: '数学教学' },
  { id: '英语教学', name: '英语教学' },
  { id: '科学教学', name: '科学教学' },
  { id: '教学管理', name: '教学管理' },
  { id: '学习分析', name: '学习分析' }
]

const toolTypes = [
  { id: 'all', name: '全部类型' },
  { id: 'ai_tool', name: 'AI工具' },
  { id: 'knowledge_base', name: '知识库' },
  { id: 'template', name: '模板' },
  { id: 'resource', name: '资源' }
]

export function PublicSpace() {
  const [tools, setTools] = useState<PublicTool[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [sortBy, setSortBy] = useState('popular')
  
  // 工具使用对话框状态
  const [showToolDialog, setShowToolDialog] = useState(false)
  const [selectedTool, setSelectedTool] = useState<PublicTool | null>(null)
  const [toolMessage, setToolMessage] = useState('')
  const [toolResponse, setToolResponse] = useState<UseToolResponse | null>(null)
  const [usingTool, setUsingTool] = useState(false)

  useEffect(() => {
    loadTools()
  }, [selectedCategory, selectedType, searchQuery, sortBy])

  const loadTools = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const filters = {
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        tool_type: selectedType !== 'all' ? selectedType : undefined,
        search: searchQuery || undefined,
        sort_by: sortBy as 'popular' | 'rating' | 'newest',
        limit: 50
      }
      
      const fetchedTools = await publicToolsAPI.getPublicTools(filters)
      setTools(fetchedTools)
    } catch (err: any) {
      setError(err.message || '加载工具失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleToolUse = async (tool: PublicTool) => {
    setSelectedTool(tool)
    setToolResponse(null)
    setToolMessage('')
    
    if (tool.tool_type === 'ai_tool') {
      // AI工具需要用户输入
      setShowToolDialog(true)
    } else {
      // 其他类型直接使用
      await executeToolUse(tool)
    }
  }
  
  const executeToolUse = async (tool: PublicTool, message?: string) => {
    setUsingTool(true)
    try {
      const response = await publicToolsAPI.useTool(tool.id, message)
      setToolResponse(response)
      
      // 刷新工具列表以更新使用次数
      loadTools()
    } catch (err: any) {
      setError(err.message || '使用工具失败，请稍后重试')
    } finally {
      setUsingTool(false)
    }
  }
  
  const handleSubmitToolMessage = async () => {
    if (!selectedTool || !toolMessage.trim()) return
    await executeToolUse(selectedTool, toolMessage)
  }
  
  const handleFavorTool = async (tool: PublicTool) => {
    try {
      await publicToolsAPI.favorTool(tool.id)
      // 这里可以添加成功提示
    } catch (err: any) {
      setError(err.message || '收藏失败，请稍后重试')
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ))
  }

  const ToolCard = ({ tool }: { tool: PublicTool }) => (
    <Card key={`tool-card-${tool.id}`} className="group hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg text-white">
              {getToolIcon(tool.icon_name)}
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg font-bold group-hover:text-blue-600 transition-colors">
                {tool.name}
                {tool.is_premium && (
                  <Badge variant="outline" className="ml-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-none">
                    高级
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1">
                  {renderStars(tool.rating)}
                  <span className="text-sm text-gray-600 ml-1">{tool.rating}</span>
                </div>
                <span className="text-sm text-gray-500">• {tool.usage_count} 次使用</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className="text-sm text-gray-600 mb-4 line-clamp-3">
          {tool.description}
        </CardDescription>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {tool.tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        
        <div className="mb-4">
          <p className="text-sm font-medium mb-2">主要功能：</p>
          <ul className="text-xs text-gray-600 space-y-1">
            {tool.features.slice(0, 3).map((feature, index) => (
              <li key={index} className="flex items-center gap-2">
                <div className="w-1 h-1 bg-blue-500 rounded-full" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Clicking tool:', tool.id, tool.name);
              handleToolUse(tool);
            }}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            disabled={usingTool}
          >
            <Play className="h-4 w-4 mr-2" />
            立即使用
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleFavorTool(tool)}
          >
            <Heart className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="公共空间" />
      
      <div className="container mx-auto px-6 py-8">
        {/* 页面标题和描述 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Mega Space 公共工具库
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            探索丰富的AI教学工具、知识库和模板资源，让教学更智能、学习更高效
          </p>
        </div>

        {/* 搜索和筛选区域 */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="搜索工具、功能、标签..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="工具类型" />
              </SelectTrigger>
              <SelectContent>
                {toolTypes.map(type => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
            <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">排序方式：</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">最受欢迎</SelectItem>
                  <SelectItem value="rating">评分最高</SelectItem>
                  <SelectItem value="newest">最新发布</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="text-sm text-gray-600">
              找到 {tools.length} 个工具
            </div>
          </div>
        </div>

        {/* 错误显示 */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 工具展示区域 */}
        <Tabs defaultValue="grid" className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="grid">网格视图</TabsTrigger>
              <TabsTrigger value="list">列表视图</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="grid">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <LoadingSpinner size="lg" />
              </div>
            ) : tools.length === 0 ? (
              <div className="text-center py-20">
                <Brain className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">未找到相关工具</h3>
                <p className="text-gray-600">尝试调整搜索条件或筛选器</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tools.map(tool => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="list">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <LoadingSpinner size="lg" />
              </div>
            ) : tools.length === 0 ? (
              <div className="text-center py-20">
                <Brain className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">未找到相关工具</h3>
                <p className="text-gray-600">尝试调整搜索条件或筛选器</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tools.map(tool => (
                  <Card key={tool.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg text-white">
                          {getToolIcon(tool.icon_name)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-bold text-gray-900 mb-1">
                                {tool.name}
                                {tool.is_premium && (
                                  <Badge variant="outline" className="ml-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-none">
                                    高级
                                  </Badge>
                                )}
                              </h3>
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex items-center gap-1">
                                  {renderStars(tool.rating)}
                                  <span className="text-sm text-gray-600 ml-1">{tool.rating}</span>
                                </div>
                                <span className="text-sm text-gray-500">• {tool.usage_count} 次使用</span>
                                <Badge variant="outline">{tool.category}</Badge>
                              </div>
                              <p className="text-gray-600 mb-3">{tool.description}</p>
                              <div className="flex flex-wrap gap-2">
                                {tool.tags.map((tag, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('Clicking tool (list view):', tool.id, tool.name);
                                  handleToolUse(tool);
                                }}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                disabled={usingTool}
                              >
                                <Play className="h-4 w-4 mr-2" />
                                立即使用
                              </Button>
                              <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => handleFavorTool(tool)}
                              >
                                <Heart className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* 工具使用对话框 */}
      <Dialog open={showToolDialog} onOpenChange={setShowToolDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>使用 {selectedTool?.name}</DialogTitle>
            <DialogDescription>
              {selectedTool?.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {toolResponse ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">{selectedTool?.name} 回复：</h4>
                  <p className="text-blue-800 whitespace-pre-wrap">{toolResponse.message}</p>
                </div>
                
                {toolResponse.features && (
                  <div>
                    <h4 className="font-medium mb-2">可用功能：</h4>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      {toolResponse.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      setToolResponse(null)
                      setToolMessage('')
                    }}
                    variant="outline"
                  >
                    继续使用
                  </Button>
                  <Button 
                    onClick={() => {
                      setShowToolDialog(false)
                      setToolResponse(null)
                      setToolMessage('')
                    }}
                  >
                    关闭
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    请描述您的需求或问题：
                  </label>
                  <Textarea
                    value={toolMessage}
                    onChange={(e) => setToolMessage(e.target.value)}
                    placeholder={`例如：请帮我使用${selectedTool?.name}解决...`}
                    rows={4}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSubmitToolMessage}
                    disabled={usingTool || !toolMessage.trim()}
                    className="flex-1"
                  >
                    {usingTool ? <LoadingSpinner size="sm" /> : '开始使用'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowToolDialog(false)}
                    disabled={usingTool}
                  >
                    取消
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}