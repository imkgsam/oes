# OES Site Runtime Kit 架构

## 1. 文档目的

本文用于冻结 `@oes/site-runtime-kit` 的 Phase 1 架构设计。

`@oes/site-runtime-kit` 是所有外部 Site Runtime 后端必须使用的官方运行时包。它不是普通 API SDK，而是同时包含：

- OES Site API SDK
- 轻量 Site Runtime Framework
- 安全通信能力
- webhook 校验能力
- 发布同步能力
- 本地 public view store
- NestJS 集成能力

本文只冻结站点侧 runtime kit 的 P1 设计，不定义 OES Site Control Plane、Site Publish / Sync、Site Ingress API 的完整服务边界。OES 侧能力后续应先从高层架构继续冻结，再进入 API / contract 细节。

## 2. 核心定位

`@oes/site-runtime-kit` 的职责是让外部站点后端以统一、安全、可治理的方式连接 OES。

它负责：

- 解析站点 credential
- 初始化站点 runtime
- 通过签名 client 调用 OES Site-facing BFF / Site API
- 校验 OES 发来的 webhook
- 执行 `syncToLatest()`
- 将 OES 发布的 public view 写入本地 store
- 为 Site Runtime 提供 `runtime.publicViews` 本地读取层
- 提供 NestJS 默认接入模块
- 提供 health 与 runtime status 能力

它不负责：

- OES Core 内部业务真相
- 站点页面设计
- 价格 / 库存最终校验
- 询盘 / 订单写入
- 客户账号、经销商门户、支付结算
- 搜索引擎、CDN purge、复杂缓存平台

外部站点不得绕过 `@oes/site-runtime-kit` 直接调用 OES Core 内部 API。

## 3. P1 范围

P1 只交付站点运行时基础框架与本地 public view 读取能力。

P1 包含：

- Runtime Kernel
- Config / Credential
- Signed OES Client
- Webhook Verifier
- Sync Engine
- Local Published Store
- SQLite Published Store
- `runtime.publicViews`
- NestJS Integration
- Health endpoints
- Runtime status endpoint
- 基础 Error / Retry / Idempotency

P1 public view 读取只覆盖：

- products
- categories
- contents
- blogs
- news

P1 明确不包含：

- price public view
- inventory public view
- inquiry submission
- draft order
- final price / inventory validation
- customer account
- dealer portal
- payment / checkout
- search engine
- Redis cache
- Postgres / Mongo store
- 多框架 adapter
- CDN purge integration
- credential rotation automation
- 多实例分布式 lock

Inquiry submission 明确后置到 P2，不进入 P1 或 P1.5。

## 4. Runtime Kernel

`Runtime Kernel` 是 `@oes/site-runtime-kit` 的装配中心。

默认入口：

```ts
createSiteRuntimeFromEnv()
```

高级入口：

```ts
createSiteRuntime({...})
```

默认站点接入不要求手动配置多个字段。`createSiteRuntime({...})` 只用于测试、特殊部署或未来多 credential 场景。

站点后端通过 Runtime 实例使用能力：

```ts
runtime.publicViews
runtime.sync
runtime.client
runtime.health
runtime.store
```

底层工具函数可以暴露给高级场景，但不是默认接入方式。

## 5. Config / Credential

默认开发体验采用单个环境变量：

```text
OES_SITE_CREDENTIAL
```

`OES_SITE_CREDENTIAL` 是 OES Site Control Plane 生成的 credential bundle，不是简单裸 API key。对站点开发者表现为一个配置项，对 kit 内部保持结构化身份、签名密钥、endpoint 与环境信息。

kit 内部从 credential bundle 解析：

- `siteId`
- `clientId`
- `clientSecret`
- `credentialId`
- `webhookSigningSecret`，Phase 1 可与 client secret 同源，长期允许分离
- `oesBaseUrl`
- `environment`

配置模型分为三层：

1. Credential bundle  
   只负责身份、签名与连接 OES。
2. OES-managed site config  
   由 Site Control Plane 管理，并由 runtime 启动握手获取。
3. Local runtime config  
   只保存站点服务器本地运行环境配置。

