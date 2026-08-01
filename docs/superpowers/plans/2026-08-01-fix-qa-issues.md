# 验收问题修复 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复人工验收发现的 5 个问题：Lanyard 主题切换崩溃、首页多余按钮、ChromaGrid 卡片与背景对比过强、碎碎念念页重定向循环、OptionWheel 列表效果重新实现。

**Architecture:** Lanyard 崩溃通过稳定 `frontImage` prop（不再随主题色重新生成 SVG）+ 防御性 try/catch 消除；hero-actions 直接删除（导航已在顶部）；ChromaGrid 光斑与卡片渐变改为主题色柔和版（CSS `color-mix`）；碎碎念念重定向根因是 vendored OptionWheel 的 `defaultSelected={3}` 与 2 条内容不匹配导致挂载时触发 `onChange`（且任何滚动都触发导航）——扩展组件增加 `onItemClick`（仅显式点击触发）与 `renderItem`（富卡片渲染），页面重构为「轮盘即列表」：整页一个 OptionWheel，每项是标题+时间+预览卡片，滚动/拖动浏览、点击打开。

**Tech Stack:** Next.js 16、React 19、TypeScript、Tailwind v4、vendored reactbits 组件（OptionWheel/Lanyard/ChromaGrid）。

## Global Constraints

- 静态导出 `output: 'export'`：无服务端运行时；数据构建期读取。
- 主题色必须走 CSS 变量（`--color-accent`、`--card-bg`、`--fg-color`、`--muted-fg`、`--card-border` 等），禁止硬编码与主题不搭的颜色（CSS `color-mix` 优先）。
- Lanyard 是**官方 reactbits 组件原样 vendored**（非自写）——不要重写，只做最小修复。
- 用户未提交文件（`.claude/settings.json`、`next.config.ts`、`plan.md`）不得被触碰/提交；`question.md` 是验收清单，不提交。
- `pnpm lint` 基线本来就有存量错误——任务门禁用 `pnpm test` + `pnpm build` + curl 冒烟，不做全局 lint。
- 本计划为纯 UI/组件修复，无新纯逻辑——不新增单元测试；门禁为构建 + curl + 手工验证清单。
- 现有代码风格：双引号、server 组件优先、CSS 变量主题化。

---

### Task 1: 修复 Lanyard 主题切换崩溃 + 效果对齐官方 demo

**Files:**
- Modify: `src/components/home/hero.tsx`（稳定 `cardFront` prop）
- Modify: `src/components/reactbits/lanyard.tsx`（合成纹理防御）
- Modify: `src/styles/globals.css`（hero-lanyard 容器尺寸）

**Interfaces:**
- Consumes: 现有 `Hero` 组件与 vendored `Lanyard`（`frontImage` prop）。
- Produces: 主题切换不再触发纹理重新合成 → 不崩溃；容器高度对齐官方 demo 观感。

**根因（已验证代码）:** `hero.tsx` 的 `cardFront` 是 `useMemo(..., [name, colors.accent])`——主题切换 → accent 变 → SVG data URL 变 → Lanyard 收到新 `frontImage` → `lanyard.tsx:191-234` 的 `cardMap` useMemo 重新执行 canvas 合成（`ctx.drawImage` 多张图片含跨资源加载时序）→ 崩溃。

- [ ] **Step 1: 稳定 `cardFront`（hero.tsx）**

找到 `Hero` 组件内（约第 70-74 行）：

```tsx
  const cardFront = useMemo(
    () => buildCardFrontSvg(name, "全栈开发者 · React / Next.js / TypeScript", colors.accent),
    [name, colors.accent]
  );
```

改为（只依赖 `name`——SVG 中的 accent 色在首次渲染时定格，主题切换不再重新生成）：

```tsx
  const cardFront = useMemo(
    () => buildCardFrontSvg(name, "全栈开发者 · React / Next.js / TypeScript", colors.accent),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [name]
  );
```

同时把 Lanyard 容器（约第 86-88 行）的 `aria-hidden` 移除（卡片可拖拽交互，不应隐藏语义）：

```tsx
      <div className="hero-lanyard">
```

- [ ] **Step 2: 合成纹理防御（lanyard.tsx）**

`lanyard.tsx:191-234` 的 `cardMap` useMemo——把 canvas 合成主体包进 try/catch（任何图片加载/绘制异常都回退到原始纹理，杜绝崩溃）：

