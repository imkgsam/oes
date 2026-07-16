# Inspirations Masonry Gallery

## 1. 目标

- 在 Meilong Ceramics storefront 提供正式公开的 `/inspirations` 灵感聚合页。
- 复刻参考页的宽幅编辑式标题、主题筛选、不同图片比例自然堆叠的 Masonry 瀑布流，以及渐进式 `Load more` 体验。
- 为全部内容和每一个主题提供可抓取、可分享、可 canonical 的 SSR 页面：
  - `/inspirations`
  - `/inspirations/kids`
  - `/inspirations/pets`
  - `/inspirations/color`
  - `/inspirations/small-spaces`
  - `/inspirations/seasonal-styling`
- 保持图片原始方向和宽高比。纵向图片必须继续以纵向卡片展示；页面不得通过固定横向容器裁切原图。

## 2. 不做什么

- 不实现卡片点击后的详情页、收藏、购物车或商品推荐逻辑。
- 不增加 Site Runtime、site-service 或任何跨服务 API/数据契约。
- 不将 West Elm 远程资源作为运行时依赖。
- 不把分类筛选实现为仅客户端可见的状态，避免对搜索引擎隐藏分类内容。

## 3. 上游依赖

- architecture:
  - [site-runtime-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/site-runtime-architecture.md)
  - [site-runtime-kit.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/site-runtime-kit.md)
- services:
  - [site-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/site-service.md)
- implementation surface:
  - `src/site-runtime/meilong-ceramics-site/storefront/**`

## 4. 当前结论

- 当前 feature 只属于 Meilong Ceramics storefront 的展示层，不创建新的业务能力或跨服务协同。
- `/inspirations` 是全部灵感的 canonical 页面；每个主题使用独立路径，而不是 `?category=` 参数作为主要可索引地址。
- 筛选控件使用正常的 `<NuxtLink>` 目的地。SSR HTML 必须在无 JavaScript 的情况下包含当前主题的标题、描述和首批图片卡片。
- Masonry 使用 CSS Multi-column 布局和原比例图片：卡片图片为 `width: 100%; height: auto`，卡片使用 `break-inside: avoid`，不使用固定高度或 `object-fit: cover`。服务端输出一个保持内容阅读顺序的卡片列表，由浏览器负责分列，避免客户端重新分配导致的 hydration 复杂度和 CLS。
- 首屏可见卡片在 SSR 中渲染；`Load more` 只在客户端渐进增强时追加下一批内容，并通过 `opacity` 与 `transform` 的错峰动画进入。禁用 JavaScript 时，首批内容仍完整可用。
- 素材一律存入 storefront 的本地 `public/images/inspirations/`。每条素材记录显式包含 `src`、`width`、`height`、`alt`、`category` 和主题关键词；`width / height` 既用于预留布局空间，也用于避免 CLS。
- 自动化访问参考页当前被 403 拒绝。实现不依赖该站远程图片地址；可用参考素材需先固化为本地文件并保留其来源与授权记录。

## 5. SEO 与可访问性规则

- 每个路由仅有一个 `h1`，且有独立 title、description、canonical、Open Graph 和 `CollectionPage` JSON-LD。
- 全部分类页都提供有意义的编辑性正文和 `ItemList`，结构化数据只描述 SSR 可见卡片。
- 图片必须具备与内容相符的 `alt`，禁止以文件名、空泛关键词或主题名替代内容描述。
- 分类导航使用 `aria-label`，当前项使用 `aria-current="page"`；加载更多按钮会声明忙碌状态并公布新增内容。
- 响应式断点为桌面四列、平板三/两列、移动单列；所有动效须提供 `prefers-reduced-motion` 降级。

## 6. 当前 slice

- slice: Inspirations gallery v1
- status: design-approved / implementation-not-started
- scope:
  - 本地灵感素材集与精确宽高数据
  - `/inspirations` 和 5 个主题路由
  - SSR 首批卡片、CSS Multi-column Masonry、主题导航、Load more 动效
  - 路由级 SEO、JSON-LD、无障碍和桌面/移动视觉验证
- ready definition:
  - 首屏、主题切换和加载更多均不裁切原图
  - 每条主题 URL 可以直接访问、带正确 canonical、可在无 JavaScript 下阅读首批内容
  - 桌面和移动截图不存在空白、重叠、横向溢出或布局跳变

## 7. 线程分工

| Thread / Owner | 职责 | 允许修改路径 | 输出 | 状态 |
| --- | --- | --- | --- | --- |
| current implementation owner | 灵感页、素材数据、本地资产、SEO、测试与视觉验证 | `src/site-runtime/meilong-ceramics-site/storefront/**`, `docs/plans/features/inspirations-masonry-gallery.md` | 可运行的 Inspirations Gallery v1 | in-progress |

## 8. 主线范围

- 本线程主线：复刻 Inspiration 页面排版，并在不裁切素材的前提下实现可筛选的 Masonry 瀑布流与渐进加载。
- 本线程不做：详情阅读页、产品详情联动、CMS 编辑器、在线图片管理、跨服务内容模型。
- 偏移返回条件：如需要引入来自 Site Runtime 的独立 inspiration 内容资源、公开契约或后台编辑能力，暂停当前实现并先更新 site-service 真相源与 public-view contract。

## 9. 阻塞 / 依赖

- 参考站对自动化访问返回 403，当前无法可靠地自动盘点原页的全部图片 URL、比例或 DOM。
- 实现可立即用本地固化的同类图片集验证布局；如必须逐张使用参考站原图，需要提供可访问的原始素材或允许在有授权的人工会话中导出到本地。

## 10. 验收标准

- `/inspirations` 及五个主题路由均正常 SSR 渲染。
- 同一张纵向素材在任意断点均不会变为横向裁切图，横向素材同理。
- 筛选切换以 canonical 路由完成，当前主题状态清晰且键盘可达。
- Load more 追加新卡片时只播放合成层动画，不导致已呈现图片重新裁切或明显跳动。
- 页面有唯一 H1、完整 meta、canonical、社交 meta 和与可见卡片相符的结构化数据。
- 使用桌面与移动 Playwright 截图检查布局、交互、无障碍焦点和 reduced-motion 行为。

## 11. 关闭条件

- 功能代码与素材数据已经落地。
- 单元/显示验证、typecheck、production build 和桌面/移动视觉检查均通过。
- 若素材来源尚未完成授权记录，feature 保持 implementation-complete / asset-governance-pending，不宣称完全关闭。