OES 能统一治理的配置，不应要求站点本地手写。与站点服务器运行环境绑定的配置，保留在 Site Runtime 本地配置。

站点本地配置示例：

```text
OES_SITE_CREDENTIAL=...
OES_SITE_STORE_PATH=./data/site-runtime.sqlite
```

可选本地配置包括：

- SQLite store path
- pull fallback interval
- log level
- NestJS module options

## 6. Signed OES Client

`Signed OES Client` 是 kit 内部唯一允许访问 OES Site-facing API 的通道。

所有站点到 OES 的请求必须经过它：

- sync
- snapshot rebuild
- batch get publish views
- future ingress clients
- future credential/status handshake

P1 采用 HMAC-SHA256 request signing。

签名基于 canonical request，至少包含：

- method
- path
- normalized query
- body hash
- timestamp
- nonce
- siteId
- clientId
- credentialId

每次请求必须携带：

```text
x-oes-site-id
x-oes-client-id
x-oes-credential-id
x-oes-timestamp
x-oes-nonce
x-oes-signature
x-oes-request-id
x-oes-trace-id
```

OES 侧必须校验：

- site 状态
- client 状态
- credential 状态
- signature
- timestamp 时间窗
- nonce 重放
- scope
- rate limit

以下情况必须 fail closed：

- timestamp 过期
- nonce 重放
- 签名错误
- credential revoked
- site disabled
- scope 不足

默认只重试：

- 网络超时
- 502 / 503 / 504
- 遵守 `Retry-After` 的 429

不重试：

- 401 / 403
- signature invalid
- credential revoked
- site disabled
- scope insufficient
- validation error
- 业务拒绝

写入类请求必须使用 idempotency key。P1 不包含业务写入能力，但该规则作为基础 client 设计约束保留。

Signed Client 统一映射错误类型，例如：

- auth error
- scope error
- site disabled
- credential revoked
- rate limit
- network error
- validation error
- server error

`site disabled` / `credential revoked` 应使 runtime 进入明确 `blocked` 状态。

## 7. Webhook Verifier

`Webhook Verifier` 是 OES -> Site Runtime 通知的安全入口。

Webhook 只通知事件，不传完整业务数据。

`site.publish.available` webhook 只触发：

```text
syncToLatest()
```

站点不要求同步到 webhook 中提示的指定 publishVersion。

Webhook 必须基于 HMAC canonical request 验签，并校验：

- siteId
- timestamp
- nonce
- eventId
- eventType

Webhook 通过 `webhook_events` 做幂等去重。

以下情况必须拒绝请求，且不得触发同步：

- 验签失败
- timestamp 过期
- nonce 重放
- eventId 异常
- siteId 不匹配

Phase 1 credential bundle 可以内部包含 webhook signing secret。长期模型允许 webhook signing secret 与 clientSecret 分离并独立轮换。

## 8. Sync Engine

`Sync Engine` 负责把 OES 发布的 public view 同步到 Site Runtime 本地。

P1 默认只执行：

```text
syncToLatest()
```

webhook 只是唤醒信号。Site Runtime 不提供拉取指定 publishVersion 的站点能力。

同步主流程：

```text
webhook / pull fallback
  ↓
syncToLatest()
  ↓
查询 latestVersion
  ↓
获取 localVersion -> latestVersion 的 changed resource list
  ↓
批量拉取 changed resources 的最新 publish view
  ↓
写入 Local Published Store
  ↓
更新 publish_state
```

Delta P1 定义为：

```text
from localVersion to latestVersion 的聚合 changed resource list
```

Delta 不承载完整业务数据，也不作为业务动作日志。

同一资源在版本区间内多次变化时，只同步最终最新 view。

下架、隐藏、删除等外部展示变化统一表达为 publish view 的 `status` 变化。同步层可以写入非 `published` 状态，`runtime.publicViews` 展示读取层默认只返回 `status = published` 的资源。

同步失败时：

- 不得推进 `publish_state`
- 必须记录 failed `sync_run`
- 继续用旧本地数据服务读取流量

读取路径允许短时间 stale。写入请求和最终价格 / 库存 / 订单校验不得信任 stale 本地数据，必须通过 OES 受控写入或 final validation 边界处理。

