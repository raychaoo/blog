# 看板娘多模型切换 + 拖动 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增 Pio/Tia 两个可切换的 Cubism 2 看板娘模型(全自托管),并启用看板娘拖动 + 拖动位置跨页记忆。

**Architecture:** 复用 live2d-widget v1 内置能力(方案 A):`drag: true` 启用内置拖动、`switch-model` 工具按钮切换模型、`model_list.json` 的 `messages` 数组驱动切换欢迎语;仅新增 ~40 行位置持久化薄封装于 `live2d-mascot.tsx`。模型从 fghrsh/live2d_api 稀疏克隆后裁剪换装贴图(只留 default-costume.png)自托管。**不修改任何 vendor 编译文件**(`public/live2d/*.js`、`chunk/*.js`、`live2d.min.js`)。

**Tech Stack:** Next.js 16(App Router)/ React 19 / TS;live2d-widget v1(Cubism 2);git sparse-checkout 拉取模型。

## Global Constraints

- **全自托管**:除一次性下载源(fghrsh/live2d_api GitHub 仓库)外,仓库内不得残留任何外网 URL(含 jsdelivr 等 CDN);网络面板验证 0 外网请求。
- **模型格式**:必须 Cubism 2(`index.json` + `.moc`,非 `.model3.json`)。引擎 `live2d.min.js` 仅支持 Cubism 2。
- **不碰 vendor**:`public/live2d/waifu-tips.js`、`public/live2d/chunk/*`、`public/live2d/live2d.min.js`、`public/live2d/waifu.css` 一律不改。
- **目录命名**:模型目录与现有 shizuku 同级扁平命名 → `public/live2d-api/model/pio/`、`model/tia/`。
- **存储风格**:localStorage key 用 `waifu-position`,与现有 `modelId`、`blog-theme` 平级命名。
- **提交信息**:遵循仓库常规格式(`feat:` / `chore:` / `docs:`),每个任务一个独立提交。
- **执行环境**:在隔离 worktree 中执行(创建方式见 using-git-worktrees 技能);worktree 内新装依赖若 vitest 报 WASI 错,用 `pnpm install --force` 修复(已知坑)。
- **Lint**:仓库 lint 基线已坏,不跑全量 lint;只对改动文件自查,用 `pnpm build` 做 TypeScript 门禁。

设计文档:`docs/superpowers/specs/2026-08-01-live2d-mascot-models-design.md`(已批准)。

---

### Task 1: 自托管 Pio/Tia 模型资源(下载 + 裁剪 + 提交)

**Files:**
- Create: `public/live2d-api/model/pio/**`(index.json、model.moc、motions/、textures/default-costume.png、textures.cache)
- Create: `public/live2d-api/model/tia/**`(同构)

**Interfaces:**
- Consumes: 无(纯静态资源)。
- Produces: 两个模型目录,内部相对路径结构必须保持(index.json 引用的 `model.moc`、`textures/default-costume.png`、`motions/*.mtn` 全部存在);`textures.cache` 重写为只含 default-costume 的数组。Task 2 的 `model_list.json` 将按 `pio`/`tia` 名引用,Task 3 验证时小部件将请求 `/live2d-api/model/pio/index.json`。

**背景知识**(实现者必读,均已在探索阶段从当前 vendor 源码验证):

- 小部件 CDN 模式加载链路:`fetch /live2d-api/model/<name>/index.json` → `checkModelVersion()`:非 Cubism 3(`Version===3` 或含 `FileReferences`)一律返回 2 → 再 `fetch /live2d-api/model/<name>/textures.cache` 并取 `textures[modelTexturesId]` 覆盖贴图。因此 **textures.cache 必须存在且第一个元素有效**;modelTexturesId 始终为 0(未开启 switch-texture),其余缓存条目永不加载。
- fghrsh/live2d_api 的 Pio/Tia 为 Cubism 2(index.json 无 `FileReferences`),`hit_areas_custom` 字段被 cubism2 core 原生支持,点击互动与 shizuku 一致。
- index.json 全部是相对路径,整个文件夹搬移/重命名安全。

