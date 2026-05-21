🚀 个人技术博客搭建 — 完整开发指令
请帮助我从零搭建一个现代个人博客，满足以下全部技术要求，并提供完整的可运行代码。

一、项目概况
维度	要求
项目类型	个人技术博客
核心技术栈	React 19 + TypeScript + Next.js（App Router）
部署平台	Vercel
代码托管	GitHub（公开仓库）
内容管理方式	基于文件系统的 MDX/Markdown 文章
二、功能需求清单
🔹 P0 — 核心功能（必须实现）
Markdown/MDX 文章渲染
文章存放在项目内的 content/posts/ 目录中，按 {slug}/index.mdx 组织
支持 Frontmatter（title、date、description、tags、coverImage 等）
支持代码高亮（使用 rehype-pretty-code 或 prism-react-renderer）
支持 GFM（表格、任务列表、脚注等）
文章目录（TOC）自动生成
基于文章内的 h2 / h3 标题自动提取生成
固定在文章页面侧边栏，随页面滚动高亮当前可见标题（Intersection Observer）
在移动端折叠为可展开的浮层
评论系统
使用 Giscus（基于 GitHub Discussions）实现评论
评论组件仅在文章详情页加载，支持懒加载
需配置 GitHub 仓库的 Discussions 功能
阅读进度条
固定在页面顶部的条状进度指示器
基于 window.scrollY 和文档总高度计算百分比
平滑动画过渡
暗色模式切换
支持 亮色 / 暗色 / 跟随系统 三种模式
使用 Tailwind CSS 的 dark 类实现，或使用 CSS 变量方案
用户选择持久化到 localStorage，页面加载时无闪烁（通过 next-themes 或内联脚本）
切换按钮使用太阳/月亮图标，带有平滑过渡动画
🔹 P1 — 增强功能（建议实现）
文章列表页
首页展示所有文章的卡片列表，按日期降序排列
每张卡片展示：封面图（可选）、标题、发布日期、描述、标签
支持按标签筛选（简单的前端过滤即可）
SEO 优化
每篇文章自动生成 <title> 和 <meta name="description">
生成 sitemap.xml 和 robots.txt
支持 Open Graph 标签
使用 next/font 加载字体
RSS 订阅
生成 rss.xml / atom.xml 订阅源
响应式设计
完美适配移动端（320px）→ 平板 → 桌面端（1440px+）
使用 Tailwind CSS 的响应式断点
三、技术架构约束
*.txt
Plaintext
.
├── content/
│   └── posts/                    # MDX 文章
│       └── hello-world/
│           └── index.mdx
├── src/
│   ├── app/
│   │   ├── layout.tsx            # 根布局（含暗色模式 Provider）
│   │   ├── page.tsx              # 首页 — 文章列表
│   │   ├── posts/
│   │   │   └── [slug]/
│   │   │       └── page.tsx      # 文章详情页
│   │   ├── sitemap.ts            # sitemap 生成
│   │   └── rss.xml/route.ts      # RSS 生成
│   ├── components/
│   │   ├── article-card.tsx      # 文章卡片
│   │   ├── toc.tsx               # 目录组件
│   │   ├── progress-bar.tsx      # 阅读进度条
│   │   ├── theme-toggle.tsx      # 暗色模式切换
│   │   ├── giscus.tsx            # 评论组件
│   │   └── mdx-components.tsx    # MDX 自定义组件映射
│   ├── lib/
│   │   ├── posts.ts              # 文章解析与获取工具函数
│   │   └── mdx.ts                # MDX 编译配置
│   └── styles/
│       └── globals.css           # 全局样式 + 代码高亮主题
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
└── package.json
关键依赖
*.json
JSON
{
  "next": "latest (15.x 兼容 React 19)",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "typescript": "^5.x",
  "tailwindcss": "^4.x",
  "next-themes": "latest",
  "@next/mdx": "latest",
  "@mdx-js/mdx": "latest",
  "@mdx-js/react": "latest",
  "rehype-pretty-code": "latest",
  "rehype-slug": "latest",
  "remark-gfm": "latest",
  "@giscus/react": "latest"
}
四、代码质量要求
✅ 全部使用 TypeScript，提供完整的类型定义
✅ 使用 Next.js App Router（非 Pages Router）
✅ 尽可能使用 Server Components，仅在需要交互时使用 Client Components
✅ 每个组件放在独立文件中，职责单一
✅ 使用 Tailwind CSS 进行样式编写，不额外引入 CSS-in-JS 方案
✅ 代码中包含必要的注释（关键逻辑 + 类型定义）
✅ 遵循 ESLint 默认规则，无 warning
五、输出要求
请按以下顺序提供代码：

初始化步骤：npx create-next-app 的命令参数和后续安装依赖的命令
配置文件：next.config.ts、tailwind.config.ts、tsconfig.json、mdx-components.tsx
工具函数：lib/posts.ts、lib/mdx.ts
布局与页面：layout.tsx、首页 page.tsx、文章详情页 page.tsx
所有组件：逐个提供完整代码
全局样式：globals.css
示例文章：至少 2 篇示例 MDX 文章用于验证功能
Vercel 部署说明：包括环境变量配置、部署命令
六、验收标准
完成后的博客应满足：

 pnpm dev 启动后本地可访问，无报错
 首页正确展示文章列表（含标签筛选）
 点击文章进入详情页，TOC 正确渲染且随滚动高亮
 阅读进度条从 0% 到 100% 平滑变化
 暗色模式切换无闪烁，刷新后保持选择
 Giscus 评论区域正常加载(可以先预留配置)
 移动端布局无溢出、无重叠
 pnpm build 构建成功，无 TypeScript 类型错误
 部署到 Vercel 后所有功能正常
 需要支持H5
七、附加说明
样式风格：简洁现代，偏好类似 tailwindcss-typography 的排版风格，配色以灰白为主，点缀蓝色或紫色系
性能目标：Lighthouse 评分 ≥ 95（Performance / Accessibility / Best Practices / SEO）
如果遇到技术选型冲突，优先选择 Next.js 官方推荐的方案
📌 关键改进说明
从模糊到结构化：将用户的一句话需求扩展为分层次的功能清单（P0 核心 / P1 增强）、完整目录结构、依赖清单
明确技术边界：补充了 MDX 文件组织方式、TOC 实现原理（Intersection Observer）、暗色模式防闪烁方案、评论系统选型（Giscus）等具体实现细节
增加质量约束：引入 TypeScript 全覆盖、App Router、Server Components 优先、Tailwind CSS 等明确限制
定义交付物顺序：将输出拆解为 8 个明确的交付步骤，避免 AI 一次性输出过于冗长或遗漏模块
可验证的验收标准：增加了 Checklist 形式的验收项和 Lighthouse 性能目标，确保交付可衡量
💡 使用建议
将本提示词分步使用效果更佳——先让 AI 输出步骤 1-3（基础设施），再逐步输出步骤 4-7（组件和样式），避免单次回复内容过长被截断
在提供给 AI 时，建议补全 仓库名称、GitHub 用户名 等占位信息
如果对某一功能有额外偏好（如替换 Giscus 为 utterances），可在该章节旁注明