# External Site Runtime Kit Design Workspace

## 0. 文档控制

```text
designKey: external-site-runtime-kit
designStatus: ACTIVE_DESIGN_WORKSPACE
implementationStatus: DESIGN_FROZEN_FOR_EXTERNAL_SITE_INTEGRATION_P1_CONTRACTS_FROZEN
lastUpdatedAt: 2026-06-15 00:00:00 CST
lastUpdatedBy: Codex
supersedes: 本线程中关于 OES 外部站点集成、Site Runtime、webhook、pull fallback 与 @oes/site-runtime-kit 的口头讨论
truthSource: docs/architecture/site-runtime-architecture.md, docs/architecture/site-runtime-kit.md, docs/architecture/services/site-service.md, docs/plans/features/external-site-integration-p1.md, and docs/contracts/site-service/README.md for frozen P1 design and contracts
doNotUseAsStableSource: false
conflictResolution: 当本文与更早讨论冲突时，以本文 lastUpdatedAt 之后的冻结结论为准；稳定 architecture / ADR / contracts 明确覆盖本文时，以稳定真相源为准。
```

## 1. 目标

- 持续设计 OES 外部网站集成架构。
- 冻结 `@oes/site-runtime-kit` 作为一个同时包含 SDK 与轻量运行时框架的统一包。
- 先冻结并实现基础框架能力，再推进产品、内容、询盘、订单等业务能力模块。
- 明确 OES 内部模块、Site Runtime、Storefront Frontend 与站点运行时包之间的边界。

## 2. 当前范围

本 workspace 负责：

- 外部站点运行时总体协作模型。
- `@oes/site-runtime-kit` 基础框架设计。
- webhook、pull fallback、publishVersion、snapshot / delta 同步设计。
- Site Runtime 与 OES Site-facing BFF / Site API 的通信边界。
- 基础能力与业务能力的分阶段路线。

本 workspace 不负责：

- 实现生产代码。
- 替代稳定架构文档、ADR 或 contracts。
- 重新定义 OES Core 内部服务的业务真相。
- 设计具体 storefront 页面 UI。

## 3. 涉及对象

- OES 内部：
  - OES Core services
  - Site Control Plane
  - Site Publish / Sync
  - Site-facing BFF / Site API
  - Site Ingress API
- 站点侧：
  - `@oes/site-runtime-kit`
  - Site Runtime backend
  - Storefront Frontend
  - Local published data / cache

## 4. 已冻结决定