- [ ] **Step 1: 稀疏克隆 fghrsh/live2d_api,只取 Potion-Maker 两个模型**

```bash
# 在仓库外部的临时目录操作(勿污染仓库)
rm -rf /tmp/live2d_api
git clone --depth 1 --filter=blob:none --sparse https://github.com/fghrsh/live2d_api.git /tmp/live2d_api
cd /tmp/live2d_api
git sparse-checkout set model/Potion-Maker
ls model/Potion-Maker
```

预期:`model/Potion-Maker/Pio` 与 `model/Potion-Maker/Tia` 两个目录存在(内含 index.json、model.moc、motions/、textures/、textures.cache)。若网络不通,使用 GitHub raw 逐个下载对应文件(文件清单见 GitHub API tree),不得改用其他 CDN 源。

- [ ] **Step 2: 拷贝到仓库并重命名(大写 → 小写)**

```bash
cd <worktree 根目录>
mkdir -p public/live2d-api/model
cp -r /tmp/live2d_api/model/Potion-Maker/Pio public/live2d-api/model/pio
cp -r /tmp/live2d_api/model/Potion-Maker/Tia public/live2d-api/model/tia
```

- [ ] **Step 3: 裁剪换装贴图,只保留 default-costume.png,并重写 textures.cache**

```bash
# Pio
find public/live2d-api/model/pio/textures -type f ! -name "default-costume.png" -delete
printf '["textures/default-costume.png"]' > public/live2d-api/model/pio/textures.cache
# Tia
find public/live2d-api/model/tia/textures -type f ! -name "default-costume.png" -delete
printf '["textures/default-costume.png"]' > public/live2d-api/model/tia/textures.cache
```

原因:原始目录各含 ~50 张换装贴图(Pio 40.7MB / Tia 27.2MB),裁剪后合计约 1.5MB。textures.cache 格式为 JSON 字符串数组(与 shizuku 的 `[[...]]` 嵌套不同,此处为扁平数组,小部件两者都支持)。

- [ ] **Step 4: 校验资源完整性**

```bash
cd <worktree 根目录>
# index.json 必须是合法 JSON,且引用的文件全部存在
python -c "
import json
for m in ['pio','tia']:
    d = json.load(open(f'public/live2d-api/model/{m}/index.json', encoding='utf-8'))
    paths = [d['model']] + d['textures']
    import os
    missing = [p for p in paths if not os.path.exists(f'public/live2d-api/model/{m}/{p}')]
    assert not missing, f'{m} missing: {missing}'
    for g, arr in d.get('motions', {}).items():
        for item in arr:
            f = item['file']
            assert os.path.exists(f'public/live2d-api/model/{m}/{f}'), f'{m} missing motion: {f}'
    print(m, 'OK')
"
du -sh public/live2d-api/model/pio public/live2d-api/model/tia
```

预期:两行 `OK`;每目录 ~0.8MB 量级(合计 ≤ 2MB)。任何缺失/超限都视为失败,回到 Step 2/3 修正。

- [ ] **Step 5: 清理临时目录并提交**

```bash
rm -rf /tmp/live2d_api
git add public/live2d-api/model/pio public/live2d-api/model/tia
git commit -m "feat: self-host Pio and Tia live2d models for mascot switching"
```

---

### Task 2: 更新 model_list.json 与 waifu-tips.json(切换配置 + 外链清理)

**Files:**
- Modify: `public/live2d-api/model_list.json`(整体替换内容)
- Modify: `public/live2d/waifu-tips.json`(仅 `models` 数组)

