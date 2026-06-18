# External Site Integration P1

## 1. 目标

- 将已冻结的外部站点集成架构转成可执行 feature packet。
- 同时覆盖 OES 端 `site-service` P1 与站点端 `@oes/site-runtime-kit` P1。
- 明确两条实现主线共享的 contracts、实施顺序、验收标准与并行边界。
- 保持 OES 不是集中式实时网站渲染后端；外部站点页面由各自 Site Runtime 使用本地 published data 渲染。

## 2. 不做什么

- 不实现生产代码。
- 不直接进入并行实现线程。
- 不让外部站点直接调用 OES Core 内部 API。
- 不让 Storefront Frontend 持有高权限凭证或直接调用 OES Core API。
- 不做集中式实时 Site Platform backend。
- 不做 template、page builder、archive。
- 不做 price / inventory final validation。
- 不做 inquiry、order、customer account、dealer account、payment / checkout。
- 不做 third-party marketplace connector，例如 Amazon / 1688 / 淘宝 / 京东。
- 不做 IM / Email / social channel 集成。
- 不做多 runtime endpoint、复杂 redirect、CDN purge、自动翻译。

## 3. 上游依赖

- architecture:
  - [site-runtime-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/site-runtime-architecture.md)
  - [site-runtime-kit.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/site-runtime-kit.md)
  - [site-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/site-service.md)
  - [11-gateway-and-bff-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/11-gateway-and-bff-architecture.md)
  - [12-observability-and-audit-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/12-observability-and-audit-architecture.md)
  - [14-grpc-metadata-and-service-trust-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/14-grpc-metadata-and-service-trust-architecture.md)
- design workspace:
  - [external-site-runtime-kit-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/external-site-runtime-kit-design.md)
- future contracts:
  - `docs/contracts/site-service/**`
  - `docs/contracts/site-runtime-kit/**` if package-facing contracts need a separate home
  - `docs/contracts/api-gateway/**` for Admin BFF / Site-facing BFF surfaces

## 4. 当前结论

External Site Integration P1 由两条主线组成：

```text
External Site Integration P1
  ├─ OES side: site-service P1
  └─ Site side: @oes/site-runtime-kit P1
```

共同架构结论：

- OES Core 是内部业务真相源。
- `site-service` 是 OES 自有 / 自控外部站点治理与发布服务。
- `@oes/site-runtime-kit` 是所有 Site Runtime 后端必须使用的官方运行时包。
- Site Runtime 通过 `api-gateway` 的 Site-facing BFF / Site API 与 OES 通信，不直接调用 `site-service` 或 OES Core 内部 API。
- 保存草稿或站点展示配置只产生 pending sync。
- 显式 Sync 才生成 / 更新 public views、推进站点 publishVersion 并 webhook 通知站点。
- 每个站点每次同步批次最多发送一次 `site.publish.available` webhook。
- Site Runtime 收到 webhook 后执行 `syncToLatest()`，并具备 pull fallback。
- Preview 通过站点真实 preview 页面渲染，但不写正式 store、不生成 publishVersion、不触发 webhook。

## 5. 契约真相位置

稳定架构真相：

- `@oes/site-runtime-kit` P1 架构：
  - [site-runtime-kit.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/site-runtime-kit.md)
- `site-service` 服务职责与 P1 对象边界：
  - [site-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/site-service.md)
- 顶层外部站点运行时协作方式：
  - [site-runtime-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/site-runtime-architecture.md)

本 feature packet 不替代上述稳定真相源。

后续必须冻结的 contracts：

- credential bundle contract
- signed request headers / canonical signing contract
- webhook payload / headers contract
- latest publish state contract
- changed resources contract
- batch public views contract
- snapshot contract
- preview token / preview view contract
- runtime status contract
- Admin BFF contract for Site Management

contracts 冻结前，不应启动 `site-service` 与 `@oes/site-runtime-kit` 的并行生产实现。

## 6. P1 主线范围

### 6.1 `@oes/site-runtime-kit` P1

P1 包含：

- Runtime Kernel
- `createSiteRuntimeFromEnv()`
- advanced `createSiteRuntime({...})`
- `OES_SITE_CREDENTIAL` parsing
- Signed OES Client
- Webhook Verifier
- Sync Engine with `syncToLatest()`
- Local Published Store interface
- SQLite Published Store
- `runtime.publicViews`
- NestJS Integration
- health endpoints
- protected runtime-status endpoint
- pull fallback
- preview view fetch support
- basic Error / Retry / Idempotency

