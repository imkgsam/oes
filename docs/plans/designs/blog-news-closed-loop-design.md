# Blog / News Closed Loop Design

```text
designKey: blog-news-closed-loop-design
thread: BLOG-NEWS-CLOSED-LOOP-DESIGN
status: SUPERSEDED_BY_TRUTH_SOURCE
truthSource: docs/architecture/services/site-service.md
featureSource: docs/plans/features/external-site-integration-p1.md
supersededBy: docs/plans/features/blog-news-closed-loop-p1.md
createdAt: 2026-06-29
lastUpdatedAt: 2026-06-29
doNotUseAsStableSource: true
```

## 1. Purpose

本文是 External Site Integration P1 中 Blog / News + Topic SEO Archive 闭环的设计工作台，用于冻结后续两个实现线程的需求与边界：

- `BLOG-NEWS-OES-IMPLEMENTATION`
- `BLOG-NEWS-MEILONG-RUNTIME-DISPLAY`

本文不替代 `site-service` 服务真相源。`site-service` 的长期职责、核心对象和 owner 边界以 `docs/architecture/services/site-service.md` 为准。

本文件的冻结结论已回写到 `docs/architecture/services/site-service.md`、`docs/contracts/site-service/**` 与 `docs/plans/features/blog-news-closed-loop-p1.md`。后续实现应以这些稳定文档为准，不应继续把本文作为当前设计入口扩写。

## 2. Read Sources

本轮已读取并对齐：

- `AGENTS.md`
- `docs/architecture/services/site-service.md`
- `docs/architecture/site-runtime-architecture.md`
- `docs/architecture/site-runtime-kit.md`
- `docs/plans/features/external-site-integration-p1.md`
- `docs/contracts/site-service/README.md`
- `docs/contracts/site-service/admin-bff.md`
- `docs/contracts/site-service/public-views.md`
- `docs/contracts/site-service/preview-and-runtime-status.md`
- `docs/contracts/site-service/sync-api.md`
- `docs/contracts/site-service/security-and-signing.md`
- `src/site-runtime/meilong-ceramics-site/README.md`

只读检查过：

- `src/services/system/site-service/**`
- `src/services/api-gateway/src/modules/site-management-bff/**`
- `src/services/api-gateway/src/modules/site-runtime-bff/**`
- `app/web/apps/tenant-web/src/views/admin/site-management-detail.vue`
- `app/web/apps/tenant-web/src/api/bff/site-management/index.ts`
- `src/site-runtime/site-runtime-kit/**`
- `src/site-runtime/meilong-ceramics-site/**`

外部展示参考：

- Blog detail: `https://www.deervalleybath.com/blogs/deervalley-blog/10-expert-tips-for-transforming-your-bathroom-into-the-ultimate-spa-experience`
- Blog list: `https://www.deervalleybath.com/blogs/deervalley-blog`
- Tagged archive: `https://www.deervalleybath.com/blogs/deervalley-blog/tagged/toilet`

SEO 校准参考：

- Google Search Central sitemap、canonical、robots.txt、noindex 文档。

## 3. Scope

### 3.1 P1 Product Intent

Blog / News P1 是外部站点的公司官网内容发布闭环，目标是让 OES Admin 中的运营人员可以创建、编辑、预览、同步发布、下架站点私有 Blog / News，并让 Meilong Runtime / Storefront 以 SEO-friendly 的方式展示。

页面可以包含静态联系引导，但 P1 不做询盘、订单、账号、评论、购物车或 Product / Item 关联。

### 3.2 P1 Includes

- site-scoped Blog / News 内容管理。
- Blog / News 使用同一字段模型，通过 `contentType = blog | news` 区分。
- Topic 主数据，用于 Blog / News 的 SEO-friendly archive / filter pages。
- Blog / News detail pages。
- Blog / News list pages。
- Topic archive pages。
- 多语言完整性检查。
- 安全 HTML 富文本。
- 草稿、预览、显式 Sync、下架、pending sync、sync history、audit。
- Blog / News detail preview。
- Runtime local published data rendering。
- SEO metadata、canonical、OG、Twitter、JSON-LD、sitemap、robots。
- Blog / News 与 Topic slug 历史和 301 redirect。

### 3.3 P1 Excludes