**Interfaces:**
- Consumes: Task 1 的 `model/pio`、`model/tia` 目录名。
- Produces: `model_list.json` 的 `models` 数组(驱动切换顺序)与 `messages` 数组(驱动切换欢迎语,`loadNextModel` 在 CDN 模式下取 `modelList.messages[modelId]`,已从 vendor 源码确认);`waifu-tips.json` 的 `models` 数组仅供非 CDN 模式/配置卫生,指向本地路径。

- [ ] **Step 1: 整体替换 `public/live2d-api/model_list.json`**

内容(逐字节一致,含 UTF-8 中文):

```json
{
  "models": ["shizuku", "pio", "tia"],
  "messages": [
    "来自 Live2D 官方示例的 Shizuku 酱 ~",
    "来自 Potion Maker 的 Pio 酱 ~",
    "来自 Potion Maker 的 Tia 酱 ~"
  ]
}
```

- [ ] **Step 2: 替换 `public/live2d/waifu-tips.json` 的 `models` 数组**

把现有 `models` 数组(含 jsdelivr 外链的 Pio/Tia/HyperdimensionNeptunia/Hiyori 四条)整体替换为:

```json
  "models": [{
    "name": "Pio",
    "paths": ["/live2d-api/model/pio/index.json"]
  }, {
    "name": "Tia",
    "paths": ["/live2d-api/model/tia/index.json"]
  }]
```

注意保留外层 `"models":` 键;文件中其余部分(seasons/time/message/mouseover/click)一律不动。

- [ ] **Step 3: 校验 JSON 合法性**

```bash
python -c "import json; json.load(open('public/live2d-api/model_list.json', encoding='utf-8')); json.load(open('public/live2d/waifu-tips.json', encoding='utf-8')); print('JSON OK')"
grep -c "jsdelivr" public/live2d/waifu-tips.json
```

预期:`JSON OK`;jsdelivr 计数为 **0**(全仓库应无外链,可再跑 `grep -rn "jsdelivr\|fastly" public/ | grep -v "\.map"` 复核,预期无输出)。

- [ ] **Step 4: 提交**

```bash
git add public/live2d-api/model_list.json public/live2d/waifu-tips.json
git commit -m "feat: configure live2d model switching (model list and messages)"
```

---

### Task 3: live2d-mascot.tsx — 开启切换工具、拖动与位置记忆

**Files:**
- Modify: `src/components/live2d/live2d-mascot.tsx`(整体替换为下方代码)

**Interfaces:**
- Consumes: Task 2 的 `model_list.json`(小部件运行时读取,本任务代码不直接引用)。
- Produces: 无(自包含组件,根布局已挂载)。行为契约:三模型可循环切换;拖动画布(`#live2d`)移动且钳制视口;位置存 `localStorage("waifu-position")` 为 JSON `{top, left}`;StrictMode 开发模式不重复绑定。

**背景知识**(已从 vendor 源码确认):

- 内置拖动:`drag: true` 时小部件在 `#waifu` 上绑定 mousedown(仅当 target 为 `#live2d` 画布),mousemove 直接写 `style.top/left`(px,钳制 `0..innerWidth-waifuW` / `0..innerHeight-waifuH`),不持久化 —— 故需本任务封装记忆。
- `#waifu` DOM 由小部件在 `initWidget` 的异步流程中创建,须用 MutationObserver 等待其出现后再恢复位置。
- 首次拖动前 `style.top/left` 为空字符串,保存逻辑须跳过(否则写入非法值)。

- [ ] **Step 1: 整体替换 `src/components/live2d/live2d-mascot.tsx`**

