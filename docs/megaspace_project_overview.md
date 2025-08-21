# MegaSpace 项目概述

## 项目基本信息
- **项目名称**: MegaSpace AI Platform
- **技术栈**: 
  - 前端: React 18 + TypeScript + Vite
  - UI组件: Radix UI + Tailwind CSS
  - 状态管理: React Query + React Hook Form
  - 后端集成: Supabase

## 目录结构
```
megaspace-ai-platform/
├── src/
│   ├── components/        # 公共组件
│   │   ├── ai-agents/     # AI代理相关组件
│   │   ├── auth/          # 认证相关组件  
│   │   ├── layout/        # 布局组件
│   │   └── ui/           # UI基础组件
│   ├── contexts/         # React Context
│   ├── hooks/            # 自定义Hooks
│   ├── lib/              # 工具库
│   └── pages/            # 页面组件
│       ├── Dashboard.tsx
│       ├── ParentDashboard.tsx
│       ├── PublicSpace.tsx
│       ├── StudentDashboard.tsx
│       └── TeacherDashboard.tsx
└── supabase/
    ├── functions/        # Supabase函数
    ├── migrations/       # 数据库迁移
    └── tables/           # 数据库表定义
```

## 核心功能模块
1. **认证系统**
   - 使用Supabase Auth
   - 包含登录/注册页面
   - 用户角色管理

2. **AI代理系统**
   - AI代理管理
   - AI聊天功能
   - 代理表单

3. **仪表盘系统**
   - 学生仪表盘
   - 教师仪表盘  
   - 家长仪表盘
   - 公共空间

4. **知识库管理**
   - 知识库CRUD
   - 内容处理

## 数据库设计
Supabase数据库包含以下主要表:
- `ai_agents` - AI代理信息
- `assignments` - 作业管理
- `knowledge_bases` - 知识库
- `organizations` - 组织管理
- `profiles` - 用户资料
- `public_tools` - 公共工具

## 开发环境配置
1. 安装依赖:
```bash
pnpm install
```

2. 启动开发服务器:
```bash 
pnpm dev
```

3. 构建生产版本:
```bash
pnpm build