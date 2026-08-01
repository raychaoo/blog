# ChromaGrid 区域背景 = 与 body 背景一致

日期：2026-08-01
状态：已批准（最终版：方案 A — 移除区域级调暗遮罩）

## 目标

/posts 页 ChromaGrid 网格区域（根容器 div 所在区域）的背景颜色与 body 背景颜色一致（`var(--bg-color)`），任何时刻无任何色差，切换主题时自动跟随。

## 根因

首次改动（根容器加 `background: var(--bg-color)`）无效的原因：ChromaGrid 自带两层**区域级调暗遮罩**（z-30 / z-40，`absolute inset-0`，`backdropFilter: grayscale(1) brightness(0.78)`），铺满整个网格区域，把其下方所有内容（含背景间隙）做灰度+压暗处理。验证：dark 主题 `--bg-color: #121110` → grayscale → rgb(17,17,17) → brightness 0.78 → **#0d0d0d**（与用户实际看到的一致）。

## 改动（方案 A）

`src/components/reactbits/chroma-grid.tsx`：

1. 删除两层区域级调暗遮罩 div（原 z-30 + z-40，约 26 行）。
2. 删除配套 GSAP 光圈逻辑：`fadeRef`、`--x/--y` 追踪（quickSetter）、`moveTo`、`handleMove`、`handleLeave`、`useEffect` 初始化；由此 `radius`/`damping`/`fadeOut`/`ease` 四个 props 失去用途，从 `ChromaGridProps` 一并移除；`gsap`、`useRef`、`useEffect` 导入移除。
3. 保留根容器 `background: var(--bg-color)`。
4. 保留每张卡片自带的 accent 悬停光斑（`--mouse-x/--mouse-y` + `--spotlight-color`）与 `handleCardMove`。

## 影响与不变项

- 区域背景任何时刻严格等于 body 背景（`var(--bg-color)`），6 个主题下均一致。
- 卡片背景、边框、文字不变；卡片 hover 光斑、`btn-press` 微交互不变。
- 「鼠标光圈高亮」效果（区域整体变灰、随鼠标显示彩色光圈）移除——卡片始终全彩。
- demo 模式（无 items）同样获得与 body 一致的背景。
- `ChromaGridProps` 移除 4 个 props，项目中无其它调用方使用它们。

## 验收

- 手动检查 /posts：区域背景与 body 背景在 6 个主题下完全一致（取色相同）。
- 卡片 hover 光斑、微交互正常。
- `pnpm build` / `pnpm lint`（仅触碰文件）通过。