```tsx
"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    initWidget?: (options: Record<string, unknown>) => void;
  }
}

const POSITION_KEY = "waifu-position";

// 模块级 flag:防 React StrictMode 开发模式双挂载导致的重复绑定
let bound = false;

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
            tools: ["hitokoto", "switch-model", "photo", "info", "quit"],
            drag: true,
          });
          bindPositionPersistence();
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

/** 看板娘拖动位置持久化:恢复 + 保存 */
function bindPositionPersistence() {
  if (bound) return;
  bound = true;

  // 读取保存的位置;缺失或解析失败(值损坏)返回 null,回退默认位置
  const readSaved = (): { top: number; left: number } | null => {
    try {
      const raw = localStorage.getItem(POSITION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { top?: unknown; left?: unknown };
      if (typeof parsed.top !== "number" || typeof parsed.left !== "number") {
        return null;
      }
      return { top: parsed.top, left: parsed.left };
    } catch {
      return null;
    }
  };

  // 保存当前位置;首次拖动前 style.top/left 为空字符串,跳过
  const save = () => {
    const waifu = document.getElementById("waifu");
    if (!waifu) return;
    const { top, left } = waifu.style;
    if (!top.endsWith("px") || !left.endsWith("px")) return;
    localStorage.setItem(
      POSITION_KEY,
      JSON.stringify({ top: parseFloat(top), left: parseFloat(left) })
    );
  };

  // 恢复位置,按内置拖动同款公式对当前视口钳制
  const restore = (waifu: HTMLElement) => {
    const saved = readSaved();
    if (!saved) return;
    const maxLeft = Math.max(0, window.innerWidth - waifu.offsetWidth);
    const maxTop = Math.max(0, window.innerHeight - waifu.offsetHeight);
    waifu.style.left = `${Math.min(Math.max(saved.left, 0), maxLeft)}px`;
    waifu.style.top = `${Math.min(Math.max(saved.top, 0), maxTop)}px`;
  };

  // #waifu 由小部件异步创建:先查一次,未出现则用 MutationObserver 等待
  const applyIfReady = () => {
    const waifu = document.getElementById("waifu");
    if (!waifu) return false;
    restore(waifu);
    return true;
  };

  if (!applyIfReady()) {
    const observer = new MutationObserver(() => {
      if (applyIfReady()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  document.addEventListener("mouseup", save);
}
```

- [ ] **Step 2: TypeScript 门禁**

```bash
pnpm build
```

预期:构建成功(`✓ Compiled successfully`),无 TS 报错。若 worktree 首次构建报 vitest/WASI 相关错误,先 `pnpm install --force` 再重试。

- [ ] **Step 3: 提交**

```bash
git add src/components/live2d/live2d-mascot.tsx
git commit -m "feat: enable live2d drag with position memory and model switch tool"
```

---

### Task 4: 手动验证(浏览器)

**Files:** 无(验证任务)

**Interfaces:** 验证 Task 1-3 的全部行为契约。

- [ ] **Step 1: 启动开发服务器并打开页面**

```bash
pnpm dev
```

浏览器访问 `http://localhost:3000`,等待 1.5s+ 看板娘加载(桌面宽度)。

- [ ] **Step 2: 按清单逐项验证**

| # | 检查项 | 预期 |
|---|--------|------|
| 1 | 看板娘控件条出现「切换模型」按钮(`#waifu-tool-switch-model`) | 按钮存在,图标正确 |
| 2 | 悬停切换按钮 | 显示默认萌系文案(「你是不是不爱人家了呀,呜呜呜～」等) |
| 3 | 点击切换按钮循环切模型 | shizuku → pio → tia → shizuku 循环,模型外观明显不同 |
| 4 | 每次切换后气泡 | 显示对应 `messages` 文案(Shizuku/Pio/Tia 各一条) |
| 5 | 刷新页面 | 保持切换后的模型(小部件 `localStorage("modelId")`) |
| 6 | 按住模型画布拖动 | 看板娘跟随鼠标移动,且不超出视口上下/左右边界 |
| 7 | 拖动到新位置后刷新页面 / 切换路由再返回 | 位置保持(读 `localStorage("waifu-position")`) |
| 8 | 开发者工具 Network 面板 | 全程无 `githubusercontent`/`jsdelivr` 等外网请求(仅 localhost) |
| 9 | 窗口缩到 <768px(移动端) | 看板娘显示、画布 180px、单指触摸拖动生效(见 Task 5) |