P1 public view read covers:

- products
- categories
- contents
- blogs
- news

P1 excludes:

- inquiry submission
- order / draft order
- price / inventory validation
- Redis / Postgres / Mongo store implementations
- multiple framework adapters
- distributed lock
- CDN purge
- credential rotation automation

### 6.2 `site-service` P1

P1 包含:

- Site Management card workspace support
- `Site`
- `SiteLocale`
- `SiteCredential`
- `SiteProductPublication`
- site-scoped `SiteContentEntry` for Blog / News
- `SitePublicView`
- `SiteSyncBatch`
- sync resource list / changed resource index
- `SiteWebhookEndpoint` concept through P1 `webhookUrl`
- `SiteRuntimeStatus`
- `SiteAuditLog`
- preview token and draft preview view
- explicit sync semantics

P1 Admin workflows:

- Site card workspace
- Site Overview
- Products
- Blog / News
- Locales
- Sync
- Settings
- Credentials
- Audit

P1 excludes:

- template
- page builder
- archive
- automatic product master publish
- automatic translation
- complete CMS
- commerce writes
- marketplace connectors

## 7. P1 User Workflows

P1 must support these operator workflows:

- Create and configure a site.
- Generate `OES_SITE_CREDENTIAL` for a Site Runtime backend.
- Configure domain, preview base URL, webhook URL and runtime status URL.
- Configure default locale and add preparing locales.
- Add products from Product Master to a site.
- Edit site-specific product slug, title, description and SEO per locale.
- Create site-scoped Blog / News with fixed fields.
- Save draft / changes without notifying the site.
- Preview product / Blog / News through the real Site Runtime preview page.
- Sync all pending changes for a site.
- Retry or resend webhook for a failed sync.
- Activate a preparing locale after completeness checks.
- Unpublish product / Blog / News.
- View runtime status and sync history.
- View audit records for site governance, credentials, content changes and sync.

## 8. Runtime / OES Interaction

Normal sync:

```text
OES Admin saves changes
  ↓
site-service marks pending sync
  ↓
OES Admin executes Sync
  ↓
site-service validates active locale completeness
  ↓
site-service builds public views and advances publishVersion
  ↓
api-gateway / OES sends signed webhook
  ↓
Site Runtime verifies webhook through @oes/site-runtime-kit
  ↓
runtime.sync.syncToLatest()
  ↓
Signed OES Client pulls changed resources and public views
  ↓
Local Published Store updates published_resources
  ↓
Storefront renders from local data
```

Preview:

```text
OES Admin saves draft
  ↓
Preview
  ↓
site-service issues previewToken
  ↓
OES Admin opens Site Runtime preview URL
  ↓
Site Runtime uses SDK to call OES Preview API
  ↓
site-service returns draft preview view
  ↓
Site Runtime renders real preview without writing formal store
```

Pull fallback:

```text
Site Runtime scheduled check
  ↓
Signed OES Client gets latest publish state
  ↓
If remote version is newer, runtime performs syncToLatest()
```

## 9. 线程分工

| Thread / Owner | 职责 | 允许修改路径 | 输入 | 输出 | 状态 |
| --- | --- | --- | --- | --- | --- |
| EXTERNAL-SITE-ARCH thread | 维护架构真相源、P1 feature packet 与设计 workspace | `docs/architecture/site-runtime-architecture.md`, `docs/architecture/site-runtime-kit.md`, `docs/architecture/services/site-service.md`, `docs/plans/designs/external-site-runtime-kit-design.md`, `docs/plans/features/external-site-integration-p1.md` | 已冻结设计 | stable docs + feature packet | in_progress |
| EXTERNAL-SITE-CONTRACT thread | 冻结共享 contracts | `docs/contracts/site-service/**`, `docs/contracts/api-gateway/**`, necessary index docs | 本文、architecture truth sources | credential / webhook / sync / preview / runtime-status contracts | completed |
| SITE-RUNTIME-KIT-P1 thread | 实现 `@oes/site-runtime-kit` P1 foundation | future package path for `@oes/site-runtime-kit`, tests, examples | contracts + site-runtime-kit architecture | runtime kit package with tests | ready_for_plan |
| SITE-SERVICE-P1 thread | 实现 OES 端 `site-service` P1 foundation | future `src/services/**/site-service/**`, api-gateway site/admin BFF paths, contracts generated code | contracts + site-service truth source | OES service and BFF implementation with tests | ready_for_plan |
| integration / review thread | 验证两端实现按 contracts 协同，且未越界到 P2 | read all relevant paths, minimal doc fixes | implementations + contracts | review findings and closure | pending |

