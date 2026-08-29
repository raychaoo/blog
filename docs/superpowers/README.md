# Superpowers 计划与规格总览

> 本文档是使用 **superpowers 工作流**(brainstorming → writing-plans → subagent-driven-development / executing-plans → requesting-code-review)产出的设计规格(specs)与实施计划(plans)的**关键内容摘要与索引**。
>
> 原始计划与规格文件(`plans/`、`specs/` 目录)已于 2026-08-01 归档删除,本文件为唯一留存的关键内容摘要。
>
> 更新日期:2026-08-01

## 索引

| # | 项目 | Spec | Plan | 状态 |
|---|------|------|------|------|
| 1 | 全站改造(Blog Redesign) | 早期手工文档,未归档 | `plans/2026-08-01-blog-redesign.md`(已删) | ✅ 已落地(15 任务) |
| 2 | 验收问题修复 | 验收清单 `question.md`(未提交) | `plans/2026-08-01-fix-qa-issues.md`(已删) | ✅ 已落地(6 任务) |
| 3 | Hero 内容烘焙进 Lanyard 卡片 | `specs/2026-08-01-hero-intro-into-lanyard-design.md`(已删) | `plans/2026-08-01-hero-intro-into-lanyard.md`(已删) | ✅ 已落地(4 任务) |
| 4 | ChromaGrid 区域背景对齐 body | `specs/2026-08-01-chromagrid-region-background-design.md`(已删) | 无(直接实施) | ✅ 已落地 |
| 5 | 碎碎念轮盘返回位置恢复 | `specs/2026-08-01-thoughts-wheel-scroll-restore-design.md`(已删) | `plans/2026-08-01-thoughts-wheel-scroll-restore.md`(已删) | ✅ 已落地(3 任务) |
| 6 | 看板娘多模型切换 + 拖动 | `specs/2026-08-01-live2d-mascot-models-design.md`(已删) | `plans/2026-08-01-live2d-mascot-models.md`(已删) | ✅ 已落地(5 任务) |

---

## 1. 全站改造(Blog Redesign)

**原文件**:`plans/2026-08-01-blog-redesign.md`(已删除)

**目标**:博客改造为「首页纯个人介绍 + 独立文章页 + 碎碎念页 + 全局看板娘 Live2D」的动效增强型站点,并重构目录结构。

**核心架构决策**:
- 目录抽离为按职责分组:`src/components/{nav, theme, search, home, posts, thoughts, mdx, live2d, reactbits}/`
- 路由扩展:`/`(首页)、`/posts`、`/posts/[slug]`、`/thoughts`、`/thoughts/[slug]`
- 从 DavidHDev/react-bits 自托管 8 个 ReactBits 动效组件到 `src/components/reactbits/`(gooey-nav / lanyard / chroma-grid / option-wheel / split-text / text-type / shuffle / scroll-float),配色统一走主题 CSS 变量
- 碎碎念与文章共用 unified MDX 管线与公共搜索组件(Fuse.js,`/api/search` 返回 `{posts, thoughts}` 双索引)
- Live2D 用 stevenjoezhang/live2d-widget v1 + Shizuku,全部自托管到 `public/`,以静态文件树驱动(无后端)
- 引入 vitest,仅对纯逻辑(lib 函数、API 映射)做 TDD;UI/动画以 `pnpm build` + 手工验证为门禁

**任务结构(15 个)**:
1. 测试基础设施 + posts 库基线测试(vitest + jsdom,4 测试)
2. 目录结构抽离(git mv 纯移动)
3. 下载自托管 ReactBits 组件(gooey-nav 颜色改 string 数组、chroma-grid 加 `renderItem`、补 `"use client"`)
4. 主题色解析工具 `src/lib/accent-colors.ts`(`readAccentColors`/`useAccentColors` + 6 色 fallback,TDD)
5. 全局粘性 GooeyNav 头部(搜索按路由显隐:仅 /posts 与 /thoughts)
6. 首页改造(SplitText 标题 + TextType tagline + Shuffle kicker + Lanyard 3D 挂绳卡 + 个人资料卡)
7. `/posts` 文章列表(ChromaGrid 网格 + `posts-scroll` sessionStorage 滚动恢复)
8. 公共搜索组件(先建 `src/lib/thoughts.ts` 最小骨架,依赖 Task 9)
9. 碎碎念内容层(`extractPreview` 摘要 + 2 篇样例内容,TDD)
10. `/thoughts` 列表页(OptionWheel 标题转轮 + Steps 风格时间线 + wheel-drop 入场动画)
11. `/thoughts/[slug]` 详情页(与文章共用 Giscus 评论)
12. 文章详情页动效(标题 SplitText、meta 错峰淡入、标签改 span、返回链接修正)
13. 全局看板娘 Live2D 自托管(`public/live2d/` + `public/live2d-api/` 静态 API 树)
14. 页面切换 + 按钮全局动效(Chromium MPA View Transitions + `prefers-reduced-motion` 降级)
15. 清理未用代码(sidebar/tag-context/tag-filter-wrapper)+ sitemap/CLAUDE.md 收尾