- [ ] **Step 3: 如发现缺陷,回到对应 Task 修复后重验**

- [ ] **Step 4: 全部通过后,向用户报告验证结果(含截图/实测描述),等待合并指示**

---

### Task 5: 移动端支持(移除 768px 限制 + 180px 画布 + 触摸拖动)

**Files:**
- Modify: `src/components/live2d/live2d-mascot.tsx`(整体替换为下方代码)
- Modify: `src/styles/globals.css`(文件末尾追加媒体查询)
- Modify: `CLAUDE.md`(更新 live2d 描述中的 "desktop-only (hidden <768px)")

**Interfaces:**
- Consumes: Task 3 的 `bindPositionPersistence`/`applyIfReady` 结构(本任务在其内部扩展)。
- Produces: 无(行为契约):全屏宽加载看板娘;`<768px` 时画布 180px;触摸单指拖动 `#live2d` 可移动整个看板娘并钳制视口;触摸拖动结束时保存位置;桌面行为不变。

**背景知识**(已从 vendor 源码确认):

- 小部件内置拖动仅监听 `mousedown/mousemove/mouseup`(绑定在 `#waifu`,target 须为 `#live2d`),触摸设备不触发,需自行补 touch 等效实现。
- cubism2 核心在 canvas 上自绑 `touchstart/touchend/touchmove`(模型本体点击/拖参互动),与容器级拖动互不冲突。
- `#live2d` 的 300x300 是 vendor waifu.css 定死,须用**我们的** globals.css + `!important` 覆盖(waifu.css 为运行时后注入,同特异性下后者赢)。
- iOS 上须 `touch-action: none`(或 touchmove 非被动 + preventDefault)才能阻止页面滚动接管手势。
- `<768px` 早退是唯一限制入口(waifu.css 无媒体查询),删除即全屏显示。

- [ ] **Step 1: `src/styles/globals.css` 末尾追加移动端媒体查询**

```css
/* 移动端看板娘:缩小画布并允许触摸拖动(!important 覆盖运行时注入的 waifu.css) */
@media (max-width: 767px) {
  #live2d {
    width: 180px !important;
    height: 180px !important;
    touch-action: none;
  }
}
```

- [ ] **Step 2: 整体替换 `src/components/live2d/live2d-mascot.tsx`**