- Product / Item 展示能力推进。
- 文章结构化推荐产品。
- 询盘、订单、账号、支付、购物车。
- 评论。
- 自动翻译。
- 跨站内容共享。
- 完整 CMS。
- page builder。
- Topic landing page。
- Topic 专题正文、FAQ、营销模块、自定义 CTA。
- 多级 Topic 分类树。
- 复杂搜索。
- AI 自动打标。
- 全站 redirect management。
- Topic archive preview。

## 4. Current Contract Coverage

现有 contracts 已覆盖 External Site Integration P1 的基础闭环：

- Admin BFF 有 Blog / News 基础命令和查询。
- Public Views 已有 `BlogPublicView` 和 `NewsPublicView`。
- Preview / Runtime Status / Sync / Security contracts 已冻结底座行为。
- Runtime Kit 已有 products / categories / contents / blogs / news 的本地 public view reader。
- Meilong Runtime / Storefront 已有 Blog / News seed preview、list、detail、preview、sitemap、robots 基础形态。

现有 contracts 不足以直接表达本轮新增冻结的 Topic SEO Archive 能力。后续需要补充 contracts 与 truth source。

## 5. Architecture Boundary

### 5.1 site-service Owns

以 `docs/architecture/services/site-service.md` 为准，`site-service` 继续拥有：

- site-scoped Blog / News 内容源模型。
- Blog / News locale versions。
- 草稿状态与 sync 状态。
- Preview token 与 draft preview view。
- Blog / News public view 生成。
- Site sync batch、changed resources、publishVersion。
- Site audit。

本轮新增待回写结论：

- `site-service` 需要拥有站点私有 Blog / News Topic 主数据。
- `site-service` 需要拥有 Topic locale versions、Topic public view、Topic slug history、Topic 与 Blog / News 关联。
- `site-service` 需要在 sync 完整性检查中纳入 Topic 完整性与引用合法性。

### 5.2 Admin BFF Owns

`api-gateway` Admin BFF 只负责：

- HTTP DTO。
- authenticated operator context。
- tenant / org context。
- permission context。
- trace context。
- audit context 透传。
- 调用 site-service gRPC。
- HTTP 错误映射。

Admin BFF 不写核心业务规则，不直接暴露 `site-service` 内部数据库结构。

### 5.3 Site-facing BFF Owns

Site-facing BFF 只负责 Runtime Kit signed request 入口：

- signed header / canonical request 前置解析。
- site caller context。
- trace / request id。
- rate limit。
- 调用 site-service runtime gRPC。

Storefront Frontend 不直接调用 Site-facing BFF，不持有 `OES_SITE_CREDENTIAL`。

### 5.4 Runtime Owns

Site Runtime 通过 `@oes/site-runtime-kit`：

- 接收 webhook。
- `syncToLatest()`。
- 拉取 changed resources / public views / snapshot。
- 写 Local Published Store。
- 提供本地 public API / SSR 读取。
- 提供 runtime status。

Runtime 不调用 OES Core，不直接访问 `site-service` 内部接口。

### 5.5 Storefront Owns

Storefront 负责页面体验：

- Blog / News list。
- Blog / News detail。
- Topic archive。
- SEO head。
- sitemap / robots。
- redirect handling。
- preview route shell。

Storefront 不拥有业务真相，不保存 credential，不直接读 Runtime SQLite。

## 6. Blog / News Model

### 6.1 Content Type

P1 固定：

- `blog`
- `news`

Blog 与 News 使用同一字段模型，仅通过内容类型区分用途、路由、列表和 SEO 类型。

语义：

- Blog: 长期有效的文章、指南、教程、应用说明、Buying Guide、How-to Guide。
- News: 公司动态、展会、发布、公告。

不新增 `guide` content type。`How-to Guide`、`Buying Guide` 等入口由 Blog Topic 支持。

### 6.2 Content Entry And Locale Versions

Blog / News 采用：

```text
SiteContentEntry
  -> SiteContentLocaleVersion[]
```

同一篇内容有一个逻辑 entry，每个 active locale 有独立 locale version。

P1 不做翻译流程，不判断不同 locale version 之间语义是否一致。

### 6.3 Fields

内容字段：

- `contentId`
- `contentType`: `blog | news`
- `locale`
- `title`
- `slug`
- `summary`
- `coverImage`
- `coverImageAlt`
- `authorDisplayName`
- `bodyRichText`
- `bodyHtml`: OES 发布时生成的 sanitized HTML
- `topicIds[]`

