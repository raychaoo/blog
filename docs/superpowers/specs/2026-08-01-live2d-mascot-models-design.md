# 看板娘多模型切换 + 拖动 — 设计

日期:2026-08-01
状态:已批准

## 背景与问题

看板娘基于 **live2d-widget v1**(`stevenjoezhang/live2d-widget`,Cubism 2 引擎,`public/live2d/live2d.min.js`),模型完全自托管。现状:

- 只有一个模型 shizuku(`public/live2d-api/model/shizuku/`,2.8MB),[model_list.json](public/live2d-api/model_list.json) 为 `{"models": ["shizuku"]}`。
- 控件条 tools 当前为 `["hitokoto", "photo", "info", "quit"]`,**未开启** `switch-model`(切换模型)按钮。
- 小部件内置拖动功能,但由 `drag: true` 选项开关控制,当前未传入,故**不可拖动**。
- [waifu-tips.json](public/live2d/waifu-tips.json) 的 `models` 数组残留 jsdelivr 外链(HyperdimensionNeptunia、Hiyori 等),违反全自托管约定(该数组在 CDN 模式下实际不被使用)。

## 目标

1. 新增 **Pio、Tia** 两个 Cubism 2 模型,可循环切换(切换按钮 + 模型选择持久化,均由小部件内置能力提供)。
2. 看板娘可**拖动**,且拖动位置**跨页面/刷新保持**(localStorage 记忆)。
3. 切换模型时显示每个模型对应的欢迎语;全程不依赖外网资源。
4. **移动端支持(补充)**:移除 `<768px` 不加载限制,小屏画布自动缩小到 180px,支持**触摸拖动**(内置拖动为纯鼠标事件,须补 touch 等效实现)。

## 方案

采用**方案 A:复用小部件内置能力 + 最小封装**(不修改任何 vendor 编译文件):

- 拖动:传 `drag: true` 启用内置拖动(自带视口边界钳制),另加 ~30 行薄封装做位置记忆。
- 模型切换:传 `"switch-model"` 工具按钮,模型列表由 `model_list.json` 驱动,`modelId` 由小部件自动存 `localStorage`。
- 模型文件:从 fghrsh/live2d_api 仓库下载 Pio/Tia(Cubism 2 格式)自托管。

## 数据流

### 模型加载与切换(小部件内置)

1. `initWidget` 传 `cdnPath: "/live2d-api/"` → 小部件 fetch `${cdnPath}model_list.json` 得到模型列表。
2. 当前模型 = `models[modelId]`,加载 `${cdnPath}model/<name>/index.json`;`modelId` 持久化在 `localStorage("modelId")`,跨访问保持。
3. 点击 `switch-model` 按钮 → `loadNextModel()`:CDN 模式下 `modelId = (modelId+1) % models.length`,并取 **`modelList.messages[modelId]`** 作为切换后的欢迎语(已从源码确认)。
4. 切换失败走内置 `changeFail` 提示。

### 拖动与位置记忆(封装层)

1. `drag: true` → 小部件在 `#waifu` 上绑定 mousedown(目标须为 `#live2d` 画布),mousemove 时 `style.top/left = px`,按 `0 ≤ top ≤ innerHeight - waifuH`、`0 ≤ left ≤ innerWidth - waifuW` 钳制。
2. 封装层(在 `live2d-mascot.tsx` 中):
   - **恢复**:MutationObserver 等待 `#waifu` 出现 → 读 `localStorage("waifu-position")` 的 `{top, left}`,按与内置拖动相同的公式对当前视口钳制后写入 `style.top/left` → 断开 observer。
   - **保存**:`document.mouseup` 时读 `#waifu` 当前 `style.top/left` 写回 localStorage(幂等,无拖动时写入的也是现值,无副作用);**仅当两个值均为有效 px 字符串时写回**,首次拖动前为空字符串则跳过。
   - 用模块级 flag 防 React StrictMode 开发模式下的重复绑定。

## 组件改动

### `src/components/live2d/live2d-mascot.tsx`

- `tools` 增加 `"switch-model"` → `["hitokoto", "switch-model", "photo", "info", "quit"]`。
- `initWidget` 参数增加 `drag: true`。
- 新增位置记忆逻辑(见上"拖动与位置记忆"),`localStorage` key:`waifu-position`(与现有 `modelId`、`blog-theme` 存储风格一致),存 JSON `{top, left}`。

