# Blog Redesign (文章页 / 碎碎念念 / 看板娘 / ReactBits 动效) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将博客改造为「首页纯个人介绍 + 独立文章页 + 新增碎碎念念页 + 全局看板娘 Live2D」的动效增强型站点，并重构项目目录结构。

**Architecture:** 目录先抽离为按职责分组的文件夹（nav/theme/search/home/posts/thoughts/mdx/live2d/reactbits）；路由扩展为 `/`（首页）、`/posts`（文章列表）、`/posts/[slug]`、`/thoughts`（碎碎念念列表）、`/thoughts/[slug]`；从 reactbits（GitHub 仓库 DavidHDev/react-bits，ts-tailwind 变体）下载 8 个动效组件自托管到 `src/components/reactbits/`，统一用主题 CSS 变量适配配色；碎碎念念与文章共用 MDX 管线（unified）与封装后的公共搜索组件；Live2D 使用 stevenjoezhang/live2d-widget v1 + Shizuku 模型，全部自托管到 `public/`，以静态 API 树方式驱动（无需后端）。

**Tech Stack:** Next.js 16 (App Router, `output: 'export'`)、React 19、TypeScript 5、Tailwind CSS v4；新增依赖：`gsap`、`@gsap/react`、`three`、`@react-three/fiber`、`@react-three/drei`、`@react-three/rapier`、`meshline`；测试：`vitest` + `jsdom`（仅覆盖纯逻辑，见下文验证策略）。

## Global Constraints

- 静态导出 `output: 'export'`：所有数据必须构建期读取（fs / 静态 JSON），禁止服务端运行时；客户端的 fetch 只允许请求静态生成的 `/api/*` 路由。
- 主题色必须复用现有 CSS 变量（`--color-accent`、`--color-accent-violet/pink/cyan/emerald/amber`、`--bg-color`、`--fg-color`、`--muted-fg`、`--card-bg`、`--card-border` 等，定义于 `src/styles/globals.css`），禁止硬编码与主题不搭的颜色。
- ReactBits 动效组件全部自托管在 `src/components/reactbits/`，配色通过 wrapper 层传入主题色。
- 文案使用中文；「碎碎念念」为统一命名（规格中一处笔误写为「岁岁念念」）。
- 页面中的按钮与页面跳转都必须有动画效果；尊重 `prefers-reduced-motion`。
- 服务器组件优先，仅交互组件加 `"use client"`。
- 本项目无任何测试基础设施：计划引入轻量 vitest，**仅对纯逻辑（lib 函数、API 映射）做 TDD**；UI/动画组件以 `pnpm build` + `pnpm dev` 手工验证为门禁（见各任务 Verify 步骤）。
- 遵守 AGENTS.md：动手写 Next.js 代码前先查阅 `node_modules/next/dist/docs/` 中相关指南（Task 1 中有一次盘点，后续任务如需路由/布局 API 变动时再次查阅）。
- 未使用的旧代码（sidebar、tag-context、tag-filter-wrapper 等）**最后一步**再删除。
- 现有代码风格：单引号在部分文件、双引号在部分文件（Prettier 配置为 double quotes），提交前跑 `pnpm lint` 与 Prettier。

---

### Task 1: 测试基础设施 + posts 库的基准确认测试

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`（scripts + devDependencies）
- Create: `src/lib/__tests__/posts.test.ts`

**Interfaces:**
- Consumes: 现有 `src/lib/posts.ts` 的 `estimateReadingTime(content: string): number` 与 `getAllPosts(): PostMeta[]`（不改动）。
- Produces: `pnpm test` 命令；后续所有任务用它跑测试。

- [ ] **Step 1: 安装依赖并配置 vitest**

```bash
pnpm add -D vitest jsdom
```

- [ ] **Step 2: 写测试**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
```

Create `src/lib/__tests__/posts.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { estimateReadingTime, getAllPosts } from "../posts";

describe("estimateReadingTime", () => {
  it("returns at least 1 minute for empty content", () => {
    expect(estimateReadingTime("")).toBe(1);
  });

  it("counts 350 CJK chars as 1 minute", () => {
    expect(estimateReadingTime("汉".repeat(350))).toBe(1);
  });

  it("counts 200 English words as 1 minute", () => {
    const en = Array.from({ length: 200 }, () => "word").join(" ");
    expect(estimateReadingTime(en)).toBe(1);
  });
});

describe("getAllPosts", () => {
  it("returns posts sorted newest first", () => {
    const posts = getAllPosts();
    const dates = posts.map((p) => new Date(p.frontmatter.date).getTime());
    expect(dates).toEqual([...dates].sort((a, b) => b - a));
  });
});
```

- [ ] **Step 3: 添加 test script**

Modify `package.json` scripts:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest run"
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `pnpm test`
Expected: 4 tests PASS（`getAllPosts` 需要 `content/posts/` 下已有文章，当前有 5 篇）。

- [ ] **Step 5: 盘点 Next 16 文档（AGENTS.md 要求）**

```bash
ls node_modules/next/dist/docs/
```

读一遍列出的 guide 文件名即可，后续任务涉及 App Router 路由/布局时回到对应文档确认 API（尤其 `params` 为 Promise、静态导出限制）。

- [ ] **Step 6: 提交**

```bash
git add vitest.config.ts package.json src/lib/__tests__/posts.test.ts
git commit -m "test: add vitest setup and posts lib tests"
```

---

### Task 2: 目录结构抽离（纯移动，保持行为不变）

**Files:**
- Move: `src/components/header.tsx` → `src/components/nav/header.tsx`
- Move: `src/components/theme-provider.tsx`, `src/components/theme-picker.tsx` → `src/components/theme/`
- Move: `src/components/progress-bar.tsx` → `src/components/mdx/`
- Move: `src/components/search.tsx` → `src/components/search/search.tsx`
- Move: `src/components/home-client.tsx`, `src/components/github-contributions.tsx` → `src/components/home/`
- Move: `src/components/article-card.tsx` → `src/components/posts/`
- Move: `src/components/toc.tsx`, `src/components/giscus.tsx`, `src/components/giscus-dynamic.tsx`, `src/components/code-enhancer.tsx` → `src/components/mdx/`
- Modify: `src/app/layout.tsx`, `src/components/nav/header.tsx`(刚移入), `src/components/home/home-client.tsx`(刚移入), `src/components/tag-filter-wrapper.tsx`, `src/app/posts/[slug]/page.tsx` 中的 import 路径

**Interfaces:**
- Produces: 最终目录结构（后续任务都在新路径上工作）：
  ```
  src/components/{nav,theme,search,home,posts,thoughts,mdx,live2d,reactbits}/
  ```
- 保留原位待删：`tag-context.tsx`、`tag-filter-wrapper.tsx`、`sidebar.tsx`（Task 15 删除）。
- `giscus-dynamic.tsx` 内部用相对路径 `./giscus` 动态 import——两个文件同移到 `mdx/` 后无需改。

- [ ] **Step 1: 执行移动（git mv 保留历史）**

```bash
git mv src/components/header.tsx src/components/nav/header.tsx
git mv src/components/theme-provider.tsx src/components/theme/theme-provider.tsx
git mv src/components/theme-picker.tsx src/components/theme/theme-picker.tsx
git mv src/components/progress-bar.tsx src/components/mdx/progress-bar.tsx
git mv src/components/search.tsx src/components/search/search.tsx
git mv src/components/home-client.tsx src/components/home/home-client.tsx
git mv src/components/github-contributions.tsx src/components/home/github-contributions.tsx
git mv src/components/article-card.tsx src/components/posts/article-card.tsx
git mv src/components/toc.tsx src/components/mdx/toc.tsx
git mv src/components/giscus.tsx src/components/mdx/giscus.tsx
git mv src/components/giscus-dynamic.tsx src/components/mdx/giscus-dynamic.tsx
git mv src/components/code-enhancer.tsx src/components/mdx/code-enhancer.tsx
```

- [ ] **Step 2: 更新 import（共 5 处）**

`src/app/layout.tsx`（3 行）：

```tsx
import BlogThemeProvider from "@/components/theme/theme-provider";
import Header from "@/components/nav/header";
import ProgressBar from "@/components/mdx/progress-bar";
```

`src/components/nav/header.tsx`（2 行）：

```tsx
import ThemePicker from "../theme/theme-picker";
import SearchModal from "../search/search";
```

`src/components/home/home-client.tsx`（1 行，同目录改相对路径）：

```tsx
import GithubContributions from "./github-contributions";
```

`src/components/tag-filter-wrapper.tsx`（1 行）：

```tsx
import ArticleCard from "@/components/posts/article-card";
```

`src/app/posts/[slug]/page.tsx`（3 行）：

```tsx
import Toc from "@/components/mdx/toc";
import DynamicGiscus from "@/components/mdx/giscus-dynamic";
import CodeEnhancer from "@/components/mdx/code-enhancer";
```

- [ ] **Step 3: 验证**

