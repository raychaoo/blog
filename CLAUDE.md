@AGENTS.md

# VibeCoding Blog

个人技术博客,基于 Next.js 16 + React 19 + TypeScript + Tailwind CSS v4 构建。

## 技术栈

- **框架**:Next.js 16(App Router)
- **UI**:React 19、TypeScript 5
- **样式**:Tailwind CSS v4(`@tailwindcss/postcss`)+ CSS 自定义属性
- **内容**:MDX 走 `unified` + `remark` + `rehype` 管线(不用 `@next/mdx`)
- **字体**:阿里巴巴普惠体 3.0(自托管 WOFF2,无 Google Fonts API)
- **搜索**:Fuse.js(客户端模糊搜索)
- **动效**:GSAP(@gsap/react)+ Three.js / react-three-fiber(Lanyard)
- **UI 库**:ReactBits(自托管/手写组件)
- **图标**:Lucide React
- **测试**:Vitest(Node 环境运行;仅当组件确实需要 DOM 时才用 jsdom@26)
- **统计**:@vercel/analytics

## 架构

```
content/
├── posts/{slug}/index.mdx          # 文章 MDX(frontmatter)
│   └── (图片放 public/posts/{slug}/,见「内容图片约定」)
└── thoughts/{slug}/index.mdx       # 碎碎念(frontmatter: title, date)
    └── (图片放 public/thoughts/{slug}/,见「内容图片约定」)
public/
├── fonts/                          # 自托管阿里巴巴普惠体 WOFF2
├── lanyard/                        # Lanyard 的 card.glb + 图片资源
├── live2d/                         # 自托管 live2d-widget v1 + 3 个模型(完全静态)
├── live2d-api/                     # 自托管 live2d API 静态树(模型/切换配置)
├── posts/{slug}/                   # 文章配图(与 content/posts 同 slug 镜像)
└── thoughts/{slug}/                # 碎碎念配图(与 content/thoughts 同 slug 镜像)
src/
├── app/
│   ├── layout.tsx                  # 根布局:BlogThemeProvider + ProgressBar + GooeyNav 头部 + Live2dMascot
│   ├── page.tsx                    # 首页:hero 单个 Lanyard + 「关于我」资料卡(无文章列表/搜索)
│   ├── posts/page.tsx              # /posts 文章网格(ChromaGrid 区域背景对齐 body、标签筛选、搜索、滚动恢复)
│   ├── posts/[slug]/page.tsx       # 文章详情页
│   ├── thoughts/page.tsx           # /thoughts 轮盘即列表(OptionWheel 富卡片 + 返回位置恢复)
│   ├── thoughts/[slug]/page.tsx    # 碎碎念详情页
│   ├── sitemap.ts                  # 自动生成 sitemap(/posts + /thoughts,force-static)
│   ├── rss.xml/route.ts            # RSS 订阅
│   └── api/search/route.ts         # 搜索索引 API(dynamic = "force-static",构建时生成 {posts, thoughts})
├── components/
│   ├── home/                       # home-client.tsx(客户端包装)+ hero.tsx(单个 Lanyard)+ github-contributions.tsx
│   ├── nav/header.tsx              # 站点头部(server 组件,承载 GooeyNav)
│   ├── live2d/live2d-mascot.tsx    # 全局看板娘(延迟懒加载 /live2d,拖动 + 位置记忆,移动端画布 180px + 触摸拖动)
│   ├── mdx/                        # toc.tsx、progress-bar.tsx、giscus.tsx、giscus-dynamic.tsx、code-enhancer.tsx
│   ├── posts/                      # posts-client.tsx(搜索 + 标签筛选 + 网格)+ article-card.tsx
│   ├── thoughts/thoughts-client.tsx# 碎碎念列表客户端(轮盘即列表 + 滚动恢复)
│   ├── reactbits/                  # 自托管 ReactBits:gooey-nav、lanyard、option-wheel、chroma-grid、
│   │                               #   split-text、text-type、shuffle、scroll-float(仅最小扩展,见约定)
│   ├── search/search.tsx           # 搜索弹窗(fuse.js,/posts 与 /thoughts 共用)
│   └── theme/                      # theme-provider.tsx(上下文)+ theme-picker.tsx(下拉)
├── lib/
│   ├── posts.ts                    # 解析 frontmatter、文章列表/筛选/标签、预计阅读时长
│   ├── thoughts.ts                 # 解析 frontmatter、排序、extractPreview 摘要
│   ├── accent-colors.ts            # useAccentColors()/readAccentColors() — 读取主题 accent CSS 变量
│   ├── card-face.ts                # buildCardFrontSvg():生成 480×724 hero 卡片正面 SVG(纯函数,TDD)
│   ├── mdx.ts                      # MDX 编译(unified 管线)
│   └── __tests__/                  # accent-colors / card-face / posts / thoughts 单测
└── styles/
    └── globals.css                 # 全部样式 + 6 套主题变量
```

