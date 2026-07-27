# Blog / News Closed Loop P1

```text
featureStatus: FROZEN_FOR_IMPLEMENTATION_PLANNING
articleTaxonomyStatus: LEGACY_P1_COMPATIBILITY_ONLY
articleTaxonomyTruthSource: docs/architecture/services/site-service.md#21-frozen-article-taxonomy
sourceDesign: docs/plans/designs/blog-news-closed-loop-design.md
serviceTruthSource: docs/architecture/services/site-service.md
contractSource: docs/contracts/site-service/README.md
parentFeature: docs/plans/features/external-site-integration-p1.md
createdAt: 2026-06-29
lastUpdatedAt: 2026-06-29
```

## 1. Goal

交付 External Site Integration P1 中 Blog / News + Topic SEO Archive 的完整闭环：

- OES Admin 可运营管理 Blog / News 与 Topic。
- `site-service` 生成 Blog / News / Topic public views。
- Site Runtime 通过 `@oes/site-runtime-kit` 同步到本地 store。
- Meilong Storefront 渲染 Blog / News list、detail 与 Topic archive。
- SEO、sitemap、robots、canonical、JSON-LD、slug redirect 符合 P1 contract。

本文是 feature packet，不替代 `site-service` 真相源或 contracts。

本文冻结的 `contentType = blog / news + Topic` 仅描述已规划 P1 闭环。新 Article 能力不得继续以本 packet 的 Topic 模型实现；必须以 `articleType + category + tags` 稳定真相源和 public view contract 为准，并单独创建迁移 feature packet。

## 2. Stable Inputs

- `docs/architecture/services/site-service.md`
- `docs/architecture/site-runtime-architecture.md`
- `docs/architecture/site-runtime-kit.md`
- `docs/plans/features/external-site-integration-p1.md`
- `docs/plans/designs/blog-news-closed-loop-design.md`
- `docs/contracts/site-service/README.md`
- `docs/contracts/site-service/admin-bff.md`
- `docs/contracts/site-service/public-views.md`
- `docs/contracts/site-service/preview-and-runtime-status.md`
- `docs/contracts/site-service/sync-api.md`
- `docs/contracts/site-service/security-and-signing.md`
- `src/site-runtime/meilong-ceramics-site/README.md`

## 3. P1 Scope

### 3.1 OES Side

包含：

- Blog / News 管理。
- Topic 管理。
- Blog / News 与 Topic 多语言完整性。
- Blog / News safe HTML rich text。
- Blog / News detail preview。
- Blog / News / Topic explicit sync。
- `BlogPublicView`、`NewsPublicView`、`TopicPublicView`。
- Blog / News 与 Topic historical slug / 301 redirect metadata。
- Admin pending sync、sync history、audit、错误与空状态。

不包含：

- Product / Item 关联。
- 结构化推荐产品。
- 完整 CMS。
- page builder。
- Topic landing page。
- 自动翻译。
- 询盘、订单、账号、支付、评论、复杂搜索。

### 3.2 Runtime / Storefront Side

包含：

- Blog list。
- News list。
- Blog detail。
- News detail。
- Blog Topic archive。
- News Topic archive。
- Topic navigation / filter。
- Pagination。
- sitemap / robots。
- canonical / OG / Twitter / JSON-LD。
- Blog / News / Topic historical slug 301 redirect。
- preview noindex / no-store。
- seed preview 与 OES live sync mode 区分。

不包含：

- comments。
- cart / account / payment。
- inquiry write。
- Product / Item display expansion。
- Topic landing modules。
- complex search。

## 4. Frozen Product Decisions

本节的 Blog / News / Topic 结论只适用于 legacy P1 implementation compatibility。它们不覆盖 `articleType + category + tags` 的后续稳定模型。

