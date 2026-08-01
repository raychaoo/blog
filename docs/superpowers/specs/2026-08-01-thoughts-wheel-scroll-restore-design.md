# 碎碎念念轮盘返回位置恢复 — 设计

日期:2026-08-01
状态:已批准

## 背景与问题

`/thoughts` 页用 ReactBits `OptionWheel` 呈现碎碎念念列表。点击某条卡片进入 `/thoughts/[slug]` 详情页后,页面卸载;浏览器返回时 `ThoughtsClient` 重新挂载,轮盘内部位置(由 `defaultSelected` 初始化为 0)重置,用户丢失了刚才的位置,需要重新滚动。

## 目标

点击某条 thought 卡片进入详情,阅读完返回 `/thoughts` 时,轮盘**从顶部平滑滚动**到之前点击的那一条记录(动画恢复,非瞬间跳转)。

## 方案

采用 **sessionStorage + OptionWheel 新 prop `initialScrollTo`**(方案 A):

- 与 `/posts` 现有的 `sessionStorage` 滚动恢复约定(`posts-scroll` key,见 `src/components/posts/posts-client.tsx`)保持一致。
- 一次恢复语义:读取后立即清除,不影响后续访问。
- 存 **slug** 而非索引:列表顺序变动时依然安全。

## 数据流

1. **记录**:`ThoughtsClient.handleSelect(idx)` 中,除 `router.push(/thoughts/${slug})` 外,将 `thoughts[idx].slug` 写入 `sessionStorage("thoughts-wheel-return")`。
2. **卸载**:导航至详情页,页面卸载。
3. **恢复**:返回 `/thoughts` 时 `ThoughtsClient` 重新挂载,读取该 key,按 slug 在当前列表(日期倒序,顺序稳定)解析出索引;找不到(文章已删除)回退 0;随后 `sessionStorage.removeItem(key)` 实现一次性恢复。
4. **动画**:解析出的索引通过新 prop `initialScrollTo` 传给 OptionWheel。

## 组件改动

### `src/components/thoughts/thoughts-client.tsx`

- 新增常量 `const WHEEL_RETURN_KEY = "thoughts-wheel-return";`
- 挂载 effect:读 key → slug 解析为索引 → 传给 OptionWheel 的 `initialScrollTo` → `removeItem`。
- `handleSelect(idx)`:增加 `sessionStorage.setItem(WHEEL_RETURN_KEY, target.slug)`。

### `src/components/reactbits/option-wheel.tsx`

- 新增可选 prop:`initialScrollTo?: number`(加入 `OptionWheelProps` 接口)。
- 挂载后 effect(置于现有的 `[items, ...]` 重排 effect 之后):
  - 若 `initialScrollTo != null`:调用 `applyTarget(initialScrollTo, true)`。
  - 这样夹取/越界处理、选中态同步(`selectedIndex`/`aria-selected`/`renderItem` 的 selected)、tick 播放、启动 rAF 全部复用现有逻辑,`posRef` 从 `defaultSelected`(0)出发,现有 rAF 指数平滑循环自然产生"从顶部滚到目标"的动画,**不新增任何动画代码**。
  - 目标卡片的选中高亮会在轮盘滚到它之前就绪,滚到时亮起,符合预期。
- 不改动 `defaultSelected` 的既有语义(初始即停)。

## 边界情况

| 情况 | 行为 |
|------|------|
| 存储的 slug 不在当前列表(文章已删) | 回退索引 0,key 仍清除 |
| 详情页刷新后返回 | sessionStorage 仍保留,正常恢复 |
| 直接访问 /thoughts(无记录) | key 不存在,从 0 开始,行为不变 |
| 恢复目标就是第 0 条 | 无动画(本来就在顶部),符合预期 |
| 非 loop 模式越界 | 夹取到边界,自然停止 |
| 连续点击多条进入再返回 | 每次点击都重写 key,恢复的是最后一次点击的那条 |

## 测试策略

与 `/posts` 滚动恢复一致,仓库无 UI 行为单测先例;轮盘动画需要 DOM + rAF mock,不符合仓库 jsdom 使用约定。采用 `pnpm dev` 手动验证:

1. `/thoughts` 点击第 N 条 → 详情 → 返回,轮盘从顶部平滑滚到第 N 条并停住。
2. 再点另一条 → 详情 → 返回,恢复的是新点击的那条。
3. 直接访问 `/thoughts`,轮盘从 0 开始。
4. 快速滚动/拖动轮盘不受影响。

## 涉及文件

- `src/components/thoughts/thoughts-client.tsx`(改)
- `src/components/reactbits/option-wheel.tsx`(改,新增 1 个 prop + 1 个 effect)