发布字段：

- `publishedAt`
- `status`: `draft | published | unpublished`
- `syncStatus`: `pending | synced | failed`

SEO 字段：

- `seoTitle`
- `seoDescription`
- `seoImage`

不做字段：

- `relatedProductIds`
- comments
- read count
- scheduled publish job
- author profile
- author avatar
- recommendation config
- landing layout blocks

### 6.4 Rich Text Boundary

Blog / News 正文采用安全 HTML 富文本。

允许：

- headings
- paragraphs
- ordered / unordered lists
- images with alt
- links
- quote
- table
- simple button-style links

禁止：

- `script`
- inline event handlers
- untrusted iframe
- arbitrary embed
- form
- custom component
- external JS
- dynamic interaction

OES 在 public view 生成前输出 sanitized `body_html`。Runtime / Storefront 只消费 sanitized HTML，不信任原始编辑态输入。

## 7. Topic Model

### 7.1 Positioning

Topic 是 Blog / News 的站点私有内容组织与 SEO archive 能力，不是完整 CMS taxonomy platform。

后台文案可以称为“分类标签”或 “Topic”，但架构上应按可管理 Topic 实体处理。

### 7.2 Topic Scope

Topic 主数据：

- site-scoped。
- Blog / News 共用一套。
- 通过 `appliesTo = blog | news | both` 控制适用范围。
- 不跨站共享。
- 不关联 Product / Item。
- 不做层级树。

### 7.3 Topic Locale Versions

Topic 采用：

```text
SiteContentTopic
  -> SiteContentTopicLocaleVersion[]
```

每个 active locale 必须补齐 Topic locale version。

Topic locale version 字段：

- `name`
- `slug`
- `description`
- `seoTitle`
- `seoDescription`
- `seoImage`
- `historicalSlugs[]`

不同 locale 的 slug 可以不同。

唯一性范围：

```text
siteId + contentTypeRoute + locale + topicSlug
```

### 7.4 Topic URL

Topic archive URL 按内容类型分开：

```text
/blog/topic/:slug
/news/topic/:slug
/{locale}/blog/topic/:slug
/{locale}/news/topic/:slug
```

不做统一 `/topics/:slug` 混合页。

### 7.5 Topic Archive Page

P1 做 SEO-friendly Topic Archive Page，不做 Topic Landing Page。

Topic archive 是可收录筛选页，页面主体是该 Topic 下 published Blog / News 列表。

包含：

- H1 使用 Topic name。
- 可展示 Topic description。
- 使用 Topic SEO title / description / image。
- canonical。
- OG。
- Twitter card。
- JSON-LD。
- pagination。

不包含：

- 专题正文。
- FAQ。
- 推荐产品区。
- 自定义营销模块。
- CTA 配置。
- page builder。

### 7.6 Topic Public Visibility

Topic 是独立 public view，但公开可见性由 published 内容反向驱动。

Topic 只有同时满足以下条件时才公开出现：

- Topic active / published。
- 当前 `contentType + locale` 下至少一篇 published Blog / News 引用该 Topic。

允许公开出现的位置：

- Blog / News 详情页 topic 标签。
- Blog / News 列表页 topic filter / nav。
- Topic archive URL。
- sitemap。

没有 published 内容引用的 Topic 不公开展示、不进 sitemap、Topic archive 404 或 noindex fallback。

### 7.7 Topic Navigation

`How-to Guide`、`Buying Guide` 这类入口由 Blog-only Topic 支持。

Topic 可以有轻量导航展示控制：

- `showInBlogNav`
- `showInNewsNav`
- `navLabel`
- `sortOrder`

细分低价值 Topic 可以只在文章详情和 archive 中使用，不进入主导航。

## 8. Lifecycle And Sync

### 8.1 Draft And Save

保存 Blog / News 或 Topic 草稿只标记 pending sync，不通知 Runtime，不推进 publishVersion。

### 8.2 Publish Completeness

Blog / News 采用整篇发布规则。

正式 Sync 前必须满足：

- Blog / News 所有 active locale versions 完整。
- 引用的每个 Topic 所有 active locale versions 完整。
- 引用的 Topic 状态可发布。
- Blog 只能引用 `appliesTo = blog | both` 的 Topic。
- News 只能引用 `appliesTo = news | both` 的 Topic。

