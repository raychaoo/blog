# ChromaGrid 区域背景 = 当前主题强调色

日期：2026-08-01
状态：已批准（方案 A）

## 目标

/posts 页 ChromaGrid 网格区域（根容器 div 所在区域）的背景颜色改为当前主题的强调色 `var(--color-accent)`，切换主题时自动跟随。

## 现状

- ChromaGrid 根 div（`src/components/reactbits/chroma-grid.tsx` 第 154-166 行）没有任何背景样式，透明 → 露出页面底色 `var(--bg-color)`。
- 6 个主题均已定义 `--color-accent`（light 靛蓝 / dark 浅靛蓝 / sepia 铜色 / ocean 青色 / lavender 紫色 / midnight 翠绿）。
- `.article-card` 仅被 /posts 的 ChromaGrid 使用；卡片自身有 `var(--card-bg)` 背景，文字用 `--card-fg`/`--muted-fg`，不受区域背景影响。

## 改动

在 ChromaGrid 根 div 的 `style` 对象（与 `--r`/`--x`/`--y` 一起）追加：

```ts
background: 'var(--color-accent)'
```

单行改动，纯 CSS 变量，符合项目「ReactBits 配色走 CSS 变量」约定。

## 影响与不变项

- 悬停聚光遮罩（grayscale/brightness mask 两层 overlay）叠加在区域之上，行为不变。
- 卡片本身背景、边框、文字不变。
- 组件 demo 模式（无 items 时）同样获得主题色背景，无害。
- dark 主题下区域为浅靛蓝大色块，属预期视觉；如需调色后续单独处理。

## 验收

- 手动检查 /posts：区域背景随 6 个主题切换显示对应 `--color-accent`。
- 悬停聚光、卡片 hover 效果正常。
- `pnpm build` / `pnpm lint`（仅触碰文件）通过。
