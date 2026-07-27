# Article Content Model Exploration

## 0. 文档控制

```text
designKey: article-content-model-exploration
designStatus: SUPERSEDED_BY_TRUTH_SOURCE
implementationStatus: DESIGN_FROZEN_NOT_IMPLEMENTED
lastUpdatedAt: 2026-07-15 22:45:00 Asia/Shanghai
lastUpdatedBy: CODEX-ARTICLE-TAXONOMY-DESIGN
supersedes: none
truthSource: docs/architecture/services/site-service.md#21-frozen-article-taxonomy
contractSource: docs/contracts/site-service/public-views.md#7-frozen-article-taxonomy-public-views
doNotUseAsStableSource: true
conflictResolution: 本文已退出 active 设计入口。文章对象、public view、Runtime filter 与 Storefront 路由边界以 truthSource 和 contractSource 为准；不得在本文继续定义或修改稳定结论。
```

## 1. 目标

记录外部站点文章能力从 legacy `blog / news / topic` P1 模型演进为统一 Article 模型的讨论过程。设计已冻结并回写稳定真相源，本文仅保留决策背景和恢复导航。

## 2. 当前范围

- 已冻结统一 Article 的语义模型。
- 已冻结 Runtime 本地组合 filter 与 Storefront 路由解耦。
- 已冻结 Article Category archive 与轻量 Tag 的边界。

不在本 workspace 中处理：

- Inspiration 场景和可点选商品能力。
- Article taxonomy 的生产 schema、gRPC、public view 或同步迁移实现。
- `/guides`、`/blogs`、`/news` 的正式页面实现与 URL 迁移。
- 文章与产品、collection 的正式关联字段。

## 3. 当前讨论方向

冻结后的统一模型：

```ts
Article {
  title
  slug
  summary
  body
  articleType: 'blog' | 'guide' | 'news'
  categoryId
  tags: Array<{ key: string; label: string }>
  publishedAt
}
```

稳定语义：

- `articleType` 是内容语义与 Runtime filter，不由任何 Storefront URL 决定。
- `categoryId` 是唯一、可策展、可索引的大类，例如 `how-to-guides`、`buying-guides`；它替代 `primaryTopicId` 和 `topicIds[]` 的 archive 责任。
- `tags` 是零到多个细粒度关联值，例如 `bathtub`；它们默认不能成为 archive、sitemap 或独立 public view。
- Storefront 可以把 `/blogs/category/:categorySlug` 映射为 `categorySlug` filter，也可为其他页面组合任意 type、category 与 tag filter。

不保留 `primaryTopicId`、`topicIds[]`，也不把 Tag 自动提升为 Topic archive。

## 4. 与现有实现的关系

当前实现仍使用 legacy `contentType = blog | news` 与 `TopicPublicView`。它是迁移兼容基线，不是新文章能力的目标模型。

本轮没有修改 schema、gRPC、sync、Runtime reader 或 Storefront route；任何实现必须从稳定真相源与 public view contract 创建新的 feature packet。

## 5. 已确认的展示决定

| 日期 | 决定 | 影响范围 | 回写目标 |
| --- | --- | --- | --- |
| 2026-07-15 | Blog 首页不采用品牌名 + 大标题，也不采用密集 pill/tab topic 切换。 | Storefront `/blogs` | Storefront 页面与样式 |
| 2026-07-15 | Category archive 使用可抓取链接，而非仅客户端过滤；Tag 默认不产生 archive。 | Article taxonomy | service truth source / public view contract |
| 2026-07-15 | 首页输出 `CollectionPage` + `ItemList` JSON-LD、canonical、语义化 article/time/heading 结构。 | Storefront `/blogs` | Storefront 页面 |
| 2026-07-15 | Article 固定为 `articleType + 单一 category + 多个 tags`；Runtime 支持组合 filter，Storefront URL 不绑定 Runtime 查询模型。 | Article taxonomy / Runtime | service truth source / Runtime Kit / public view contract |

## 6. 后续实现议题

- legacy `BlogPublicView / NewsPublicView / TopicPublicView` 到 `ArticlePublicView / ArticleCategoryPublicView` 的数据与 redirect 迁移。
- Admin 编辑体验中的 category 选择、轻量 Tag 输入与 active locale 完整性校验。
- Site Runtime 本地 Article filter reader、Storefront category archive 及其 sitemap 采纳策略。
- Article 与 Product / Collection 关联仍为独立设计主题，未包含在本文冻结范围。

## 7. 恢复入口

- 稳定文章边界：`docs/architecture/services/site-service.md#21-frozen-article-taxonomy`。
- 稳定 public view contract：`docs/contracts/site-service/public-views.md#7-frozen-article-taxonomy-public-views`。
- Runtime local reader 边界：`docs/architecture/site-runtime-kit.md` 的 `Frozen Article query rules`。
- 当前 Storefront `/blogs` 是 legacy P1 Topic archive 展示，不得被视为新 Article taxonomy 已实现。
