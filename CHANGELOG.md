# Changelog

## [Unreleased] (0.2.0)

### 新增
- **全站重构**为「首页纯个人介绍 + 独立文章页 + 碎碎念念页 + 全局看板娘」的动效增强型站点,目录按职责重分组(`src/components/{nav, theme, search, home, posts, thoughts, mdx, live2d, reactbits}/`)
- **自托管 8 个 ReactBits 动效组件**:gooey-nav、lanyard、option-wheel、chroma-grid、split-text、text-type、shuffle、scroll-float,配色统一走主题 CSS 变量
- **首页**:单个居中放大的 Lanyard 3D 挂绳卡(介绍文案烘焙进卡片正面,`card-face.ts` 生成 480×724 SVG,含贪心换行与 XML 转义)+「关于我」资料卡(GitHub 头像、文章/标签/始于统计、贡献图)
- **/posts 文章列表页**:ChromaGrid 网格背景、标签筛选、Fuse.js 搜索、滚动位置恢复
- **/thoughts 碎碎念念**:OptionWheel 轮盘转列表(标题 + 时间 + 3 行预览富卡片,滚动切高亮、点击进详情)
- **/thoughts/[slug] 详情页**:与文章共用 Giscus 评论
- **搜索**:/posts 与 /thoughts 共用搜索弹窗,`/api/search` 构建期生成 `{posts, thoughts}` 双索引
- **全局 Live2D 看板娘**:自托管 waifu-tips(1.5s 延迟懒加载),含 hitokoto/photo/info/quit 工具
- **Live2D 多模型**:新增 Pio/Tia 两个 Cubism 2 模型(自托管裁剪,合计约 1.5MB),可循环切换并显示对应欢迎语
- **Live2D 拖动**:位置持久化到 localStorage 跨页/刷新保持;移动端画布 180px + 触摸拖动
- **页面切换 + 按钮微动效**:Chromium MPA View Transitions,`prefers-reduced-motion` 降级
- **主题 accent 色解析工具**:`useAccentColors()`/`readAccentColors()`(6 色族 + fallback,TDD)
- **Vitest 测试基础设施**:4 个 lib 纯逻辑测试 + search route 测试(Node 环境)
- 自托管字体 immutable 缓存头、移动端两行式头部 + 柔化 gooey nav、antdv6 风格磨砂玻璃弹窗遮罩

### 修复
- Lanyard 主题切换崩溃(cardFront 依赖收窄为 name,纹理合成失败回退原始贴图)
- ChromaGrid 区域背景与 body 完全一致(移除两层区域级调暗遮罩)
- ChromaGrid 光斑与卡片渐变柔和化(`color-mix` 稀释 accent,主题和谐)
- 碎碎念念轮盘重定向循环(`defaultSelected` 归零 + 扩展 `onItemClick` 仅显式点击触发)
- 碎碎念念轮盘返回位置恢复(sessionStorage 存 slug + OptionWheel `initialScrollTo` 一次性平滑恢复)
- Live2D 移动端拖动抖动(触摸位移钳制)与 touchcancel 监听泄漏
- 文章详情返回链接、跨任务导航与导航主题化

### 变更
- Lanyard 新增 `cardScale` prop(外层 group 统一缩放 collider 与网格)
- hero 移除 DOM 文案块与多余按钮,导航职责交给 GooeyNav
- OptionWheel 扩展 `onItemClick`/`renderItem`/`initialScrollTo` 三个 prop(vendor 最小扩展)

### 移除
- 死代码:sidebar、tag-context、tag-filter-wrapper、hero 按钮区与 `.btn-primary/.btn-secondary` 样式、时间线样式

### 文档
- 归档 plans/、specs/ 到 [docs/superpowers/README.md](docs/superpowers/README.md)(6 个项目索引)
- CLAUDE.md 重写为中文并同步最新架构

## [0.1.0] - 2026-06-07

### Added
- **Blog framework**: Next.js 16 App Router with React 19 and TypeScript
- **Content pipeline**: MDX articles via unified/remark/rehype with frontmatter parsing
- **Theme system**: 6 themes (light, dark, sepia, ocean, lavender, midnight) with localStorage persistence and anti-flash script
- **Article pages**: Dynamic routing, tag pills, reading time estimation, cover images
- **Homepage**: Article grid with tag filtering and sidebar (post count, tag cloud, copyright)
- **Search**: Client-side fuzzy search via Fuse.js with ⌘K shortcut and modal UI
- **Comments**: Giscus integration with dynamic import for code splitting
- **Code blocks**: Syntax highlighting with rehype-pretty-code and copy-button injection
- **Table of contents**: IntersectionObserver-based TOC sidebar on article pages
- **Reading progress bar**: Fixed top progress indicator
- **RSS feed**: Auto-generated `/rss.xml` from all posts
- **Sitemap**: Auto-generated `sitemap.ts`
- **Search API**: JSON endpoint (`/api/search`) for client-side search index
- **MDX posts**: 5 articles covering Next.js, React 19, Ant Design patterns, and blog development
- **Typography**: DM Sans + Space Grotesk self-hosted via Fontsource
- **Icons**: Lucide React icon set

### Changed
- Enhanced `next.config.ts` with MDX file handling and image configuration
- Extended `package.json` with full dependency set for MDX pipeline, search, and UI
- Updated root layout with theme provider, progress bar, and site header
- Refactored homepage to use client/server component split pattern

### Removed
- Deleted unused components: `code-copy.tsx`, `main-content.tsx`, `liquid-bg.tsx`
- Removed orphaned `.liquid-blob` CSS animations from `globals.css`
- Cleaned up default Next.js globals.css
