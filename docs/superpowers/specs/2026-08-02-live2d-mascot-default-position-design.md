# 看板娘默认位置移到右下角 — 设计

日期:2026-08-02
状态:已批准(方案 A)

## 背景

Live2D 看板娘(`#waifu`)当前默认贴**左下角**:vendored 的 `public/live2d/waifu.css` 中
`#waifu { position: fixed; left: 0; bottom: -500px → 0(waifu-active) }`。需求:默认位置改为**右下角**。

## 决策

采用**方案 A:globals.css `!important` 覆盖**。

理由:
- 与仓库既有约定一致 — 移动端画布收窄(180px)正是用 `!important` 覆盖运行时注入的 waifu.css
  (见 `src/styles/globals.css` 844 行注释);
- 不修改 vendored 的 live2d-widget 文件(「编译文件一律不修改」约定),未来升级小部件不冲突;
- JS 拖动/位置记忆逻辑不需要任何改动:它只在存在保存位置时才设置内联 `left/top`,
  无保存位置时走 CSS 默认值,正好落在右下角。

## 实现

在 `src/styles/globals.css` 的移动端 waifu 覆盖块(844 行)上方,新增一段基础规则:

```css
/* 看板娘默认贴右下角(!important 覆盖运行时注入的 waifu.css) */
#waifu {
  right: 0 !important;
  left: auto !important;
}

/* 显隐切换小标签镜像到右边缘,slide 动画改用 margin-right */
#waifu-toggle {
  right: 0 !important;
  left: auto !important;
  margin-left: 0 !important;
  margin-right: -100px;
  transition: margin-right 1s;
}

#waifu-toggle.waifu-toggle-active {
  margin-right: -50px;
}

#waifu-toggle.waifu-toggle-active:hover {
  margin-right: -30px;
}
```

要点:
- `#waifu` 的 `bottom` 入场动画(`-500px → 0`)、`transform` 过渡、`z-index` 均不动;
- `#waifu-toggle` 原 CSS 用 `margin-left: -100px/-50px/-30px` 做滑出动画,
  `margin-left: 0 !important` 钉死左侧偏移后,动画语义完整迁移到 `margin-right`
  (waifu.css 不设 `margin-right`、`transition` 也只列了 `margin-left`,故此处无需 `!important`);
- ID 选择器 + `!important` 对 waifu.css 的非 `!important` 同特异性规则必胜,与注入顺序无关;
- 移动端 180px 收窄块不受影响;拖动保存(`localStorage("waifu-position")`)与恢复逻辑不改。

## 验证

- `pnpm build` 通过(静态导出);
- 浏览器手工核对:默认出现在右下角、入场动画正常;隐藏看板娘后橙色小标签从右侧露出;
  拖动后刷新,位置记忆仍生效。
- 仅改一个 CSS 文件,现有 Vitest 测试不受影响。

## 影响范围

- `src/styles/globals.css` — 唯一改动文件(+约 25 行)
- `public/live2d/waifu.css`、`live2d-mascot.tsx` — 不动