不完整时：

- 允许保存草稿。
- 允许 Blog / News detail preview。
- 不允许生成正式 published view。

### 8.3 Explicit Sync

显式 Sync 才：

- 校验 active locale 完整性。
- 生成 / 更新 BlogPublicView、NewsPublicView、TopicPublicView。
- 生成 changed resource list。
- 推进 site publishVersion。
- 每站点每次 sync batch 最多发一次 `site.publish.available` webhook。

无 pending changes 时不生成新版本、不发 webhook。

### 8.4 Topic Independent Sync

Topic 名称、slug、描述、SEO、状态、历史 slug 变化可独立 pending sync。

Topic 变更：

- 更新 TopicPublicView。
- 不强制重发所有关联 Blog / News。

文章 topic 关联变化：

- 标记该 Blog / News pending sync。
- 更新 Blog / News public view 中的 topic refs。

### 8.5 Unpublish And Disable

Blog / News 下架：

- 生成 `status = unpublished` 的 public view。
- Runtime 本地保存状态变化。
- 默认公开读取只返回 `status = published`。
- Topic archive 可见性随 published 引用动态变化。

Topic 禁用：

- 若 Topic 仍被任何 published Blog / News 引用，Admin 禁用必须失败。
- 必须先移除引用并 Sync，或下架引用内容并 Sync。
- 禁用后 Topic 不公开展示、不进 sitemap。
- 不自动批量移除文章引用。

### 8.6 PublishedAt

`publishedAt` 是运营展示发布时间。

规则：

- 草稿阶段可为空。
- 首次正式 Sync 成 published view 时，若为空，OES 自动设置为首次发布成功时间。
- 若运营已填写，则保留运营值。
- 后续重新 Sync 不自动覆盖。
- 运营手动修改后按新值展示、排序、进入 audit。
- P1 不做定时发布。未来时间只作为展示时间，不触发自动上线。

默认排序：

```text
publishedAt desc, updatedAt desc
```

适用于：

- Blog list。
- News list。
- Topic archive。
- JSON-LD `datePublished`。

## 9. Slug And Redirect

### 9.1 Blog / News Slug

Blog / News locale version 当前 slug 是 canonical slug。

修改 slug 时：

- 旧 slug 进入历史 slug 列表。
- Runtime 对旧 URL 返回 301 到当前 canonical URL。
- 旧 slug 不进 sitemap。
- canonical 永远指向当前 slug。

适用：

```text
/blog/:oldSlug -> /blog/:newSlug
/news/:oldSlug -> /news/:newSlug
/{locale}/blog/:oldSlug -> /{locale}/blog/:newSlug
/{locale}/news/:oldSlug -> /{locale}/news/:newSlug
```

### 9.2 Topic Slug

Topic locale version 当前 slug 是 canonical slug。

修改 slug 时：

- 旧 slug 进入历史 slug 列表。
- Runtime 对旧 URL 返回 301 到当前 canonical URL。
- 旧 slug 不进 sitemap。
- canonical 永远指向当前 slug。

适用：

```text
/blog/topic/:oldSlug -> /blog/topic/:newSlug
/news/topic/:oldSlug -> /news/topic/:newSlug
/{locale}/blog/topic/:oldSlug -> /{locale}/blog/topic/:newSlug
/{locale}/news/topic/:oldSlug -> /{locale}/news/topic/:newSlug
```

### 9.3 Conflict Rules

Admin 保存 slug 时必须拒绝：

- 当前 slug 与同 site + content type + locale 下其他当前 slug 冲突。
- 当前 slug 与其他资源历史 slug 冲突。
- 历史 slug 劫持另一个资源当前 URL。

P1 只做 Blog / News 与 Topic slug redirect，不做全站复杂 redirect management。

## 10. Preview

P1 Preview 只覆盖：

- Blog detail preview。
- News detail preview。

不覆盖：

- Topic archive preview。
- Blog / News list preview。
- sitemap preview。
- robots preview。
- 未发布文章集合组合预览。

Preview 规则：