| 日期 | 决定 | 影响范围 | 回写目标 |
| --- | --- | --- | --- |
| 2026-06-12 | 外部站点不直接调用 OES Core 内部 API；Site Runtime 通过 `@oes/site-runtime-kit` 调用 OES 面向站点开放的 BFF / Site API。 | Site Runtime、OES Site API、安全边界 | `docs/architecture/site-runtime-architecture.md` |
| 2026-06-12 | 一个站点默认只配置一个主 webhook endpoint；通过 `eventType`、`resources` 与 `publishVersion` 区分 product、news、blog 等更新。 | webhook、同步、站点注册 | `docs/architecture/site-runtime-architecture.md` |
| 2026-06-12 | webhook 只承载通知信息，不推送完整业务数据；Site Runtime 收到通知后拉取 snapshot 或 delta。 | 发布同步、安全、缓存 | `docs/architecture/site-runtime-architecture.md` |
| 2026-06-12 | webhook 之外必须支持 pull fallback，由 Site Runtime 定时检查 OES 最新 publishVersion 并补偿漏同步。 | 同步可靠性、失败恢复 | `docs/architecture/site-runtime-architecture.md` |
| 2026-06-12 | `@oes/site-runtime-kit` 第一阶段设计为一个包，既包含 Site API SDK，也包含轻量 Site Runtime Framework。 | SDK / framework 设计、站点开发规范 | 待回写 `docs/architecture/site-runtime-kit.md` |
| 2026-06-12 | `@oes/site-runtime-kit` 应先实现基础框架能力，再推进业务能力模块。 | 路线图、实现拆分 | 待回写 roadmap / feature packet |
| 2026-06-12 | `@oes/site-runtime-kit` 必须以 `createSiteRuntime()` 作为默认主入口；站点后端通过 Runtime 实例使用 webhook、sync、client、cache、health、ingress 等能力。底层工具函数可以暴露给高级场景，但不是默认接入方式。 | Runtime Kernel、public API、站点开发规范 | 待回写 `docs/architecture/site-runtime-kit.md` |
| 2026-06-12 | `@oes/site-runtime-kit` Phase 1 基础模块收敛为 Runtime Kernel、Config / Credential、Signed OES Client、Webhook Verifier、Sync Engine、Local Published Store、Error / Retry / Idempotency、Health Check、Minimal HTTP Handler。 | Runtime Kit 基础框架、实施范围 | 待回写 `docs/architecture/site-runtime-kit.md` |
| 2026-06-12 | Phase 1 核心持久化能力统一称为 `Local Published Store`，用于保存站点已发布数据、publishVersion、sync state 与 webhook 去重记录；页面级缓存交给 NestJS/SSR 框架、CDN、Nginx 等站点渲染层处理。 | Store / cache 边界、性能策略 | 待回写 `docs/architecture/site-runtime-kit.md` |
| 2026-06-12 | Phase 1 不设计复杂 cache adapter、lock adapter、scheduler adapter、id generator adapter、clock adapter 或多框架 adapter 体系；这些能力只在 kit 内部提供最小默认实现，后续根据真实多站点部署差异再扩展。 | 反过度设计、实现范围 | 待回写 `docs/architecture/site-runtime-kit.md` |
| 2026-06-12 | Phase 1 官方优先支持 NestJS 接入方式；底层可保留标准 HTTP handler 形态，但不优先建设 Next.js / Express / Fastify 多 adapter 体系。 | 站点后端技术栈、framework adapter 优先级 | 待回写 `docs/architecture/site-runtime-kit.md` |
| 2026-06-12 | `Local Published Store` 设计为接口 + 默认实现模式；上层使用统一 `runtime.store` 能力，底层 Phase 1 只实现 SQLite，未来可增加 Postgres / MongoDB / File 等实现。 | Store adapter 边界、部署演进 | 待回写 `docs/architecture/site-runtime-kit.md` |
| 2026-06-12 | Phase 1 暂不把 cache 设计为独立核心 adapter；业务公开数据进入 `Local Published Store`，页面级缓存由站点渲染层、CDN、Nginx 或后续站点框架能力处理。 | Cache 边界、反过度设计 | 待回写 `docs/architecture/site-runtime-kit.md` |
| 2026-06-12 | `Local Published Store` Phase 1 数据结构采用 metadata 表独立 + 通用业务资源表：`publish_state`、`sync_runs`、`webhook_events` 独立保存运行时元数据；`published_resources` 通过 `resourceType`、`resourceId`、`slug`、`locale`、`status`、`publishVersion`、`payloadJson` 保存 product / category / content / blog / news 等站点公开业务数据。 | Store schema、同步协议、业务 public view 存储 | 待回写 `docs/architecture/site-runtime-kit.md` |
| 2026-06-12 | Phase 1 不为 product、blog、news 等资源提前建立复杂专用表；后续只有在筛选、搜索或性能需求明确后，再引入 resource-specific read model 或索引表。 | 反过度建模、后续优化策略 | 待回写 `docs/architecture/site-runtime-kit.md` |
| 2026-06-13 | `@oes/site-runtime-kit` Phase 1 必须提供 `runtime.publicViews` 读取层；Storefront Frontend 不直接读 `published_resources`，而是通过 Site Runtime API / SSR 间接消费 `runtime.publicViews`。 | Site Runtime 读取边界、前端边界 | 待回写 `docs/architecture/site-runtime-kit.md` |
| 2026-06-13 | `runtime.publicViews` Phase 1 先支持 products、categories、contents、blogs、news 的本地 public view 读取；price 与 inventory 后置到业务增强阶段。 | Public view client 范围、业务模块分期 | 待回写 `docs/architecture/site-runtime-kit.md` |
| 2026-06-13 | `slug` 是站点公开 URL 标识，由 OES Site Control Plane / Publish View 管理并同步到 Site Runtime；站点侧消费结果，不自行决定 slug。 | SEO URL、发布配置、Site Control Plane | 待回写 `docs/architecture/site-control-plane.md` 与 `docs/architecture/site-runtime-kit.md` |
| 2026-06-13 | `slug` 唯一性范围为 `siteId + resourceType + locale`；同一 OES 内部资源在不同站点或不同 locale 下可以有不同 slug。 | Store schema、发布校验、SEO | 待回写 `docs/architecture/site-control-plane.md` 与 `docs/architecture/site-runtime-kit.md` |
| 2026-06-13 | Sync Engine Phase 1 默认只执行 `syncToLatest()`；webhook 只作为“有新发布版本”的唤醒信号，Site Runtime 不提供拉取指定 publishVersion 的站点能力。 | 同步协议、runtime public API | 待回写 `docs/architecture/site-runtime-kit.md` |
| 2026-06-13 | Delta Phase 1 定义为 `from localVersion to latestVersion` 的聚合 changed resource list，不承载完整业务数据，也不强调业务动作日志。 | Delta 协议、Publish Sync API | 待回写 `docs/architecture/site-runtime-kit.md` 与后续 contracts |
| 2026-06-13 | Site Runtime 根据 changed resource list 批量拉取这些资源的最新 publish view 并写入 `Local Published Store`。同一资源在版本区间内多次变化时，只同步最终最新 view。 | Sync Engine、Local Published Store | 待回写 `docs/architecture/site-runtime-kit.md` |
| 2026-06-13 | 下架、隐藏、删除等外部展示变化统一表达为 publish view 的 `status` 变化；同步层可以写入非 published 状态，`runtime.publicViews` 展示读取层默认只返回 `status = published` 的资源。 | 发布状态模型、前端展示边界 | 待回写 `docs/architecture/site-control-plane.md` 与 `docs/architecture/site-runtime-kit.md` |
| 2026-06-13 | 设计推进顺序冻结为：先冻结 `@oes/site-runtime-kit` P1，再从高层冻结 OES 侧架构，最后才进入 OES Site API / contract 细节。 | 设计治理、阶段顺序 | 本 workspace |
| 2026-06-13 | OES 侧设计开始时必须先讨论整体架构与部署/服务边界，例如 Site Control Plane 是否独立服务、与 api-gateway/Core services/publish worker 的关系，而不是直接设计 API 字段。 | OES 侧架构设计纪律 | 后续 `docs/architecture/site-control-plane.md` |
| 2026-06-13 | Config / Credential 默认开发体验采用单个 `OES_SITE_CREDENTIAL`；推荐入口为 `createSiteRuntimeFromEnv()`，由 kit 内部解析出 `siteId`、`clientId`、`clientSecret`、`oesBaseUrl`、`environment` 等结构化配置。 | Runtime Kit 配置模型、开发者体验、安全模型 | 待回写 `docs/architecture/site-runtime-kit.md` |
| 2026-06-13 | `OES_SITE_CREDENTIAL` 是 OES Site Control Plane 生成的 credential bundle，不是简单裸 API key；对站点开发者表现为一个配置项，对 kit 内部保持结构化身份、签名密钥、endpoint 与环境信息。 | Credential 生成、配置简化、凭证治理 | 待回写 `docs/architecture/site-control-plane.md` 与 `docs/architecture/site-runtime-kit.md` |
| 2026-06-13 | `createSiteRuntime({...})` 保留为高级入口，用于测试、特殊部署或未来多 credential 场景；默认站点接入不要求手动配置多个字段。 | Runtime Kernel public API | 待回写 `docs/architecture/site-runtime-kit.md` |
| 2026-06-13 | Config 模型分为三层：Credential bundle 只负责身份、签名与连接 OES；OES-managed site config 由 Site Control Plane 管理并由 runtime 启动握手获取；Local runtime config 只保存站点服务器本地运行环境配置。 | Config 分层、Site Control Plane、Runtime Kit | 待回写 `docs/architecture/site-control-plane.md` 与 `docs/architecture/site-runtime-kit.md` |
| 2026-06-13 | 凡是 OES 能统一治理的配置，不应要求站点本地手写；凡是与站点服务器运行环境绑定的配置，保留在 Site Runtime 本地配置。 | 配置治理、反漂移原则 | 待回写 `docs/architecture/site-runtime-kit.md` |
| 2026-06-13 | `Signed OES Client` 是 `@oes/site-runtime-kit` 内部唯一允许访问 OES Site-facing API 的通道；站点开发者不得绕过它直接调用 OES。 | 安全通信、SDK 边界 | 待回写 `docs/architecture/site-runtime-kit.md` |
| 2026-06-13 | Phase 1 采用 HMAC-SHA256 request signing。签名基于 canonical request，至少包含 method、path、normalized query、body hash、timestamp、nonce、siteId、clientId、credentialId。 | 签名协议、安全基线 | 待回写 `docs/architecture/site-runtime-kit.md` 与后续 contracts |
| 2026-06-13 | Signed Client 每次请求必须携带 `x-oes-site-id`、`x-oes-client-id`、`x-oes-credential-id`、`x-oes-timestamp`、`x-oes-nonce`、`x-oes-signature`、`x-oes-request-id`、`x-oes-trace-id`。 | Header 规范、可观测性、凭证轮换 | 待回写 `docs/architecture/site-runtime-kit.md` 与后续 contracts |
| 2026-06-13 | OES 侧必须校验站点状态、client 状态、credential 状态、签名、timestamp 时间窗、nonce 重放、scope 与 rate limit。timestamp 过期、nonce 重放、签名错误、凭证吊销、站点禁用、scope 不足均 fail closed。 | OES Site API 安全边界 | 待回写 `docs/architecture/site-control-plane.md` 与后续 contracts |
| 2026-06-13 | Signed Client 默认只重试网络超时、502/503/504 与遵守 `Retry-After` 的 429；不重试 401/403、签名错误、凭证吊销、站点禁用、scope 不足、validation error 与业务拒绝。写入类请求必须使用 idempotency key。 | Retry / idempotency、安全失败处理 | 待回写 `docs/architecture/site-runtime-kit.md` |
| 2026-06-13 | Signed Client 统一映射错误类型，例如 auth、scope、site disabled、credential revoked、rate limit、network、validation、server error；site disabled / credential revoked 应使 runtime 进入明确 degraded / blocked 状态。 | 错误模型、运行时降级 | 待回写 `docs/architecture/site-runtime-kit.md` |
| 2026-06-13 | `Webhook Verifier` 是 `@oes/site-runtime-kit` 处理 OES -> Site Runtime 通知的安全入口；webhook 只通知事件，不传完整业务数据。 | Webhook 安全边界、同步触发 | 待回写 `docs/architecture/site-runtime-kit.md` |
| 2026-06-13 | `site.publish.available` webhook 只触发 `syncToLatest()`，不要求站点同步到 webhook 中提示的指定 publishVersion。 | Webhook / Sync Engine 协作 | 待回写 `docs/architecture/site-runtime-kit.md` |
| 2026-06-13 | Webhook 必须基于 HMAC canonical request 验签，校验 siteId、timestamp、nonce、eventId、eventType，并通过 `webhook_events` 做幂等去重。 | Webhook 签名、重放防护、幂等 | 待回写 `docs/architecture/site-runtime-kit.md` 与后续 contracts |
| 2026-06-13 | Webhook 验签失败、timestamp 过期、nonce 重放、eventId 异常或 siteId 不匹配时必须拒绝请求，并且不得触发同步。 | Fail-closed 安全行为 | 待回写 `docs/architecture/site-runtime-kit.md` |
| 2026-06-13 | Phase 1 credential bundle 可以内部包含 webhook signing secret；长期模型允许 webhook signing secret 与 clientSecret 分离并独立轮换。 | Credential 模型、webhook 安全演进 | 待回写 `docs/architecture/site-control-plane.md` 与 `docs/architecture/site-runtime-kit.md` |
| 2026-06-13 | Sync Engine 同步失败时不得推进 `publish_state`，必须记录 failed `sync_run`，并继续用旧本地数据服务读取流量。 | Sync failure、stale read | 待回写 `docs/architecture/site-runtime-kit.md` |
| 2026-06-13 | 读取路径允许短时间 stale；写入请求和最终价格/库存/订单校验不得信任 stale 本地数据，必须通过 OES 受控写入或 final validation 边界处理。 | Stale data 策略、写入边界 | 待回写 `docs/architecture/site-runtime-kit.md` 与后续 Site Ingress 设计 |
| 2026-06-13 | Snapshot 兜底条件包括首次无本地数据、delta 不可用、delta 应用失败、Local Published Store 校验失败或管理员手动 rebuild。 | Snapshot fallback、恢复策略 | 待回写 `docs/architecture/site-runtime-kit.md` |
| 2026-06-13 | Phase 1 只做进程内并发同步保护：同步中收到新的 webhook 或 pull trigger 时不启动第二个 sync，只标记 `pendingSync`，当前同步完成后再执行一次 `syncToLatest()`。 | 并发控制、反过度设计 | 待回写 `docs/architecture/site-runtime-kit.md` |
| 2026-06-13 | Runtime health 至少区分 `healthy`、`degraded`、`blocked`、`failed`：OES 暂不可用或最近同步失败为 degraded，site disabled / credential revoked 为 blocked，Local Published Store 不可用为 failed。 | Health Check、运维状态 | 待回写 `docs/architecture/site-runtime-kit.md` |
| 2026-06-13 | Phase 1 NestJS 集成采用 `OesSiteRuntimeModule.forRootFromEnv()` 作为默认接入方式，从环境变量读取 `OES_SITE_CREDENTIAL` 与本地 runtime 配置并初始化 runtime。 | NestJS Integration、开发体验 | 待回写 `docs/architecture/site-runtime-kit.md` |
| 2026-06-13 | 站点后端默认只需配置 `OES_SITE_CREDENTIAL` 与 `OES_SITE_STORE_PATH`；pull interval 等本地运行配置可通过环境变量或 module options 覆盖。 | Runtime config、部署配置 | 待回写 `docs/architecture/site-runtime-kit.md` |
| 2026-06-13 | `OesSiteRuntimeModule` 默认注册 `OesSiteRuntimeService`，并默认提供 webhook endpoint、health endpoint 与 pull fallback；内置 controller / scheduler 可关闭以支持特殊部署。 | NestJS module 边界、默认能力 | 待回写 `docs/architecture/site-runtime-kit.md` |
| 2026-06-13 | 站点业务代码通过注入 `OesSiteRuntimeService` 使用 `publicViews`、`sync`、`health` 等能力，不直接创建零散 client 或自行实现 webhook/sync/health。 | 站点开发规范、SDK 使用边界 | 待回写 `docs/architecture/site-runtime-kit.md` |
| 2026-06-13 | Phase 1 区分 health endpoints 与 OES runtime status endpoint：`/health/live` 与 `/health/ready` 服务部署系统和基础监控，返回精简状态；`/api/oes/runtime-status` 服务 OES Site Control Plane，返回详细 runtime 状态。 | Health Check、OES 站点管理 | 待回写 `docs/architecture/site-runtime-kit.md` |
| 2026-06-13 | `runtime-status` 必须通过 OES 签名或等效机制保护，不应作为公开匿名接口；它可返回 localPublishVersion、lastKnownRemotePublishVersion、last sync 状态、storeReady、syncInProgress、pendingSync、kitVersion 等管理信息。 | Runtime status 安全、站点巡检 | 待回写 `docs/architecture/site-runtime-kit.md` 与后续 contracts |
| 2026-06-13 | `/health/live` 只表达进程存活；`/health/ready` 只表达是否适合接流量，不承载完整站点治理信息。OES 管理页面需要的详细状态走 `runtime-status`。 | Health 语义边界、反信息泄露 | 待回写 `docs/architecture/site-runtime-kit.md` |
| 2026-06-13 | `@oes/site-runtime-kit` P1 只交付站点运行时基础框架与本地 public view 读取能力：Runtime Kernel、Config / Credential、Signed OES Client、Webhook Verifier、Sync Engine、Local Published Store、SQLite store、`runtime.publicViews`、NestJS Integration、health endpoints、runtime-status、基础 Error / Retry / Idempotency。 | P1 范围冻结 | 待回写 `docs/architecture/site-runtime-kit.md` |
| 2026-06-13 | P1 public view 读取只覆盖 products、categories、contents、blogs、news；price、inventory、inquiry、draft order、final validation、customer account、dealer portal、payment / checkout、search engine、Redis cache、Postgres/Mongo store、多框架 adapter、CDN purge、credential rotation automation、分布式 lock 均后置。 | P1 排除范围、路线图 | 待回写 `docs/architecture/site-runtime-kit.md` 与后续 roadmap |
| 2026-06-13 | Inquiry submission 明确后置到 P2，不进入 P1 或 P1.5；P1 保持纯基础框架与 public view read，不包含业务写入能力。 | 业务写入分期、Site Ingress 后置 | 待回写 `docs/architecture/site-runtime-kit.md` 与后续 Site Ingress 设计 |
| 2026-06-14 | OES 侧 P1 服务命名收敛为 `site-service`，只服务 OES 自有 / 自控外部站点体系，例如 brand site、B2B inquiry site、B2C site、dealer portal、regional site。 | OES 侧服务命名、服务边界 | 待回写未来 `docs/architecture/services/site-service.md` 与 `docs/architecture/site-control-plane.md` |
| 2026-06-14 | 当前不抽象为 `external-touchpoint-service`，也不把 Amazon / 1688 / 淘宝 / 京东、IM、Email、社媒或第三方 marketplace connector 纳入 `site-service`。第三方电商渠道后续应独立设计 e-commerce / marketplace 相关服务。 | 反过度抽象、未来服务边界 | 待回写未来 ADR / service truth source |
| 2026-06-14 | 未来站点支持下单时，`site-service` 只提供 site / region / channel / policy / public view 上下文，不拥有订单、库存、价格、客户、询盘等核心业务真相；订单写入应经 Site Ingress 进入 Sales / Order / WMS / Pricing / CRM 等 OES Core 服务。 | 未来 commerce 边界、业务真相归属 | 待回写未来 `site-service` 与 commerce collaboration 设计 |
| 2026-06-14 | `site-service` 服务职责卡已回写到 `docs/architecture/services/site-service.md`，作为服务职责、核心对象与 owner 边界唯一稳定真相源。 | 服务职责真相源 | `docs/architecture/services/site-service.md` |
| 2026-06-14 | P1 由 `api-gateway` 承载 Admin BFF 与 Site-facing BFF / Site API 两类 HTTP 入口；外部 Site Runtime 不直接调用 `site-service`。 | Gateway / site-service 协作边界 | 待回写 `docs/architecture/site-runtime-architecture.md` 与后续 contracts |
| 2026-06-14 | `api-gateway` 负责 DTO 校验、HTTP 错误模型、operator / site caller context、trace、rate limit 与签名校验前置；`site-service` 负责 credential / site status / scope 的最终真相判定、发布状态与审计。 | 入口层职责、授权真相边界 | 待回写 `docs/architecture/site-runtime-architecture.md` 与后续 contracts |
| 2026-06-14 | Site-facing signed request 使用双层安全模型：gateway 做 HMAC / timestamp / nonce 前置校验，`site-service` 做 credential、site status、scope 的最终真相判定与审计。 | Site API 安全模型 | 待回写后续 contracts |
| 2026-06-15 | `site-service` P1 操作者流程冻结：Site Management 采用卡片式站点工作台，站点详情包含 Overview、Products、Blog / News、Locales、Sync、Settings、Credentials、Audit。 | OES Admin、site-service P1 范围 | 已回写 `docs/architecture/services/site-service.md` |
| 2026-06-15 | P1 不引入 template、page builder、archive；Blog / News 是站点私有内容，采用固定字段与多语言 locale versions。 | 内容模型、反过度设计 | 已回写 `docs/architecture/services/site-service.md` |
| 2026-06-15 | Products Tab 默认展示已经加入当前站点的 `SiteProductPublication`；`Add Products` 才从 Product Master 选择产品加入站点。 | 产品发布操作心智、产品主数据边界 | 已回写 `docs/architecture/services/site-service.md` |
| 2026-06-15 | 站点语言采用生命周期模型：`preparing` / `active` / `disabled`；active 语言参与完整性检查，新增语言先 preparing，完整后通过全量同步上线。 | 多语言、SEO、同步完整性 | 已回写 `docs/architecture/services/site-service.md` |
| 2026-06-15 | 保存草稿或站点展示配置只形成 pending sync；显式 Sync 才生成 / 更新 public views、推进 publishVersion 并通知 Site Runtime。 | 同步语义、webhook 触发 | 已回写 `docs/architecture/services/site-service.md` 与 `docs/architecture/site-runtime-architecture.md` |
| 2026-06-15 | 每个站点每次同步批次最多发送一次 `site.publish.available` webhook；无变更站点跳过，不生成新版本，不发送 webhook。 | Sync batch、webhook、运行时同步 | 已回写 `docs/architecture/services/site-service.md` 与 `docs/architecture/site-runtime-architecture.md` |
| 2026-06-15 | Preview P1 采用保存草稿后生成短时 previewToken，由 Site Runtime 使用 SDK 调 OES Preview API 拉 draft preview view 并真实渲染；预览不写正式 store、不生成 publishVersion、不触发 webhook。 | 预览、安全、站点真实渲染 | 已回写 `docs/architecture/services/site-service.md` |
| 2026-06-15 | External Site Integration P1 共享 contracts 已冻结到 `docs/contracts/site-service/**`，覆盖 security/signing、sync API、public views、preview/runtime-status、Admin BFF。 | contracts、implementation readiness | 已冻结 |

