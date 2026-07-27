# Inspiration Hotspot Drawer Overlay Design

## Goal

将 inspiration 页面点击 hotspot 后的商品 Drawer 从“右侧白色整栏”改为“居中商品卡片组 + 全屏 mask”，让商品卡片成为图片展开场景中的主要视觉焦点。

## Scope

- 仅修改 `InspirationProductDrawer` 的展示层与动画表现，以及 inspiration 页面针对该 Drawer 的视觉回归检查。
- 保留原生 `dialog` 的 modal/top-layer 能力、商品数据、商品链接、关闭按钮、Esc 关闭、遮罩点击关闭和 hotspot 焦点恢复。
- 不修改图片、hotspot 数据、API、服务契约、权限或持久化模型。

## Design

- Drawer 继续由现有 `showModal()` 打开，确保位于图片 lightbox 上层。
- `dialog::backdrop` 提供深色半透明与轻微模糊的全屏 mask，弱化底层图片但保留场景上下文。
- Drawer 本体改为视口居中的浮层面板，使用受限宽高、圆角与阴影；不再固定贴靠右侧或铺满整高。
- 商品列表改为响应式卡片组：宽屏并排展示，窄屏自动单列；卡片维持当前商品图片、标题、价格与详情链接。
- Drawer 继续使用现有 `dxv-drawer` 生命周期修复，关闭动画结束后才退出 top layer，并在 `after-leave` 恢复 hotspot 焦点。
- 进入/退出动画改为轻微缩放与透明度过渡，不再使用右侧平移。

## Interaction and Accessibility

- 点击 mask 或关闭按钮关闭 Drawer；点击商品卡片内容不关闭 Drawer。
- Esc 与原生 dialog cancel 事件继续关闭 Drawer。
- Drawer 打开时焦点进入原生 dialog；关闭动画完成后焦点回到触发 hotspot。
- 图片 lightbox 的主图、mask 关闭和键盘行为不变。

## Verification

- 运行 inspiration display regression，锁定居中面板、backdrop、响应式卡片组和原生 modal 行为。
- 运行 storefront typecheck 与 production build。
- 使用 Chromium 验证：hotspot 打开居中 Drawer、mask 覆盖底层、卡片可见、mask/关闭按钮可关闭、关闭动画期间 Drawer 保持 modal、关闭后焦点回到 hotspot。

## Non-goals

- 不新增商品推荐逻辑，不改变商品排序，不引入新的服务或接口。
