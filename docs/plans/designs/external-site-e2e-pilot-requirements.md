# External Site Integration P1 E2E Pilot Requirements Freeze

```text
status: FROZEN_REQUIREMENTS_WITH_FOLLOW_UPS
designKey: external-site-e2e-pilot-requirements
thread: External Site Integration P1 E2E Pilot - Requirements Freeze
createdAt: 2026-06-16
frozenAt: 2026-06-16
followUpsReviewedAt: 2026-06-16
truthSourceMode: design-workspace-only
doNotUseAsStableServiceTruthSource: true
```

## 1. Purpose

本文用于沉淀 External Site Integration P1 E2E Pilot 的需求、边界、站点工程框架方向、SEO / performance baseline、验收标准与后续线程 prompt。

本文是需求冻结工作台，不替代以下稳定真相源：

- [site-service.md](../../architecture/services/site-service.md)
- [site-runtime-kit.md](../../architecture/platforms/site-runtime-kit.md)
- [site-runtime-architecture.md](../../architecture/platforms/site-runtime-architecture.md)
- [docs/contracts/site-service/**](../../contracts/site-service/README.md)

若本文与稳定架构或 contract 真相源冲突，默认以稳定真相源为准。若需求冻结中产生需要长期生效的变更，应后续回写到对应 architecture / contract 文档，而不是长期滞留在本文。

## 2. Current Freeze State

当前已确认：

- P1 local pilot 必须是 production-shaped local deployment preview。
- External Site Template 只冻结必要工程边界，不建设过度抽象的 site builder。
- 美隆站点是第一个 Pilot 实例，不得污染通用模板核心。
- 已产出第一个后续线程完整 prompt：`External Site Template P1 - Nuxt + NestJS Runtime`。
- `External Site Template P1 - Nuxt + NestJS Runtime` 已完成，产物位于 [external-site-template](../../../src/site-runtime/external-site-template)。
- `Meilong Ceramics Site Pilot - Local E2E` 已完成，产物位于 [meilong-ceramics-site](../../../src/site-runtime/meilong-ceramics-site)。

仍待后续按需求产出：

- `External Site Integration P1 - E2E Verification` 独立验证线程。

## 3. Pilot Goal

External Site Integration P1 E2E Pilot 的目标不是单独完成一个美隆站点，而是验证一套可复用、可部署、不过度抽象的 OES 外部站点工程范式。

Pilot 必须证明：

- OES `site-service`、`api-gateway` Site-facing API / Admin BFF、`@oes/site-runtime-kit`、NestJS Site Runtime、Nuxt Storefront 可以通过已冻结 contracts 协作。
- 公开页面正常渲染路径依赖 Site Runtime 本地 published data，不实时穿透 OES Core。
- webhook 快速通知 + pull fallback 可以完成发布同步闭环。
- product / category / blog / news 可以完成本地发布、拉取、渲染、SEO 输出与 E2E 验收。
- 本地看到的是可部署等级的结构与细节，区别只是运行在本地预览环境。

## 4. Non-goals

P1 Pilot 不做：

- 不把美隆业务、美隆分类、美隆导航、美隆视觉风格写死进通用模板。
- 不建设 page builder、site builder、template management 或 full CMS。
- 不实现 inquiry / order / payment / comments / reviews / customer account / dealer portal / advanced search。
- 不做真实公网 DNS、生产 CDN、真实公网 TLS 证书。
- 不做价格、库存、订单最终校验。
- 不让 Storefront 直接调用 OES Core、OES Site-facing API 或读取 Site Runtime SQLite。
- 不让 Site Runtime 绕过 `@oes/site-runtime-kit` 自行实现 OES 签名、webhook 验签、sync engine 或 local published store 写入协议。

## 5. Confirmed Decisions

### 5.1 Local Pilot Is Production-shaped

Confirmed decision:

```text
P1 local pilot is a production-shaped local deployment preview.
It must expose deployment-grade behavior and SEO semantics locally.
Local-only differences are infrastructure substitution, not architecture shortcuts.
```

本地只替换基础设施，不降低架构标准。允许的本地差异包括：

- local hosts
- local ports
- no public DNS
- no production CDN
- no public TLS certificate

不允许的本地捷径包括：

- 将 `localhost` 写入 canonical / sitemap。
- 为了本地方便让 Storefront 持有 `OES_SITE_CREDENTIAL`。
- 让公开页面实时依赖 OES。
- 将 Nuxt 与 Runtime 做成未来无法分离部署的混合工程。

### 5.2 Local Domain and SEO Identity

Confirmed decision:

```text
访问方式可以本地化，SEO 身份必须生产化。
```

P1 可以本地访问：

```text
http://meilong-ceramics.com
```

但页面输出的 SEO 正式地址必须来自站点域名配置，并按未来生产 HTTPS 地址设计：

```text
https://meilong-ceramics.com
```

P1 不要求公网 DNS、生产 CDN 或公网 TLS 证书。

### 5.3 SEO Output and SEO Data Boundary

Confirmed decision:

```text
Nuxt Storefront owns public SEO output surfaces.
NestJS Site Runtime owns local SEO data APIs.
```

Nuxt Storefront 负责：

- HTML head
- canonical tags
- meta title / description
- OG / Twitter tags
- structured data
- `sitemap.xml`
- `robots.txt`

NestJS Site Runtime 负责：

- published route index
- site domain / locale config
- resource `updatedAt`
- preview indexing policy
- SEO 输出所需的本地 published data API

SEO data APIs 必须读取本地 published data 和站点配置。正常公开 SEO 渲染不得调用 OES Core 或 OES Site-facing API。

### 5.4 Frontend / Backend Deployment Boundary

Confirmed decision:

```text
Nuxt Storefront and NestJS Site Runtime must be separable deployable units.
```

P1 local pilot 可以将二者放在同一个本地域名后面，但架构边界必须与未来部署一致。

Nuxt Storefront：

- 可以调用 Site Runtime local/internal APIs。
- 不得持有 `OES_SITE_CREDENTIAL`。
- 不得调用 OES Site-facing API。
- 不得直接读取 Site Runtime SQLite。

NestJS Site Runtime：

- 持有 OES credential。
- 通过 `@oes/site-runtime-kit` 连接 OES。
- 管理 webhook、pull fallback、runtime-status、preview bridge 与本地 published data。

### 5.5 Locale Route Convention

Confirmed decision:

```text
Default locale is English.
Default English routes have no locale prefix.
Non-default active locales use /<locale>/ prefix.
```

Example:

```text
https://meilong-ceramics.com/products/polished-tile-a
https://meilong-ceramics.com/categories/floor-tiles
https://meilong-ceramics.com/blog/ceramic-care-guide
https://meilong-ceramics.com/news/showroom-update

https://meilong-ceramics.com/zh-CN/products/polished-tile-a
https://meilong-ceramics.com/zh-CN/categories/floor-tiles
```

Rules:

- Default English routes have no locale prefix.
- Non-default active locales use `/<locale>/`.
- Preparing or disabled locales must not appear in public routes, sitemap, or hreflang.
- Slugs come from OES published data or site instance configuration, not from frontend ad hoc generation.

### 5.6 Category Boundary

Confirmed decision:

```text
Categories are site-defined.
Different sites may have different category trees, names, slugs, ordering, and SEO.
The reusable site template must not hardcode Meilong categories.
Storefront and Site Runtime only consume the categories published for the current site.
```

Implication:

- `site-service` should own external site category definition or published category output for each site.
- `CategoryPublicView` should come from site-defined category data.
- Products may reference site-defined categories in their published views.

Follow-up recommendation:

```text
docs/architecture/services/site-service.md and docs/contracts/site-service/public-views.md may need follow-up clarification:
CategoryPublicView P1 source should be site-defined category data, not assumed item-master category projection.
```

### 5.7 Navigation Boundary

Confirmed decision:

```text
P1 does not add an OES-managed site navigation contract.
Navigation, header, footer, and menu composition belong to the site frontend.
```

Rules:

- The reusable template may provide navigation components or examples.
- Site-specific menu items belong to the site instance configuration.
- Meilong navigation must not be hardcoded into reusable template core.
- If a menu item points to a category page, it can reference a published category slug, but OES P1 does not need to manage the navigation contract.

### 5.8 Static Brand Pages

Confirmed decision:

```text
P1 product / category / blog / news come from OES published data.
Home, About, Contact, header/footer copy, and other static brand pages belong to the site frontend instance configuration in P1.
P1 does not introduce page builder, template management, or full CMS.
Future OES-managed static pages can be designed later as CMS/content capability.
```

### 5.9 Inquiry and Contact CTA

Confirmed decision:

```text
P1 may include non-OES-writing contact CTAs for realistic storefront UX.
P1 must not submit inquiry, order, payment, comment, review, or account data to OES.
Formal inquiry submission is deferred to P2 Site Ingress design.
```

P1 页面可以包含：

- `Inquire Now`
- `Contact Us`
- email link
- WhatsApp link
- static contact page

P1 不创建：

- CRM lead
- sales inquiry
- order draft
- payment
- account
- comment / review

### 5.10 Performance Baseline

Confirmed decision:

```text
Performance acceptance is architecture-oriented, not score-oriented.
P1 must prove the site template has the structural conditions required for professional deployed performance:
local published data rendering, SSR/cache-friendly storefront, lightweight frontend bundle, non-blocking sync, low-resource runtime, image optimization readiness, and separable deployment topology.

Local Pilot may record basic observations, but Lighthouse or lab scores are not the primary acceptance gate.
```

Baseline:

- Public rendering reads local published data.
- Normal public page requests do not call OES Core or OES Site-facing API.
- Nuxt SSR / cache-friendly rendering is the default direction.
- Site Runtime sync is a background capability and must not block ordinary page reads.
- Site Runtime P1 remains low-resource, with SQLite as default local published store.
- P1 does not pull inquiry/order/account/dealer/search complexity into the storefront bundle.
- Images and media must be structured for future production optimization.
- Nuxt and Site Runtime remain separately deployable.

### 5.11 SEO Baseline

Confirmed decision:

```text
SEO acceptance is deployment-structure-oriented.
P1 does not require real search engine indexing, public DNS, production CDN, or SEO audit score.
P1 must ensure the site template can produce correct SEO surfaces after deployment:
SSR HTML, canonical URLs, sitemap.xml, robots.txt, structured data, preview noindex, locale-aware URLs, and SEO metadata sourced from published data/site config.
```

P1 verifies SEO structural readiness for deployment, not real-world ranking or indexing.

### 5.12 E2E Acceptance Granularity

Confirmed decision:

```text
P1 E2E Pilot acceptance is black-box integration-oriented.
It verifies that OES, api-gateway, site-service, runtime-kit, Site Runtime, local store, and Nuxt Storefront cooperate through frozen contracts.
Module-internal behavior remains owned by the corresponding implementation threads and tests.
```

Pilot E2E should verify cross-boundary behavior, not re-test every internal command handler, DTO validator, HMAC edge case, or storage branch.

### 5.13 Framework Must Not Be Over-abstracted

Confirmed decision:

```text
The reusable site framework must not become an over-abstracted site builder.
It should standardize only the required engineering boundaries and shared runtime contracts.
Frontend-owned brand experience, visual composition, navigation design, static pages, and page-level creative decisions remain site-instance responsibilities.
The template should provide sane examples and integration patterns, not force all sites through a generic configuration abstraction.
```

Framework owns:

- OES credential boundary
- runtime-kit integration
- webhook / pull fallback
- local published data rendering
- Nuxt SSR / SEO output structure
- Site Runtime local data APIs
- frontend/backend deployment boundary
- product/category/blog/news data consumption pattern
- preview noindex
- local domain / canonical strategy

Site frontend instance owns:

- homepage design
- visual style
- navigation organization
- header/footer experience
- About / Contact brand pages
- page-level creative decisions
- CTA copy and placement
- Meilong-specific business expression

## 6. Site Template Boundary

The site template should provide a production-shaped engineering skeleton. It should not provide a universal website generator.

Template responsibilities:

- Nuxt Storefront + NestJS Site Runtime separation.
- `@oes/site-runtime-kit` integration pattern.
- Local published data rendering pattern.
- Product / category / blog / news route and data consumption pattern.
- SEO output surfaces and Site Runtime SEO data APIs.
- Preview noindex handling.
- Local domain and canonical configuration pattern.
- Storefront credential safety.

Template non-responsibilities:

- Meilong brand expression.
- Site-specific navigation menus.
- Site-specific homepage design.
- Page builder or full CMS.
- Inquiry / order / payment write paths.
- Production CDN implementation.

## 7. Meilong Pilot Boundary

Meilong is the first Pilot site instance.

Meilong may define:

- `meilong-ceramics.com` local domain.
- English default locale.
- Meilong site instance config.
- Meilong categories, products, blog, news data.
- Meilong homepage, navigation, About, Contact, footer copy and visual expression.
- Non-OES-writing contact CTAs.

Meilong must not:

- Add Meilong categories or navigation into reusable template core.
- Require the template to become a site builder.
- Bypass Site Runtime or `@oes/site-runtime-kit`.
- Make public pages depend on live OES reads.

## 8. P1 Data Scope

P1 rendering scope:

- product
- category
- blog
- news

P1 postposed scope:

- inquiry
- order
- payment
- comments / reviews
- customer account
- dealer portal
- advanced search
- production CDN

## 9. E2E Acceptance Criteria

P1 E2E acceptance should verify:

- OES can configure a site and credential.
- `OES_SITE_CREDENTIAL` is only held by Site Runtime backend.
- Explicit sync produces published views.
- Webhook notifies Site Runtime.
- Site Runtime verifies webhook and runs `syncToLatest()`.
- Pull fallback can recover from missed webhook.
- Site Runtime writes product/category/blog/news into local published store.
- Nuxt renders product/category/blog/news from Site Runtime local APIs.
- Normal public rendering does not call OES Core or OES Site-facing API.
- `sitemap.xml` is generated from local published URL index.
- `robots.txt` blocks preview/runtime/admin/debug paths as appropriate.
- Canonical URL uses production-shaped site domain config.
- Preview uses noindex/nofollow/no-store and does not write formal store.
- Runtime status is available through protected runtime-status path.
- Storefront does not hold or expose OES credentials.

## 10. Architecture / Contract Follow-up Suggestions

These are suggestions only. This workspace does not directly modify stable truth sources.

1. Category source clarification

   `site-service.md` and `public-views.md` may need clarification that external site categories are site-defined, and `CategoryPublicView` is generated from site category definition rather than assumed item-master category projection.

2. SEO route index API

   The template needs Site Runtime local SEO data APIs for sitemap and route index. If this becomes a cross-site standard, it may deserve a future contract or runtime-kit helper.

3. Site config for SEO base URL

   Contracts may need to ensure Site Runtime can expose safe site domain / locale config to Storefront without leaking credentials.

4. Static brand pages

   P1 keeps Home / About / Contact in frontend instance configuration. If OES later manages static pages, that should be designed as a separate CMS/content capability.

5. Inquiry P2

   Inquiry submission should be designed through Site Ingress with CRM / audit / anti-spam / tenant context / replayability, not folded into P1 Pilot.

## 11. Follow-up Thread Prompts

### 11.1 External Site Template P1 - Nuxt + NestJS Runtime

```text
你正在 OES 项目中工作。

请先为本线程创建一个 goal。

Goal objective:
设计并实现 External Site Template P1：一个 production-shaped、可复用但不过度抽象的外部站点工程模板，包含 Nuxt Storefront Frontend 与 NestJS Site Runtime Backend 的基础工程框架、部署边界、runtime-kit 接入、SEO 输出结构、performance-oriented 架构约束，以及 product / category / blog / news 的本地 published data 渲染范式。

线程名称建议：
External Site Template P1 - Nuxt + NestJS Runtime

交互语言：中文。

本线程性质：
这是站点工程模板实现线程，但必须先进行最小实现计划确认。
本线程不是美隆站点实例实现线程。
本线程不是 E2E 验证线程。

硬约束：

1. 必须遵守 AGENTS.md。
2. 必须先阅读相关架构、contract、feature packet，再动代码。
3. 不要把美隆业务、美隆分类、美隆导航、美隆视觉风格写死进通用模板。
4. 不要把模板做成 page builder、site builder 或过度配置化平台。
5. 通用框架只标准化必要工程边界和共享 runtime contract。
6. 首页、导航、页头、页脚、About、Contact、品牌表达、页面创意属于具体站点前端实例，不属于通用框架强抽象。
7. Storefront Frontend 不得持有 OES_SITE_CREDENTIAL。
8. Storefront Frontend 不得直接调用 OES Core API 或 OES Site-facing API。
9. Storefront Frontend 不得直接读取 Site Runtime SQLite。
10. Site Runtime 必须通过 @oes/site-runtime-kit 接入 OES。
11. 站点正常公开页面渲染不得实时依赖 OES。
12. P1 不实现 inquiry / order / payment / comments / reviews / customer account / dealer portal / advanced search。
13. P1 不要求生产 DNS、生产 CDN、真实公网 TLS，但本地结构必须是 deployment-grade。
14. 不得修改 site-service / runtime-kit / contract 稳定真相源，除非发现 blocker 后先提出回写建议并等待确认。
15. 如发现 contract 缺口，只记录为 architecture / contract follow-up，不用临时硬编码绕过。

必须先阅读：

- AGENTS.md
- docs/plans/features/external-site-integration-p1.md
- docs/architecture/platforms/site-runtime-architecture.md
- docs/architecture/platforms/site-runtime-kit.md
- docs/architecture/services/site-service.md
- docs/contracts/site-service/README.md
- docs/contracts/site-service/security-and-signing.md
- docs/contracts/site-service/sync-api.md
- docs/contracts/site-service/public-views.md
- docs/contracts/site-service/preview-and-runtime-status.md
- docs/contracts/site-service/admin-bff.md
- src/site-runtime/site-runtime-kit/package.json
- src/services/system/site-service/package.json
- docs/plans/designs/external-site-e2e-pilot-requirements.md

已确认的需求冻结结论：

1. P1 local pilot 是 production-shaped local deployment preview。
   本地只替换基础设施，不降低架构标准。
   本地差异仅限 local hosts / local ports / no public DNS / no production CDN / no public TLS certificate。

2. 访问方式可以本地化，SEO 身份必须生产化。
   本地可访问 http://meilong-ceramics.com，但 canonical / sitemap / SEO base URL 必须来自站点正式域名配置，并按未来 HTTPS 生产地址设计。

3. Nuxt Storefront 负责 public SEO output surfaces：
   - HTML head
   - canonical tags
   - meta title / description
   - OG / Twitter tags
   - structured data
   - sitemap.xml
   - robots.txt

4. NestJS Site Runtime 负责 local SEO data APIs：
   - published route index
   - site domain / locale config
   - resource updatedAt
   - preview indexing policy

5. SEO data APIs 必须读取本地 published data 和站点配置。
   正常公开 SEO 渲染不得调用 OES Core 或 OES Site-facing API。

6. Nuxt Storefront 与 NestJS Site Runtime 必须可前后端分离部署。
   P1 local 可以放在同一个本地域名后面，但架构边界必须与未来部署一致。

7. 默认语言是英文。
   默认英文路由不带 locale 前缀。
   非默认 active locale 使用 /<locale>/ 前缀。
   preparing / disabled locale 不得出现在公开路由、sitemap 或 hreflang 中。

8. Category 是 site-defined。
   不同站点可以有不同 category tree、name、slug、ordering、SEO。
   通用模板不得写死美隆分类。
   Storefront 和 Site Runtime 只消费当前站点已发布 category 数据。

9. P1 不新增 OES-managed site navigation contract。
   Navigation、header、footer、menu composition 属于站点前端。
   模板可以提供组件结构或示例，但站点菜单项属于 site instance configuration。

10. Home、About、Contact、header/footer copy、静态品牌页在 P1 属于站点前端实例配置。
    P1 不引入 page builder、template management 或 full CMS。

11. P1 可以展示 non-OES-writing contact CTA。
    P1 不向 OES 提交 inquiry / order / payment / comment / review / account 数据。
    正式 inquiry submission 后置到 P2 Site Ingress 设计。

12. Performance acceptance 是 architecture-oriented，不是 score-oriented。
    P1 需要证明模板具备部署后达到专业性能的结构条件：
    - local published data rendering
    - SSR/cache-friendly storefront
    - lightweight frontend bundle
    - non-blocking sync
    - low-resource runtime
    - image optimization readiness
    - separable deployment topology

13. SEO acceptance 是 deployment-structure-oriented。
    P1 不要求真实搜索引擎收录、public DNS、production CDN 或 SEO audit score。
    P1 必须验证部署后的 SEO structural readiness。

14. P1 E2E Pilot 验收偏黑盒集成。
    本线程只负责模板工程框架，不负责最终独立 E2E 验证。

15. 通用框架只冻结必要工程边界，不抽象站点创意表达。
    前端拥有品牌体验、视觉组合、导航设计、静态页和页面级创意决策。

本线程目标：

实现一个 External Site Template P1 工程模板，至少包含：

1. Nuxt Storefront Frontend 框架方向
   - SSR-first public rendering
   - product / category / blog / news route pattern
   - default English no-prefix route
   - non-default locale /<locale>/ route convention
   - SEO head output structure
   - sitemap.xml output structure
   - robots.txt output structure
   - structured data output structure
   - preview noindex handling
   - Storefront -> Site Runtime local/internal API access pattern

2. NestJS Site Runtime Backend 框架方向
   - @oes/site-runtime-kit 接入
   - OES_SITE_CREDENTIAL 后端环境变量边界
   - webhook endpoint
   - pull fallback hook / scheduler boundary
   - runtime-status endpoint
   - health endpoints
   - local published data API
   - SEO route index API
   - preview bridge API
   - local SQLite published store usage through runtime-kit

3. Frontend / Backend deployment boundary
   - Nuxt 与 NestJS 可分离部署
   - local pilot 可通过同一 domain routing 组合
   - 不允许 Nuxt 直接持有 credential
   - 不允许 Nuxt 直接读 SQLite
   - 不允许公开页面实时调用 OES

4. Template scope
   - 提供 sane examples and integration patterns
   - 不建设 page builder
   - 不把所有站点设计抽象为复杂配置系统
   - 不强制所有站点使用同一首页、导航、视觉布局
   - 不写死美隆业务

5. P1 data rendering scope
   - product
   - category
   - blog
   - news

6. P1 postposed scope
   - inquiry submission
   - order
   - payment
   - comments / reviews
   - customer account
   - dealer portal
   - advanced search
   - production CDN

推荐技术边界：

- Nuxt Storefront 负责公开页面、SEO 输出和站点体验。
- NestJS Site Runtime 负责 OES 连接、安全、sync、本地数据与运行状态。
- @oes/site-runtime-kit 是 Site Runtime 访问 OES 和管理本地 published data 的唯一基础包。
- Site Runtime local APIs 可以被 Nuxt server-side route / SSR 调用。
- public browser client 不应直接调用需要 secret 的接口。

建议路径：

请先检查 repo 当前结构，再决定具体落点。
不要凭空创建与 monorepo 规范冲突的目录。
如果已有 site runtime 或 web app 约定，应优先复用。

实现前必须先输出一个简短 implementation plan，至少说明：

1. 拟新增 / 修改的目录与文件。
2. Nuxt Storefront 与 NestJS Site Runtime 的工程落点。
3. 哪些只是模板示例，哪些是必须稳定的工程边界。
4. 如何避免美隆实例污染通用模板。
5. 如何验证 Storefront 不持有 OES credential。
6. 如何验证公开页面不实时调用 OES。
7. 如何验证 SEO structural readiness。
8. 是否发现 site-service / runtime-kit / contract 缺口。

完成后必须验证：

1. 相关 lint / typecheck / unit tests 按项目可行方式执行。
2. 如果创建前端页面或本地 app，必须启动本地 dev server 并用 Browser 验证主要页面，除非用户明确禁止。
3. 如果 dev server 已有端口冲突，换端口。
4. 公开页面 HTML 中可看到 SEO head / canonical / structured data 的结构。
5. sitemap / robots 输出路径存在或模板明确提供生成路径。
6. Nuxt 代码中没有 OES_SITE_CREDENTIAL 使用。
7. Nuxt 代码中没有直接调用 OES Site-facing API 的实现。
8. Site Runtime 的 OES 连接只通过 @oes/site-runtime-kit。

交付输出必须包含：

1. 本次范围。
2. 修改文件。
3. 模板工程边界。
4. 不属于模板、留给站点前端实例自由发挥的内容。
5. Nuxt Storefront 职责。
6. NestJS Site Runtime 职责。
7. SEO structural readiness 说明。
8. Performance-oriented 架构说明。
9. local deployment / local domain 使用方式。
10. 验证结果。
11. 发现的 architecture / contract 回写建议。
12. 后续 Meilong Pilot thread 需要接入的输入清单。

特别提醒：

- 不要把“通用模板”做成过度抽象的平台。
- 不要为了复用而牺牲具体站点前端设计自由。
- 框架负责边界，站点负责表达。
- 美隆可以在后续线程里做得很具体、很商务、很真实，但不能污染本模板核心。
```

### 11.2 Meilong Ceramics Site Pilot - Local E2E

```text
你正在 OES 项目中工作。

请先为本线程创建一个 goal。

Goal objective:
基于已完成的 External Site Template P1，将 Meilong Ceramics 作为第一个外部站点实例接入本地 Pilot，完成 deployment-shaped local preview：使用 meilong-ceramics.com 本地域名、英文默认 locale、站点定义 categories、product / category / blog / news published data、本地 Site Runtime + Nuxt Storefront 联动、正式站点级 SEO 输出、专业商务视觉表达与非 OES-writing contact CTA。

线程名称建议：
Meilong Ceramics Site Pilot - Local E2E

交互语言：中文。

本线程性质：
这是美隆站点实例 Pilot 实现线程。
本线程不是通用模板线程。
本线程不是最终独立 E2E Verification 线程。

硬约束：

1. 必须遵守 AGENTS.md。
2. 必须先阅读相关架构、contract、feature packet、requirements freeze workspace 和模板 README，再动代码。
3. 必须基于已完成的 External Site Template P1，不重新发明模板工程框架。
4. 不得把美隆业务、美隆分类、美隆导航、美隆视觉风格反向写入通用模板核心。
5. 可以在美隆站点实例层自由设计首页、导航、About、Contact、页头页脚、视觉风格、CTA 文案和页面组合。
6. 美隆站点应呈现为真实、正式、商务、有专业水准的电子商务 / B2B brand site，而不是简单 demo。
7. 本地预览必须是 deployment-shaped：本地只是替代公网基础设施，不允许架构降级。
8. Storefront 不得持有 OES_SITE_CREDENTIAL。
9. Storefront 不得直接调用 OES Core API 或 OES Site-facing API。
10. Storefront 不得直接读取 Site Runtime SQLite。
11. Site Runtime 必须通过 @oes/site-runtime-kit 接入 OES / 本地 published data 边界。
12. 公开页面正常渲染不得实时依赖 OES。
13. P1 不实现 inquiry / order / payment / comments / reviews / customer account / dealer portal / advanced search。
14. P1 可以有 Inquire Now / Contact Us / email / WhatsApp / Contact 页面等非 OES-writing CTA，但不得向 OES 写入询盘。
15. 不得修改 site-service / runtime-kit / contracts 稳定真相源，除非发现 blocker 后先提出回写建议并等待确认。
16. 如发现 contract 缺口，只记录为 architecture / contract follow-up，不用临时硬编码绕过。

必须先阅读：

- AGENTS.md
- docs/plans/designs/external-site-e2e-pilot-requirements.md
- docs/plans/features/external-site-integration-p1.md
- docs/architecture/platforms/site-runtime-architecture.md
- docs/architecture/platforms/site-runtime-kit.md
- docs/architecture/services/site-service.md
- docs/contracts/site-service/README.md
- docs/contracts/site-service/security-and-signing.md
- docs/contracts/site-service/sync-api.md
- docs/contracts/site-service/public-views.md
- docs/contracts/site-service/preview-and-runtime-status.md
- src/site-runtime/site-runtime-kit/package.json
- src/site-runtime/external-site-template/README.md
- src/site-runtime/external-site-template/package.json
- src/site-runtime/external-site-template/runtime/package.json
- src/site-runtime/external-site-template/storefront/package.json

已完成的模板输入：

- 通用模板产物位于 src/site-runtime/external-site-template。
- Runtime local preview 默认端口：4301。
- Storefront local preview 默认端口：4300。
- 模板 canonical 示例为 https://example-site.test。
- 模板提供 docker-compose.local.yml 与 nginx/local-domain.conf，用于同一本地域名下组合 Nuxt 和 Runtime。
- 模板已实现 product / category / blog / news routes。
- 模板已实现 default English no-prefix routes 与 non-default /<locale> routes。
- 模板已实现 sitemap.xml、robots.txt、canonical/meta/OG/Twitter/JSON-LD、preview noindex。
- 模板已实现 Runtime local APIs：site config、route index、published resources、preview bridge。

已确认的需求冻结结论：

1. 美隆是第一个 Pilot site instance，不是通用模板本身。
2. 美隆 local pilot 必须是 production-shaped local deployment preview。
3. 访问方式可以本地化，SEO 身份必须生产化。
4. 美隆使用本地域名 meilong-ceramics.com。
5. SEO base / canonical identity 使用 https://meilong-ceramics.com。
6. 默认 locale 是英文，默认英文路由不带 locale 前缀。
7. 非默认 active locale 使用 /<locale>/ 前缀。
8. Categories 是 site-defined。美隆可以有自己的 category tree、name、slug、ordering、SEO。
9. Navigation、header、footer、Home、About、Contact 和品牌页面属于美隆前端实例设计，不由 OES P1 管理。
10. Product / category / blog / news 来自 published data / site instance data。
11. P1 可以有 non-OES-writing contact CTA，但 inquiry submission 后置到 P2。
12. Performance 验收目标是架构上具备专业部署性能条件，不追本地跑分。
13. SEO 验收目标是部署结构正确，不要求真实搜索引擎收录或 SEO audit score。

本线程目标：

实现 Meilong Ceramics Site Pilot local preview，至少包含：

1. 美隆站点实例落点
   - 复用 External Site Template P1。
   - 可以通过拷贝 / 组合 / site instance overlay 方式创建美隆实例，但不得污染模板核心。
   - 落点需符合 repo 现有结构，先检查再决定。

2. local domain strategy
   - 本地访问域名：meilong-ceramics.com。
   - P1 可接受 local HTTP 访问。
   - Canonical / sitemap / SEO base 使用 https://meilong-ceramics.com。
   - 不要求公网 DNS、生产 CDN、公网 TLS 证书。
   - 提供本地 hosts / nginx / env 使用说明。

3. Meilong site identity
   - 英文默认 locale。
   - 可预留 zh-CN 等非默认 locale route 结构，但 P1 可先主打英文。
   - 美隆品牌、陶瓷行业、B2B / brand site 语境。
   - 专业、正式、商务、可信赖的视觉表达。

4. Site-defined categories
   - 分类属于美隆站点定义。
   - 不同站点可有不同 category tree。
   - 不得在通用模板核心中写死美隆分类。
   - 美隆 Pilot 可以定义自己的 categories，例如 porcelain tiles / slabs / mosaics / outdoor tiles 等，但具体命名应按专业英文站点表达优化。

5. Published data
   - 提供美隆 product / category / blog / news 的本地 published data 或 fixture。
   - 数据结构应符合 site-service public views contract。
   - 产品不包含 P1 后置的 price / inventory final validation。
   - Blog / News 使用 sanitized HTML 或等价 public-safe content。

6. Storefront pages
   - Home
   - Product detail
   - Category page
   - Blog detail / listing if template supports listing
   - News detail / listing if template supports listing
   - About
   - Contact
   - sitemap.xml
   - robots.txt
   - preview page

7. Frontend freedom
   - 美隆首页、导航、页头页脚、About、Contact、CTA 和视觉风格由前端实例自由设计。
   - 不要为了“通用化”把美隆页面设计抽成复杂配置平台。
   - 但不得破坏 template 的 OES / Runtime / SEO / deployment boundaries。

8. Contact CTA
   - 可以有 Contact Us / Inquire Now / Email / WhatsApp 等非 OES-writing CTA。
   - 不得提交 inquiry 到 OES。
   - 不得创建 CRM lead / sales inquiry / order draft。

9. SEO structural readiness
   - 美隆公开页面 SSR 输出。
   - canonical 使用 https://meilong-ceramics.com。
   - product/category/blog/news 具备 title / description / OG / Twitter / JSON-LD。
   - sitemap.xml 只包含 published public URLs。
   - robots.txt 阻止 preview / runtime API / admin / debug 路径。
   - preview 页面 noindex/nofollow/no-store。
   - structured data 不编造 price / inventory / review。

10. Performance-oriented structure
   - 公开页面渲染读取 Site Runtime local published data。
   - 普通页面请求不调用 OES Core / Site-facing API。
   - Nuxt 与 Runtime 可分离部署。
   - Runtime 低资源，本地 store 使用 runtime-kit / SQLite 边界。
   - 图片与媒体使用可部署级尺寸、alt、lazy/eager 策略。

实现前必须先输出简短 implementation plan，至少说明：

1. 美隆实例准备放在哪里。
2. 复用模板的方式是什么。
3. 哪些会修改模板，哪些只属于美隆实例。
4. 美隆 categories / product / blog / news fixture 或 published data 如何提供。
5. local domain 如何配置。
6. SEO base 如何保证不出现 localhost。
7. 如何验证 Storefront 不持有 credential。
8. 如何验证公开页面不实时调用 OES。
9. 如何避免美隆反向污染通用模板核心。

完成后必须验证：

1. 相关 typecheck / build / boundary checks 按项目可行方式执行。
2. 本地 Runtime 与 Storefront 可以启动。
3. 用 Browser 打开 http://meilong-ceramics.com 或等价本地入口验证主要页面。
4. Browser 验证 Home、product、category、blog、news 页面可见且呈现专业商务站点质量。
5. Curl 或 Browser 验证 product HTML 含 canonical/meta/OG/Twitter/JSON-LD。
6. Curl 或 Browser 验证 sitemap.xml / robots.txt。
7. 验证 preview 页面 noindex/no-store。
8. rg 验证美隆 Storefront 不包含 OES_SITE_CREDENTIAL、签名头、OES direct-call、SQLite/local store token。
9. rg 验证通用模板核心没有被写入 Meilong / 美隆 / meilong-ceramics 业务内容，除非是 README 中明确作为实例引用。
10. 验证 Runtime OES 连接仍通过 @oes/site-runtime-kit。

交付输出必须包含：

1. 本次范围。
2. 修改文件。
3. 美隆实例落点。
4. 如何复用 External Site Template P1。
5. 哪些内容属于美隆前端自由发挥。
6. categories / product / blog / news 数据范围。
7. local domain 使用方式。
8. SEO structural readiness 证据。
9. Performance-oriented 架构说明。
10. 验证结果。
11. 未进入 P1 的 inquiry / order / payment / account / search 等后置能力确认。
12. 发现的 architecture / contract 回写建议。
13. 后续 External Site Integration P1 E2E Verification 线程需要的输入清单。

特别提醒：

- 美隆站点应该看起来像真实、正式、专业的商务站点，而不是工程样例页。
- 可以在美隆实例层大胆做前端设计，但不要让通用模板过度抽象。
- 框架负责边界，站点负责表达。
- P1 的 local preview 必须接近未来部署结构，不能因为本地而偷懒。
```

### 11.3 External Site Integration P1 - E2E Verification

```text
你正在 OES 项目中工作。

请先为本线程创建一个 goal。

Goal objective:
对 External Site Integration P1 E2E Pilot 做独立黑盒验证：基于已完成的 External Site Template P1 与 Meilong Ceramics Site Pilot，验证 OES site-service / api-gateway contracts、@oes/site-runtime-kit、Meilong Site Runtime、local published store、Nuxt Storefront、local domain、SEO structural readiness、performance-oriented architecture、preview/noindex、credential boundary 与 P1 后置能力边界是否按需求冻结结果成立，并输出 verification evidence 与 architecture / contract follow-up 建议。

线程名称建议：
External Site Integration P1 - E2E Verification

交互语言：中文。

本线程性质：
这是独立 E2E verification 线程。
本线程不是模板实现线程。
本线程不是美隆站点继续开发线程。
本线程默认不改生产代码，除非发现验证脚本或文档存在明确错误且用户确认允许修正。

硬约束：

1. 必须遵守 AGENTS.md。
2. 必须先阅读需求冻结文档、模板 README、美隆 README、相关 architecture 和 contracts，再执行验证。
3. 以黑盒 E2E 与边界证据为主，不重新测试每个模块内部实现细节。
4. 不改 site-service / runtime-kit / contracts 稳定真相源。
5. 不推进新的 product/category/blog/news 功能。
6. 不实现 inquiry / order / payment / comments / reviews / customer account / dealer portal / advanced search。
7. 不把 verification 线程变成第三次实现线程。
8. 若发现缺口，先分类为 blocker / non-blocking follow-up / documentation follow-up / implementation bug，再给建议。
9. Storefront 不得持有 OES_SITE_CREDENTIAL。
10. Storefront 不得直接调用 OES Core API 或 OES Site-facing API。
11. Storefront 不得直接读取 Site Runtime SQLite。
12. 公开页面正常渲染不得实时依赖 OES。
13. Runtime 的 OES 连接边界必须仍通过 @oes/site-runtime-kit。
14. 本地预览必须体现 deployment-shaped local preview：本地只是基础设施替代，不是架构捷径。

必须先阅读：

- AGENTS.md
- docs/plans/designs/external-site-e2e-pilot-requirements.md
- docs/plans/features/external-site-integration-p1.md
- docs/architecture/platforms/site-runtime-architecture.md
- docs/architecture/platforms/site-runtime-kit.md
- docs/architecture/services/site-service.md
- docs/contracts/site-service/README.md
- docs/contracts/site-service/security-and-signing.md
- docs/contracts/site-service/sync-api.md
- docs/contracts/site-service/public-views.md
- docs/contracts/site-service/preview-and-runtime-status.md
- src/site-runtime/site-runtime-kit/package.json
- src/site-runtime/external-site-template/README.md
- src/site-runtime/external-site-template/package.json
- src/site-runtime/meilong-ceramics-site/README.md
- src/site-runtime/meilong-ceramics-site/package.json
- src/site-runtime/meilong-ceramics-site/runtime/package.json
- src/site-runtime/meilong-ceramics-site/storefront/package.json
- src/site-runtime/meilong-ceramics-site/scripts/verify-meilong-boundaries.mjs

已完成输入：

1. External Site Template P1 已完成。
   - 路径：src/site-runtime/external-site-template
   - Runtime 默认端口：4301
   - Storefront 默认端口：4300
   - canonical 示例：https://example-site.test
   - 已提供 verify:boundaries、docker-compose.local.yml、nginx/local-domain.conf

2. Meilong Ceramics Site Pilot 已完成。
   - 路径：src/site-runtime/meilong-ceramics-site
   - Runtime 默认端口：4301
   - Storefront 默认端口：4300
   - 本地域名：meilong-ceramics.com
   - SEO base：https://meilong-ceramics.com
   - hosts 建议：127.0.0.1 meilong-ceramics.com
   - 验证脚本：pnpm --dir src/site-runtime/meilong-ceramics-site verify:boundaries
   - Runtime seed：4 categories、4 products、2 blog、2 news
   - 视觉资产：storefront/public/images/meilong-showroom-hero.png、meilong-calacatta-slab.png
   - 页面范围：Home、Products listing/detail、Categories listing/detail、Blog listing/detail、News listing/detail、About、Contact、Preview、sitemap、robots

已确认需求冻结结论：

1. Pilot 是 production-shaped local deployment preview。
2. 访问方式可以本地化，SEO 身份必须生产化。
3. 美隆本地访问域名为 meilong-ceramics.com，canonical / sitemap / SEO base 为 https://meilong-ceramics.com。
4. 默认 locale 是英文，默认英文路由不带 locale 前缀。
5. 非默认 active locale 使用 /<locale>/ 前缀。
6. Categories 是 site-defined，不同站点可以有不同 category tree。
7. Navigation / header / footer / Home / About / Contact 属于站点前端实例设计，不进入 OES P1 管理。
8. Product / category / blog / news 来自 local published data / public views。
9. Contact CTA 可存在，但不得向 OES 写入 inquiry。
10. Performance 验收是 architecture-oriented，不追本地分数。
11. SEO 验收是 deployment-structure-oriented，不要求真实收录或 SEO audit score。
12. E2E 验收是 black-box integration-oriented。

验证目标：

1. Requirements traceability
   - 将需求冻结文档中的 confirmed decisions 映射到当前模板和美隆实例证据。
   - 明确每条是 passed / failed / not applicable / needs follow-up。

2. Workspace and package sanity
   - 确认 external-site-template 与 meilong-ceramics-site 目录存在。
   - 确认 package scripts、workspace 纳入、README 与 local domain 说明存在。
   - 确认没有把 Meilong 内容写回 external-site-template 核心。

3. Boundary verification
   - 运行 template boundary verification。
   - 运行 Meilong boundary verification。
   - rg 检查 Storefront 不包含 OES_SITE_CREDENTIAL、签名头、OES direct-call、SQLite/local store token。
   - rg 检查 Runtime 通过 @oes/site-runtime-kit 接入。
   - rg 检查 external-site-template 未被 Meilong / 美隆 / meilong-ceramics 污染。

4. Build / typecheck verification
   - 按项目可行方式运行：
     - pnpm --dir src/site-runtime/external-site-template verify:boundaries
     - pnpm --dir src/site-runtime/meilong-ceramics-site verify:boundaries
     - pnpm --dir src/site-runtime/meilong-ceramics-site/runtime typecheck
     - pnpm --dir src/site-runtime/meilong-ceramics-site/runtime build
     - pnpm --dir src/site-runtime/meilong-ceramics-site/storefront typecheck
     - pnpm --dir src/site-runtime/meilong-ceramics-site/storefront build
   - 如果有 lint/unit test 脚本，按可行方式补充执行；如果没有，明确说明。

5. Runtime local API verification
   - 启动 Meilong Runtime。
   - 验证 /health/live、/health/ready。
   - 验证 site config API。
   - 验证 route index API。
   - 验证 product/category/blog/news published data API。
   - 验证 preview bridge 可返回 noindex/no-store 语义或明确的 P1 fallback。

6. Storefront page verification
   - 启动 Meilong Storefront。
   - 用 Browser 打开本地入口：
     - http://meilong-ceramics.com
     - 或在 hosts/nginx 不可用时使用等价 localhost 入口，但必须验证 HTML canonical 仍为 https://meilong-ceramics.com。
   - 验证以下页面可见并不是空白：
     - Home
     - product listing
     - product detail
     - category listing
     - category detail
     - blog listing
     - blog detail
     - news listing
     - news detail
     - About
     - Contact
     - preview
   - Browser 检查移动 375px 无横向溢出。

7. SEO structural readiness verification
   - Curl 或 Browser 验证 product/category/blog/news HTML 包含：
     - canonical
     - meta description
     - OG tags
     - Twitter tags
     - JSON-LD
   - sitemap.xml 只包含 published public URLs。
   - sitemap URLs 使用 https://meilong-ceramics.com，不出现 localhost。
   - robots.txt 阻止 /preview/、/api/、/api/oes/、/admin/、/debug/。
   - preview 页面响应头包含 cache-control: no-store 与 x-robots-tag: noindex, nofollow，或页面 head 明确 noindex/no-store。
   - structured data 不编造 price / inventory / review。

8. Performance-oriented architecture verification
   - 验证公开页面数据来自 Site Runtime local APIs / local published data。
   - 验证普通公开页面不实时调用 OES Core / OES Site-facing API。
   - 验证 Nuxt 与 Runtime 可以作为可分离部署单元运行。
   - 验证图片资产具有可部署级使用方式：本地可控 bitmap、alt、尺寸/加载策略。
   - 不要求 Lighthouse 分数，但要判断结构是否具备专业部署性能条件。

9. P1 postposed capability verification
   - 验证没有实现 inquiry submission。
   - 验证没有实现 order / payment / comments / reviews / customer account / dealer portal / advanced search。
   - Contact CTA 仅为 Email / WhatsApp / Contact page 等非 OES-writing 行为。

10. Follow-up classification
   - 输出 blocker。
   - 输出 non-blocking implementation follow-up。
   - 输出 architecture / contract follow-up。
   - 输出 documentation follow-up。
   - 特别关注：
     - site-defined category source 是否需要回写 site-service architecture / public-views contract。
     - Runtime local SEO route index / public site config 是否应标准化到 runtime-kit helper 或 contract。
     - 无 OES draft preview 时的 preview fallback 验收语义是否需要补充。

执行要求：

1. 使用 update_plan 跟踪验证步骤。
2. 先做 evidence gathering，再下结论。
3. 不要只根据前序线程口头报告判断完成，必须检查当前 worktree 与命令输出。
4. 若 dev server 已运行，优先复用；若端口占用，按 README 或可行方式选择替代端口，并记录。
5. 如果需要修改 hosts 或启动本地域名反向代理而需要权限，先说明并请求批准；不能批准时用 localhost 入口验证，同时确认 canonical 仍为 production-shaped domain。
6. Browser 验证应覆盖桌面与移动关键页面。
7. 不要让 verification 线程修复大量实现问题；若发现问题，优先记录并分类。

交付输出必须包含：

1. 本次验证范围。
2. 读取的 authoritative docs / paths。
3. 执行的命令与结果摘要。
4. Browser / curl 验证证据摘要。
5. Requirements traceability 表。
6. Boundary verification 结论。
7. SEO structural readiness 结论。
8. Performance-oriented architecture 结论。
9. P1 后置能力未进入确认。
10. blocker 列表。
11. non-blocking follow-up 列表。
12. architecture / contract 回写建议。
13. 是否可以关闭 External Site Integration P1 E2E Pilot requirements freeze goal 的建议。

完成条件：

- 第三线程独立验证已完成。
- 所有 P1 confirmed decisions 都有 evidence 或明确 follow-up。
- 没有发现阻断 Pilot 冻结的 blocker；若有 blocker，明确阻断项和建议处理线程。
- 输出可供 requirements freeze 线程关闭 goal 的 verification summary。
```

## 12. Final Verification Summary

```text
verificationThread: External Site Integration P1 - E2E Verification
verificationStatus: COMPLETED
blockers: none
closeRecommendation: can_close_requirements_freeze_goal
reportedAt: 2026-06-16
```

第三线程已完成 External Site Integration P1 E2E Pilot 独立黑盒验证。整体结论：

- 未发现阻断 Pilot requirements freeze 关闭的 blocker。
- P1 confirmed decisions 基本成立。
- External Site Template P1、Meilong Ceramics Site Pilot 与 E2E Verification 三个后续线程均已完成。
- 可以关闭 External Site Integration P1 E2E Pilot Requirements Freeze goal。
- 后续应将 non-blocking follow-up 进入 architecture / contract / implementation 整理。

### 12.1 Verification Scope

第三线程验证了：

- External Site Template P1 工程边界。
- Meilong Ceramics Site Pilot 本地 Runtime + Storefront。
- `@oes/site-runtime-kit` 接入边界。
- Storefront credential / OES direct-call / SQLite boundary。
- Runtime local APIs。
- Nuxt SSR / SEO surfaces / sitemap / robots / preview noindex。
- P1 后置能力未进入。
- local deployment-shaped preview 是否成立。

第三线程未修改生产代码、architecture、contracts 或稳定真相源。

### 12.2 Verification Evidence Summary

命令验证通过：

```text
pnpm --dir src/site-runtime/external-site-template verify:boundaries
pnpm --dir src/site-runtime/meilong-ceramics-site verify:boundaries
pnpm --dir src/site-runtime/meilong-ceramics-site/runtime typecheck
pnpm --dir src/site-runtime/meilong-ceramics-site/runtime build
pnpm --dir src/site-runtime/meilong-ceramics-site/storefront typecheck
pnpm --dir src/site-runtime/meilong-ceramics-site/storefront build
```

说明：

- Meilong runtime/storefront package 没有单独 lint / unit test scripts。
- Storefront typecheck 有 npm env warning，但 exit 0。

Runtime evidence:

- `/health/live` 返回 `200`。
- `/health/ready` 返回 `200` 与 healthy status。
- `/api/public/site-config` 返回 `publicBaseUrl: https://meilong-ceramics.com`、default `en-US`、preview noindex / no-store。
- `/api/public/seo/route-index` 返回 12 条 published route，canonical 全部为 `https://meilong-ceramics.com/...`。
- product / category / blog / news APIs 返回 4 / 4 / 2 / 2 published data。
- `/api/oes/runtime-status` 匿名请求返回 `401 Unauthorized`。
- Runtime preview bridge 无真实 OES draft preview 时返回 500，但 header 有 `Cache-Control: no-store` 与 `X-Robots-Tag: noindex, nofollow`。

Storefront evidence:

- Home、products/list/detail、categories/list/detail、blog/list/detail、news/list/detail、About、Contact、Preview 均返回 200 且 SSR HTML 非空。
- product/category/blog/news detail HTML 均包含 canonical、meta description、OG、Twitter、JSON-LD。
- `sitemap.xml` 只包含 12 条 published public URLs，全部为 `https://meilong-ceramics.com`，无 localhost。
- `robots.txt` 阻止 `/preview/`、`/api/`、`/api/oes/`、`/admin/`、`/debug/`。
- Storefront preview page/API 均为 200 fallback，带 no-store + noindex,nofollow。

Boundary evidence:

- Storefront 静态扫描未命中 `OES_SITE_CREDENTIAL`、签名头、client secret、SQLite/local store token、OES direct-call。
- Runtime 明确 import `@oes/site-runtime-kit`。
- `external-site-template` 未被 Meilong / 美隆 / `meilong-ceramics` 污染。
- Storefront 只通过 Nuxt server routes 调 Site Runtime local API。
- 公开页面没有实时调用 OES Core / Site-facing API 的代码证据。

Verification limitation:

- Browser 插件验证未完成：in-app Browser 连续 attach timeout。
- 没有切到 Chrome，因为 Chrome fallback 需要用户明确批准。
- 移动端只基于 CSS 响应式结构做有限判断，不能声明 Browser 375px 实机已通过。

### 12.3 Requirements Traceability

| 冻结结论 | 结果 | Evidence / follow-up |
| --- | --- | --- |
| production-shaped local preview | Passed with follow-up | 分离 Runtime/Storefront、docker/nginx shape、SSR/cache rules；direct domain dev host 有 follow-up。 |
| SEO 身份生产化 | Passed | canonical/sitemap/site config 全部为 `https://meilong-ceramics.com`。 |
| 默认英文无 locale 前缀 | Passed | route index 为 `/products/...` 等无前缀 `en-US` route。 |
| 非默认 active locale 用 `/<locale>/` | Not applicable P1 seed | active locales 当前仅 `en-US`。 |
| Categories site-defined | Passed / contract follow-up | Meilong seed category public views 独立于 template；contracts 仍需澄清 source。 |
| Navigation/static brand pages 前端拥有 | Passed | Home/About/Contact/header/footer 在 Meilong Storefront。 |
| Product/category/blog/news 来自 local published data | Passed | Runtime APIs + Nuxt server routes `fetchSiteRuntime`。 |
| Contact CTA 不写 OES inquiry | Passed | 仅 mailto / WhatsApp / contact page；无写入 API。 |
| Performance architecture-oriented | Passed | SSR、SWR route rules、本地 Runtime API、分离部署、轻量 bundle。 |
| SEO structure-oriented | Passed | canonical/meta/OG/Twitter/JSON-LD/sitemap/robots/preview noindex。 |
| E2E black-box integration-oriented | Passed | 使用命令、curl、boundary scripts 验证边界，不改实现。 |

## 13. Freeze Closure

External Site Integration P1 E2E Pilot requirements freeze 已完成。

完成项：

- 已冻结 Pilot 目标。
- 已冻结 Pilot 不做什么。
- 已冻结站点模板边界。
- 已冻结美隆 Pilot 边界。
- 已冻结 SEO baseline。
- 已冻结 performance baseline。
- 已冻结 local domain 测试策略。
- 已冻结 E2E 验收标准。
- 已产出并执行后续三个线程：
  - `External Site Template P1 - Nuxt + NestJS Runtime`
  - `Meilong Ceramics Site Pilot - Local E2E`
  - `External Site Integration P1 - E2E Verification`
- 已记录 architecture / contract 回写建议。
- 未在 requirements freeze 线程进入生产代码实现。

关闭结论：

```text
requirementsFreeze: CLOSED
closeReason: verified_no_blockers
```

### 13.1 Blockers

None.

### 13.2 Non-blocking Implementation Follow-ups

1. Nuxt dev allowed hosts

   直接用 `Host: meilong-ceramics.com` 访问 Nuxt dev server 被 Vite allowedHosts 拦截。localhost 验证可用，SEO canonical 正确；若 README 希望 dev 直连域名或 nginx edge 代理 dev server，需要补 `server.allowedHosts` 或说明必须走特定 edge 配置。

2. Category fallback image

   Category detail 的 fallback image 出现 `picsum.photos` 外链，不影响 P1 边界，但“可部署级本地可控 bitmap”最好后续替换为本地资产。

### 13.3 Architecture / Contract Follow-ups

1. site-defined category source

   回写 [site-service.md](../../architecture/services/site-service.md) 与 [public-views.md](../../contracts/site-service/public-views.md)：`CategoryPublicView` P1 source 应明确为 site-defined category data。

2. Runtime local SEO route index / public site config

   如果 Runtime local SEO route index / public site config 成为跨站标准，建议沉淀为 runtime-kit helper 或 contract。

3. Preview fallback semantics

   无真实 OES draft preview 时，Runtime 原始 500 + noindex/no-store，Storefront 转 200 fallback。建议后续冻结可接受行为。

### 13.4 Documentation Follow-ups

1. README local domain

   README local domain 部分建议说明：若不改 hosts/nginx，可用 localhost 验证，但 canonical 仍必须是 production-shaped domain。

2. Nuxt dev host requirement

   README 或 local-domain docs 应说明 Nuxt dev `allowedHosts` / nginx edge 对 Host header 的要求。

## 14. Follow-up Closure Ledger

```text
followUpThread: External Site Integration P1 - Architecture Contract Follow-ups
followUpStatus: DOCUMENTED_WITH_DEFERRED_ITEMS
reviewedAt: 2026-06-16
```

本轮 follow-up 只做 architecture / contract / documentation 回写，不进入生产代码实现、不启动 dev server、不继续推进美隆站点功能，也不做真实 OES live sync 联调。

处理结果：

| Follow-up | 处理状态 | 落点 |
| --- | --- | --- |
| site-defined category source | documented | `docs/architecture/services/site-service.md`, `docs/contracts/site-service/public-views.md` |
| Runtime local SEO route index / public site config | documented as runtime-kit local helper boundary; contract deferred | `docs/architecture/platforms/site-runtime-kit.md`, `src/site-runtime/external-site-template/README.md` |
| preview fallback semantics | documented | `docs/contracts/site-service/preview-and-runtime-status.md`, `docs/architecture/services/site-service.md` |
| local domain / Nuxt allowedHosts | documented | `src/site-runtime/external-site-template/README.md`, `src/site-runtime/meilong-ceramics-site/README.md`, local nginx examples |
| category fallback image external URL | deferred implementation follow-up | no production code change in this thread |
| live sync / true-device boundary | documented | this workspace and Meilong README |

边界澄清：

- requirements freeze 已关闭，关闭依据是第三线程独立验证未发现 blocker。
- 当前 Pilot 只证明 deployment-shaped local preview 与本地 published-data 渲染边界成立。
- 当前 Pilot 尚未证明真实 OES Admin 配置站点 -> `site-service` 显式 Sync -> webhook -> Meilong Runtime `syncToLatest()` -> Storefront 渲染真实 OES published data 的 live sync 全链路。
- 当前 Pilot 尚未完成真机浏览器测试；不得把有限 Browser / curl / build evidence 表述为真机通过。
- 若要验证“通过 OES 配置同步美隆站点”，应新开独立线程：`Meilong Ceramics Site Pilot - OES Live Sync Integration`。

后续状态建议：

- 本 workspace 已不应继续作为稳定设计入口扩写。
- 若稳定 truth source 与 contracts 已覆盖后续查询需要，可将本文标记为 historical design workspace，并在后续归档时添加 `SUPERSEDED_BY_TRUTH_SOURCE` / `doNotUseAsStableSource: true` 指向上述 architecture 与 contract 文档。