- 只能从 OES Admin 发起。
- 必须先保存草稿。
- preview token 短时有效。
- token 绑定 site、resource、locale、operator。
- token 不携带完整内容。
- Runtime 用 `@oes/site-runtime-kit` 调 OES Preview API 拉 draft preview view。
- preview 不写正式 store。
- preview 不生成 publishVersion。
- preview 不触发 webhook。
- preview 页面必须 `noindex`、`nofollow`、`no-store`。

Topic 修改效果通过正式保存 + Sync + Runtime 拉取后体现。

## 11. SEO Rules

### 11.1 Blog / News Detail

Blog / News detail page:

- canonical 指向当前 canonical slug。
- title 使用 `seoTitle` fallback `title`。
- description 使用 `seoDescription` fallback `summary`。
- image 使用 `seoImage` fallback `coverImage`。
- Blog JSON-LD 使用 `BlogPosting`。
- News JSON-LD 使用 `NewsArticle`。

### 11.2 Blog / News List

List pages:

- `/blog`
- `/news`
- locale prefix variants。
- fixed canonical。
- fixed SEO metadata from site/runtime config or OES public site config。
- pagination supported.

### 11.3 Topic Archive

Topic archive:

- canonical 指向 current topic URL。
- H1 使用 Topic name。
- description 使用 Topic description。
- SEO metadata 使用 Topic SEO fields。
- 仅展示当前 Topic 下 published content。
- 空 Topic 404 或 noindex fallback。

### 11.4 Sitemap / Robots / Canonical

P1 按 SEO 最佳实践执行：

- `robots.txt` 阻止 `/preview/`、`/api/`、`/admin/`。
- 不用 `robots.txt` 承担 canonical 或 noindex 语义。
- `sitemap.xml` 只包含 canonical、indexable、公开 URL：
  - `/blog`
  - `/news`
  - published Blog detail 当前 slug
  - published News detail 当前 slug
  - 有 published 内容引用的 Topic archive 第 1 页
  - active locale URL
- `sitemap.xml` 不包含：
  - preview URL
  - old slug redirect URL
  - unpublished / disabled / deleted 内容
  - empty Topic archive
  - noindex 页面
  - preparing / disabled locale
  - pagination page 2+
- pagination pages 可访问，canonical 指向自身。
- pagination page 2+ 通过页面内分页链接发现。

## 12. Admin Operation Flow

OES Admin 必须交付可运营闭环，不允许只交付后端接口。

### 12.1 Topic Management

需要支持：

- Topic list。
- Create Topic。
- Edit Topic locale version。
- Configure `appliesTo`.
- Configure nav visibility。
- Configure slug / description / SEO / status。
- Historical slug conflict warning。
- Disable protection if referenced by published content。
- Completeness status。
- Empty and error states。

### 12.2 Blog / News Management

需要支持：

- Blog / News list。
- Create Blog / News。
- Edit active locale versions。
- Select Topics。
- Save draft。
- Preview Blog / News detail。
- Unpublish。
- Pending sync status。
- Completeness gap display。
- Empty and error states。

### 12.3 Sync

需要支持：

- Pending summary includes Blog / News / Topic。
- Pending resources list includes Blog / News / Topic。
- Sync history includes Blog / News / Topic changes。
- Sync errors display completeness gaps and topic reference violations。
- Retry / resend webhook semantics follow existing contracts.

### 12.4 Audit

P1 audit must cover:

- topic created / updated / disabled。
- topic slug changed。
- content created / updated / unpublished。
- content slug changed。
- preview token issued。
- sync started / completed / failed。
- webhook sent / failed。

Audit rows must include tenant context、operator context、trace context and resource identifiers.

## 13. Runtime / Storefront Display Requirements

### 13.1 Blog List

Meilong Blog page should reference:

- `https://www.deervalleybath.com/blogs/deervalley-blog`

Requirements:

- Blog page renders published Blog list.
- Topic navigation / filter shows only visible Blog Topics.
- Cards show cover image, title, summary, publishedAt, author, topics.
- Pagination.
- SEO head.
- Empty state.

### 13.2 Blog Detail

Meilong Blog detail should reference:

- `https://www.deervalleybath.com/blogs/deervalley-blog/10-expert-tips-for-transforming-your-bathroom-into-the-ultimate-spa-experience`
- `https://www.deervalleybath.com/blogs/deervalley-blog/how-to-accurately-measure-your-kitchen-sink`

Requirements:

- Hero / cover image.
- Title.
- PublishedAt.
- Author display name.
- Topic tags.
- Sanitized rich text body with images, headings, lists, links and tables.
- SEO head.
- JSON-LD.
- No comments.
- No cart / account / payment behavior.
- Product recommendation can appear only as ordinary rich text links authored in body HTML; no structured product relation.

### 13.3 News List And Detail

News uses the same display model as Blog with News-specific route and JSON-LD:

- `/news`
- `/news/:slug`
- `/news/topic/:slug`
- JSON-LD `NewsArticle`.

### 13.4 Topic Archive

Requirements:

- `/blog/topic/:slug`
- `/news/topic/:slug`
- locale-prefixed variants.
- Shows only published content for current content type + topic + locale.
- Uses Topic SEO metadata.
- Pagination.
- Empty topic returns 404 or noindex fallback.
- Topic visibility is derived from published content references.

### 13.5 Redirects

Runtime / Storefront must support 301 redirects for historical slugs:

- Blog detail historical slugs.
- News detail historical slugs.
- Blog Topic historical slugs.
- News Topic historical slugs.

Old slug URLs do not enter sitemap.

### 13.6 Seed Preview Mode vs Live Sync Mode

Seed Preview Mode:

- Uses local seed published data.
- Verifies page rendering, SEO, topic archive, pagination and redirect behavior locally.
- Does not prove OES live sync.

OES Live Sync Mode:

- Uses real `OES_SITE_CREDENTIAL`。
- Pulls OES public views through Runtime Kit。
- Verifies Blog / News / Topic public views sync into local store and render from Storefront。

## 14. Public View Impact

Existing P1 public views:

- `BlogPublicView`
- `NewsPublicView`

Required new public view:

- `TopicPublicView`

Blog / News payload should include topic refs sufficient for Runtime to resolve labels and archive links:

```json
{
  "topics": [
    {
      "topic_id": "topic_kitchen_sink"
    }
  ]
}
```

Topic display and SEO fields should come from `TopicPublicView`, not duplicated across every article as the only source of truth.

Topic public view draft shape to contract later:

```json
{
  "topic_id": "topic_kitchen_sink",
  "applies_to": "blog",
  "name": "Kitchen Sink",
  "slug": "kitchen-sink",
  "description": "Kitchen sink buying and installation guides.",
  "seo": {
    "title": "Kitchen Sink Guides",
    "description": "Buying and installation guides for kitchen sinks.",
    "image": null
  },
  "historical_slugs": ["sink-guide"],
  "nav": {
    "show_in_blog_nav": true,
    "show_in_news_nav": false,
    "label": "How-to Guide",
    "sort_order": 10
  }
}
```

Final field names are now governed by `docs/contracts/site-service/**`.

## 15. Truth Source And Contract Impact

### 15.1 site-service Truth Source Impact

This design has been written back to `docs/architecture/services/site-service.md` because it adds stable service-owned objects:

- `SiteContentTopic`
- `SiteContentTopicLocaleVersion`
- Topic / Blog-News association。
- `TopicPublicView`。
- Blog / News / Topic slug history for P1 redirect。

Future changes to these boundaries must update `docs/architecture/services/site-service.md` first.

### 15.2 Contract Impact

Contract updates have been written to:

- `docs/contracts/site-service/admin-bff.md`
  - Topic CRUD / locale version / disable / list / reference usage / completeness。
  - Blog / News topic selection。
  - Historical slug and redirect metadata。
- `docs/contracts/site-service/public-views.md`
  - `TopicPublicView`。
  - Blog / News topic refs。
  - historical slug contract。
- `docs/contracts/site-service/sync-api.md`
  - `topic` as sync resource type。
  - changed resources and batch public views for Topic。
- `docs/contracts/site-service/preview-and-runtime-status.md`
  - Confirm no Topic preview in P1。
- `docs/contracts/site-service/security-and-signing.md`
  - No expected change unless new endpoints require scope clarification。

Contracts must remain aligned with `site-service.md`.

## 16. Implementation Thread Prompt: BLOG-NEWS-OES-IMPLEMENTATION