```tsx
  const cardMap = useMemo(() => {
    const baseMap = materials.base.map as THREE.Texture;
    if (!frontImage && !backImage) return baseMap;
    try {
      const baseImg = baseMap.image as any;
      const W = baseImg.width;
      const H = baseImg.height;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) return baseMap;
      ctx.drawImage(baseImg, 0, 0, W, H);
      // ...(drawFitted 定义与两处 drawFitted 调用保持原样)...
      const composite = new THREE.CanvasTexture(canvas);
      composite.colorSpace = THREE.SRGBColorSpace;
      composite.flipY = baseMap.flipY;
      composite.anisotropy = 16;
      composite.needsUpdate = true;
      return composite;
    } catch {
      return baseMap;
    }
  }, [frontImage, backImage, imageFit, frontTex, backTex, materials.base.map]);
```

（把 `if (!ctx) return baseMap;` 之前的所有代码包进 try；`drawFitted` 定义与调用原样保留在 try 内。）

- [ ] **Step 3: hero-lanyard 容器尺寸对齐 demo（globals.css）**

找到 `.hero-lanyard` 规则（约 806-808 行）：

```css
.hero-lanyard {
  height: 420px;
  min-height: 300px;
}
```

改为（更高、居中，接近官方 demo 的展示占比）：

```css
.hero-lanyard {
  height: clamp(360px, 52vh, 560px);
  min-height: 360px;
}
```

- [ ] **Step 4: 验证**

Run: `pnpm test`（11 通过）与 `pnpm build`（干净）。
Run: `pnpm dev` 后台 + `curl -s localhost:3000/ | grep -c hero-lanyard`（容器存在）后杀进程。

**手工验证（用户执行）:** 首页反复切换 6 个主题——Lanyard 不得崩溃；绳子摆动与官方 reactbits demo 观感一致。

- [ ] **Step 5: 提交**

```bash
git add src/components/home/hero.tsx src/components/reactbits/lanyard.tsx src/styles/globals.css
git commit -m "fix: stabilize lanyard card texture across theme switches"
```

---

### Task 2: 首页移除 hero-actions 按钮区

**Files:**
- Modify: `src/components/home/hero.tsx`
- Modify: `src/styles/globals.css`

**Interfaces:**
- Consumes: 无。Produces: 首页只保留 kicker/标题/tagline/介绍段/Lanyard；导航职责全部交给顶部 GooeyNav。

- [ ] **Step 1: 删除按钮区（hero.tsx）**

删除整个（约第 78-86 行）：

```tsx
        <div className="hero-actions flex flex-wrap gap-3">
          <Link href="/posts" className="btn-press btn-primary">
            浏览文章
          </Link>
          <Link href="/thoughts" className="btn-press btn-secondary">
            碎碎念念
          </Link>
        </div>
```

删除 `import Link from "next/link";`（hero.tsx 中 Link 不再被使用）。

- [ ] **Step 2: 清理无用按钮样式（globals.css）**

删除 `.btn-primary` 与 `.btn-secondary` 两个规则块（约 820-851 行）。**保留** `.btn-press:active`（其他页面仍在用：posts/thoughts 详情返回链接、article-card、theme-picker）。

- [ ] **Step 3: 验证**

Run: `pnpm build`（干净）。
Run: `pnpm dev` 后台 + `curl -s localhost:3000/`——HTML 不得包含 `浏览文章`；`grep -rn "btn-primary\|btn-secondary" src/` 应为空；杀进程。

- [ ] **Step 4: 提交**

```bash
git add src/components/home/hero.tsx src/styles/globals.css
git commit -m "refactor: remove hero action buttons, nav covers navigation"
```

---

### Task 3: ChromaGrid 卡片与 body 背景视觉融合

**Files:**
- Modify: `src/components/reactbits/chroma-grid.tsx`（光斑颜色）
- Modify: `src/components/posts/posts-client.tsx`（卡片渐变）

**Interfaces:**
- Consumes: ChromaGrid 卡片 `--spotlight-color` CSS 变量与 `gradient` 字段。Produces: 卡片/光斑与 body 背景过渡柔和，6 主题下不刺眼。

**根因:** 光斑是硬编码白色 `rgba(255,255,255,0.3)` 径向渐变（chroma-grid.tsx:181），在深色背景上 contrast 过强；卡片渐变 `linear-gradient(160deg, var(--color-accent), var(--bg-color) 180%)` 从饱和 accent 起始，与 body 差异大。

- [ ] **Step 1: 光斑改主题柔和色（chroma-grid.tsx）**

找到卡片 style 里的（约第 179-183 行）：

