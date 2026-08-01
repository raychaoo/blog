# ChromaGrid 区域背景 = 与 body 背景一致

日期：2026-08-01
状态：已批准（修正版：与 body 背景色一致）

## 目标

/posts 页 ChromaGrid 网格区域（根容器 div 所在区域）的背景颜色与 body 背景颜色一致（`var(--bg-color)`），切换主题时自动跟随。

## 现状

- ChromaGrid 根 div（`src/components/reactbits/chroma-grid.tsx` 第 154-166 行）没有任何背景样式，透明 → 露出页面底色 `var(--bg-color)`。
- body 背景为纯 `var(--bg-color)`（globals.css 第 190-194 行），无渐变。
- 区域背景显式设为 `var(--bg-color)` 后，与 body 保持一致且不再依赖透明穿透（后续若 body 或外层容器改动背景，区域仍然一致）。

## 改动

在 ChromaGrid 根 div 的 `style` 对象（与 `--r`/`--x`/`--y` 一起）追加：

```ts
background: 'var(--bg-color)'
```

单行改动，纯 CSS 变量，符合项目「ReactBits 配色走 CSS 变量」约定。

## 影响与不变项

- 悬停聚光遮罩（grayscale/brightness mask 两层 overlay）叠加在区域之上，行为不变。
- 卡片本身背景、边框、文字不变。
- 组件 demo 模式（无 items 时）同样获得与 body 一致的背景，无害。

## 验收

- 手动检查 /posts：区域背景与 body 背景在 6 个主题下完全一致。
- 悬停聚光、卡片 hover 效果正常。
- `pnpm build` / `pnpm lint`（仅触碰文件）通过。
