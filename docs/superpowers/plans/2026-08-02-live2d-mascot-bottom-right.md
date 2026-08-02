# 看板娘默认位置右下角 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 Live2D 看板娘默认位置从左下角改为右下角,显隐切换小标签同步镜像到右边缘。

**Architecture:** `#waifu` 默认定位在 `src/components/live2d/live2d-mascot.tsx` 运行时注入的非 `!important` `<style>`(`#waifu { left: auto; right: 0 }`,在 waifu.css 之后 append,同特异性后加载胜;内联 `left` 按级联仍优先)。`src/styles/globals.css` 保留 `#waifu-toggle`/`#waifu-tool` 的 `!important` 覆盖。JS 拖动/位置记忆逻辑语义不变:restore/touchstart/save/mousedown(带 left 门槛)四处在写内联锚定时同步清掉对应反向锚。

**Tech Stack:** Tailwind CSS v4 + 原生 CSS(`src/styles/globals.css`)。

## Global Constraints

- 不修改 vendored 文件(`public/live2d/waifu.css`、`waifu-tips.js` 等);`#waifu` 定位规则实际落在 `live2d-mascot.tsx` 运行时注入的非 `!important` 样式(`#waifu { left: auto; right: 0 }`,与 waifu.css 同特异性、后加载胜;内联 `left` 按级联仍优先,拖拽/restore 不受影响)
- `#waifu` 的 `bottom` 入场动画(`-500px → 0`)、`transform` 过渡、`z-index` 保持不动
- 内联 `left` 生效后清 `right/bottom` 锚(三处:restore/touchstart/save + 鼠标拖拽前 mousedown),防双锚把元素拉伸成整条透明带
- 主题全部走 CSS 变量,本改动不引入颜色
- 门禁:`pnpm build` + 浏览器手工核对(仓库 UI 改动无单测先例)

---

### Task 1: globals.css 新增看板娘右下角覆盖规则

**Files:**
- Modify: `src/styles/globals.css` — 在移动端看板娘块(844 行注释)之前插入(toggle 镜像 + `#waifu-tool` 视口裁切覆盖)
- Modify: `src/components/live2d/live2d-mascot.tsx` — 运行时注入非 `!important` 样式 `#waifu { left: auto; right: 0; }`(后加载胜,内联 `left` 仍优先),并清 `right/bottom` 锚防双锚拉伸(restore/touchstart/save 三处 + 鼠标拖拽前 mousedown)

**Interfaces:**
- Consumes: 无
- Produces: 无(纯 CSS + 运行时注入样式;拖拽/位置记忆逻辑不受影响,内联 `left/top` 按级联优先于注入样式)

- [ ] **Step 1: 实现右下角默认定位(`#waifu` 的默认定位**不能**用 globals.css 的 `!important` 覆盖 — 会压过拖拽/restore 的内联 `left`,见评审 Critical)**

① `src/styles/globals.css` — 在移动端看板娘块(844 行注释)之前插入 toggle + 工具面板覆盖:

```css
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

/* 工具面板贴回看板娘右缘:right: -10px 溢出在右下角默认位会被视口裁切 */
#waifu-tool {
  right: 0 !important;
}
```

原 `waifu.css` 对应关系:`#waifu-toggle { left: 0; margin-left: -100px }` → `right: 0 !important; left: auto !important; margin-left: 0 !important; margin-right: -100px`;
`transition: margin-left 1s` → `transition: margin-right 1s`(waifu.css 不设 `margin-right`,故 slide 状态无需 `!important`);`#waifu-tool { right: -10px }` → `right: 0 !important`(右下角默认位防视口裁切)。

② `src/components/live2d/live2d-mascot.tsx` useEffect — 注入非 `!important` 的默认定位 `<style>`,在 waifu.css 之后 append(同特异性、后加载胜;内联 `left` 按级联仍优先):

```ts
const style = document.createElement("style");
style.textContent = "#waifu { left: auto; right: 0; }";
document.head.append(css, script, style);
```

③ `src/components/live2d/live2d-mascot.tsx` — 写内联锚定时同步清反向锚(防双锚把元素拉伸成整条透明带),共四处:
- `restore()` / `bindTouchDrag` touchstart:写内联 left/top 前清 `bottom` / `right`;
- `save()`:px 检查通过后清 `right` / `bottom`(覆盖 vendored 鼠标拖拽 mouseup 路径);
- canvas `mousedown`:仅当已有内联 `left`(之前拖过/恢复过)时清;无内联 left 时全 auto 会把元素瞬移到文档末尾。

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