```tsx
          style={
            {
              '--card-border': c.borderColor || 'transparent',
              background: c.gradient,
              '--spotlight-color': 'rgba(255,255,255,0.3)'
            } as React.CSSProperties
          }
```

改为（accent 色 18% 透明版——悬停光斑柔和且跟随主题）：

```tsx
          style={
            {
              '--card-border': c.borderColor || 'transparent',
              background: c.gradient,
              '--spotlight-color': 'color-mix(in srgb, var(--color-accent) 18%, transparent)'
            } as React.CSSProperties
          }
```

- [ ] **Step 2: 卡片渐变柔和化（posts-client.tsx）**

找到 items 映射里的（约第 47-48 行）：

```tsx
    gradient: `linear-gradient(160deg, var(--color-accent), var(--bg-color) 180%)`,
```

改为（accent 稀释到 28% 融入卡片底色，渐变终点用 card-bg）：

```tsx
    gradient: `linear-gradient(160deg, color-mix(in srgb, var(--color-accent) 28%, var(--card-bg)), var(--card-bg) 130%)`,
```

- [ ] **Step 3: 验证**

Run: `pnpm build`（干净）。
Run: `pnpm dev` 后台 + `curl -s localhost:3000/posts | grep -c "chroma\|article-card"` > 0；杀进程。

**手工验证（用户执行）:** `/posts` 悬停卡片——光斑柔和、卡片与背景过渡自然；6 主题各看一眼。

- [ ] **Step 4: 提交**

```bash
git add src/components/reactbits/chroma-grid.tsx src/components/posts/posts-client.tsx
git commit -m "fix: soften chroma grid spotlight and card gradient for theme harmony"
```

---

### Task 4: 扩展 vendored OptionWheel（onItemClick + renderItem）

**Files:**
- Modify: `src/components/reactbits/option-wheel.tsx`

**Interfaces:**
- Consumes: 现有 OptionWheel 全部行为（**保持默认行为不变**）。
- Produces:
  - `onItemClick?: (index: number, item: string) => void` —— **仅在用户显式点击选项时**触发（拖动/滚动/键盘/挂载都不触发）。
  - `renderItem?: (item: string, index: number, selected: boolean) => React.ReactNode` —— 自定义选项内容；提供时选项 div 取消 `whitespace-nowrap`，样式类由自定义内容自持。

- [ ] **Step 1: 增加 props 与 refs**

`OptionWheelProps`（第 6-27 行）新增两个字段：

```tsx
  onItemClick?: (index: number, item: string) => void;
  renderItem?: (item: string, index: number, selected: boolean) => React.ReactNode;
```

解构处（第 61-82 行）新增：

```tsx
  onItemClick,
  renderItem,
```

组件体 refs 区（`onChangeRef` 之后，约第 90 行）新增并同步：

```tsx
  const onItemClickRef = useRef(onItemClick);
  // ...
  onItemClickRef.current = onItemClick;
```

- [ ] **Step 2: 点击时触发 onItemClick**

`handleItemClick`（第 268-281 行）末尾、`applyTarget(cur + d, true)` 之后追加：

```tsx
      onItemClickRef.current?.(index, cfg.items[index]);
```

（`handleItemClick` 开头已有 `if (dragMovedRef.current) return;`——拖动不算点击，天然满足「仅显式点击」。）

- [ ] **Step 3: renderItem 渲染分支**

选项 div 的 className（第 336-338 行）中 `whitespace-nowrap` 改为条件：

```tsx
          className={`absolute top-1/2 cursor-pointer leading-none will-change-[transform,opacity,filter] [font-size:var(--ow-font-size)] [color:color-mix(in_srgb,var(--ow-active-color)_calc(var(--ow-p,0)*100%),var(--ow-text-color))] ${
            side === 'right' ? 'right-[var(--ow-inset)] origin-right' : 'left-[var(--ow-inset)] origin-left'
          } ${selectedIndex === index ? 'font-medium' : 'font-extralight'} ${renderItem ? '' : 'whitespace-nowrap'}`}
```

children（第 340-342 行）改为：

```tsx
          {renderItem ? renderItem(label, index, selectedIndex === index) : label}
```

- [ ] **Step 4: 验证**

Run: `pnpm test`（11 通过）与 `pnpm build`（干净）——现有用法（无 renderItem/onItemClick）行为不变。
Run: `grep -rn "onItemClick\|renderItem" src/components/reactbits/option-wheel.tsx` 确认 4 处都就位。

- [ ] **Step 5: 提交**

