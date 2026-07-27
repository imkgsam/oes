# Site Locale Exposure Governance

## 0. 文档控制

```text
designKey: site-locale-exposure-governance
designStatus: SUPERSEDED_BY_TRUTH_SOURCE
implementationStatus: TRACKED_BY_FEATURE_PACKET
lastUpdatedAt: 2026-07-19 Asia/Shanghai
lastUpdatedBy: Codex / Global Command Thread
supersedes: none
truthSource: docs/architecture/services/site-service.md; docs/architecture/site-runtime-architecture.md; docs/architecture/site-runtime-kit.md; docs/contracts/site-service/page-capabilities-and-exposure.md; docs/plans/features/site-page-locale-governance-p1.md
doNotUseAsStableSource: true
conflictResolution: 本文仅保留设计过程历史；稳定语义以 truthSource 列出的 architecture 与 contract 为准，执行状态以 feature packet 为准。
```

> 本 workspace 已退出 active 状态，不得继续作为当前设计入口或稳定实现依据。

## 1. 目标

冻结外部站点 locale 的公开访问原则，使 URL、canonical、sitemap、hreflang 与内容可用性遵循同一职责边界，同时避免 Storefront 在每次页面请求时依赖 OES。

## 2. 当前范围

本 workspace 负责：

- Site、OES、Site Runtime 与 Storefront 对 locale 公开暴露的职责划分。
- 单 locale 与多 locale 的 public URL 原则。
- OES locale 状态变更后的实时生效方向。
- SEO 公开性与 locale 路由的基本约束。

本 workspace 不负责：

- 数据库 schema、Admin UI、gRPC、webhook event 名称或字段。
- 配置存储、缓存、消息总线、失效机制或部署工具的具体实现。
- 静态营销页的翻译范围与逐页 URL 设计。
- 翻译工作流、机器翻译或内容编辑体验。

## 3. 涉及对象

- `site-service`：提供可启用 locale 的平台治理、发布完整性校验与 locale 内容数据。
- Site Runtime：同步 OES 发布数据，并维护本站可消费的 locale 能力状态。
- Storefront：拥有公开路由、canonical、301、sitemap、hreflang 与前台页面可用性。
- 历史讨论中的 Site-owned locale policy：曾作为候选边界，已被 OES `SiteLocale` 唯一治理真相取代。

## 4. 已冻结概念