## 路由

| 路由 | 用途 |
|------|------|
| `/` | 首页 — 单个居中放大的 Lanyard 3D 挂绳卡(介绍文案烘焙进卡片正面,见 `card-face.ts`)+ 下方「关于我」资料卡(GitHub 头像、文章/标签/始于统计、贡献图)。无文章列表、无搜索框。 |
| `/posts` | 文章列表 — ChromaGrid 网格(区域背景与 body 一致)、标签筛选胶囊、Fuse.js 搜索、滚动位置恢复(`posts-scroll`)。 |
| `/posts/[slug]` | 文章详情 — SplitText 标题、meta 错峰淡入、标签为 `<span>`、Giscus 评论、页面切换动效。 |
| `/thoughts` | 碎碎念 — 轮盘即列表:整页一个 OptionWheel,每项为标题+时间+预览富卡片,滚动切高亮、点击进详情;返回时从上次点击处平滑恢复。 |
| `/thoughts/[slug]` | 碎碎念详情 — 标题动效、MDX 渲染、Giscus 评论、返回链接。 |

## 布局

全站为**单个全局 GooeyNav 粘性头部 + 全宽内容**布局:

1. **全局头部**([src/components/nav/header.tsx](src/components/nav/header.tsx)):粘性 ReactBits GooeyNav,链接到 `/posts` 与 `/thoughts`(搜索入口按路由显隐,仅 /posts 与 /thoughts 显示)。
2. **首页**:自上而下为 hero(单个 Lanyard,文案烘焙进卡片,单栏布局 `clamp(480px, 100dvh - 56px, 880px)`)+「关于我」资料卡(GitHub 头像/统计/贡献图),全宽,无侧边栏、无文章列表、无搜索。
3. **文章/碎碎念页**:全宽内容流,右侧粘性 MDX 目录(TOC),顶部阅读进度条,底部 Giscus 评论。

无历史侧边栏;个人资料位于首页「关于我」资料卡。

## 主题系统(自研,无 next-themes)

通过 `[data-theme="..."]` CSS 属性选择器定义 6 套主题:

- `light` — 白色背景,indigo 强调色
- `dark` — 深色背景,浅 indigo 强调色
- `sepia` — 暖米色,copper 强调色
- `ocean` — 藏青深色,cyan 强调色
- `lavender` — 淡紫浅色,violet 强调色
- `midnight` — 极深色,emerald 强调色

主题持久化到 `localStorage("blog-theme")`;`<head>` 中的防闪烁脚本在水合前读取它(回退 `prefers-color-scheme`)。

**重要**:所有主题相关颜色都走 CSS 变量(`var(--bg-color)`、`var(--fg-color)`、`var(--color-accent)` 等),不用 Tailwind 主题 token;`@theme inline` 只定义交互/装饰 token。

每套主题定义 **6 色 accent 族** CSS 变量:`--color-accent` + `--color-accent-violet|pink|cyan|emerald|amber`。需要 JS 驱动颜色属性(GSAP 粒子色、Three.js 材质、ChromaGrid)的组件通过 `@/lib/accent-colors` 的 `useAccentColors()` / `readAccentColors()` 运行时读取,主题切换时重渲染。

## 构建与部署

- **静态导出**:[next.config.ts](next.config.ts) 设置 `output: 'export'` — 产物为纯静态站点(`out/`),无 Node 服务端。
- **`reactStrictMode: false`(必须保留)**:本机 AMD RX 6600M + ANGLE D3D11 组合下,StrictMode 双挂载 r3f Canvas 会残留两个 WebGL context,GPU 进程约 1 秒后崩溃(webglcontextlost → 3D 卡片变空白)。生产静态导出不受影响(StrictMode 双调用仅开发期),改回 true 前需先在真机上验证。
- **vercel.json**:Vercel 部署(`pnpm install` + `next build`);`/fonts/*` 加 1 年 immutable 缓存头。
- **搜索索引**:`/api/search` 路由 `dynamic = "force-static"`,构建时生成 `{posts, thoughts}` 双索引;客户端搜索弹窗直接 `fetch("/api/search")` 再交给 Fuse.js。

## 关键约定