```bash
git add src/components/reactbits/option-wheel.tsx
git commit -m "feat: extend option wheel with onItemClick and renderItem"
```

---

### Task 5: /thoughts 重构为「轮盘即列表」+ 修复重定向循环

**Files:**
- Rewrite: `src/components/thoughts/thoughts-client.tsx`
- Modify: `src/styles/globals.css`（删时间线样式，加轮盘卡片样式）

**Interfaces:**
- Consumes: `ThoughtView`（page.tsx 传入，`ThoughtMeta & { preview: string }`）、扩展后的 `OptionWheel`（Task 4）、`extractPreview`（服务端已算好）。
- Produces: `/thoughts` 页面 = 整页一个 OptionWheel：每项为「标题+时间+预览」富卡片，沿轮盘曲线排列；滚动/拖动只改变选中高亮**不导航**；点击卡片才进详情。**重定向循环修复**。

**根因（已验证代码）:** vendored OptionWheel 默认 `defaultSelected={3}`；`/thoughts` 只有 2 条时，挂载 effect（option-wheel.tsx:295-297）把 3 钳制为 1 → `idx(1) !== selectedRef(3)` → 触发 `onChange` → `thoughts-client` 的 `handleSelect` → `router.push` → 每次进入 `/thoughts` 都被重定向到详情页。且滚动/拖动/键盘也会触发 `onChange` 导致误导航。

- [ ] **Step 1: 重写 `src/components/thoughts/thoughts-client.tsx`**

```tsx
"use client";

import { useRouter } from "next/navigation";
import OptionWheel from "@/components/reactbits/option-wheel";
import type { ThoughtMeta } from "@/lib/thoughts";

interface ThoughtView extends ThoughtMeta {
  preview: string;
}

interface Props {
  thoughts: ThoughtView[];
}

export default function ThoughtsClient({ thoughts }: Props) {
  const router = useRouter();
  const titles = thoughts.map((t) => t.frontmatter.title);

  function handleSelect(idx: number) {
    const target = thoughts[idx];
    if (target) router.push(`/thoughts/${target.slug}`);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">碎碎念念</h1>
      <p className="text-sm text-muted-fg mt-1">共 {thoughts.length} 条 · 滚动或拖动轮盘浏览，点击打开</p>

      {thoughts.length > 0 && (
        <div className="wheel-list mx-auto w-full max-w-md mt-4 h-[460px] sm:h-[520px]">
          <OptionWheel
            items={titles}
            defaultSelected={0}
            onItemClick={handleSelect}
            renderItem={(title, i, selected) => {
              const t = thoughts[i];
              return (
                <div className={`thoughts-wheel-card ${selected ? "selected" : ""}`}>
                  <div className="flex items-baseline justify-between gap-3 flex-wrap">
                    <span className="font-heading font-semibold text-sm">{title}</span>
                    <time dateTime={t.frontmatter.date} className="text-[11px] text-muted-fg">
                      {new Date(t.frontmatter.date).toLocaleDateString("zh-CN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </time>
                  </div>
                  <p className="text-xs text-muted-fg leading-relaxed mt-1 line-clamp-2">{t.preview}</p>
                </div>
              );
            }}
            textColor="var(--muted-fg)"
            activeColor="var(--color-accent)"
            side="left"
            inset={40}
            tilt={3}
            fontSize={3.5}
            spacing={1.6}
            blur={0.5}
            fade={0.35}
          />
        </div>
      )}
    </div>
  );
}
```

关键点：
- `defaultSelected={0}`：挂载时 `0 === selectedRef(0)` → **不触发 onChange/onItemClick** → 不再自动重定向。
- 导航只走 `onItemClick`（仅显式点击）；滚动/拖动只改高亮。
- 不再传 `onChange`——彻底切断「选中变化即导航」路径。
- 轮盘容器 `max-w-md mx-auto` 居中；`h-[460px] sm:h-[520px]` 给足滚动空间；`tilt={3}` 缓弯（Steps 步进感），`fontSize/spacing` 控制行距（rowH = 3.5×1.6×16 ≈ 90px，容纳卡片高度）。
- 若视觉上卡片间距/弯曲度不理想，可微调 `spacing`/`tilt`/`fade`/`blur`（这是唯一需要视觉调参的部分）。

- [ ] **Step 2: 样式（globals.css）**

**删除**整个 `.thoughts-timeline`、`.thoughts-item`、`.thoughts-card`、`@keyframes wheel-drop` 及对应 `prefers-reduced-motion` 块（约 840-915 行，全部不再使用）。