| 日期 | 决定 | 影响范围 | 后续回写目标 |
| --- | --- | --- | --- |
| 2026-07-17 | Storefront 不得在每次页面请求时向 OES 查询 locale 配置。 | 性能、可用性、SSR | Site Runtime / Storefront architecture |
| 2026-07-17 | **历史候选，已废止：**站点本地 `siteActiveLocales` 决定哪些语言可公开访问；OES `oesEnabledLocales` 只决定平台允许哪些语言启用和发布。 | locale ownership | 已被 2026-07-19 OES `SiteLocale` 唯一治理结论取代 |
| 2026-07-17 | **历史候选，已废止：**有效公开语言是 `siteActiveLocales ∩ oesEnabledLocales`。 | 路由与发布 | 已被 2026-07-19 Site Exposure Publication 结论取代 |
| 2026-07-17 | OES locale 变化通过发布同步、通知与本地缓存失效方向生效，而非页面请求时轮询 OES。 | 实时更新方向 | Site Runtime sync / Storefront cache design |
| 2026-07-17 | 默认 locale 使用无前缀 canonical URL；有效的非默认 locale 才使用 `/<locale>/` 前缀。 | URL、SEO | Storefront routing / SEO contract |
| 2026-07-17 | 默认 locale 的带前缀 URL 必须 301 到无前缀 canonical；未知、disabled 或未对本站公开的 locale 必须 404，且不得回退为默认语言内容。 | SEO、内容隔离 | Storefront routing / SEO contract |
| 2026-07-17 | sitemap 与 hreflang 只包含 effective locale 中存在已发布对应内容的 canonical URL。 | SEO | Storefront sitemap / public-view consumption |
| 2026-07-19 | 站点对外公开哪些 locale 的控制入口与权威状态归 OES 站点治理；Site Runtime 同步到本地，Storefront 不在页面请求时实时查询 OES。 | locale ownership、Admin、Runtime sync | Site Service truth source / Runtime collaboration |
| 2026-07-19 | 静态页面的多语言内容与页面实现由 Storefront 负责，动态资源的多语言内容与发布状态由 OES 后端负责；两类页面的页面能力公开开关均由 OES SitePage 治理，最终 locale 路由与 HTML 渲染仍由 Storefront 执行。 | SitePage、静态页、动态模板页 | Site Service truth source / Storefront routing architecture |
| 2026-07-19 | locale 公开采用站点级开关，不提供页面 × locale 的独立公开开关。SitePage 的启用状态是页面能力的整体开关，适用于站点已启用的所有 locale。静态页面必须在所有已启用 locale 中具备 Storefront 实现与翻译，否则阻止该 locale 正式激活；不能只关闭某一个静态页面的某一种语言。 | SitePage、Storefront、SEO | Site Service truth source / Runtime collaboration |
| 2026-07-19 | 动态资源可以按资源与 locale 独立完成并发布，不要求站点启用某 locale 时一次性翻译全部历史资源。缺少某 locale 已发布版本的资源，在该 locale 下返回 404，不回退其他语言；该资源不进入该 locale 的列表、sitemap 或 hreflang。 | OES / Runtime / Storefront / SEO | Public view contract / Storefront routing |
| 2026-07-19 | SitePage 的 `index` 意图按页面能力整体治理；`index = false` 时页面可以访问但必须输出 `noindex`、不进入 sitemap 或 hreflang。`index = true` 只有在页面存在有效 canonical 且内容满足发布条件时才具备 sitemap 资格；动态资源自身的 `indexable/noindex` 可以进一步否决索引。canonical 由 Storefront 根据真实域名、locale 和路由自动生成。 | OES / Runtime / Storefront / SEO | Site Service truth source / public view contract |
| 2026-07-19 | 默认 locale 使用无前缀 canonical；默认 locale 的带前缀 URL 统一 301 到无前缀 URL；其他有效 locale 使用 `/<locale>/` 前缀。未知、未启用、被站点关闭的 locale，SitePage 整体未启用，静态页面缺少已激活 locale 实现，或动态资源 locale 未正式发布时均直接 404，不回退显示默认语言内容。hreflang 只输出实际存在、已发布且可索引的对应 locale 页面。 | Storefront / Runtime / SEO | Storefront routing / SEO contract |
| 2026-07-19 | SitePage、locale、SEO 治理状态和受影响公开资源统一通过显式 Sync 形成新的站点发布版本；OES 使用已冻结的 Webhook 通知 Runtime 有新版本，Webhook 不承载完整数据。Runtime 验签并主动拉取最新变更，原子提交本地正式状态；定时 pull 作为漏通知兜底。页面、sitemap 与 hreflang 只能在同一正式版本切换后一起生效。 | OES / Runtime / Storefront / SEO | Runtime sync contract / feature packet |
| 2026-07-19 | Storefront 项目声明实际实现的页面与 locale，Runtime Kit 在启动时自动向 OES 注册页面能力。OES 管理端展示已注册能力并允许配置公开与 index；sitemap 资格由 Runtime / Storefront 根据页面可访问性、index 意图、canonical 和内容资格自动计算。注册本身不改变线上公开状态，正式变更仍需显式 Sync。Runtime 离线不删除已知能力；已启用能力从注册清单消失时标记能力漂移并阻止继续发布，不能静默造成线上 404。 | Storefront / Runtime Kit / OES Admin / OES | Runtime capability registration / SitePage feature packet |
| 2026-07-19 | Runtime 页面能力注册只包含稳定页面身份与支持的 locale；不注册 page kind、组件、布局、页面内容、资源实例或前端内部路由实现。 | Storefront / Runtime Kit / OES | SitePage capability contract |
| 2026-07-19 | 页面能力注册采用幂等更新，以站点、稳定页面身份与 locale 识别同一能力；重复启动只刷新能力发现状态，不生成重复页面。OES 的公开与 index 配置独立持久化，不因 Runtime 重启或重复注册而重置。新增能力默认不公开；能力暂时消失时保留配置与历史，已启用能力消失则标记漂移并阻止正式 Sync，重新出现后继续沿用原配置。 | Runtime Kit / OES / OES Admin | SitePage capability contract / feature packet |

## 5. 最终边界表达

```text
OES SiteLocale governance
  defaultLocale + activeLocales
      ↓ explicit Sync / publishVersion
Site Exposure Publication
      ↓ Runtime atomic local commit
Storefront effective locales
      ↓
Storefront public routes, canonical, sitemap, hreflang
```

含义：

- OES `SiteLocale` 是站点公开 locale 的唯一治理真相；Storefront 不维护第二套公开 locale 权威配置。
- Site Runtime 只在完整 exposure publication 原子提交后更新本地 effective locales，并在同步失败时继续服务上一完整版本。
- OES 禁用某 locale 后，该 locale 在新 publishVersion 生效时同时退出页面访问、sitemap 与 hreflang。
- Runtime capability locale 只证明 Storefront 实现能力，不构成第二个运营开关。

## 6. 开放问题

无。原开放问题均已冻结并回写到稳定 truth source；后续实现问题只在 feature packet 中跟踪。

## 7. 真相源回写计划

已回写到：

- 服务职责：`docs/architecture/services/site-service.md`
- Runtime / Storefront 协同：`docs/architecture/site-runtime-architecture.md`
- Runtime Kit：`docs/architecture/site-runtime-kit.md`
- 页面能力与 exposure 黑盒契约：`docs/contracts/site-service/page-capabilities-and-exposure.md`
- 公开 SEO / 路由契约：`docs/contracts/site-service/public-views.md`
- 具体执行：`docs/plans/features/site-page-locale-governance-p1.md`

## 8. 恢复入口

- 不得从本文恢复当前设计或继续扩写。
- 服务边界从 architecture truth source 恢复；黑盒行为从 contract 恢复；实现状态从 feature packet 恢复。
