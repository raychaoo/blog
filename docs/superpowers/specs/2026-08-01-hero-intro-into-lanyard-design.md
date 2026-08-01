# 设计:介绍内容烘焙进 Lanyard 卡片

日期:2026-08-01
状态:已与用户确认(用户答复 "先这样吧")

## 目标

把 hero 区的全部介绍内容(标签、名字、tagline、简介)从 `hero-copy` DOM 块移除,烘焙进 Lanyard 3D 卡片的正面贴图。hero 变为全宽居中的放大 Lanyard。

## 背景事实(已实测验证)

- 卡片贴图图集 `card.glb` 内嵌 PNG 为 **1678×1677**(近正方形)。
- 卡片正面 UV 区域:`{x:0, y:0, w:0.5, h:0.755}` → 正面区域 aspect ≈ **0.66**。
- 现有 `buildCardFrontSvg` 产出 480×300(aspect 1.6)的 SVG,经 `imageFit="cover"` 合成时**水平方向被裁掉约 60%**,只有中央 ~41% 可见——新设计必须匹配正面 aspect(≈0.663)才能完整显示。
- 卡片顶部有金属 clip/clamp 网格,会盖住贴图顶部一点,SVG 顶部需留安全边距。
- header 为 sticky `h-14`(56px)。

## 内容(精简版,用户已确认)

1. 小标签:`VIBECODING · BLOG`(uppercase、accent 色)
2. 名字:`你好，我是 {name}`(粗体白字)
3. 合并 tagline(一行放不下则两行居中,浅灰 `#cbd5e1`):
   `全栈开发者 · 热爱 React 与 TypeScript · 记录技术学习与思考`
4. 短简介(1–2 行):
   `记录前端工程化、React 生态与开发效率的实践,有长文,也有碎碎念念。`

> Shuffle / SplitText / TextType 动画在贴图中无法运行,一律移除,文字为静态。

## 实现方案(用户已选:烘焙进卡片贴图)

### 1. 卡片正面 SVG(480×724,aspect ≈ 0.663)

- 深色底 `#111827` + accent 描边圆角框(与现状一致,accent 跟随主题变量,经 `useAccentColors()` 传入)
- 垂直布局:顶部小标签 → 名字 → accent 分隔线 → tagline → 底部简介
- 顶部留安全边距(避开金属 clip),内容垂直分布均匀

### 2. 布局与卡片放大

- `hero.tsx`:
  - 删除 `hero-copy` 块及 Shuffle / SplitText / TextType 的导入与使用
  - `hero-section` 变单栏居中;`hero-lanyard` 高度改为 `clamp(480px, calc(100vh - 56px), 880px)`
  - 传给 Lanyard 更大的 `cardScale`
- `lanyard.tsx`:
  - 新增 `cardScale` prop(默认 2.25),透传进 `Band` 替换硬编码的 `scale={2.25}`
  - 移动端视口窄,按 `isMobile` 自动收小 scale(避免卡片横向溢出画布)
  - 相机 fov/position 微调以保证放大后卡片摆动不出画布

> 注意:以上数值(放大倍数、fov、移动端收小比例)以实现阶段实测目测微调为准,不追求一次到位。

### 3. 代码结构

- 新建 `src/lib/card-face.ts`:导出 `buildCardFrontSvg(name, tagline, intro, accent): string`(纯函数,返回 `data:image/svg+xml` URL),hero.tsx 调用
- `globals.css`:删除 `hero-copy` / `hero-title` / `hero-tagline` / `hero-intro` 相关样式(确认无其他地方引用后),`hero-section` 改单栏
- Vitest 单测:`buildCardFrontSvg` 生成的 data URL 可解码、包含名字/tagline/简介文案、宽高比为 480×724

### 4. 验证

- `pnpm test`(新增单测)
- `pnpm build`(类型/编译通过)
- `pnpm dev` 实测:桌面/移动端卡片大小、文字可读性、摆动不出界、拖拽正常、主题切换 accent 跟随

## 不做的事(YAGNI)

- 不做 3D 空间 Html 附着(用户已排除)
- 不做运行时 canvas 绘制
- 不保留任何 hero 处 DOM 动画文字
- 不动 `关于我` 资料卡区块(已有介绍文字,非本次范围)
