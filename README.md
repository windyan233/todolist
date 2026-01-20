# Super Todo - Next.js + Supabase

一个功能强大的全栈 Todo List 应用，基于 Next.js 15 和 Supabase 构建。支持用户认证、实时数据同步、图片附件上传等功能。

## ✨ 主要功能

- **用户认证**：完整的登录、注册、退出流程（基于 Supabase Auth）。
- **实时同步**：多端实时数据更新（基于 Supabase Realtime）。
- **数据隔离**：每个用户只能查看和管理自己的任务（Row Level Security）。
- **图片附件**：支持为任务上传图片附件（Supabase Storage）。
- **丰富交互**：
  - 任务增删改查（CRUD）
  - 标记完成/未完成
  - 标记重要/取消重要
  - 任务列表排序
- **精美 UI**：现代化的渐变背景与动态动画效果（Tailwind CSS + Lucide React）。

## 🛠️ 技术栈

- **框架**: [Next.js](https://nextjs.org) (App Router)
- **数据库 & 认证**: [Supabase](https://supabase.com)
- **样式**: [Tailwind CSS](https://tailwindcss.com)
- **图标**: [Lucide React](https://lucide.dev)
- **部署**: Vercel (推荐)

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd with-supabase-app
```

### 2. 安装依赖

```bash
npm install
# 或者
yarn install
```

### 3. 配置 Supabase

1.  在 [Supabase Dashboard](https://database.new) 创建一个新项目。
2.  进入 SQL Editor，运行 `sql/init.sql` 中的所有语句。这将：
    *   创建 `todos` 表。
    *   设置 Row Level Security (RLS) 策略。
    *   开启 Realtime 功能。
3.  在 Storage 中创建一个名为 `todolist-files` 的公开 bucket（Public Bucket）。

### 4. 配置环境变量

将 `.env.example` 重命名为 `.env.local` 并填入你的 Supabase 项目信息：

```env
NEXT_PUBLIC_SUPABASE_URL=你的项目URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=你的Anon Key
```

### 5. 运行项目

```bash
npm run dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000) 即可看到应用。

## 📂 项目结构

- `app/page.tsx`: 主页面，包含所有 Todo 核心逻辑。
- `lib/supabase/`: Supabase 客户端配置。
- `sql/init.sql`: 数据库初始化脚本。
- `components/`: UI 组件。

## 📝 数据库模型

**Todos 表结构**:
- `id`: BigInt (主键)
- `user_id`: UUID (关联 auth.users)
- `text`: Text (任务内容)
- `is_completed`: Boolean
- `is_important`: Boolean
- `image_url`: Text (图片附件链接)
- `created_at`: Timestamp

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！