Run: `pnpm lint && pnpm build`
Expected: 无报错；`pnpm test` 仍 4 个 PASS。

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "refactor: group components into feature folders"
```

---

### Task 3: 下载并自托管 ReactBits 动效组件 + 安装依赖

**Files:**
- Create: `src/components/reactbits/{gooey-nav,lanyard,chroma-grid,option-wheel,split-text,text-type,shuffle,scroll-float}.tsx`（小写文件名，内容来自 reactbits 仓库）
- Create: `public/lanyard/card.glb`、`public/lanyard/lanyard.png`
- Modify: `package.json`（dependencies）

**Interfaces:**
- Produces（组件 props 均为后续任务使用）:
  - `GooeyNav({ items: {label, href}[], colors: string[], activeIndex?: number, ... })`
  - `Lanyard({ frontImage?: string, ... })`（其余可选 props 保留原件默认）
  - `ChromaGrid({ items: ChromaItem[], renderItem?: (item, i) => ReactNode, radius?, damping?, fadeOut?, ease? })`
  - `OptionWheel({ items: string[], onChange?: (idx, item) => void, textColor?, activeColor?, className? })`
  - `SplitText({ text, className?, delay?, from?, to? })`
  - `TextType({ text: string|string[], className?, textColors?, as?, ... })`
  - `Shuffle({ text, className?, shuffleDirection?, ... })`
  - `ScrollFloat({ children, ... })`

- [ ] **Step 1: 安装依赖**

```bash
pnpm add gsap @gsap/react three @react-three/fiber @react-three/drei @react-three/rapier meshline
```

说明：`SplitText/Shuffle/ScrollFloat/ChromaGrid` 用 gsap（含 `gsap/SplitText` 插件，GSAP 3.13+ 免费内置）；`Lanyard` 用 R3F + rapier 物理 + meshline。

- [ ] **Step 2: 下载 8 个组件源文件到 `src/components/reactbits/`（ts-tailwind 变体，内嵌 `<style>`，自包含）**

```bash
mkdir -p src/components/reactbits
cd src/components/reactbits
BASE="https://raw.githubusercontent.com/DavidHDev/react-bits/main/src/ts-tailwind"
curl -fsSL -o gooey-nav.tsx   "$BASE/Components/GooeyNav/GooeyNav.tsx"
curl -fsSL -o lanyard.tsx     "$BASE/Components/Lanyard/Lanyard.tsx"
curl -fsSL -o chroma-grid.tsx "$BASE/Components/ChromaGrid/ChromaGrid.tsx"
curl -fsSL -o option-wheel.tsx "$BASE/Components/OptionWheel/OptionWheel.tsx"
curl -fsSL -o split-text.tsx  "$BASE/TextAnimations/SplitText/SplitText.tsx"
curl -fsSL -o text-type.tsx   "$BASE/TextAnimations/TextType/TextType.tsx"
curl -fsSL -o shuffle.tsx     "$BASE/TextAnimations/Shuffle/Shuffle.tsx"
curl -fsSL -o scroll-float.tsx "$BASE/TextAnimations/ScrollFloat/ScrollFloat.tsx"
```

- [ ] **Step 3: 下载 Lanyard 资源到 `public/lanyard/`**

```bash
mkdir -p public/lanyard
curl -fsSL -o public/lanyard/card.glb "https://raw.githubusercontent.com/DavidHDev/react-bits/main/src/ts-tailwind/Components/Lanyard/card.glb"
curl -fsSL -o public/lanyard/lanyard.png "https://raw.githubusercontent.com/DavidHDev/react-bits/main/src/ts-tailwind/Components/Lanyard/lanyard.png"
```

- [ ] **Step 4: 修改 `lanyard.tsx` 的资源引用（Next 无法直接 import .glb）**

把文件头部的两行（约第 20-21 行）：

```tsx
import cardGLB from './card.glb';
import lanyard from './lanyard.png';
```

替换为：

```tsx
const cardGLB = '/lanyard/card.glb';
const lanyard = '/lanyard/lanyard.png';
```

并把函数签名默认值里 `lanyardImage = null` 保持不动（`useTexture(lanyardImage || lanyard)` 会落到本地 URL）。

- [ ] **Step 5: 给缺少指令的组件补 `"use client"`**

`TextType.tsx` 与 `lanyard.tsx` 自带 `'use client'`；其余 6 个文件（gooey-nav、chroma-grid、option-wheel、split-text、shuffle、scroll-float）在文件**第一行**补上 `"use client";`（它们全部在客户端用到 hooks/gsap/事件，且会被服务端组件引用，例如 Task 11 在 server page 里用 SplitText——缺少该指令会导致 RSC 渲染错误）。

- [ ] **Step 6: 按用途微调 3 个组件（其余 5 个原文保留）**

**5a. `gooey-nav.tsx` — 颜色数组改为字符串、activeIndex 可受控：**

将接口与默认值：

```tsx
export interface GooeyNavProps {
  items: GooeyNavItem[];
  animationTime?: number;
  particleCount?: number;
  particleDistances?: [number, number];
  particleR?: number;
  timeVariance?: number;
  colors?: number[];
  initialActiveIndex?: number;
}
```

改为：

```tsx
export interface GooeyNavProps {
  items: GooeyNavItem[];
  animationTime?: number;
  particleCount?: number;
  particleDistances?: [number, number];
  particleR?: number;
  timeVariance?: number;
  colors?: string[];
  activeIndex?: number;
}
```

将解构（约第 25 行）：

```tsx
  colors = [1, 2, 3, 1, 2, 3, 1, 4],
  initialActiveIndex = 0
```

改为：

```tsx
  colors = ['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4'],
  activeIndex = 0
```

在组件体内（`useEffect` 区域）找到所有用到 `initialActiveIndex` 的地方，全部替换为 `activeIndex`；如果组件内部把它存进了 state（例如 `const [activeItem, setActiveItem] = useState(initialActiveIndex)`），改为 `useState(activeIndex)` 并加一个 `useEffect(() => setActiveItem(activeIndex), [activeIndex])` 同步。粒子 `fillStyle` 处原本是 `colors[Math.floor(Math.random() * colors.length)]`，现在拿到的是真实颜色字符串，无需再改。

**5b. `chroma-grid.tsx` — 支持自定义卡片渲染：**

给 `ChromaGridProps` 加一个字段：

```tsx
export interface ChromaGridProps {
  items?: ChromaItem[];
  className?: string;
  radius?: number;
  damping?: number;
  fadeOut?: number;
  ease?: string;
  renderItem?: (item: ChromaItem, index: number) => React.ReactNode;
}
```

给 `ChromaItem` 加一个可选字段：

```tsx
export interface ChromaItem {
  image: string;
  title: string;
  subtitle: string;
  handle?: string;
  location?: string;
  borderColor?: string;
  gradient?: string;
  url?: string;
  post?: import("@/lib/posts").PostMeta;
}
```

把 `data.map((c, i) => (...))` 的卡片渲染改为：在 `<article ...>` 内部，把原来写死的 image/footer 内容替换为 `{renderItem ? renderItem(c, i) : (<原文默认卡片内容>)}`（保留 `<article>` 外层：onMouseMove、onClick、className、style 里的 `--card-border`/background/`--spotlight-color` 全部保留）。

**5c. `option-wheel.tsx` — 无需改动**（props 已含 `textColor`、`activeColor`、`onChange`，内部以 CSS 变量 `--ow-text-color` / `--ow-active-color` 配合 `color-mix` 生效，可直接传 `var(--color-accent)`）。

- [ ] **Step 7: 验证编译**

Run: `pnpm build`
Expected: 构建成功。若报 `React` 未导入或类型错误，按报错补 import（reactbits 文件为 Vite 风格，Next 需要显式 React import）。

- [ ] **Step 8: 提交**

```bash
git add -A
git commit -m "feat: vendor reactbits animation components and deps"
```

---

### Task 4: 主题色解析工具 + 与 ReactBits 配色打通

**Files:**
- Create: `src/lib/accent-colors.ts`
- Create: `src/lib/__tests__/accent-colors.test.ts`
- Modify: `src/components/reactbits/gooey-nav.tsx`（Task 3 已改，无进一步改动——本任务只加工具与测试）

**Interfaces:**
- Produces:
  - `readAccentColors(): AccentColors` — 从 `getComputedStyle(document.documentElement)` 读取 6 个 accent CSS 变量，缺失时回落默认值（客户端专用）。
  - `useAccentColors(): AccentColors` — React Hook，依赖 `useBlogTheme()` 的 theme，主题切换时重读。
  - `AccentColors = { accent, violet, pink, cyan, emerald, amber }` 均为 `string`。

- [ ] **Step 1: 写失败测试（TDD）**

Create `src/lib/__tests__/accent-colors.test.ts`:

```ts
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { readAccentColors } from "../accent-colors";