**追加**轮盘卡片样式：

```css
/* ── Thoughts wheel-as-list cards ── */
.thoughts-wheel-card {
  width: 320px;
  max-width: 78vw;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid var(--card-border);
  background: var(--card-bg);
  box-shadow: 0 6px 20px -14px rgba(0, 0, 0, 0.5);
  transition: border-color 0.2s ease, background-color 0.2s ease;
}
.thoughts-wheel-card.selected {
  border-color: var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 9%, var(--card-bg));
}
```

- [ ] **Step 3: 验证**

Run: `pnpm test`（11 通过）与 `pnpm build`（干净）。
Run: `pnpm dev` 后台 + `curl -s localhost:3000/thoughts`——HTML 含 `thoughts-wheel-card`、两个标题、`defaultSelected` 相关标记无（客户端渲染，验证容器与文案存在即可）；杀进程。

**手工验证（用户执行，重点）:**
1. 直接访问 `/thoughts`——**不再被自动重定向**到详情页；
2. 滚动/拖动轮盘——只切换高亮，**不跳转**；
3. 点击某张卡片——进入对应 `/thoughts/[slug]`；
4. 详情页点「返回碎碎念念」——回到列表页，**停留**（不再弹回）；
5. 卡片视觉：选中态 accent 描边、未选中态半透明（组件自带距离淡化）。

- [ ] **Step 4: 提交**

```bash
git add src/components/thoughts/thoughts-client.tsx src/styles/globals.css
git commit -m "fix: rework thoughts list as option-wheel with click-only navigation"
```

---

### Task 6: 全站回归 + 收尾

**Files:**
- 无代码改动（除非回归发现问题）

**Interfaces:**
- Consumes: 全部修复。Produces: 验收就绪状态。

- [ ] **Step 1: 全量门禁**

```bash
pnpm test        # 11 通过
pnpm build       # 干净，15 个静态页
```

- [ ] **Step 2: 路由冒烟（后台 dev server + curl）**

| 路由 | 断言 |
|---|---|
| `/` | 200；含 hero 标题；不含「浏览文章」 |
| `/posts` | 200；含文章标题；`color-mix` 渐变在 CSS 中 |
| `/posts/hello-world` | 200；含返回文章 |
| `/thoughts` | 200；含 thoughts-wheel-card 与两条标题 |
| `/thoughts/first-murmur` | 200；含正文与 Giscus 容器 |
| `/thoughts/does-not-exist` | 404 |
| `/api/search` | JSON 含 posts(5) 与 thoughts(2) |

检查完杀进程。

- [ ] **Step 3: 交付手工验证清单（用户执行）**

1. 首页：6 主题切换 Lanyard 不崩溃；无按钮区；rope 观感对齐 demo；
2. `/posts`：卡片悬停光斑柔和；6 主题背景过渡自然；
3. `/thoughts`：无自动重定向；滚动不跳转；点击进详情；返回停留；
4. 全局：搜索、GooeyNav、看板娘仍正常。

- [ ] **Step 4: 提交（如有回归修复）**

```bash
git add -A  # 仅当回归发现问题并修复时；正常情况本任务无提交
git commit -m "fix: regression fixes from final QA"
```

---

## Self-Review 记录

- 验收问题 1（Lanyard 崩溃/效果）→ Task 1；「是否调用组件库」→ 已在计划中说明是官方 vendored 组件，Task 1 只做最小修复与尺寸对齐。
- 验收问题 2（hero-actions）→ Task 2。
- 验收问题 3（ChromaGrid 背景对比）→ Task 3（光斑 accent 柔和色 + 卡片渐变稀释）。
- 验收问题 4（重定向循环）→ Task 5 根因修复（defaultSelected=0 + onItemClick 点击才导航 + 不传 onChange）；根因已在计划中引用 option-wheel.tsx 行号验证。
- 验收问题 5（OptionWheel 重新实现）→ Task 4（组件扩展）+ Task 5（轮盘即列表），方案为用户确认的「轮盘即列表」。
- 类型一致性：Task 4 新增的 `onItemClick`/`renderItem` 签名与 Task 5 使用处一致（`renderItem: (item, index, selected) => ReactNode`，`onItemClick: (index, item) => void`）；`ThoughtView` 结构沿用现有 page.tsx 传入。
- 无占位符：所有改动均有确切代码与位置；唯一需视觉调参的参数（spacing/tilt/fade）已给出起始值与调整说明。