Snapshot 兜底条件：

- 首次无本地数据
- delta 不可用
- delta 应用失败
- Local Published Store 校验失败
- 管理员手动 rebuild

P1 只做进程内并发同步保护：

- 同步中收到新的 webhook 或 pull trigger 时不启动第二个 sync
- 只标记 `pendingSync`
- 当前同步完成后再执行一次 `syncToLatest()`

不设计 Redis lock、DB lock 或多实例分布式 lock。

## 9. Local Published Store

`Local Published Store` 是 Site Runtime 本地 published data 的持久化边界。

它保存两类数据：

1. Runtime metadata
2. Published business data

P1 采用接口 + 默认实现模式。上层使用统一 `runtime.store`，底层只实现 SQLite。未来可增加：

- Postgres implementation
- MongoDB implementation
- File implementation

P1 不把 cache 设计为独立核心 adapter。业务公开数据进入 `Local Published Store`，页面级缓存由站点渲染层、CDN、Nginx 或后续站点框架能力处理。

P1 数据结构采用 metadata 表独立 + 通用业务资源表。

Runtime metadata：

- `publish_state`
- `sync_runs`
- `webhook_events`

Published business data：

- `published_resources`

`published_resources` 至少表达：

- `siteId`
- `resourceType`
- `resourceId`
- `slug`
- `locale`
- `status`
- `publishVersion`
- `payloadJson`
- `updatedAt`

`resourceType` P1 覆盖：

- product
- category
- content
- blog
- news

P1 不为 product、blog、news 等资源提前建立复杂专用表。后续只有在筛选、搜索或性能需求明确后，再引入 resource-specific read model 或索引表。

## 10. Public Views

P1 必须提供：

```text
runtime.publicViews
```

Storefront Frontend 不直接读 `published_resources`，而是通过 Site Runtime API / SSR 间接消费 `runtime.publicViews`。

读取路径：

```text
Storefront Frontend
  ↓
Site Runtime API / SSR
  ↓
runtime.publicViews
  ↓
runtime.store
  ↓
published_resources
```

P1 支持：

- `runtime.publicViews.products`
- `runtime.publicViews.categories`
- `runtime.publicViews.contents`
- `runtime.publicViews.blogs`
- `runtime.publicViews.news`

默认展示读取只返回：

```text
status = published
```

price 与 inventory 后置到业务增强阶段。

### 10.1 Slug 规则

`slug` 是站点公开 URL 标识。

它由 OES Site Control Plane / Publish View 管理并同步到 Site Runtime。站点侧消费结果，不自行决定 slug。

唯一性范围：

```text
siteId + resourceType + locale
```

同一 OES 内部资源在不同站点或不同 locale 下可以有不同 slug。

### 10.2 Local SEO Data Helpers

Site Runtime 可以向 Storefront 提供本地 SEO 数据 helper / API，用于生成 sitemap、robots、canonical、hreflang 和页面 head 所需的公开数据。

P1 推荐的本地读取能力包括：

- public-safe site config，例如 public base URL、default locale、active locales、preview indexing policy。
- local SEO route index，例如 resource type、slug、locale、canonical URL、updatedAt、status。
- published resource read APIs，供 SSR / server routes 从本地 published data 取公开页面数据。

约束：

- 这些能力必须读取 Local Published Store 与 public-safe site config。
- 正常公开 SEO 渲染不得实时调用 OES Core 或 OES Site-facing API。
- public site config 不得暴露 credential、secret、签名材料、nonce、内部 endpoint 或 runtime status 细节。
- route index 只包含当前 site、当前 active locale、`status = published` 的公开路由；preparing / disabled locale 不得进入 sitemap 或 hreflang。
- P1 不把 route index 扩展为 CMS、page builder、导航 contract 或生产 CDN contract。
- 若后续需要跨站强 contract，应在 `docs/contracts/**` 单独冻结；本节只冻结 runtime-kit P1 的本地 helper 架构边界。

## 11. NestJS Integration

P1 官方优先支持 NestJS 接入方式。

默认接入：

```ts
@Module({
  imports: [
    OesSiteRuntimeModule.forRootFromEnv(),
  ],
})
export class AppModule {}
```