**关键文件**:`src/lib/accent-colors.ts`、`src/components/reactbits/*`、`src/components/live2d/live2d-mascot.tsx`、`src/lib/thoughts.ts`

---

## 2. 验收问题修复(fix-qa-issues)

**原文件**:`plans/2026-08-01-fix-qa-issues.md`(已删除)

**目标**:修复人工验收发现的 5 个问题。纯 UI/组件修复,不新增单测;门禁为 `pnpm test`(11 通过)+ `pnpm build` + curl 冒烟 + 手工验证清单。

**根因与修复(6 任务)**:

| 问题 | 根因 | 修复 |
|------|------|------|
| Lanyard 主题切换崩溃 | `cardFront` useMemo 依赖 `colors.accent`,主题切换 → SVG 变 → canvas 纹理重新合成崩溃 | `cardFront` 只依赖 `name`;lanyard.tsx 合成包 try/catch 回退原始纹理 |
| 首页多余按钮 | hero-actions 与顶部导航重复 | 删除按钮区与 `.btn-primary/.btn-secondary` 样式,导航职责交给 GooeyNav |
| ChromaGrid 卡片与背景对比过强 | 硬编码白色光斑 `rgba(255,255,255,0.3)` + 饱和 accent 渐变 | 光斑改 `color-mix(var(--color-accent) 18%)`,卡片渐变改 28% accent 稀释 → card-bg |
| 碎碎念重定向循环 | vendored OptionWheel `defaultSelected={3}` 与 2 条内容不匹配,挂载时触发 onChange → router.push;任何滚动也触发导航 | `defaultSelected={0}` + 扩展组件加 `onItemClick`(仅显式点击)+ `renderItem`;页面不传 `onChange` |
| OptionWheel 列表效果 | 原生行为与需求不符 | 重构为「轮盘即列表」:整页一个 OptionWheel,每项为标题+时间+预览富卡片,滚动只切高亮、点击才进详情 |

**任务结构**:1) Lanyard 修复 + 容器尺寸对齐 demo(`clamp(360px, 52vh, 560px)`);2) 移除 hero-actions;3) ChromaGrid 柔和化;4) 扩展 OptionWheel(2 个新 prop);5) `/thoughts` 重构为轮盘即列表(删时间线样式,加 `.thoughts-wheel-card`);6) 全站回归 + 路由冒烟表(7 条路由断言)。

**关键文件**:`src/components/home/hero.tsx`、`src/components/reactbits/lanyard.tsx`、`chroma-grid.tsx`、`option-wheel.tsx`、`src/components/thoughts/thoughts-client.tsx`

**落地提交**:`3772f12` stabilize lanyard → `20adcf3` remove hero buttons → `1ee9390` soften chroma grid → `13880a4` option wheel props → `55ae918` wheel-as-list → `c345f0b` cross-task nav fixes

---

## 3. Hero 内容烘焙进 Lanyard 卡片

**原文件**:`specs/2026-08-01-hero-intro-into-lanyard-design.md`、`plans/2026-08-01-hero-intro-into-lanyard.md`(已删除)

**目标**:把 hero 全部介绍内容(标签、名字、tagline、简介)烘焙进 Lanyard 3D 卡片正面贴图,hero 变为单个居中放大的 Lanyard。文字为静态,移除 Shuffle/SplitText/TextType。