## 10. 实施顺序

Recommended order:

1. Freeze this P1 feature packet.
2. Freeze shared contracts. `completed`
3. Create implementation plan for `@oes/site-runtime-kit` P1.
4. Create implementation plan for `site-service` P1.
5. Start parallel implementation threads only after contracts are frozen.
6. Integrate with contract tests and runtime mock tests.

Parallelism rule:

- Before contracts freeze: keep work serial in architecture / contract design.
- After contracts freeze: SDK and OES implementation can proceed in parallel.

## 11. 阻塞 / 依赖

- Shared contracts are frozen for P1 implementation planning.
- Package location for `@oes/site-runtime-kit` must be selected before implementation.
- Runtime kit implementation depends on contract DTOs, signing rules and error model.
- `site-service` implementation depends on final service location, persistence strategy and api-gateway integration plan.
- Product Master public-safe field contract is not frozen.
- Category public view source has been clarified as site-defined category data in the service truth source and public view contract.

## 12. 派生问题 Ledger

| 时间 | 问题 | 分类 | 当前影响 | 处理策略 | 目标落点 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-06-15 | `@oes/site-runtime-kit` package path | Blocker-Now | 影响 implementation plan，但不影响 contracts | contract 后、implementation plan 前确定 | future runtime kit implementation plan | open |
| 2026-06-15 | Product Master public-safe fields | Blocker-Now | 影响 ProductPublicView contract | contract 线程中冻结最小字段集 | `docs/contracts/site-service/**` | open |
| 2026-06-15 | Category public view source | Resolved Follow-up | P1 categories 需要避免暗示来自 item-master category projection | 已明确为 site-defined category data；ProductPublicView 可引用当前 site category ids | `docs/architecture/services/site-service.md`, `docs/contracts/site-service/public-views.md` | closed |
| 2026-06-15 | Snapshot / rollback depth | Blocker-Later | 不影响 minimal sync path，但影响 recovery | P1 contracts 先支持 snapshot rebuild，rollback 可后置 | future sync hardening | open |
| 2026-06-15 | Credential rotation automation | Blocker-Later | P1 手动轮换即可 | 后续 security hardening | future P2 | open |

## 13. 验收标准

Feature packet 验收：

- 本文明确引用稳定架构真相源，不重新定义服务边界。
- 本文同时覆盖 `site-service` P1 与 `@oes/site-runtime-kit` P1。
- 本文明确 contracts 冻结前不启动并行生产实现。
- 本文明确可并行实现的边界与阻塞条件。

Contracts 验收：

- credential bundle contract 已冻结到 [security-and-signing.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/site-service/security-and-signing.md)。
- signed request / webhook signing contract 已冻结到 [security-and-signing.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/site-service/security-and-signing.md)。
- sync latest / changed resources / batch public views / snapshot contracts 已冻结到 [sync-api.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/site-service/sync-api.md)。
- preview token / preview view contract 已冻结到 [preview-and-runtime-status.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/site-service/preview-and-runtime-status.md)。
- runtime-status contract 已冻结到 [preview-and-runtime-status.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/site-service/preview-and-runtime-status.md)。
- Admin BFF 最小站点管理 contract 已冻结到 [admin-bff.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/site-service/admin-bff.md)。

Implementation readiness:

- `@oes/site-runtime-kit` implementation plan can mock OES Site API from contracts.
- `site-service` implementation plan can satisfy runtime kit contract tests.
- 两端不需要互相猜字段、状态码、签名算法或错误模型。

## 14. 关闭条件

- P1 contracts 已冻结。
- Runtime kit P1 implementation plan 已创建并通过 review。
- site-service P1 implementation plan 已创建并通过 review。
- 两条 implementation thread 均能独立启动，且共享 contract tests。
- 未把 P2 deferred 能力混入 P1。

## 15. 备注

- 本 feature packet 是 External Site Integration P1 的执行协作入口。
- `site-service` 的长期职责和核心对象只以 [site-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/site-service.md) 为准。
- `@oes/site-runtime-kit` 的 P1 架构只以 [site-runtime-kit.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/site-runtime-kit.md) 为准。