## 5. 推荐但未完全冻结决定

| 日期 | 推荐决定 | 待确认点 | 下一步 |
| --- | --- | --- | --- |
| 2026-06-12 | 业务能力模块后置；P1 只覆盖 Product / Category / Content / Blog / News public view read，Inquiry 进入 P2，Draft Order / Final Validation 更后置。 | 业务模块路线图。 | 后续设计 P2 时冻结。 |

## 5.1 设计阶段顺序

### Stage 1: 冻结 `@oes/site-runtime-kit` P1

目标：

- 冻结站点侧统一 runtime kit 的 Phase 1 架构。
- 只设计基础框架能力，不进入具体业务服务实现。

待冻结设计块：

- Config / Credential
- Signed OES Client
- Webhook Verifier
- Sync Engine failure behavior
- NestJS Integration
- Health Check
- P1 include / exclude list

完成标准：

- 能明确回答这个包是什么、不是什么。
- 能明确 Phase 1 包含哪些基础能力。
- 能明确 Site Runtime 如何通过 NestJS 接入。
- 能明确哪些业务能力后置。

### Stage 2: 冻结 OES 侧高层架构

目标：

- 从整体架构、部署边界、服务边界与治理职责开始设计 OES 侧能力。
- 不直接进入 API 字段设计。