**关键实测事实**(spec 已验证):
- `card.glb` 内嵌贴图图集 **1678×1677**;卡片正面 UV `{x:0, y:0, w:0.5, h:0.755}` → aspect ≈ **0.66**
- 旧 480×300 SVG(aspect 1.6)经 `cover` 合成水平裁掉约 60%,只有中央 ~41% 可见 → 新 SVG 必须 480×724 匹配正面 aspect
- 卡片顶部有金属 clip/clamp 网格 → SVG 顶部留 ≥40px 安全边距

**核心决策**:
- 新建纯函数模块 `src/lib/card-face.ts`:`buildCardFrontSvg({name, accent, tagline, intro})` 生成 480×724 SVG data URL;`wrapLines()` 贪心换行(CJK=1 宽度单位、` · ` 分隔符不断行、全角标点不触发断行);名字 XML 转义(GitHub API 用户输入)
- `lanyard.tsx` 新增 `cardScale` prop(默认 2.25),用外层 `<group scale={cardScale}>` 同时缩放 collider 与网格(rapier 支持缩放父组);移动端自动 ×0.8
- `hero.tsx` 删掉 DOM 文案块,只留 `<Lanyard frontImage={cardFront} cardScale={3.4} ...>`
- 中文文案固定:`VIBECODING · BLOG` / `你好，我是 {name}` / tagline 两行 / intro 两行

**任务结构(4 个)**:1) card-face.ts 纯模块 + TDD(6 测试);2) lanyard.tsx 加 `cardScale`;3) hero.tsx 重写 + globals.css 单栏布局(`clamp(480px, 100dvh - 56px, 880px)`);4) 全量验证 + 手动调参(`cardScale`/`fov`)。

**关键文件**:`src/lib/card-face.ts`、`src/components/reactbits/lanyard.tsx`、`src/components/home/hero.tsx`

**落地提交**:`39e4673` spec → `4db0b97` plan → `0bd5090` card-face → `612eca6`/`aa0d303` cardScale → `c4fcd77` hero rewrite → `1c0306b` layout/escaping hardening → `3aadb71`+ chromagrid bg

---

## 4. ChromaGrid 区域背景对齐 body

**原文件**:`specs/2026-08-01-chromagrid-region-background-design.md`(已删除)

**目标**:/posts 页 ChromaGrid 网格区域背景与 body 背景(`var(--bg-color)`)完全一致,任何时刻无色差,主题切换自动跟随。

**根因**:首次给根容器加 `background: var(--bg-color)` 无效,因为 ChromaGrid 自带**两层区域级调暗遮罩**(z-30/z-40,`backdropFilter: grayscale(1) brightness(0.78)`),把整块区域灰度+压暗(dark 主题实测 #121110 → **#0d0d0d**)。

**方案 A(已批准)**:删除两层调暗遮罩 div + 配套 GSAP 光圈逻辑(`fadeRef`、`--x/--y` quickSetter、moveTo/handleMove/handleLeave);`radius/damping/fadeOut/ease` 4 个 prop 失去用途一并移除;保留根容器背景、每张卡片自己的 accent 悬停光斑(`--mouse-x/--mouse-y` + `--spotlight-color`)。

**验收**:6 主题下区域与 body 取色相同;卡片 hover 光斑与微交互不变。

**落地提交**:`ec0f747`/`f9d88f4` spec → `3aadb71` → `171480e` remove dimming overlays

---

## 5. 碎碎念轮盘返回位置恢复

**原文件**:`specs/2026-08-01-thoughts-wheel-scroll-restore-design.md`、`plans/2026-08-01-thoughts-wheel-scroll-restore.md`(已删除)

**目标**:点击 /thoughts 轮盘某条进入详情,返回时轮盘**从顶部平滑滚动**恢复到之前点击的那条(动画恢复,非瞬间跳转)。

**方案(sessionStorage + 新 prop,与 /posts 的 `posts-scroll` 约定一致)**:
- 点击时把 **slug** 写入 `sessionStorage("thoughts-wheel-return")`(存 slug 非索引,列表变动安全);返回时读取即删(一次性恢复),slug 解析为索引,找不到回退 0
- OptionWheel 新增可选 prop `initialScrollTo?: number`:挂载后 effect 调 `applyTarget(initialScrollTo, true)`,夹取/吸附/选中同步/tick/rAF 全部复用现有逻辑,**零新增动画代码**;不改 `defaultSelected` 语义
- 无单测(仓库 UI 行为无单测先例,手动验证)

**任务结构(3 个)**:1) OptionWheel 加 `initialScrollTo`;2) ThoughtsClient 记录/恢复 slug;3) 收尾回归。