默认环境变量：

```text
OES_SITE_CREDENTIAL=...
OES_SITE_STORE_PATH=./data/site-runtime.sqlite
```

`OesSiteRuntimeModule` 默认注册：

- `OesSiteRuntimeService`
- webhook endpoint
- health endpoints
- runtime-status endpoint
- pull fallback

内置 controller / scheduler 可关闭，以支持特殊部署。

站点业务代码通过注入 `OesSiteRuntimeService` 使用：

- `publicViews`
- `sync`
- `health`

站点业务代码不直接创建零散 client，也不自行实现 webhook / sync / health。

P1 底层可保留标准 HTTP handler 形态，但不优先建设 Next.js / Express / Fastify 多 adapter 体系。

## 12. Health 与 Runtime Status

P1 区分 health endpoints 与 OES runtime status endpoint。

### 12.1 Health Endpoints

`/health/live` 服务部署系统和基础监控，只表达进程存活。

`/health/ready` 服务部署系统和负载均衡，只表达是否适合接流量，不承载完整站点治理信息。

### 12.2 Runtime Status

`/api/oes/runtime-status` 服务 OES Site Control Plane，用于 OES 站点管理页面展示详细 runtime 状态。

该 endpoint 必须通过 OES 签名或等效机制保护，不应作为公开匿名接口。

可返回：

- `siteId`
- `runtimeStatus`
- `localPublishVersion`
- `lastKnownRemotePublishVersion`
- `lastSuccessfulSyncAt`
- `lastSyncStatus`
- `lastErrorCode`
- `storeReady`
- `syncInProgress`
- `pendingSync`
- `kitVersion`

Runtime health 至少区分：

- `healthy`
- `degraded`
- `blocked`
- `failed`

语义：

- OES 暂不可用或最近同步失败：`degraded`
- site disabled / credential revoked：`blocked`
- Local Published Store 不可用：`failed`

Health 与 runtime status 不得暴露：

- secret
- credential bundle
- signature
- nonce
- 完整错误堆栈

## 13. P1 后置能力

以下能力后置：

- Inquiry submission：P2
- Site Ingress write clients：P2+
- price / inventory public view：P2+
- draft order / final validation：P2+
- customer account / dealer portal：P3+
- Redis cache：按真实性能需求引入
- Postgres / Mongo store：按站点规模引入
- 多框架 adapter：按真实站点技术栈需求引入
- CDN purge integration：SEO / cache hardening 阶段引入
- credential rotation automation：安全 hardening 阶段引入
- 分布式 lock：多实例 Site Runtime 阶段引入

## 14. 实施前置条件

进入实现前，必须先继续冻结 OES 侧高层架构：

- Site Control Plane 是 OES 模块还是独立服务
- Site Publish / Sync 与 Core services 的关系
- Site-facing BFF / Site API 与 api-gateway 的关系
- Credential / Scope / Audit 的归属
- OES 如何生成 credential bundle
- OES 如何生成 site-specific public view
- OES 如何提供 latest state、changed resources、batch get views、snapshot、webhook dispatch

OES 侧设计应先讨论整体架构与部署 / 服务边界，不应直接进入 API 字段细节。

## 15. 明确拒绝

P1 明确拒绝：

- 只提供普通 HTTP SDK，不提供 runtime framework
- 站点开发者手写签名逻辑
- 站点开发者手写 webhook 验签逻辑
- 站点直接调用 OES Core 内部 API
- Storefront Frontend 直接读取 Local Published Store
- P1 引入复杂插件系统
- P1 同时实现多个 store backend
- P1 实现 inquiry / order 等业务写入
- P1 把 health endpoint 当作 OES 管理状态详情接口

## 16. 冻结状态

`@oes/site-runtime-kit` P1 架构已冻结为：

```text
站点运行时基础框架
+ 本地 public view 读取能力
+ NestJS 默认接入
+ SQLite Local Published Store
+ 双向签名通信安全基线
+ webhook + pull fallback 同步基线
```

后续若要进入实现，应先创建 feature packet，并在 OES 侧高层架构冻结后再拆分具体任务。