待冻结设计块：

- `site-service` 的 Phase 1 服务职责与不负责范围。
- Site Publish / Sync 与 Core services 的关系。
- Site-facing BFF / Site API 与 api-gateway 的关系。
- Site Ingress 与内部 CRM / Sales / Order 等服务的边界。
- Credential / Scope / Audit 的归属。

完成标准：

- OES 侧模块职责清晰。
- 服务边界与部署阶段清晰。
- 能判断哪些能力第一阶段作为模块实现，哪些后续可服务化。
- `site-service` 服务职责卡已回写到 services truth source。

### Stage 3: 冻结 OES Site API / Contract

目标：

- 在 Stage 1 与 Stage 2 均冻结后，再设计具体外部站点契约。

待冻结设计块：

- latest state API
- changed resources API
- batch get publish views API
- snapshot API
- webhook payload / headers
- inquiry submission API
- credential rotation API

完成标准：

- contracts 可以进入 `docs/contracts/**`。
- feature packet 可以进入 `docs/plans/features/**`。
- 仍不进入生产代码，直到设计被明确批准。

## 6. 开放问题

| 日期 | 问题 | 为什么未冻结 | 下一步 |
| --- | --- | --- | --- |
| 2026-06-15 | `@oes/site-runtime-kit` P1 与 `site-service` P1 implementation plan 尚未建立。 | 架构、feature packet、contracts 均已冻结，但还没有可交给实现线程的执行计划。 | 下一步分别编写两个 implementation goal / plan。 |