- Blog / News 是公司官网轻量内容发布闭环。
- Blog / News 使用同一字段模型，仅通过 `contentType = blog | news` 区分。
- `How-to Guide`、`Buying Guide` 等入口由 Blog Topic 支持，不新增 content type。
- Blog / News 发布粒度是整篇发布；全部 active locales 必须完整。
- Legacy Topic / current Content Category 是 site-scoped、Blog / News 共用；稳定目标模型不再使用 `appliesTo`，由 Article `contentType` 与实际 Category 引用决定各内容类型的 archive membership。
- Current Content Category 只维护一套站点级人工顺序；Blog / News 各自过滤实际公开 Category 后沿用相同相对顺序，不维护两套排序。
- Content Category locale 只维护 draft revision 与 last published revision，可首次发布或发布修改；P1 不提供 Category 下架、停用或手工 archive visibility 状态，修改期间保留上一份线上 revision。
- Content Category locale 只以名称和 canonical slug 作为发布硬要求；archive 简介/短标签及 SEO title/description/image 可选，按稳定回退规则输出并仅产生非阻塞质量提醒。
- Content Category 的公开资格由 last published Category revision 与对应 `contentType + locale` 的 published Article 引用共同决定；最后一个公开引用消失后自动退出筛选、sitemap 与 route。
- 首次使用允许先发布空 Category locale metadata，再由同 locale Article 引用；空 Category 仅成为可选分类，不产生公开 URL，Article 发布必须验证所有 Category 已有同 locale last published revision。
- Article 通过稳定 Category identity 建立关系；Category 文案、SEO、顺序或 slug 修改独立发布，不重发未变更 Article。Runtime 只切换完整 Site publishVersion，同步失败继续服务上一完整 Category / Article / alias 组合并自动追赶。
- Article Category 列表不引入通用 `active / healthy` 或独立公开状态：只显示 locale revision 摘要与 Blog / News published usage，sync 正常时静默，仅在 pending / retrying / failed 时提示受影响记录。
- P1 不提供 Article Category archive 草稿预览；Blog / News detail preview 保留，Category 真实模板 / URL / SEO 验证使用独立测试 Site publication。
- Article Category 无任何 draft / published Article 引用后允许用户删除：从未发布记录释放 draft slug 并永久清理，曾发布记录退出普通管理与公开输出但保留最小 identity、永久 slug ownership tombstone 与审计。
- Topic 支持 locale-specific slug。
- Topic 是独立 public view，但公开可见性由 published Blog / News 引用反向驱动。
- Topic 页面是 SEO-friendly archive / filter page，不是 landing page。
- Blog / News 与 Topic slug 变更保留历史 slug，并由 Runtime 301 到当前 canonical URL。
- `publishedAt` 草稿可空；首次正式 Sync 时为空则自动填首次发布成功时间，之后不自动覆盖。
- Preview 只覆盖 Blog / News detail，不覆盖 Topic archive。

## 5. Implementation Split

### 5.1 BLOG-NEWS-OES-IMPLEMENTATION

Owner scope:

- `site-service`
- `api-gateway` Admin BFF
- `api-gateway` Site-facing BFF
- tenant-web Site Management Admin
- contracts and focused tests

Primary outputs:

- Truth-source-aligned data and service boundaries.
- Admin CRUD / query flow for Blog / News and Topic.
- Sync / public view generation.
- Preview token and preview view for Blog / News detail.
- Audit and permission/context propagation.
- Contract tests or focused tests proving Blog / News / Topic closed loop.

### 5.2 BLOG-NEWS-MEILONG-RUNTIME-DISPLAY

Owner scope:

- `@oes/site-runtime-kit`
- Meilong Runtime
- Meilong Storefront
- seed preview data and focused tests

Primary outputs:

- Runtime support for Topic public view and historical slug redirect lookup.
- Storefront list/detail/topic archive pages.
- SEO surfaces.
- sitemap / robots.
- seed preview and live sync compatibility.

## 6. Dependencies

- OES implementation must freeze final proto / DTO field names before Meilong live sync integration.
- Meilong implementation may start from contract-shaped seed data but must preserve live sync compatibility.
- Runtime Kit must not require Storefront to hold OES credentials.
- Product / Item public-safe fields remain outside this feature except ordinary rich text links authored inside Blog / News body.

## 7. Acceptance

OES side acceptance:

- Admin can create Topic and fill active locale versions.
- Admin can create Blog / News, fill active locale versions, choose Topic, save draft, preview detail, sync, unpublish.
- Sync refuses incomplete active locale versions or invalid Topic references.
- Sync emits Blog / News / Topic pending resources and public views.
- Topic changes can sync independently.
- Published Blog / News and Topic slug changes produce redirect metadata.
- Audit records content/topic/sync/preview actions.

Runtime / Storefront acceptance:

- Blog / News pages render from local published data.
- Topic archive only appears when published content references the Topic.
- Empty Topic archive is 404 or noindex fallback and not in sitemap.
- Old Blog / News / Topic slug URLs return 301 to canonical URLs.
- Preview pages are noindex/nofollow/no-store.
- Sitemap includes only canonical, indexable public URLs.
- Pagination works; page 2+ canonical points to self and is not in sitemap.

## 8. Suggested Verification

OES side:

```bash
pnpm --dir src/services/system/site-service test
pnpm --dir src/services/api-gateway test -- site-management
pnpm --dir src/services/api-gateway test -- site-runtime
pnpm --dir app/web/apps/tenant-web test -- site-management
pnpm --dir app/web/apps/tenant-web typecheck
```

Runtime / Storefront side:

```bash
pnpm --dir src/site-runtime/site-runtime-kit test
pnpm --dir src/site-runtime/meilong-ceramics-site verify:boundaries
pnpm --dir src/site-runtime/meilong-ceramics-site typecheck
pnpm --dir src/site-runtime/meilong-ceramics-site build
pnpm --dir src/site-runtime/meilong-ceramics-site verify
```

## 9. Closure Criteria

- OES side implementation handoff confirms contracts and truth source are implemented.
- Meilong side implementation handoff confirms Runtime / Storefront display and SEO behavior.
- Integration validates seed preview mode and OES live sync mode distinction.
- No Product / Item, inquiry, order, account, payment, comment, full CMS, page builder or complex search scope creep is introduced.