### `public/live2d-api/model_list.json`

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

### `public/live2d-api/model/`(新增)

- `model/pio/`、`model/tia/`:从 fghrsh/live2d_api 下载 Potion-Maker/Pio 与 Potion-Maker/Tia(Cubism 2:index.json + .moc + 贴图 + mtn + 表情等),保持模型内部相对路径结构原样拷入(移动整个文件夹不破坏相对引用)。
- 与 shizuku 同级扁平命名;`textures.cache` 为多贴图模型的缓存文件,缺失时小部件会回退读 index.json 的 textures,无需手工生成。

### 移动端支持(补充)

- **`src/components/live2d/live2d-mascot.tsx`**:删除 `if (window.innerWidth < 768) return;` 早退;在 `bindPositionPersistence` 中新增 `bindTouchDrag(waifu)`,在 `#live2d` 画布上绑定 `touchstart`(单指)→ `document.touchmove`(非被动 + `preventDefault` 抑制页面滚动,按内置拖动同款公式钳制)→ `document.touchend`(移除监听并立即 `save()` 位置,mouseup 在触摸拖动中不可靠)。绑定时机并入已有的 `applyIfReady`(等待 `#waifu` 出现),模块级 `bound` flag 防重复绑定。
- **`src/styles/globals.css`**:新增媒体查询 `@media (max-width: 767px)` 下 `#live2d { width/height: 180px !important; touch-action: none }`。`!important` 因 waifu.css 为运行时后注入(同特异性后者赢);`touch-action: none` 让浏览器不接管画布手势,否则 iOS 会滚动页面而非拖动。
- 模型本体触摸互动(点击出表情/动作)由 cubism2 核心自带的 `touchstart/touchend/touchmove` 处理,无需改动。

### `public/live2d/waifu-tips.json`

- `models` 数组:删除 jsdelivr 外链条目(HyperdimensionNeptunia、Hiyori),替换为本地路径条目(仅配置卫生,CDN 模式下不被逻辑使用):
  - `{"name": "Pio", "paths": ["/live2d-api/model/pio/index.json"]}`
  - `{"name": "Tia", "paths": ["/live2d-api/model/tia/index.json"]}`
- `mouseover` 中 `#waifu-tool-switch-model` 的悬停文案沿用现有默认文案,不动。

## 边界情况

| 情况 | 行为 |
|------|------|
| 视口缩小后位置越界 | 恢复时按内置拖动同款公式重新钳制,不出屏 |
| localStorage 无记录(首次) | 保持默认位置(左下角),不写入 |
| 存储值损坏/非法 | 解析失败即忽略,回退默认位置 |
| StrictMode 开发模式双挂载 | 模块级 flag 防重复绑定 observer/事件 |
| 移动端(<768px) | 显示看板娘,画布 180px,触摸拖动生效,位置/模型记忆与桌面共用 localStorage |
| 模型切换顺序 | 内置 `(modelId+1) % length` 循环,持久化在 `localStorage("modelId")` |
| 模型资源加载失败 | 内置 `changeFail` 提示,保持当前模型 |

## 测试策略

小部件为第三方编译文件 + 纯静态资源 + 少量客户端封装,仓库无 UI 单测先例(jsdom 约定限制),采用 `pnpm dev` 手动验证:

1. 切换按钮循环 shizuku → pio → tia,每个模型切换后显示对应 `messages` 欢迎语;刷新后保持上次所选模型。
2. 拖动模型本体可移动,不超出视口;刷新/切换页面后位置保持。
3. 悬停切换按钮显示默认萌系文案。
4. 网络面板确认无任何外网请求(全自托管;点击 hitokoto 工具会请求 v1.hitokoto.cn 属既有 vendor 行为,不算此条)。
5. 移动端(iPhone SE 375px):看板娘显示、画布 180px、单指拖动移动且钳制视口、点击模型出表情/动作、切换模型与位置记忆正常。

## 涉及文件

- `src/components/live2d/live2d-mascot.tsx`(改)
- `public/live2d-api/model_list.json`(改)
- `public/live2d-api/model/pio/`、`model/tia/`(新增,资源)
- `public/live2d/waifu-tips.json`(改)
- `src/styles/globals.css`(改,移动端媒体查询)
- `CLAUDE.md`(改,同步"desktop-only"描述)