```text
你是 OES 的 BLOG-NEWS-OES-IMPLEMENTATION 实现线程。

工作目录：
/Users/acehood/Documents/GitHub/oes

线程职责：
实现 OES 端 Blog / News + Topic SEO Archive P1 闭环，包括 site-service、api-gateway Admin BFF、Site-facing BFF contract/runtime surfaces、tenant-web Admin 可运营闭环。

必须先读取：
- AGENTS.md
- docs/architecture/services/site-service.md
- docs/architecture/site-runtime-architecture.md
- docs/architecture/site-runtime-kit.md
- docs/plans/features/external-site-integration-p1.md
- docs/plans/designs/blog-news-closed-loop-design.md
- docs/contracts/site-service/README.md
- docs/contracts/site-service/admin-bff.md
- docs/contracts/site-service/public-views.md
- docs/contracts/site-service/preview-and-runtime-status.md
- docs/contracts/site-service/sync-api.md
- docs/contracts/site-service/security-and-signing.md
- src/site-runtime/meilong-ceramics-site/README.md

允许路径：
- docs/architecture/services/site-service.md
- docs/contracts/site-service/**
- docs/plans/features/blog-news-closed-loop-p1.md
- src/common/src/contracts/site_service/**
- src/common/src/generated/site_service/**
- src/services/system/site-service/**
- src/services/api-gateway/src/modules/site-management-bff/**
- src/services/api-gateway/src/modules/site-runtime-bff/**
- app/web/apps/tenant-web/src/views/admin/site-management-detail.vue
- app/web/apps/tenant-web/src/api/bff/site-management/**
- app/web/apps/tenant-web/src/locales/langs/**
- related focused tests for these paths

禁止路径：
- src/site-runtime/meilong-ceramics-site/**
- src/site-runtime/site-runtime-kit/** unless contract type import changes are explicitly required and coordinated
- Product / Item implementation paths
- inquiry/order/account/payment/comment/search implementation

必须遵守：
- 修改任何文件前确认任务 scope、当前 owner 与受保护路径。
- 若需要改变 site-service 核心职责，先更新 docs/architecture/services/site-service.md，并保持 contracts 与真相源一致。
- 不做完整 CMS、page builder、自动翻译、跨站内容共享、Product / Item 关联。
- Blog / News 使用 contentType=blog/news，同一字段模型。
- Topic 是 site-scoped、Blog/News 共用的 SEO archive object。
- Topic archive 是 SEO-friendly archive/filter page，不是 landing page。
- Blog / News 与 Topic active locale 必须完整才允许正式 sync。
- Topic 独立 public view，公开可见性由 published Blog/News 引用反向驱动。
- Blog/News 和 Topic slug 变更必须保留历史 slug，并支持 runtime 301 redirect contract。
- Preview 只覆盖 Blog/News detail，不覆盖 Topic archive。

验收命令建议：
- pnpm --dir src/services/system/site-service test
- pnpm --dir src/services/api-gateway test -- site-management
- pnpm --dir src/services/api-gateway test -- site-runtime
- pnpm --dir app/web/apps/tenant-web test -- site-management
- pnpm --dir app/web/apps/tenant-web typecheck
- pnpm --dir src/services/system/site-service prisma:generate 或项目实际等价命令

交付 handoff 必须包含：
- 修改文件
- site-service truth source 变更摘要
- contract 变更摘要
- Admin 操作流完成情况
- Topic 完整性、slug history、301 redirect contract 完成情况
- Blog / News sync/public view/preview/audit 验证
- 未完成风险与交给 Meilong 线程的 contract notes
```

## 17. Implementation Thread Prompt: BLOG-NEWS-MEILONG-RUNTIME-DISPLAY