```tsx
"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    initWidget?: (options: Record<string, unknown>) => void;
  }
}

const POSITION_KEY = "waifu-position";

// 模块级 flag:防 React StrictMode 开发模式双挂载导致的重复绑定
let bound = false;

export default function Live2dMascot() {
  useEffect(() => {
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
            tools: ["hitokoto", "switch-model", "photo", "info", "quit"],
            drag: true,
          });
          bindPositionPersistence();
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

/** 看板娘拖动位置持久化:恢复 + 保存 + 触摸拖动 */
function bindPositionPersistence() {
  if (bound) return;
  bound = true;

  // 读取保存的位置;缺失或解析失败(值损坏)返回 null,回退默认位置
  const readSaved = (): { top: number; left: number } | null => {
    try {
      const raw = localStorage.getItem(POSITION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { top?: unknown; left?: unknown };
      if (typeof parsed.top !== "number" || typeof parsed.left !== "number") {
        return null;
      }
      return { top: parsed.top, left: parsed.left };
    } catch {
      return null;
    }
  };

  // 保存当前位置;首次拖动前 style.top/left 为空字符串,跳过
  const save = () => {
    const waifu = document.getElementById("waifu");
    if (!waifu) return;
    const { top, left } = waifu.style;
    if (!top.endsWith("px") || !left.endsWith("px")) return;
    localStorage.setItem(
      POSITION_KEY,
      JSON.stringify({ top: parseFloat(top), left: parseFloat(left) })
    );
  };

  // 恢复位置,按内置拖动同款公式对当前视口钳制
  const restore = (waifu: HTMLElement) => {
    const saved = readSaved();
    if (!saved) return;
    const maxLeft = Math.max(0, window.innerWidth - waifu.offsetWidth);
    const maxTop = Math.max(0, window.innerHeight - waifu.offsetHeight);
    waifu.style.left = `${Math.min(Math.max(saved.left, 0), maxLeft)}px`;
    waifu.style.top = `${Math.min(Math.max(saved.top, 0), maxTop)}px`;
  };

  // 触摸拖动(移动端):内置拖动只监听鼠标事件,这里补 touch 等效实现
  const bindTouchDrag = (waifu: HTMLElement) => {
    const canvas = document.getElementById("live2d");
    if (!canvas) return;
    canvas.addEventListener(
      "touchstart",
      (e: TouchEvent) => {
        if (e.touches.length !== 1) return;
        const touch = e.touches[0];
        const rect = waifu.getBoundingClientRect();
        const dx = touch.clientX - rect.left;
        const dy = touch.clientY - rect.top;
        const maxLeft = Math.max(0, window.innerWidth - waifu.offsetWidth);
        const maxTop = Math.max(0, window.innerHeight - waifu.offsetHeight);
        const onMove = (ev: TouchEvent) => {
          ev.preventDefault(); // 抑制页面滚动
          const t = ev.touches[0];
          waifu.style.left = `${Math.min(Math.max(t.clientX - dx, 0), maxLeft)}px`;
          waifu.style.top = `${Math.min(Math.max(t.clientY - dy, 0), maxTop)}px`;
        };
        const onEnd = () => {
          document.removeEventListener("touchmove", onMove);
          document.removeEventListener("touchend", onEnd);
          save(); // 触摸拖动的 mouseup 不可靠,结束时直接保存
        };
        document.addEventListener("touchmove", onMove, { passive: false });
        document.addEventListener("touchend", onEnd);
      },
      { passive: true }
    );
  };

  // #waifu 由小部件异步创建:先查一次,未出现则用 MutationObserver 等待
  const applyIfReady = () => {
    const waifu = document.getElementById("waifu");
    if (!waifu) return false;
    restore(waifu);
    bindTouchDrag(waifu);
    return true;
  };

  if (!applyIfReady()) {
    const observer = new MutationObserver(() => {
      if (applyIfReady()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  document.addEventListener("mouseup", save);
}
```

注意:删除原 `if (window.innerWidth < 768) return;` 早退(全屏宽加载);`bindTouchDrag` 在 `applyIfReady` 内调用(`#waifu` 出现后),模块级 `bound` flag 已防重复绑定。

- [ ] **Step 3: 更新 `CLAUDE.md` 的 live2d 描述**

把两处 "desktop-only" 相关描述改为移动端可用:

```markdown
├── live2d/live2d-mascot.tsx    # Global mascot (lazy-loaded from /live2d, 全屏宽,移动端画布 180px + 触摸拖动)
```

```markdown
- **Live2D is fully self-hosted & static** — no external CDN. The mascot lazy-loads `waifu-tips.js` + `waifu.css` from `/live2d` after 1.5s, draggable (mouse + touch), with `hitokoto`/`photo`/`info`/`quit` tools and 3 switchable models (shizuku/Pio/Tia); canvas shrinks to 180px below 768px.
```

- [ ] **Step 4: TypeScript 门禁**

```bash
pnpm build
```

预期:构建成功(`✓ Compiled successfully`),无 TS 报错。

- [ ] **Step 5: 提交**

```bash
git add src/components/live2d/live2d-mascot.tsx src/styles/globals.css CLAUDE.md
git commit -m "feat: show live2d mascot on mobile with touch drag and smaller canvas"
```

- [ ] **Step 6: 验证提示**

告知用户:桌面行为不变;iPhone SE(375px)显示 180px 画布、单指可拖动、点击模型有表情/动作、位置记忆生效。

---