**边界**:slug 已删回退 0、详情页刷新后仍可恢复、目标为第 0 条无动画、非 loop 越界夹取、连续点击记录最后一次。

**关键文件**:`src/components/reactbits/option-wheel.tsx`、`src/components/thoughts/thoughts-client.tsx`

**落地提交**:`45539da` spec → `10c9b3b` initialScrollTo → `c4b08c4` restore → `db34102` click-only-open refinement

---

## 6. 看板娘多模型切换 + 拖动

**原文件**:`specs/2026-08-01-live2d-mascot-models-design.md`、`plans/2026-08-01-live2d-mascot-models.md`(已删除)

**目标**:新增 Pio/Tia 两个 Cubism 2 模型可循环切换;看板娘可拖动且位置跨页/刷新保持;切换显示对应欢迎语;全自托管零外网;补充移动端支持(180px 画布 + 触摸拖动)。

**核心决策(方案 A:复用内置能力 + 最小封装,不碰任何 vendor 编译文件)**:
- 模型从 fghrsh/live2d_api **稀疏克隆** Potion-Maker,裁剪换装贴图只留 `default-costume.png`(Pio 40.7MB/Tia 27.2MB → 合计 ~1.5MB),`textures.cache` 重写为扁平数组
- 配置:小部件 fetch `model_list.json` → `models: ["shizuku","pio","tia"]` + `messages[]` 切换欢迎语(`loadNextModel` 取 `messages[modelId]`,已从源码确认);`waifu-tips.json` 的 models 数组清理 jsdelivr 外链为本地路径(配置卫生)
- 拖动:`drag: true` 启用内置拖动(自带视口钳制);封装层 ~40 行:localStorage key `waifu-position` 存 `{top,left}`,MutationObserver 等 `#waifu` 出现后恢复,`mouseup` 保存(首次拖动前空串跳过);模块级 `bound` flag 防 StrictMode 双绑定
- 移动端:删 `window.innerWidth < 768` 早退;`#live2d` 180px `!important` 覆盖 waifu.css(运行时后注入)+ `touch-action: none`;`bindTouchDrag` 补 touch 等效拖动(touchmove 非被动 + preventDefault)

**任务结构(5 个)**:1) 自托管 Pio/Tia(下载+裁剪+完整性校验);2) 更新 model_list.json 与 waifu-tips.json;3) live2d-mascot.tsx 切换+拖动+位置记忆;4) 浏览器验证清单(9 项);5) 移动端支持。

**关键文件**:`src/components/live2d/live2d-mascot.tsx`、`public/live2d-api/model_list.json`、`public/live2d-api/model/{pio,tia}/`、`public/live2d/waifu-tips.json`

**落地提交**:`b59df45` spec → `fdb32d6` plan → `23dab7a` models → `5a51348` config → `9cdc462` drag+switch → `a058c2a` mobile docs → `37e4549` mobile support → `2df3616`/`b08e529` touch drag fixes

---

## 通用约定(跨项目沉淀)

- **执行方式**:计划头部标注 `REQUIRED SUB-SKILL: superpowers:subagent-driven-development (recommended) 或 executing-plans`;功能开发在隔离 worktree 中执行,完成后合并回本地 master(见 [[user-workflow-preferences]]);worktree 新装依赖遇 vitest WASI 错用 `pnpm install --force` 修复(见 [[pnpm-worktree-bindings-gotcha]])
- **门禁**:`pnpm test`(仅纯逻辑 TDD,Node env;jsdom 只在真需要 DOM 时用)+ `pnpm build` + curl 冒烟 + 手工验证清单;`pnpm lint` 仓库基线已坏,只对改动文件自查
- **主题约定**:所有颜色走 CSS 变量(`--color-accent` 6 色族、`--bg-color`、`--card-bg` 等),ReactBits 动画组件配色必须经 `useAccentColors()`/CSS 变量传入,禁止硬编码 hex;`color-mix` 优先用于柔和色
- **Vendor 边界**:ReactBits 组件官方 vendored,只做最小扩展(加 prop 不动默认行为);live2d-widget 编译文件一律不修改
- **规范**:server 组件优先;中文文案;`prefers-reduced-motion` 降级;提交信息 `feat:/fix:/refactor:/chore:/docs:` 每任务独立提交