```text
你是 OES 的 BLOG-NEWS-MEILONG-RUNTIME-DISPLAY 实现线程。

工作目录：
/Users/acehood/Documents/GitHub/oes

线程职责：
实现 Meilong Runtime / Storefront 的 Blog / News + Topic SEO Archive 展示闭环。站点上的 Blog detail 参考 DeerValley Blog detail，Blog list 参考 DeerValley Blog list，但不复制非范围功能。

必须先读取：
- AGENTS.md
- docs/architecture/services/site-service.md
- docs/architecture/site-runtime-architecture.md
- docs/architecture/site-runtime-kit.md
- docs/plans/features/external-site-integration-p1.md
- docs/plans/designs/blog-news-closed-loop-design.md
- docs/contracts/site-service/README.md
- docs/contracts/site-service/public-views.md
- docs/contracts/site-service/sync-api.md
- docs/contracts/site-service/preview-and-runtime-status.md
- src/site-runtime/meilong-ceramics-site/README.md
- src/site-runtime/site-runtime-kit/README.md

展示参考：
- Blog detail: https://www.deervalleybath.com/blogs/deervalley-blog/10-expert-tips-for-transforming-your-bathroom-into-the-ultimate-spa-experience
- Blog detail rich text: https://www.deervalleybath.com/blogs/deervalley-blog/how-to-accurately-measure-your-kitchen-sink
- Blog list: https://www.deervalleybath.com/blogs/deervalley-blog
- Topic/tag archive: https://www.deervalleybath.com/blogs/deervalley-blog/tagged/toilet

允许路径：
- src/site-runtime/site-runtime-kit/**
- src/site-runtime/meilong-ceramics-site/**
- related focused tests under these paths

禁止路径：
- src/services/**
- src/common/**
- app/web/**
- docs/architecture/services/site-service.md
- docs/contracts/site-service/**
- Product / Item implementation expansion
- inquiry/order/account/payment/comment/search implementation

必须遵守：
- 修改任何文件前确认任务 scope、当前 owner 与受保护路径。
- Storefront 不持有 OES_SITE_CREDENTIAL、client secret、webhook secret 或 SQLite path。
- Storefront 不直接调用 OES Core 或 OES Site-facing API。
- Storefront 不直接读取 Runtime SQLite。
- Runtime 通过 @oes/site-runtime-kit 读取 local published data。
- Blog / News public rendering 只使用 status=published。
- Topic public visibility 必须由 published Blog/News 引用反向驱动。
- 空 Topic archive 404 或 noindex fallback，不进 sitemap。
- Blog / News / Topic historical slug URL 301 到 current canonical URL。
- Preview route noindex/nofollow/no-store，不写正式 store。
- 不实现评论、推荐产品结构化关联、购物车、账号、支付、询盘。

必须交付：
- Blog list page
- News list page
- Blog detail page
- News detail page
- Blog Topic archive page
- News Topic archive page
- Pagination
- Topic navigation/filter
- SEO canonical/OG/Twitter/JSON-LD
- sitemap/robots best-practice rules
- historical slug redirect handling
- seed preview data covering Blog/News/Topic
- live sync mode compatibility with OES public views

验收命令建议：
- pnpm --dir src/site-runtime/site-runtime-kit test
- pnpm --dir src/site-runtime/meilong-ceramics-site verify:boundaries
- pnpm --dir src/site-runtime/meilong-ceramics-site typecheck
- pnpm --dir src/site-runtime/meilong-ceramics-site build
- pnpm --dir src/site-runtime/meilong-ceramics-site verify

本地人工检查建议：
- /blog
- /news
- /blog/:slug
- /news/:slug
- /blog/topic/:slug
- /news/topic/:slug
- locale-prefixed variants if seed provides multiple locales
- /sitemap.xml
- /robots.txt
- preview route noindex/no-store headers
- old slug 301 redirect

交付 handoff 必须包含：
- 修改文件
- Runtime Kit public view/topic/redirect changes
- Meilong page changes
- SEO/sitemap/robots behavior
- seed preview vs OES live sync distinction
- 验证命令和结果
- 仍需 OES implementation thread 提供的 contract/data risks
```

## 18. Open Items

当前仍需后续实现线程处理：

- Admin permission codes 是否复用 `site-management:manage`，还是细分 topic/content manage 权限。
- Topic archive noindex fallback 使用 404 还是 200 noindex。建议实现线程优先 404。
- 具体 proto / DTO 字段命名应以 `docs/contracts/site-service/**` 为准；若实现中发现契约缺口，必须先回到 contract 更新。

## 19. Closure Criteria

本 design workspace 已退出 active 状态：

1. `docs/architecture/services/site-service.md` 已回写 Topic owner 边界。
2. `docs/contracts/site-service/**` 已冻结 Blog / News + Topic contract。
3. `docs/plans/features/blog-news-closed-loop-p1.md` 已创建。
4. 后续两个 implementation threads 已获得 frozen prompt。

本文已标记为 `SUPERSEDED_BY_TRUTH_SOURCE`。后续不要继续把本文作为当前设计入口扩写。