- **Server Components 优先** — 仅在需要交互/浏览器 API 时加 `"use client"`
- **CSS 变量**做主题化,不用 Tailwind 的 `dark:` 变体
- **Tailwind v4** 用 `@import "tailwindcss"` + `@theme`,无 `tailwind.config.ts`
- **字体**:阿里巴巴普惠体 3.0 — `globals.css` 里 `@font-face` 自托管,`--font-sans` 与 `--font-heading` 都用它
- **MDX 管线**用 `unified`(remark-parse → remark-gfm → remark-rehype → rehype-slug → rehype-autolink-headings → rehype-pretty-code → rehype-stringify)
- **内容图片约定**:文章/碎碎念的图片放 `public/posts/{slug}/`、`public/thoughts/{slug}/`(与 content 目录同 slug 镜像),正文中用绝对路径标准 Markdown 引用,如 `![描述](/thoughts/my-slug/cover.png)`。原因:静态导出 + unified 管线无 `@next/mdx` 图片导入能力,只能走 `public/` 静态资源;按 slug 建子目录便于整目录删除与互不干扰。文件名用 kebab-case 纯 ASCII,避免 URL 编码问题。`.prose img` 已有圆角/边框/自适应样式,无需额外处理
- **ReactBits 配色必须走 `useAccentColors`/CSS 变量** — 动效组件禁止硬编码 hex;把 accent 族/CSS 变量传进去,主题切换时重渲染
- **颜色系统**:6 个 accent 色(indigo/violet/pink/cyan/emerald/amber)经主题 CSS 变量在标签与装饰元素间轮换
- **ChromaGrid 区域背景与 body 一致** — 两层区域级调暗遮罩已删除;卡片悬停光斑用 `color-mix(var(--color-accent) 18%)`,卡片渐变用 28% accent 稀释到 `--card-bg`
- **ReactBits vendor 边界**:官方组件只做最小扩展(加 prop、不改默认行为),如 OptionWheel 新增 `initialScrollTo`(返回位置恢复)/`onItemClick`(仅显式点击)/`renderItem`(富卡片);live2d-widget 编译文件一律不修改
- **Live2D 全自托管静态** — 无外部 CDN。mascot 延迟 1.5s 后从 `/live2d` 懒加载 `waifu-tips.js` + `waifu.css`;可拖动(鼠标 + 触摸),位置持久化到 `localStorage("waifu-position")` 跨页/刷新保持;3 个可循环切换模型(shizuku/Pio/Tia,Cubism 2,切换有对应欢迎语);带 `hitokoto`/`photo`/`info`/`quit` 工具;768px 以下画布收窄为 180px(`!important` 覆盖 waifu.css)+ `touch-action: none` 触摸拖动

## 测试与门禁

- `pnpm test` 只覆盖**纯逻辑** TDD(vitest,`environment: "node"`,include `src/**/*.test.ts`);jsdom@26 仅在组件真需要 DOM 时按需加,现有测试全部走 Node 环境
- 现有测试:`src/lib/__tests__/`(accent-colors / card-face / posts / thoughts)+ `src/app/api/search/__tests__/route.test.ts`
- UI/动效无单测先例,以 `pnpm build` + 手工验证清单(curl 冒烟 + 浏览器核对)为门禁
- `pnpm lint` 仓库基线已坏(历史遗留),只在改到相关文件时自查

## 命令

```bash
pnpm dev       # 开发服务器(热更新;3000 被占自动递增,见 scripts/find-port.mjs)
pnpm build     # 生产构建(静态导出到 out/)
pnpm start     # 静态预览 out/(output:'export' 下 next start 不可用;端口同样自动递增)
pnpm preview   # 重新构建 + 静态预览(next build && pnpm start)
pnpm test      # Vitest 单测(lib + 搜索路由)
pnpm lint      # ESLint(仓库基线已坏,只自查改动文件)
```

## 依赖

核心运行时:next、react、react-dom、@giscus/react、@vercel/analytics、fuse.js、lucide-react、gray-matter。

**动效 / 3D 栈**:gsap、@gsap/react、three、@react-three/fiber、@react-three/drei、@react-three/rapier、meshline。

**MDX / 内容**:unified 生态(remark-parse、remark-gfm、remark-rehype、rehype-slug、rehype-autolink-headings、rehype-pretty-code、rehype-stringify、unist-util-visit)。

**开发 / 测试**:vitest、jsdom(^26 — 已锁定;仅当组件真需要 DOM 时才加 `environment: "jsdom"`,否则保持 Node 环境)。

无 `next-themes`、无 `@next/mdx`、无 `@mdx-js/mdx`、无 `@fontsource/*`。

## 参考文档

- [docs/superpowers/README.md](docs/superpowers/README.md) — superpowers 工作流(brainstorming → writing-plans → SDD/executing-plans → requesting-code-review)产出的设计规格与实施计划**关键内容索引**(原始 plans/、specs/ 已归档删除)