describe("readAccentColors", () => {
  it("returns fallback values when no CSS variables are defined", () => {
    const colors = readAccentColors();
    expect(colors.accent).toBe("#6366f1");
    expect(colors.violet).toBe("#8b5cf6");
  });

  it("reads accent colors from CSS variables", () => {
    const style = document.createElement("style");
    style.textContent = `
      :root {
        --color-accent: #111111;
        --color-accent-violet: #222222;
        --color-accent-pink: #333333;
        --color-accent-cyan: #444444;
        --color-accent-emerald: #555555;
        --color-accent-amber: #666666;
      }`;
    document.head.appendChild(style);
    const colors = readAccentColors();
    expect(colors.accent).toBe("#111111");
    expect(colors.amber).toBe("#666666");
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `pnpm test`
Expected: FAIL — 模块 `../accent-colors` 不存在。

- [ ] **Step 3: 实现 `src/lib/accent-colors.ts`**

```ts
import { useMemo } from "react";
import { useBlogTheme } from "@/components/theme/theme-provider";

export interface AccentColors {
  accent: string;
  violet: string;
  pink: string;
  cyan: string;
  emerald: string;
  amber: string;
}

const FALLBACKS: AccentColors = {
  accent: "#6366f1",
  violet: "#8b5cf6",
  pink: "#ec4899",
  cyan: "#06b6d4",
  emerald: "#10b981",
  amber: "#f59e0b",
};

const VAR_NAMES: (keyof AccentColors)[] = [
  "accent",
  "violet",
  "pink",
  "cyan",
  "emerald",
  "amber",
];

export function readAccentColors(): AccentColors {
  if (typeof window === "undefined") return FALLBACKS;
  const cs = getComputedStyle(document.documentElement);
  const result = { ...FALLBACKS };
  for (const key of VAR_NAMES) {
    const value = cs.getPropertyValue(`--color-accent-${key}`).trim();
    if (value) result[key] = value;
  }
  const accent = cs.getPropertyValue("--color-accent").trim();
  if (accent) result.accent = accent;
  return result;
}

export function useAccentColors(): AccentColors {
  const { theme } = useBlogTheme();
  return useMemo(() => readAccentColors(), [theme]);
}
```

注意：`--color-accent-${key}` 对 `accent` 会拼成 `--color-accent-accent`（不存在 → 走空值），再单独读 `--color-accent`，逻辑正确；getComputedStyle 在 jsdom 里对 `--color-accent` 返回空时测试 2 的期望值会被 fallback 覆盖——若 jsdom 26 无法解析自定义属性，则测试 2 会失败，此时把测试 2 改为「注入 CSS 变量并断言 `accent` 不为空字符串且等于注入值或 fallback」均可——以实际运行结果为准，**目标是两个测试都 PASS 且实现不妥协**（若 jsdom 不支持，删除测试 2 并在注释说明原因）。

- [ ] **Step 4: 运行确认通过**

Run: `pnpm test`
Expected: 6 个测试 PASS（含 Task 1 的 4 个）。

- [ ] **Step 5: 提交**

```bash
git add src/lib/accent-colors.ts src/lib/__tests__/accent-colors.test.ts
git commit -m "feat: add theme accent color resolver"
```

---

### Task 5: 全局 GooeyNav 顶部导航（粘性 + 搜索按路由显隐）

**Files:**
- Modify: `src/components/nav/header.tsx`（整体重写为 client）
- Modify: `src/app/layout.tsx`（无需改 import，仅确认）

**Interfaces:**
- Consumes: `GooeyNav`（Task 3）、`ThemePicker`（`@/components/theme/theme-picker`）、`SearchDialog`（本任务仍用旧 `@/components/search/search`，Task 8 再改名重写——**本任务先在 header 里用 `usePathname` 控制显隐，组件名暂不变**）、`useAccentColors`（Task 4）。
- Produces: 新的全局 header 行为——所有页面顶部粘性显示 GooeyNav（首页/文章/碎碎念念）+ 主题切换；搜索按钮仅在 `/posts` 与 `/thoughts` 路径（含详情页）显示，首页隐藏。

- [ ] **Step 1: 重写 `src/components/nav/header.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import GooeyNav from "@/components/reactbits/gooey-nav";
import ThemePicker from "@/components/theme/theme-picker";
import SearchModal from "@/components/search/search";
import { useAccentColors } from "@/lib/accent-colors";

const NAV_ITEMS = [
  { label: "首页", href: "/" },
  { label: "文章", href: "/posts" },
  { label: "碎碎念念", href: "/thoughts" },
];

function getActiveIndex(pathname: string): number {
  if (pathname === "/") return 0;
  if (pathname.startsWith("/posts")) return 1;
  if (pathname.startsWith("/thoughts")) return 2;
  return 0;
}

export default function Header() {
  const pathname = usePathname();
  const colors = useAccentColors();
  const showSearch = pathname.startsWith("/posts") || pathname.startsWith("/thoughts");

  return (
    <header className="site-header sticky top-0 z-30 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="font-heading font-semibold text-lg tracking-tight shrink-0">
          VibeCoding
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <GooeyNav
            items={NAV_ITEMS}
            activeIndex={getActiveIndex(pathname)}
            colors={[colors.accent, colors.violet, colors.pink, colors.cyan]}
          />
          {showSearch && <SearchModal />}
          <ThemePicker />
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: 验证**

Run: `pnpm dev`，浏览器打开：
1. `/` 顶部粘性 nav 三个链接可用，hover 有 gooey 粒子效果；
2. 首页**不显示**搜索按钮；
3. 打开 `/posts` 与 `/thoughts`（后者 404 属预期，Task 10 创建）显示搜索按钮；
4. 切换主题（如 dark → midnight），nav 粒子颜色跟随 accent 变化。

- [ ] **Step 3: 提交**

```bash
git add src/components/nav/header.tsx
git commit -m "feat: global sticky gooey nav with route-aware search"
```

---

### Task 6: 首页改造（纯个人介绍）

**Files:**
- Modify: `src/app/page.tsx`（去掉文章/标签，只传个人数据与统计）
- Rewrite: `src/components/home/home-client.tsx`（hero + 个人资料卡，去掉 TagProvider/文章区）
- Create: `src/components/home/hero.tsx`（client，Lanyard + 文字动效）
- Modify: `src/styles/globals.css`（新增 hero 布局与文字动效样式）

**Interfaces:**
- Consumes: `SplitText`、`TextType`、`ScrollFloat`、`Shuffle`（Task 3）、`Lanyard`（Task 3，经 `next/dynamic` 懒加载）、`useAccentColors`（Task 4）、`GithubContributions`（`./github-contributions`）。
- Produces: `HomeClient({ githubAvatarUrl, githubName, githubUsername, postCount, tagCount })`；首页不再 fetch posts/tags，只保留 `getAllPosts()` 与 `getAllTags()` 的数量统计。

- [ ] **Step 1: 重写 `src/app/page.tsx`**

```tsx
import { getAllPosts, getAllTags } from "@/lib/posts";
import HomeClient from "@/components/home/home-client";

async function getGithubUser() {
  try {
    const res = await fetch("https://api.github.com/users/raychaoo");
    if (!res.ok) throw new Error("Failed to fetch");
    const data = await res.json();
    return {
      avatarUrl: data.avatar_url as string,
      name: (data.name as string) || (data.login as string),
      login: data.login as string,
    };
  } catch {
    return { avatarUrl: null, name: "raychaoo", login: "raychaoo" };
  }
}

export default async function HomePage() {
  const githubUser = await getGithubUser();
  return (
    <HomeClient
      githubAvatarUrl={githubUser.avatarUrl}
      githubName={githubUser.name}
      githubUsername={githubUser.login}
      postCount={getAllPosts().length}
      tagCount={getAllTags().length}
    />
  );
}
```

- [ ] **Step 2: 创建 `src/components/home/hero.tsx`**

```tsx
"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import SplitText from "@/components/reactbits/split-text";
import TextType from "@/components/reactbits/text-type";
import Shuffle from "@/components/reactbits/shuffle";
import { useAccentColors } from "@/lib/accent-colors";

const Lanyard = dynamic(() => import("@/components/reactbits/lanyard"), {
  ssr: false,
  loading: () => null,
});

function buildCardFrontSvg(name: string, tagline: string, accent: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300" viewBox="0 0 480 300">` +
    `<rect width="480" height="300" rx="24" fill="#111827" opacity="0.92"/>` +
    `<rect x="14" y="14" width="452" height="272" rx="18" fill="none" stroke="${accent}" stroke-width="2" opacity="0.6"/>` +
    `<text x="240" y="140" text-anchor="middle" font-family="sans-serif" font-size="44" font-weight="700" fill="#ffffff">${name}</text>` +
    `<text x="240" y="188" text-anchor="middle" font-family="sans-serif" font-size="22" fill="#cbd5e1">${tagline}</text>` +
    `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

interface HeroProps {
  name: string;
}

export default function Hero({ name }: HeroProps) {
  const colors = useAccentColors();
  const cardFront = useMemo(
    () => buildCardFrontSvg(name, "全栈开发者 · React / Next.js / TypeScript", colors.accent),
    [name, colors.accent]
  );

  return (
    <section className="hero-section">
      <div className="hero-copy">
        <Shuffle
          text="VibeCoding · Blog"
          className="inline-block text-xs uppercase tracking-[0.25em] text-muted-fg mb-3"
        />

        <h1 className="hero-title">
          <SplitText
            text={`你好，我是 ${name}`}
            className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight"
            delay={0.15}
            from={{ opacity: 0, y: 24 }}
            to={{ opacity: 1, y: 0 }}
          />
        </h1>

        <p className="hero-tagline">
          <TextType
            text={["全栈开发者", "热爱 React 与 TypeScript", "记录技术学习与思考"]}
            as="span"
            textColors={["var(--color-accent)"]}
            className="text-lg sm:text-xl text-muted-fg"
          />
        </p>

        <p className="hero-intro text-sm sm:text-base text-muted-fg max-w-xl">
          记录技术学习与开发实践，涵盖前端工程化、React 生态、开发效率等话题。这里有长文、有碎碎念念，也有我自己。
        </p>

        <div className="hero-actions flex flex-wrap gap-3">
          <Link href="/posts" className="btn-press btn-primary">
            浏览文章
          </Link>
          <Link href="/thoughts" className="btn-press btn-secondary">
            碎碎念念
          </Link>
        </div>
      </div>

      <div className="hero-lanyard" aria-hidden>
        <Lanyard frontImage={cardFront} position={[0, 0, 30]} gravity={[0, -40, 0]} fov={20} />
      </div>
    </section>
  );
}
```

注意：`ScrollFloat` 渲染的是固定 `<h2>` 容器（组件源码），只接受 `containerClassName`/`textClassName`，且只对**字符串** children 做逐字拆分——所以它用在「关于我」等标题上（见 Step 3），**不要**用它包裹段落/长文。

- [ ] **Step 3: 重写 `src/components/home/home-client.tsx`**

```tsx
"use client";

import Hero from "@/components/home/hero";
import ScrollFloat from "@/components/reactbits/scroll-float";
import GithubContributions from "./github-contributions";

interface Props {
  githubAvatarUrl: string | null;
  githubName: string;
  githubUsername: string;
  postCount: number;
  tagCount: number;
}

export default function HomeClient({ githubAvatarUrl, githubName, githubUsername, postCount, tagCount }: Props) {
  const startYear = "2020";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <Hero name={githubName} />

      {/* 个人资料卡 */}
      <section className="mt-10">
        <ScrollFloat textClassName="font-heading text-base sm:text-lg font-semibold text-fg">
          关于我
        </ScrollFloat>
        <div className="sidebar-card rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] p-5 sm:p-6">
          <div className="flex items-center gap-4 mb-4">
            {githubAvatarUrl ? (
              <img src={githubAvatarUrl} alt={githubName} className="w-14 h-14 rounded-full shadow-sm shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--color-accent)] via-[var(--color-accent-violet)] to-[var(--color-accent-pink)] flex items-center justify-center text-white font-heading font-bold text-lg shadow-sm shrink-0">
                {githubName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h3 className="font-heading font-semibold text-sm">{githubName}</h3>
                <div className="flex items-center gap-4 text-center">
                  <div>
                    <span className="text-sm font-heading font-bold" style={{ color: "var(--color-accent)" }}>{postCount}</span>
                    <span className="text-xs text-muted-fg ml-1">文章</span>
                  </div>
                  <div>
                    <span className="text-sm font-heading font-bold" style={{ color: "var(--color-accent-pink)" }}>{tagCount}</span>
                    <span className="text-xs text-muted-fg ml-1">标签</span>
                  </div>
                  <div>
                    <span className="text-sm font-heading font-bold" style={{ color: "var(--color-accent-cyan)" }}>{startYear}</span>
                    <span className="text-xs text-muted-fg ml-1">始于</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-fg leading-relaxed mt-1">
                全栈开发者，专注于 React、Next.js 和 TypeScript。
              </p>
            </div>
          </div>

          <GithubContributions username={githubUsername} />

          <p className="text-xs text-muted-fg leading-relaxed">
            记录技术学习与开发实践，涵盖前端工程化、React 生态、开发效率等话题。
          </p>
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 4: 新增样式到 `src/styles/globals.css` 末尾**

```css
/* ── Hero (homepage) ── */
.hero-section {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  align-items: center;
}
@media (min-width: 1024px) {
  .hero-section {
    grid-template-columns: minmax(0, 5fr) minmax(0, 4fr);
  }
}
.hero-lanyard {
  height: 420px;
  min-height: 300px;
}
.hero-tagline {
  margin-top: 0.75rem;
}
.hero-intro {
  margin-top: 1rem;
}

/* ── Buttons ── */
.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  transition: transform 0.15s ease, box-shadow 0.2s ease, background-color 0.2s ease;
  cursor: pointer;
}
.btn-primary {
  background: var(--color-accent);
  color: var(--color-accent-foreground);
  box-shadow: 0 4px 14px -4px var(--color-accent);
}
.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px -4px var(--color-accent);
}
.btn-secondary {
  border: 1px solid var(--card-border);
  color: var(--fg-color);
}
.btn-secondary:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
  transform: translateY(-1px);
}
.btn-press:active {
  transform: scale(0.96);
}
```

- [ ] **Step 5: 验证**

Run: `pnpm dev`，打开 `/`：
1. kicker Shuffle 悬停乱序；标题 SplitText 逐字上浮；tagline TextType 打字循环；「关于我」标题滚动逐字浮现；
2. 右侧 Lanyard 绳子摆动（桌面端），卡片正面显示名字与 tagline；
3. 首页无文章列表、无搜索按钮、无标签；
4. 两个按钮 hover 上浮、点击回缩；
5. `pnpm build` 通过（Lanyard 走 dynamic + ssr:false，三.js 不参与首屏 SSR）。

- [ ] **Step 6: 提交**

```bash
git add -A
git commit -m "feat: redesign homepage as personal intro with animations"
```

---

### Task 7: 文章列表页 `/posts`（ChromaGrid）

**Files:**
- Create: `src/app/posts/page.tsx`
- Create: `src/components/posts/posts-client.tsx`
- Modify: `src/components/posts/article-card.tsx`（调整为适配 ChromaGrid 卡片）
- Modify: `src/styles/globals.css`（文章区标题动效相关小样式，如有需要）

**Interfaces:**
- Consumes: `getAllPosts(): PostMeta[]`、`ChromaGrid`（Task 3 改版，含 `renderItem` 与 `post` 字段）。
- Produces: `PostsClient({ posts: PostMeta[] })`；滚动位置记忆逻辑（自旧 home-client 迁移）：离开列表进详情前存 `sessionStorage("posts-scroll")`，返回时恢复。

- [ ] **Step 1: 创建 `src/app/posts/page.tsx`（server）**

```tsx
import type { Metadata } from "next";
import { getAllPosts } from "@/lib/posts";
import PostsClient from "@/components/posts/posts-client";

export const metadata: Metadata = {
  title: "文章",
  description: "全部技术文章列表",
};

export default function PostsPage() {
  const posts = getAllPosts();
  return <PostsClient posts={posts} />;
}
```

- [ ] **Step 2: 创建 `src/components/posts/posts-client.tsx`（client）**

```tsx
"use client";

import { useEffect } from "react";
import ChromaGrid from "@/components/reactbits/chroma-grid";
import ArticleCard from "@/components/posts/article-card";
import type { PostMeta } from "@/lib/posts";

const SCROLL_KEY = "posts-scroll";

interface Props {
  posts: PostMeta[];
}

export default function PostsClient({ posts }: Props) {
  // 返回列表时恢复滚动位置
  useEffect(() => {
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved) {
      const y = parseInt(saved, 10);
      if (!isNaN(y)) requestAnimationFrame(() => window.scrollTo(0, y));
      sessionStorage.removeItem(SCROLL_KEY);
    }
  }, []);

  // 进入详情前记录滚动位置
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const link = (e.target as HTMLElement).closest("a");
      if (link && link.getAttribute("href")?.startsWith("/posts/")) {
        sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const items = posts.map((post) => ({
    image: post.frontmatter.coverImage || "",
    title: post.frontmatter.title,
    subtitle: post.frontmatter.description || post.frontmatter.date,
    url: `/posts/${post.slug}`,
    gradient: `linear-gradient(160deg, var(--color-accent), var(--bg-color) 180%)`,
    borderColor: "var(--color-accent)",
    post,
  }));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">文章</h1>
        <p className="text-sm text-muted-fg mt-1">共 {posts.length} 篇 · 记录技术学习与开发实践</p>
      </div>
      <ChromaGrid items={items} renderItem={(item, i) => <ArticleCard post={item.post} index={i} />} />
    </div>
  );
}
```

注意：`ChromaItem.image` 为空串时默认卡片会渲染坏图——本任务使用 `renderItem` 全覆盖，所以没问题；若后续有人不用 `renderItem`，空串需在 vendored 组件里兜底（`c.image ? <img/> : null`，一并改掉）。

- [ ] **Step 3: 修改 `src/components/posts/article-card.tsx`**

改为接收 `index`（用于主题色轮换）并在 ChromaGrid 卡片内保持原内容结构：

```tsx
import Link from "next/link";
import type { PostMeta } from "@/lib/posts";

interface ArticleCardProps {
  post: PostMeta;
  index?: number;
}

const ACCENTS = [
  "var(--color-accent)",
  "var(--color-accent-violet)",
  "var(--color-accent-pink)",
  "var(--color-accent-cyan)",
  "var(--color-accent-emerald)",
  "var(--color-accent-amber)",
];

export default function ArticleCard({ post, index = 0 }: ArticleCardProps) {
  const { title, date, description, tags } = post.frontmatter;
  const accent = ACCENTS[index % ACCENTS.length];

  return (
    <Link href={`/posts/${post.slug}`} className="block h-full">
      <article className="article-card h-full">
        <div className="flex-1 flex flex-col">
          <div className="card-date text-sm mb-2">
            <time dateTime={date}>
              {new Date(date).toLocaleDateString("zh-CN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          </div>
          <h2 className="card-title text-lg font-heading font-semibold mb-2 leading-snug">
            {title}
          </h2>
          {description && (
            <p className="card-desc text-sm leading-relaxed flex-1">{description}</p>
          )}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {tags.map((tag, i) => (
                <span
                  key={tag}
                  className="tag-pill text-xs"
                  style={{ borderColor: accent, color: accent }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
```

（不再依赖 `.tag-indigo` 等 6 个固定类，改为跟随卡片 accent 的边框/文字色。）

- [ ] **Step 4: 在 vendored `chroma-grid.tsx` 里给空 image 兜底**

找到默认卡片里 `<img src={c.image} .../>` 一行，包一层条件：

```tsx
{c.image ? <img src={c.image} alt={c.title} loading="lazy" className="w-full h-full object-cover rounded-[10px]" /> : null}
```

- [ ] **Step 5: 验证**

Run: `pnpm dev`：
1. `/posts` 展示 ChromaGrid 卡片网格（约 3 列、每张 300px），鼠标滑过有 chroma 光晕跟随；
2. 卡片显示日期/标题/描述/标签，点击进入详情；
3. 从详情返回 `/posts` 滚动位置恢复；
4. `/posts` 与详情页顶部有搜索按钮；
5. `pnpm build` 通过。

- [ ] **Step 6: 提交**

```bash
git add -A
git commit -m "feat: add /posts article list with chroma grid"
```

---

### Task 8: 公共搜索组件（文章 + 碎碎念念）

**Files:**
- Modify: `src/app/api/search/route.ts`（返回 `{ posts, thoughts }` 双索引）
- Rewrite: `src/components/search/search.tsx` → 保留文件名，重写为按路由过滤的公共对话框
- Create: `src/app/api/search/__tests__/route.test.ts`

**Interfaces:**
- Consumes: `getAllPosts()`、`getAllThoughts()`（Task 9 才有——**依赖顺序说明**：本任务先改 API 与组件骨架，`getAllThoughts` 的导入在 Task 9 创建后补上；为保持每任务可编译，本任务 Step 1 先在 `src/lib/` 创建 `thoughts.ts` 的最小可用版（只含 `getAllThoughts`/`getThoughtBySlug`/`getAllThoughtSlugs`/`extractPreview`，Task 9 再补测试与样例内容）。
- Produces: 搜索 API 返回 `{ posts: SearchItem[], thoughts: SearchItem[] }`，其中 `SearchItem = { slug, title, description, tags, date }`；`SearchModal` 不再需要 props，客户端按 `usePathname` 决定搜哪类。

- [ ] **Step 1: 创建最小版 `src/lib/thoughts.ts`（骨架，Task 9 完善）**

```ts
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const thoughtsDirectory = path.join(process.cwd(), "content", "thoughts");

export interface ThoughtFrontmatter {
  title: string;
  date: string;
}

export interface ThoughtMeta {
  slug: string;
  frontmatter: ThoughtFrontmatter;
}

export interface ThoughtWithContent extends ThoughtMeta {
  content: string;
}

function isValidDate(date: string): boolean {
  return !isNaN(Date.parse(date));
}

export function getAllThoughts(): ThoughtMeta[] {
  if (!fs.existsSync(thoughtsDirectory)) return [];
  return fs
    .readdirSync(thoughtsDirectory, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .map((slug) => getThoughtBySlug(slug))
    .filter((t): t is ThoughtWithContent => t !== null)
    .sort((a, b) => new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime());
}

export function getThoughtBySlug(slug: string): ThoughtWithContent | null {
  try {
    const filePath = path.join(thoughtsDirectory, slug, "index.mdx");
    if (!fs.existsSync(filePath)) return null;
    const source = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(source);
    if (!data.title || !data.date || !isValidDate(data.date)) return null;
    return {
      slug,
      frontmatter: { title: data.title, date: data.date },
      content,
    };
  } catch {
    return null;
  }
}

export function getAllThoughtSlugs(): string[] {
  if (!fs.existsSync(thoughtsDirectory)) return [];
  return fs
    .readdirSync(thoughtsDirectory, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

export function extractPreview(content: string, maxLines = 3): string {
  const lines = content
    .split("\n")
    .map((line) => line.replace(/^#{1,6}\s+/, "").replace(/[*_`>#-]/g, "").trim())
    .filter(Boolean);
  const preview = lines.slice(0, maxLines).join(" ");
  return preview.length > 120 ? preview.slice(0, 120).trimEnd() + "…" : preview;
}
```

- [ ] **Step 2: 重写 `src/app/api/search/route.ts`**

```ts
import { NextResponse } from "next/server";
import { getAllPosts } from "@/lib/posts";
import { getAllThoughts, extractPreview } from "@/lib/thoughts";

export const dynamic = "force-static";

export async function GET() {
  const posts = getAllPosts().map((post) => ({
    slug: post.slug,
    title: post.frontmatter.title,
    description: post.frontmatter.description,
    tags: post.frontmatter.tags || [],
    date: post.frontmatter.date,
  }));

  const thoughts = getAllThoughts().map((thought) => ({
    slug: thought.slug,
    title: thought.frontmatter.title,
    description: extractPreview(thought.content, 1),
    tags: [] as string[],
    date: thought.frontmatter.date,
  }));

  return NextResponse.json({ posts, thoughts });
}
```

- [ ] **Step 3: 重写 `src/components/search/search.tsx` 为公共搜索对话框**

保留现有模态框 UI（输入框、结果列表、⌘K 快捷键、上下键导航、高亮），改动点：
1. `interface SearchDoc` 增加 `type: "posts" | "thoughts"` 字段由 API 侧补上——直接在 fetch 后转换：`data.posts.map(d => ({ ...d, type: "posts" }))`、`data.thoughts.map(d => ({ ...d, type: "thoughts" }))`；
2. `usePathname()` 决定 scope：`startsWith("/posts") → "posts"`，否则 `"thoughts"`；
3. 构建 Fuse 时只用当前 scope 的数组；scope 变化时重建（`useEffect` 依赖 scope）；
4. `goTo` 改为 `router.push(doc.type === "posts" ? \`/posts/${doc.slug}\` : \`/thoughts/${doc.slug}\`)`；
5. placeholder 文案改为「搜索文章 / 碎碎念念」；结果里展示 `type === "thoughts" ? "碎碎念念" : "文章"` 的小标识（用现有 `FileText`/`Hash`/`Calendar` 图标布局）。

关键 diff（用 Edit 修改而非整体重写）：

```tsx
// 顶部新增 import
import { usePathname } from "next/navigation";

// SearchDoc 增加 type
interface SearchDoc {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  date: string;
  type: "posts" | "thoughts";
}

// 组件内
const pathname = usePathname();
const scope: "posts" | "thoughts" = pathname.startsWith("/posts") ? "posts" : "thoughts";

// 加载索引（依赖 scope 重建）
useEffect(() => {
  async function load() {
    try {
      const res = await fetch("/api/search");
      const data: { posts: SearchDoc[]; thoughts: SearchDoc[] } = await res.json();
      const docs = (scope === "posts" ? data.posts : data.thoughts).map((d) => ({
        ...d,
        type: scope,
      }));
      setFuse(
        new Fuse(docs, {
          keys: [
            { name: "title", weight: 2 },
            { name: "tags", weight: 1.5 },
            { name: "description", weight: 1 },
          ],
          threshold: 0.35,
          includeScore: true,
        })
      );
    } finally {
      setLoading(false);
    }
  }
  load();
}, [scope]);

// goTo
const goTo = useCallback(
  (doc: SearchDoc) => {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(doc.type === "posts" ? `/posts/${doc.slug}` : `/thoughts/${doc.slug}`);
  },
  [router]
);
```

（其余 UI 代码原样保留；`handleSearch` 等不涉及 scope 的逻辑不动。）`goTo` 签名变了，**两处调用点必须同步改**（否则 TS 报错）：
- 结果按钮（约第 229 行）：`onClick={() => goTo(doc.slug)}` → `onClick={() => goTo(doc)}`
- 键盘 Enter（约第 111 行）：`goTo(results[activeIndex].slug)` → `goTo(results[activeIndex])`

- [ ] **Step 4: 写 API 测试**

Create `src/app/api/search/__tests__/route.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { GET } from "../route";

describe("GET /api/search", () => {
  it("returns posts and thoughts index arrays", async () => {
    const res = await GET();
    const data = await res.json();
    expect(Array.isArray(data.posts)).toBe(true);
    expect(Array.isArray(data.thoughts)).toBe(true);
  });

  it("includes existing posts", async () => {
    const res = await GET();
    const data = await res.json();
    expect(data.posts.length).toBeGreaterThan(0);
    expect(data.posts[0]).toHaveProperty("slug");
    expect(data.posts[0]).toHaveProperty("title");
  });
});
```

- [ ] **Step 5: 验证**

Run: `pnpm test`（6+2 个 PASS）与 `pnpm dev`：
1. `/posts` 顶部搜索弹窗输入关键词命中文章；回车/点击跳转 `/posts/[slug]`；
2. `/thoughts`（此时 404，仅确认搜索按钮存在）——Task 10 后复测碎碎念念搜索；
3. `/` 首页无搜索入口。

- [ ] **Step 6: 提交**

```bash
git add -A
git commit -m "feat: shared search over posts and thoughts"
```

---

### Task 9: 碎碎念念内容层 + 样例内容

**Files:**
- Create: `src/lib/__tests__/thoughts.test.ts`
- Create: `content/thoughts/first-murmur/index.mdx`
- Create: `content/thoughts/learning-css-var-theming/index.mdx`
- (Modify: `src/lib/thoughts.ts` 无需再改——Task 8 已写入完整实现)

**Interfaces:**
- Consumes: Task 8 的 `src/lib/thoughts.ts`。
- Produces: 2 篇样例碎碎念念；`getAllThoughts()` 有真实数据可测。

- [ ] **Step 1: 写失败测试（TDD）**

Create `src/lib/__tests__/thoughts.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { extractPreview, getAllThoughts } from "../thoughts";

describe("extractPreview", () => {
  it("strips markdown syntax and joins the first lines", () => {
    const md = "# 标题\n第一行 **加粗** 内容\n第二行 `代码`\n第三行";
    expect(extractPreview(md, 2)).toBe("第一行 加粗 内容 第二行 代码");
  });

  it("truncates long previews with an ellipsis", () => {
    const long = "字".repeat(200);
    const preview = extractPreview(long, 3);
    expect(preview.length).toBeLessThanOrEqual(121);
    expect(preview.endsWith("…")).toBe(true);
  });
});

describe("getAllThoughts", () => {
  it("reads local thought files sorted newest first", () => {
    const thoughts = getAllThoughts();
    const dates = thoughts.map((t) => new Date(t.frontmatter.date).getTime());
    expect(dates).toEqual([...dates].sort((a, b) => b - a));
  });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `pnpm test`
Expected: `extractPreview` 相关测试 FAIL（文件不存在），`getAllThoughts` 因目录为空返回 `[]` 也 FAIL（空数组断言不等）。

- [ ] **Step 3: 创建样例内容**

Create `content/thoughts/first-murmur/index.mdx`:

```mdx
---
title: 第一篇碎碎念念
date: 2026-07-20
---

今天把博客的目录结构整理了一遍，组件按职责分组后找东西快多了。

希望接下来能把看板娘和动效都配上，让这个角落更有生命力。
```

Create `content/thoughts/learning-css-var-theming/index.mdx`:

```mdx
---
title: CSS 变量主题化的一点心得
date: 2026-07-28
---

设计系统的核心其实就一句话：把颜色、间距、字体统统抽成变量，再按主题覆盖。

ReactBits 的动效组件能接受颜色参数，和我们的 CSS 变量一组合，主题切换时动效也跟着换色，观感统一多了。
```

（`src/lib/thoughts.ts` 已能读取此结构，无需改动代码。）

- [ ] **Step 4: 运行确认通过**

Run: `pnpm test`
Expected: 全部 PASS（含新 3 个）。

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "feat: add thoughts content layer and sample posts"
```

---

### Task 10: 碎碎念念列表页 `/thoughts`（Steps 时间线 + OptionWheel）

**Files:**
- Create: `src/app/thoughts/page.tsx`
- Create: `src/components/thoughts/thoughts-client.tsx`
- Modify: `src/styles/globals.css`（时间线 + wheel-drop 动画）

**Interfaces:**
- Consumes: `getAllThoughts(): ThoughtMeta[]`、`OptionWheel`（Task 3）、`extractPreview`。
- Produces: `/thoughts` 列表——顶部 OptionWheel（标题转轮，点击/落地即跳详情）+ Steps 风格纵向时间线（最新在上），每项：标题、创建时间、内容预览（最多 3 行），点击卡片进 `/thoughts/[slug]`。

- [ ] **Step 1: 创建 `src/app/thoughts/page.tsx`（server）**

```tsx
import type { Metadata } from "next";
import { getAllThoughts, extractPreview } from "@/lib/thoughts";
import ThoughtsClient from "@/components/thoughts/thoughts-client";

export const metadata: Metadata = {
  title: "碎碎念念",
  description: "碎片化的想法与日常记录",
};

export default function ThoughtsPage() {
  const thoughts = getAllThoughts();
  return <ThoughtsClient thoughts={thoughts} />;
}
```

- [ ] **Step 2: 创建 `src/components/thoughts/thoughts-client.tsx`（client）**

```tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import OptionWheel from "@/components/reactbits/option-wheel";
import { extractPreview } from "@/lib/thoughts";
import type { ThoughtMeta } from "@/lib/thoughts";

interface Props {
  thoughts: ThoughtMeta[];
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
      <p className="text-sm text-muted-fg mt-1">共 {thoughts.length} 条 · 一些碎片化的想法与日常</p>

      {thoughts.length > 0 && (
        <div className="wheel-wrap flex justify-center py-10">
          <OptionWheel
            items={titles}
            onChange={handleSelect}
            textColor="var(--muted-fg)"
            activeColor="var(--color-accent)"
          />
        </div>
      )}

      <ol className="thoughts-timeline">
        {thoughts.map((thought, i) => (
          <li
            key={thought.slug}
            className="thoughts-item"
            style={{ animationDelay: `${Math.min(i * 90, 720)}ms` }}
          >
            <Link href={`/thoughts/${thought.slug}`} className="thoughts-card block">
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <h2 className="font-heading font-semibold text-base">{thought.frontmatter.title}</h2>
                <time
                  dateTime={thought.frontmatter.date}
                  className="text-xs text-muted-fg"
                >
                  {new Date(thought.frontmatter.date).toLocaleDateString("zh-CN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </div>
              <p className="text-sm text-muted-fg leading-relaxed mt-2 line-clamp-3">
                {extractPreview(thought.content, 3)}
              </p>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
```

- [ ] **Step 3: 时间线 + 轮盘入场样式（globals.css 末尾追加）**

```css
/* ── Thoughts timeline (Steps-like) ── */
.thoughts-timeline {
  position: relative;
  padding-left: 1.75rem;
}
.thoughts-timeline::before {
  content: "";
  position: absolute;
  left: 7px;
  top: 10px;
  bottom: 10px;
  width: 2px;
  border-radius: 2px;
  background: var(--card-border);
}
.thoughts-item {
  position: relative;
  margin-bottom: 1rem;
}
.thoughts-item::before {
  content: "";
  position: absolute;
  left: -1.6rem;
  top: 9px;
  width: 12px;
  height: 12px;
  border-radius: 9999px;
  background: var(--color-accent);
  box-shadow: 0 0 0 4px var(--card-bg);
}
.thoughts-item:last-child {
  margin-bottom: 0;
}
.thoughts-card {
  padding: 0.875rem 1.125rem;
  border-radius: 0.75rem;
  border: 1px solid var(--card-border);
  background: var(--card-bg);
  transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}
.thoughts-card:hover {
  border-color: var(--color-accent);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px -12px var(--color-accent);
}

/* wheel-drop entrance: wheel-like snap-in */
@keyframes wheel-drop {
  0% {
    opacity: 0;
    transform: rotate(-16deg) translateY(-18px);
  }
  60% {
    opacity: 1;
    transform: rotate(3deg) translateY(2px);
  }
  100% {
    opacity: 1;
    transform: rotate(0deg) translateY(0);
  }
}
.thoughts-item {
  animation: wheel-drop 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@media (prefers-reduced-motion: reduce) {
  .thoughts-item {
    animation: none;
  }
}
```

- [ ] **Step 4: 验证**

Run: `pnpm dev`：
1. `/thoughts` 顶部 OptionWheel 可滚动/点击标题，落地或选中后跳转对应详情（Task 11 创建前会 404，属预期）；
2. 时间线最新在上（7-28 在前）；每项标题/日期/3 行预览；hover 上浮+accent 边框；
3. 列表项依次轮盘式入场（带延迟）；
4. 顶部搜索按钮存在，搜索可命中碎碎念念（Task 8 逻辑）；
5. `pnpm build` 通过。

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "feat: add /thoughts timeline with option wheel"
```

---

### Task 11: 碎碎念念详情页 `/thoughts/[slug]`

**Files:**
- Create: `src/app/thoughts/[slug]/page.tsx`
- Modify: `src/app/posts/[slug]/page.tsx`（不动，本任务只加 thoughts 版）

**Interfaces:**
- Consumes: `getThoughtBySlug`、`getAllThoughtSlugs`、`compileMdx`（`@/lib/mdx`）、`estimateReadingTime`（`@/lib/posts` 导出）、`CodeEnhancer`（`@/components/mdx/code-enhancer`）、`DynamicGiscus`（`@/components/mdx/giscus-dynamic`，**与文章详情页共用同一套 Giscus 评论**）、`SplitText`。
- Produces: 详情页路由 `/thoughts/[slug]`（静态生成）。

- [ ] **Step 1: 创建 `src/app/thoughts/[slug]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getThoughtBySlug, getAllThoughtSlugs } from "@/lib/thoughts";
import { estimateReadingTime } from "@/lib/posts";
import { compileMdx } from "@/lib/mdx";
import CodeEnhancer from "@/components/mdx/code-enhancer";
import DynamicGiscus from "@/components/mdx/giscus-dynamic";
import SplitText from "@/components/reactbits/split-text";
import { Calendar, Clock, ArrowLeft } from "lucide-react";

interface ThoughtPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllThoughtSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ThoughtPageProps): Promise<Metadata> {
  const { slug } = await params;
  const thought = getThoughtBySlug(slug);
  if (!thought) return {};
  return {
    title: thought.frontmatter.title,
    description: extractDescription(thought.content),
    openGraph: {
      title: thought.frontmatter.title,
      type: "article",
      publishedTime: thought.frontmatter.date,
    },
  };
}

function extractDescription(content: string): string {
  const plain = content
    .split("\n")
    .map((line) => line.replace(/^#{1,6}\s+/, "").replace(/[*_`>#-]/g, "").trim())
    .filter(Boolean)
    .join(" ");
  return plain.length > 80 ? plain.slice(0, 80) + "…" : plain;
}

export default async function ThoughtPage({ params }: ThoughtPageProps) {
  const { slug } = await params;
  const thought = getThoughtBySlug(slug);
  if (!thought) notFound();

  const { content, headings } = await compileMdx(thought.content);
  const { title, date } = thought.frontmatter;
  const readingTime = estimateReadingTime(thought.content);

  return (
    <div className="page-enter max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <Link
        href="/thoughts"
        className="inline-flex touch-target items-center gap-1.5 text-xs text-muted-fg hover:text-[var(--color-accent)] transition-colors mb-6"
      >
        <ArrowLeft size={14} />
        返回碎碎念念
      </Link>

      <header className="mb-8">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight leading-tight mb-4">
          <SplitText
            text={title}
            className="font-heading"
            delay={0.1}
            from={{ opacity: 0, y: 16 }}
            to={{ opacity: 1, y: 0 }}
          />
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-fg">
          <span className="inline-flex items-center gap-1.5">
            <Calendar size={14} />
            <time dateTime={date}>
              {new Date(date).toLocaleDateString("zh-CN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          </span>
          <span className="w-1 h-1 rounded-full bg-current opacity-40" />
          <span className="inline-flex items-center gap-1.5">
            <Clock size={14} />
            {readingTime} 分钟阅读
          </span>
        </div>
      </header>

      <div className="prose" dangerouslySetInnerHTML={{ __html: content }} />
      <CodeEnhancer />

      {/* 评论区：与文章详情页共用 Giscus 配置 */}
      <div className="mt-10 sm:mt-12 pt-6 border-t border-[var(--card-border)] animate-fade-up">
        <DynamicGiscus />
      </div>
    </div>
  );
}
```

注意：`headings` 变量声明了但未使用——去掉解构里的 `headings`（`const { content } = await compileMdx(thought.content);`），避免 lint 报 unused。

- [ ] **Step 2: 验证**

Run: `pnpm dev`：
1. `/thoughts` 点击卡片进入详情，标题 SplitText 逐字浮现，MDX 正常渲染（含代码块、表格）；
2. 返回按钮回 `/thoughts`；
3. `/thoughts/first-murmur` 直接访问正常；不存在的 slug 返回 404；
4. 正文下方 Giscus 评论区正常加载、可发表评论（与文章详情页共用配置）；
5. `pnpm build` 通过（生成 `/thoughts/...` 静态页）。

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "feat: add /thoughts/[slug] detail page"
```

---

### Task 12: 文章详情页动效与链接修正

**Files:**
- Modify: `src/app/posts/[slug]/page.tsx`

**Interfaces:**
- Consumes: `SplitText`（Task 3）；现有 `DynamicGiscus` 评论区（**保留不动**）。
- Produces: 返回链接改指 `/posts`；标签变装饰性 span；标题 SplitText；meta 行错峰淡入；封面图保留 `animate-fade-in`；评论区包裹淡入；顶部/底部返回按钮加 `btn-press` 按压反馈。

- [ ] **Step 1: 修改 `src/app/posts/[slug]/page.tsx`**

改动点（用 Edit 逐处修改）：

1. import 区新增：

```tsx
import SplitText from "@/components/reactbits/split-text";
```

2. 顶部返回链接（约第 54-60 行，改 href + 加 `btn-press`）：

```tsx
      <Link
        href="/posts"
        className="btn-press inline-flex touch-target items-center gap-1.5 text-xs text-muted-fg hover:text-fg transition-colors mb-6"
      >
        <ArrowLeft size={14} />
        返回文章
      </Link>
```

3. 标题（约第 76-78 行）：

```tsx
          <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-4 leading-tight">
            <SplitText
              text={title}
              className="font-heading"
              delay={0.1}
              from={{ opacity: 0, y: 20 }}
              to={{ opacity: 1, y: 0 }}
            />
          </h1>
```

4. 标签（约第 96-111 行）：把 `tags.map` 里的 `<Link key={tag} href={...} className={...}>{tag}</Link>` 改为 span（去掉 `href` 与 `cursor-pointer`，保留 `tag-pill text-[11px]` 与颜色轮换类）。

5. meta 行（约第 80 行，`<div className='flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-muted-fg'>`）：在 className 末尾加 `animate-fade-up`（该全局类自带 `nth-child` 逐项延迟，日期/阅读时间/标签依次错峰淡入）。

6. 封面图（约第 63-71 行）：已有 `animate-fade-in`，**保持不动**。

7. 正文区（约第 118-123 行）：**不加 ScrollFloat**（ScrollFloat 只拆分字符串 children，长文逐词动画过重），正文保持原样，依靠 Task 14 的页面切换过渡即可。

8. **Giscus 评论区保留**（约第 137 行）：`DynamicGiscus` 组件原样保留，包一层淡入容器：

```tsx
          <div className="animate-fade-up">
            <DynamicGiscus />
          </div>
```

9. 底部返回链接（约第 127-135 行，改 href + 加 `btn-press`）：

```tsx
          <div className="mt-10 sm:mt-12 pt-6 border-t border-[var(--card-border)]">
            <Link
              href="/posts"
              className="btn-press inline-flex touch-target items-center gap-1.5 text-sm text-fg hover:text-[var(--color-accent)] transition-colors font-medium"
            >
              <ArrowLeft size={16} />
              返回文章
            </Link>
          </div>
```

- [ ] **Step 2: 验证**

Run: `pnpm dev`：
1. 从 `/posts` 进入详情，返回链接回 `/posts` 且滚动位置恢复（Task 7 的 sessionStorage 逻辑）；
2. 标题逐字浮现；meta 行（日期/阅读时间）依次错峰淡入；标签不可点击但样式正常；
3. Giscus 评论区正常加载、可发表评论；
4. 顶部/底部返回按钮 hover 上浮、点击回缩（`btn-press`）；
5. `pnpm build` 通过。

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "feat: animate post detail page and fix back links"
```

---

### Task 13: 全局看板娘 Live2D（自托管）

**Files:**
- Create: `public/live2d/`（widget 库文件：waifu.css、waifu-tips.js、waifu-tips.json、live2d.min.js、chunk/）
- Create: `public/live2d-api/model_list.json`、`public/live2d-api/model/shizuku/`（模型文件 + index.json + textures.cache）
- Create: `src/components/live2d/live2d-mascot.tsx`
- Modify: `src/app/layout.tsx`（挂载组件）

**Interfaces:**
- Consumes: 无（独立）。Produces: `Live2dMascot` 组件（渲染 null，仅注入脚本）；全局生效、桌面端显示、可拖拽、带气泡提示与工具按钮。

原理（已核实 v1 源码 `src/model.ts`）：`initWidget` 会 fetch `cdnPath + model_list.json` → `{ models: [...] }`，然后 fetch `cdnPath + model/{name}/index.json`（Cubism 2 模型配置），以及 `cdnPath + model/{name}/textures.cache`（JSON 数组，用于换装）。因此**纯静态文件树即可驱动，无需任何后端**。

- [ ] **Step 1: 下载 widget 库到 `public/live2d/`**

```bash
mkdir -p /tmp/l2d && cd /tmp/l2d
curl -fsSL -o widget.tgz "https://registry.npmjs.org/live2d-widgets/-/live2d-widgets-1.0.1.tgz"
tar -xzf widget.tgz
mkdir -p d:/MygitHub/blog/public/live2d
cp -r package/dist/waifu.css package/dist/waifu-tips.js package/dist/waifu-tips.json package/dist/live2d.min.js package/dist/chunk d:/MygitHub/blog/public/live2d/
```

（`dist/` 下另有 `autoload.js`——不复制，我们自写加载器；`chunk/` 必须整体复制，`waifu-tips.js` 是 ES module，其相对 import 依赖 chunk。）

- [ ] **Step 2: 下载 Shizuku 模型到 `public/live2d-api/model/shizuku/`**

```bash
mkdir -p /tmp/shizuku && cd /tmp/shizuku
curl -fsSL -o model.tgz "https://registry.npmjs.org/live2d-widget-model-shizuku/-/live2d-widget-model-shizuku-1.0.5.tgz"
tar -xzf model.tgz
DEST="d:/MygitHub/blog/public/live2d-api/model/shizuku"
mkdir -p "$DEST"
cp -r package/assets/* "$DEST/"
```

（`package/assets/` 内含 `shizuku.model.json`、`shizuku.moc`、`shizuku.physics.json`、`shizuku.pose.json`、`exp/`、`mtn/`、`snd/`、`moc/`——相对路径在 copy 后不变。）

- [ ] **Step 3: 创建 API 静态文件**

Create `public/live2d-api/model_list.json`：

```json
{
  "models": ["shizuku"]
}
```

Create `public/live2d-api/model/shizuku/index.json`（与 shizuku.model.json 同内容，供 lib 固定加载）：

```bash
cp public/live2d-api/model/shizuku/shizuku.model.json public/live2d-api/model/shizuku/index.json
```

Create `public/live2d-api/model/shizuku/textures.cache`（该模型有 6 张贴图，作为 1 套服装；格式为 JSON 数组）：

```json
[["moc/shizuku.1024/texture_00.png","moc/shizuku.1024/texture_01.png","moc/shizuku.1024/texture_02.png","moc/shizuku.1024/texture_03.png","moc/shizuku.1024/texture_04.png","moc/shizuku.1024/texture_05.png"]]
```

- [ ] **Step 4: 创建 `src/components/live2d/live2d-mascot.tsx`**

```tsx
"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    initWidget?: (options: Record<string, unknown>) => void;
  }
}

export default function Live2dMascot() {
  useEffect(() => {
    if (window.innerWidth < 768) return; // 桌面端显示
    let cancelled = false;

    const timer = window.setTimeout(
      () => {
        if (cancelled) return;

        const css = document.createElement("link");
        css.rel = "stylesheet";
        css.href = "/live2d/waifu.css";

        const script = document.createElement("script");
        script.type = "module";
        script.src = "/live2d/waifu-tips.js";

        script.onload = () => {
          window.initWidget?.({
            waifuPath: "/live2d/waifu-tips.json",
            cdnPath: "/live2d-api/",
            cubism2Path: "/live2d/live2d.min.js",
            tools: ["hitokoto", "photo", "info", "quit"],
          });
        };
        document.head.append(css, script);
      },
      1500 // 延迟加载，避免影响首屏
    );

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  return null;
}
```

- [ ] **Step 5: 挂载到全局布局**

`src/app/layout.tsx`（`<BlogThemeProvider>` 内、`<Header />` 之后）：

```tsx
import Live2dMascot from "@/components/live2d/live2d-mascot";
// ...
        <BlogThemeProvider>
          <ProgressBar />
          <Header />
          <Live2dMascot />
          <main className="flex-1">{children}</main>
        </BlogThemeProvider>
```

- [ ] **Step 6: 验证**

Run: `pnpm dev`，桌面浏览器（宽 ≥768px）：
1. 页面右下角出现 Shizuku 看板娘（加载有 1.5s 延迟），可拖拽；
2. 点击模型有互动提示气泡（hitokoto 等按钮可用）；
3. 切页（/ → /posts → /thoughts）看板娘保持全局存在；
4. 手机宽度（DevTools 窄屏）不加载；
5. `pnpm build` 通过；`pnpm start` 后（生产模式）同样正常。

若气泡/工具按钮行为异常（如某个 tools 项报错），对照 `public/live2d/waifu-tips.js` 源码与官方 README 中 `tools` 列表调整数组内容（hitokoto/photo/info/quit 为最稳定子集）。

- [ ] **Step 7: 提交**

```bash
git add -A
git commit -m "feat: add global self-hosted live2d mascot"
```

---

### Task 14: 页面切换 + 按钮全局动效收尾

**Files:**
- Modify: `src/styles/globals.css`
- (不新增组件)

**Interfaces:**
- Produces: 原生 View Transitions（Chromium）+ 全局按钮/链接动效；`prefers-reduced-motion` 全部降级为无动画。

- [ ] **Step 1: 查 Next 16 文档确认 View Transitions 用法**

```bash
ls node_modules/next/dist/docs/ | grep -i "transition\|view"
```

若文档有原生 `viewTransition` 配置则按其启用；否则用下面纯 CSS 方案（Chromium 原生 MPA View Transitions，对静态导出无侵入）。

- [ ] **Step 2: globals.css 追加**

```css
/* ── Page transitions (Chromium MPA view transitions) ── */
@view-transition {
  navigation: auto;
}

@media (prefers-reduced-motion: no-preference) {
  ::view-transition-old(root) {
    animation: page-enter 0.28s ease-out reverse;
  }
  ::view-transition-new(root) {
    animation: page-enter 0.28s ease-out;
  }
}
@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation: none;
  }
}

/* ── Global button/link micro-interactions ── */
button,
a {
  -webkit-tap-highlight-color: transparent;
}
.tag-pill,
.touch-target {
  transition: transform 0.15s ease, color 0.15s ease, border-color 0.15s ease, background-color 0.15s ease;
}
.tag-pill:active,
.touch-target:active {
  transform: scale(0.96);
}
```

- [ ] **Step 3: 给现有交互元素补类名（如缺失）**

搜索 `src/components` 下所有 `button`/`Link`，确认主要交互元素带 `touch-target` 或新增 `btn-press`（至少：theme-picker 的按钮、搜索触发按钮、文章卡片链接已有 hover 动画，补 `:active` 缩放）。逐处补上即可。

- [ ] **Step 4: 验证**

Run: `pnpm dev`：
1. 在 Chromium 内核浏览器中导航 `/` → `/posts` → `/thoughts` → 详情页，页面有淡入/滑入过渡；
2. 所有按钮/标签点击有回缩反馈；hover 有位移/变色；
3. OS 开启「减弱动态效果」后无动画；
4. `pnpm build` 通过。

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "feat: add page view transitions and button micro-interactions"
```

---

### Task 15: 清理未用代码 + sitemap/文档收尾

**Files:**
- Delete: `src/components/sidebar.tsx`、`src/components/tag-context.tsx`、`src/components/tag-filter-wrapper.tsx`
- Delete: `public/file.svg`、`public/globe.svg`、`public/next.svg`、`public/vercel.svg`、`public/window.svg`（如确认无引用）
- Modify: `src/app/sitemap.ts`（补 /posts、/thoughts 与碎碎念念条目）
- Modify: `CLAUDE.md`（架构、布局、约定同步现状）
- (保留 `plan.md`——它是本次改造的需求文档)

- [ ] **Step 1: 确认无引用后删除**

```bash
grep -rn "sidebar\|tag-context\|tag-filter-wrapper" src --include="*.tsx" --include="*.ts" | grep -v "components/sidebar.tsx\|components/tag-"
```

确认只命中文件自身后：

```bash
git rm src/components/sidebar.tsx src/components/tag-context.tsx src/components/tag-filter-wrapper.tsx
```

SVG 同理确认无引用后删除：

```bash
grep -rn "file.svg\|globe.svg\|next.svg\|vercel.svg\|window.svg" src public --include="*.tsx" --include="*.ts" --include="*.html" || true
git rm public/file.svg public/globe.svg public/next.svg public/vercel.svg public/window.svg
```

- [ ] **Step 2: 更新 `src/app/sitemap.ts`**

```ts
import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/posts";
import { getAllThoughts } from "@/lib/thoughts";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();
  const thoughts = getAllThoughts();

  return [
    { url: "https://your-domain.com", lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: "https://your-domain.com/posts", lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: "https://your-domain.com/thoughts", lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    ...posts.map((post) => ({
      url: `https://your-domain.com/posts/${post.slug}`,
      lastModified: new Date(post.frontmatter.date),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...thoughts.map((thought) => ({
      url: `https://your-domain.com/thoughts/${thought.slug}`,
      lastModified: new Date(thought.frontmatter.date),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
```

- [ ] **Step 3: 更新 `CLAUDE.md`**

对照最终实现的目录结构、路由（/、/posts、/posts/[slug]、/thoughts、/thoughts/[slug]）、组件分组、新增依赖（gsap、three 系、reactbits 自托管、vitest）、Live2D 自托管说明，重写「Architecture」「Layout」「Dependencies」小节；「Theme System」「Key Conventions」保留但补充 reactbits 配色必须走 `useAccentColors`/CSS 变量的约定。

- [ ] **Step 4: 最终门禁**

```bash
pnpm lint
pnpm test
pnpm build
pnpm start
```

逐页手工 QA：
1. `/` 首页：hero 动效、Lanyard、资料卡、按钮动画；无文章列表/搜索；
2. `/posts`：ChromaGrid 光晕、卡片内容、搜索、滚动恢复、进入详情；
3. `/posts/[slug]`：标题 SplitText、meta 错峰淡入、标签为 span、返回文章、Giscus 评论区正常、页面过渡动画；
4. `/thoughts`：OptionWheel、时间线入场动画、预览 3 行、搜索命中；
5. `/thoughts/[slug]`：标题动效、MDX 渲染、返回、Giscus 评论区正常；
6. 全局：GooeyNav 粘性、主题切换 6 色全部联动（粒子/Lanyard/ChromaGrid/时间线/按钮）、看板娘存在且可拖拽；
7. 404 页面正常；sitemap.xml / rss.xml 生成正常。

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "chore: remove dead code and refresh docs"
```

---

## Self-Review 记录

（计划作者在写完本计划后对照规格逐条核查，以下为核查结论，实现时无需再执行。）

- 规格「项目目录结构抽离」→ Task 2。
- 规格「SplitText/TextType/Shuffle/ScrollFloat」→ Task 6（首页 kicker/标题/tagline/关于我标题）+ Task 11/12（详情页标题）。
- 规格「GooeyNav」→ Task 5（全局粘性导航）。
- 规格「Lanyard」→ Task 6（首页 hero，卡片正面为自定义 SVG）。
- 规格「首页只展示个人信息、移除搜索」→ Task 5（搜索按路由显隐）+ Task 6（首页重写）。
- 规格「两个 nav 跳文章页与碎碎念念页」→ Task 5（NAV_ITEMS）+ Task 7/10（页面创建）。
- 规格「文章页 ChromaGrid」→ Task 7。
- 规格「文章详情页添加动画」→ Task 12（标题 SplitText、meta 行错峰淡入、封面保留 fade-in、评论区淡入、按钮按压反馈、返回链接修正）。
- 补充需求「文章与碎碎念念详情页都保留 Giscus 评论」→ Task 11（碎碎念念详情加 DynamicGiscus）+ Task 12（文章详情明确保留）。
- 规格「碎碎念念读取本地文件、单一列表、类 Steps、OptionWheel、最新在上、卡片=标题+时间+预览、点击进详情」→ Task 9/10/11。
- 规格「两页共用搜索组件」→ Task 8。
- 规格「看板娘全局生效、开源资源」→ Task 13（live2d-widget v1 + Shizuku，全静态自托管）。
- 规格「按钮与页面跳转需动画」→ Task 14。
- 规格「reactbits 配色与主题搭配」→ Task 4 + Task 5/6/7/10 中所有颜色传参。
- 规格「删除不再使用的代码，放最后」→ Task 15。
- 已知依赖顺序说明：Task 8 会先创建 `src/lib/thoughts.ts` 的最小实现，Task 9 补测试与样例内容——已在该任务中注明。
