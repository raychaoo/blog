# 看板娘默认位置右下角 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 Live2D 看板娘默认位置从左下角改为右下角,显隐切换小标签同步镜像到右边缘。

**Architecture:** 在 `src/styles/globals.css` 用 `!important` 覆盖运行时注入的 vendored `waifu.css`(仓库既有模式,见移动端 180px 收窄块)。`#waifu` 固定 `right: 0`;`#waifu-toggle` 将 slide 动画从 `margin-left` 迁移到 `margin-right`。JS 拖动/位置记忆逻辑零改动。

**Tech Stack:** Tailwind CSS v4 + 原生 CSS(`src/styles/globals.css`)。

## Global Constraints

- 不修改 vendored 文件(`public/live2d/waifu.css`、`waifu-tips.js` 等) — 只能以 `!important` 覆盖
- `#waifu` 的 `bottom` 入场动画(`-500px → 0`)、`transform` 过渡、`z-index` 保持不动
- 主题全部走 CSS 变量,本改动不引入颜色
- 门禁:`pnpm build` + 浏览器手工核对(仓库 UI 改动无单测先例)

---

### Task 1: globals.css 新增看板娘右下角覆盖规则

**Files:**
- Modify: `src/styles/globals.css` — 在移动端看板娘块(844 行注释)之前插入

**Interfaces:**
- Consumes: 无(单文件改动)
- Produces: 无(纯 CSS,无 JS 接口变化;`live2d-mascot.tsx` 的 `restore()` 只在有保存位置时设置内联 `left/top`,不受影响)

- [ ] **Step 1: 在 globals.css 插入覆盖规则**

打开 `src/styles/globals.css`,找到第 842 行(`.touch-target:active` 块结束的 `}`)和第 844 行注释 `/* 移动端看板娘:缩小画布并允许触摸拖动(...) */` 之间,插入:

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

原 `waifu.css` 对应关系:`#waifu { left: 0 }` → `left: auto !important` + `right: 0 !important`;
`#waifu-toggle { left: 0; margin-left: -100px }` → `right: 0 !important; left: auto !important; margin-left: 0 !important; margin-right: -100px`;
`transition: margin-left 1s` → `transition: margin-right 1s`(waifu.css 不设 `margin-right`,故 slide 状态无需 `!important`)。

- [ ] **Step 2: 构建验证**

Run: `pnpm build`
Expected: 构建成功(静态导出到 `out/`),无 CSS 管线错误。

- [ ] **Step 3: 手工验证清单**

`pnpm dev` 起本地服务后浏览器核对:

1. 看板娘默认出现在**右下角**(贴底贴右,无 `waifu-position` localStorage 时);
2. 入场动画正常(`bottom: -500px → 0` 上滑 + transform 过渡);
3. 工具面板(`hitokoto/switch-model/photo/info/quit`)呼出正常;
4. 隐藏看板娘后,橙色小标签从**右边缘**露出 10px,悬停滑出 30px,点击恢复显示;
5. 拖动看板娘到其他位置 → 刷新页面 → 位置记忆仍生效(存在保存位置时不受默认位置影响);
6. 移动端(<768px):画布 180px、触摸拖动正常。

- [ ] **Step 4: 提交**

```bash
git add src/styles/globals.css
git commit -m "style: place live2d mascot at bottom-right by default

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**执行说明(worktree):** 按用户工作流偏好,本任务在隔离 worktree 中执行(见 superpowers:using-git-worktrees),完成后合并回本地 master。
