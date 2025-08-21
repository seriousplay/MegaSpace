import { 
  Search, Filter, Star, Users, BookOpen, Brain, FileText, Calculator, 
  Lightbulb, Play, Heart, Bot, Microscope, Globe, Cpu, Database,
  PenTool, MessageSquare, Camera, Music, Palette, Beaker
} from 'lucide-react'

// 图标映射表
export const iconMap: Record<string, React.ReactNode> = {
  // 基础图标
  Brain: <Brain className="h-6 w-6" />,
  FileText: <FileText className="h-6 w-6" />,
  Calculator: <Calculator className="h-6 w-6" />,
  Lightbulb: <Lightbulb className="h-6 w-6" />,
  Users: <Users className="h-6 w-6" />,
  BookOpen: <BookOpen className="h-6 w-6" />,
  Bot: <Bot className="h-6 w-6" />,
  
  // 教学相关
  Microscope: <Microscope className="h-6 w-6" />,
  Beaker: <Beaker className="h-6 w-6" />,
  PenTool: <PenTool className="h-6 w-6" />,
  MessageSquare: <MessageSquare className="h-6 w-6" />,
  
  // 技术相关
  Cpu: <Cpu className="h-6 w-6" />,
  Database: <Database className="h-6 w-6" />,
  Globe: <Globe className="h-6 w-6" />,
  
  // 创意相关
  Camera: <Camera className="h-6 w-6" />,
  Music: <Music className="h-6 w-6" />,
  Palette: <Palette className="h-6 w-6" />,
  
  // 默认图标
  default: <Brain className="h-6 w-6" />
}

export function getToolIcon(iconName?: string): React.ReactNode {
  if (!iconName || !iconMap[iconName]) {
    return iconMap.default
  }
  return iconMap[iconName]
}