## 7. 真相源回写计划

- 架构总览：
  - `docs/architecture/site-runtime-architecture.md`
- Site Control Plane：
  - 待建 `docs/architecture/site-control-plane.md`
- 服务职责：
  - 已回写 `docs/architecture/services/site-service.md`
- Site Runtime Kit：
  - 已回写 `docs/architecture/site-runtime-kit.md`
- 架构取舍 ADR：
  - 待建 `docs/adr/0009-distributed-site-runtime-and-runtime-kit.md` 或按现有 ADR 编号顺延
- contracts：
  - 已建立 `docs/contracts/site-service/**`
- feature packet：
  - 已回写 `docs/plans/features/external-site-integration-p1.md`

## 8. 恢复入口

下次继续前先读：

- `docs/plans/designs/external-site-runtime-kit-design.md`
- `docs/architecture/site-runtime-architecture.md`
- `docs/architecture/11-gateway-and-bff-architecture.md`
- `docs/architecture/14-grpc-metadata-and-service-trust-architecture.md`

当前推荐下一步：

- 分别准备 `@oes/site-runtime-kit` P1 与 `site-service` P1 的实现线程 goal prompt / implementation plan。
- 暂不进入生产代码实现。
- contracts 设计时必须保持 `site-service` 服务真相源唯一性，不重新定义服务边界。
