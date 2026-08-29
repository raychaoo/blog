# VibeCoding Blog

个人技术博客,基于 Next.js 16 + React 19 + TypeScript + Tailwind CSS v4 构建的动效增强型静态站点。

## 功能特性

- **首页**:单个居中放大的 Lanyard 3D 挂绳卡,介绍文案烘焙进卡片正面贴图;下方为「关于我」资料卡(GitHub 头像、文章/标签/始于统计、贡献图)
- **文章页** `/posts`:ChromaGrid 网格背景、标签筛选、Fuse.js 模糊搜索、滚动位置恢复
- **碎碎念** `/thoughts`:整页 OptionWheel 轮盘即列表(富卡片,滚动切高亮、点击进详情),返回时平滑恢复上次位置
- **全局看板娘**:自托管 Live2D,3 个模型(shizuku/Pio/Tia)可循环切换,可拖动且位置跨页保持,支持移动端
- **主题系统**:6 套主题(light/dark/sepia/ocean/lavender/midnight),CSS 变量驱动,localStorage 持久化,无 next-themes
- **MDX 内容**:unified + remark + rehype 管线,自动目录(TOC)、阅读进度条、rehype-pretty-code 代码高亮、Giscus 评论
- **动效**:ReactBits(GooeyNav/Lanyard/OptionWheel/ChromaGrid 等 8 个自托管组件)+ GSAP + Three.js,全部遵循 `prefers-reduced-motion` 降级
- **搜索**:`/api/search` 构建期生成 `{posts, thoughts}` 双索引,Fuse.js 客户端模糊搜索
- **RSS / Sitemap**:自动生成 `/rss.xml` 与 `sitemap.xml`

## 技术栈

| 类别 | 选型 |
|------|------|
| 框架 | Next.js 16 (App Router),静态导出 (`output: 'export'`) |
| UI | React 19、TypeScript 5、Tailwind CSS v4 |
| 动效 / 3D | GSAP、Three.js、@react-three/fiber、ReactBits |
| 内容 | MDX via unified/remark/rehype(非 @next/mdx) |
| 字体 | 阿里巴巴普惠体 3.0(自托管 WOFF2,无外部 CDN) |
| 测试 | Vitest(Node 环境,仅纯逻辑 TDD) |
| 部署 | Vercel |

## 快速开始

```bash
pnpm install
pnpm dev       # 开发服务器(热更新)
pnpm build     # 生产构建(静态导出到 out/)
pnpm test      # Vitest 单测(lib + 搜索路由)
pnpm lint      # ESLint(仓库基线已坏,只自查改动文件)
```

## 项目结构

```
content/           # 文章与碎碎念 MDX(frontmatter)
public/            # 字体、Lanyard 资源、Live2D 全自托管静态树
src/app/           # 路由(layout、首页、posts、thoughts、sitemap、rss、api/search)
src/components/    # 按职责分组:home、nav、posts、thoughts、mdx、live2d、reactbits、search、theme
src/lib/           # posts/thoughts 解析、accent 颜色、card-face SVG 生成、MDX 编译
```

## 文档

- [CLAUDE.md](CLAUDE.md) — 面向 AI 助手的完整项目说明(架构、约定、构建与部署)
- [docs/superpowers/README.md](docs/superpowers/README.md) — superpowers 工作流设计规格与实施计划索引
