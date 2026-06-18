# site-service 职责卡

## 1. Purpose

`site-service` 是 OES 自有 / 自控外部站点治理与发布服务，负责回答：

- 哪些外部站点由 OES 管理。
- 每个站点支持哪些语言、域名、凭证和运行时通信配置。
- 哪些产品、Blog、News 被加入某个站点。
- 每个站点的公开展示数据何时同步给 Site Runtime。
- Site Runtime 同步到什么版本、是否健康、是否需要处理。

`site-service` 不是集中式实时网站渲染后端。外部网站页面仍由各自 Site Runtime 使用本地 published data 渲染。

本服务只面向 OES 自有或自控站点体系，例如 brand site、B2B inquiry site、B2C site、dealer portal、regional site。

## 2. Operator Model

OES Admin 中的主要入口是 `Site Management` 卡片式站点工作台。

站点详情页 P1 包含：

- `Overview`
- `Products`
- `Blog / News`
- `Locales`
- `Sync`
- `Settings`
- `Credentials`
- `Audit`

主要操作心智：

- 站点是运营核心对象。
- `Products` 默认展示已经加入当前站点的产品发布清单。
- `Add Products` 才从产品主数据中选择产品加入站点。
- Blog / News 是站点私有内容，不做跨站点共享发布。
- 保存草稿或配置只标记待同步，不通知站点。
- `Sync` 才生成 public view、推进站点版本并 webhook 通知 Site Runtime。
- 预览通过站点真实 preview 页面完成，但不进入正式同步链路。

## 3. Owns

### 3.1 Site

站点根对象。

P1 建议字段：

- `siteId`
- `siteCode`
- `siteName`
- `siteType`
- `brandId`
- `regionCode`
- `channelCode`
- `status`: `draft` / `active` / `disabled`
- `defaultLocale`
- `primaryDomain`
- `previewBaseUrl`
- `allowedOrigins`
- `webhookUrl`
- `runtimeStatusUrl`

P1 不单独拆复杂 `SiteDomain`、`SiteRuntimeEndpoint`、`SiteBrandBinding`。后续出现多域名、多区域 runtime、多品牌复杂绑定时再拆。

### 3.2 SiteLocale

站点语言生命周期。

- `siteId`
- `locale`
- `status`: `preparing` / `active` / `disabled`
- `isDefault`

规则：

- 每个站点必须有且只有一个 default locale。
- default locale 必须是 `active`。
- P1 不支持更换 default locale。
- `preparing` 语言只在 OES 内部准备，不公开。
- `active` 语言参与同步完整性检查。
- `disabled` 语言不公开展示。

新增语言流程：

```text
Add Locale
  ↓
preparing
  ↓
补全 products / blogs / news / categories 的 locale view
  ↓
完整性检查通过
  ↓
Activate Locale
  ↓
生成该语言全量 public views
  ↓
Site Runtime 同步成功
  ↓
active
```

### 3.3 SiteCredential

站点后端访问 OES Site API 的凭证。

- `siteId`
- `clientId`
- `credentialId`
- secret / key metadata
- scopes
- status
- created / rotated / revoked metadata
- last used metadata

P1 站点后端通过单个环境变量接入：

```text
OES_SITE_CREDENTIAL
```

该 bundle 对站点开发者表现为一个配置项，对 `@oes/site-runtime-kit` 内部保持结构化身份、签名密钥、endpoint 与环境信息。

P1 scopes：

- `site:read`
- `site:sync`
- `site:preview`
- `site:status`

凭证只允许站点后端持有，禁止放入 Storefront Frontend。

### 3.4 SiteProductPublication

某个产品加入某个站点后的发布配置。

产品主数据真相不属于 `site-service`，属于 product / item master / PIM 相关服务。

`site-service` 只拥有站点展示配置，例如：

- `siteId`
- `productId`
- `locale`
- `slug`
- `displayTitle`
- `displayDescription`
- `seoTitle`
- `seoDescription`
- `seoImage`
- `imageOverride`
- publish status
- sync status

规则：

- `Products` Tab 默认基于 `SiteProductPublication` 展示已加入当前站点的产品。
- `Add Products` 才查询 Product Master 选择未加入产品。
- 同一个产品在不同站点、不同语言可以有不同 slug、标题、描述与 SEO。
- `siteId + resourceType + locale + slug` 必须唯一。
- active 语言必须完整才允许同步。
- 产品 public view 由产品主数据公开字段与站点展示配置合成。
- 产品 public view 可以引用当前站点定义的 category id；这些 category id 属于外部站点公开分类体系，不要求等同于 item-master 内部分类。

### 3.5 SiteCategoryDefinition

外部站点公开分类定义。

P1 分类是 site-defined taxonomy。不同站点可以有不同分类树、分类名、slug、排序和 SEO；`site-service` 在外部站点治理边界内拥有该站点公开分类定义与发布输出，不把 item-master 内部 category projection 暴露为外部站点 contract。

建议字段：

- `siteId`
- `categoryId`
- `locale`
- `parentCategoryId`
- `slug`
- `displayTitle`
- `description`
- `image`
- `sortOrder`
- `seoTitle`
- `seoDescription`
- `seoImage`
- publish status
- sync status

规则：

- `CategoryPublicView` P1 source 是当前站点定义的 category data。
- Storefront 与 Site Runtime 只消费当前站点已发布的 category public views，不关心分类内部来源或是否参考过 item-master。
- ProductPublicView 可以通过 `category_ids` 引用当前站点定义的 category id。
- P1 不引入完整 PIM、CMS、taxonomy platform 或跨站共享分类治理。
- 若后续需要从 item-master、PIM 或其他分类源辅助生成站点分类，必须通过 `site-service` 防腐与发布模型转成 site-defined public category，不改变 Site Runtime contract。

### 3.6 SiteContentEntry

站点私有 Blog / News 内容。

P1 不做跨站点内容共享，不做完整 CMS，不做 template，不做 page builder，不做 archive。

建议拆分：

- `SiteContentEntry`: 内容逻辑记录，包含 `siteId`、`contentType`、整体状态。
- `SiteContentLocaleVersion`: 某语言版本，包含标题、slug、摘要、封面、作者、标签、正文富文本、SEO、状态与同步状态。

固定字段：

- `title`
- `slug`
- `summary`
- `coverImage`
- `author`
- `tags`
- `bodyRichText`
- `seoTitle`
- `seoDescription`
- `seoImage`
- `publishedAt`

规则：

- Blog / News 属于某个 site。
- 多语言站点中，同一篇内容有多个 locale 版本。
- active 语言必须完整才允许同步。
- 不想公开展示时走 `Unpublish`。

### 3.7 SitePublicView

站点 runtime 同步用的公开数据，不是编辑源数据。

P1 类型：

- `ProductPublicView`
- `CategoryPublicView`
- `BlogPublicView`
- `NewsPublicView`

统一外壳：

- `siteId`
- `resourceType`
- `resourceId`
- `locale`
- `slug`
- `status`
- `publishVersion`
- `payload`

站点 runtime 本地可以统一保存到 `published_resources`，但 OES 端编辑与发布模型不得只依赖一个大 `payloadJson`。

分类发布规则：

- `CategoryPublicView` 由 `SiteCategoryDefinition` 生成。
- `CategoryPublicView` 不暗示分类必然来自 item-master category projection。
- `ProductPublicView.category_ids` 引用的是当前站点公开分类 id。

### 3.8 SiteSyncBatch

一次显式同步动作。

- `siteId`
- `syncId`
- `publishVersion`
- status
- resource count
- triggered by
- started / completed metadata

每个 batch 包含多个 `SiteSyncResource`：

- `resourceType`
- `resourceId`
- `locale`
- `changeType`: `create` / `update` / `unpublish` / `locale_activate` / `locale_disable`

规则：

- 保存只产生 pending sync。
- 同步才生成 / 更新 public views。
- 无变更不生成版本、不发 webhook。
- 每个站点每次同步最多发送一次 webhook。
- Site Runtime 收到 webhook 后 `syncToLatest()`。

### 3.9 SiteWebhookEndpoint

P1 可先以 `Site.webhookUrl` 表达，概念上负责 OES 通知站点 runtime 有新版本可拉取。

默认事件：

```text
site.publish.available
```

Webhook 只通知，不携带完整业务数据，也不携带 changed resource list。

### 3.10 SiteRuntimeStatus

OES 看到的站点运行与同步状态。

典型信息：

- local publish version
- latest known OES publish version
- last sync status
- last sync time
- runtime kit version
- store status
- recent error
- status: `healthy` / `degraded` / `blocked` / `failed` / `unknown`

来源可以是：

- Site Runtime 主动上报。
- OES 通过受保护 runtime status endpoint 查询。

### 3.11 SiteAuditLog

站点治理与同步审计事实。

P1 至少记录：

- `site.created`
- `site.updated`
- `site.disabled`
- `locale.added`
- `locale.activated`
- `locale.disabled`
- `credential.generated`
- `credential.rotated`
- `credential.revoked`
- `product.added_to_site`
- `product.updated_for_site`
- `product.unpublished_from_site`
- `category.created`
- `category.updated`
- `category.unpublished`
- `content.created`
- `content.updated`
- `content.unpublished`
- `sync.started`
- `sync.completed`
- `sync.failed`
- `webhook.sent`
- `webhook.failed`
- `runtime.status_reported`

P1 不做复杂审计回放。

## 4. Does Not Own

- 产品 / 物料主数据真相。
- 价格真相。
- 库存真相。
- 客户真相。
- 询盘真相。
- 订单真相。
- 支付、收款、发票真相。
- 仓库分配、发货、履约真相。
- 完整 CMS 与页面搭建器。
- Storefront Frontend 页面渲染。
- Site Runtime 本地 SQLite / Local Published Store。
- Amazon / 1688 / 淘宝 / 京东等第三方 marketplace 集成。
- IM、Email、社媒渠道与外部沟通线程。

第三方电商平台、IM / Email / 社媒渠道后续应按各自领域独立设计，不纳入 `site-service`。

## 5. P1 Scope

P1 包含：

- site registry
- site card workspace 所需状态数据
- locale lifecycle
- credential bundle
- basic scopes
- product-to-site publication config
- site-defined category definition
- site-scoped Blog / News
- preview token and draft preview view
- explicit sync batch
- public view generation
- publish version
- changed resource index / sync resource list
- webhook notification
- runtime status inspection
- site audit

P1 不包含：

- template
- page builder
- archive
- automatic translation
- automatic product master publish
- price / inventory final validation
- inquiry submission
- order intake
- customer account
- dealer account
- payment / checkout
- third-party marketplace connector
- IM / Email / social channel
- multi-runtime endpoint
- complex redirect management
- CDN purge

## 6. Collaboration Boundaries

`site-service` 读取 OES Core 的业务真相，但不拥有内部业务真相。

产品同步协作：

```text
Product Master
  ↓ provides public-safe product facts
site-service SiteProductPublication
  ↓ provides site / locale display config
site-service explicit Sync
  ↓ builds ProductPublicView
Site Runtime
  ↓ pulls and stores local published data
Storefront Frontend
  ↓ renders from Site Runtime local data
```

Category 协作：

```text
OES Admin defines site category tree
  ↓ save draft
site-service marks pending sync
  ↓ explicit Sync
site-service builds CategoryPublicView from site-defined category data
  ↓ webhook notify
Site Runtime pulls latest category views
  ↓
Storefront renders current site's public taxonomy
```

Blog / News 协作：

```text
OES Admin edits site-scoped Blog / News
  ↓ save draft
site-service marks pending sync
  ↓ explicit Sync
site-service builds BlogPublicView / NewsPublicView
  ↓ webhook notify
Site Runtime pulls latest views
```

Preview 协作：

```text
OES Admin saves draft
  ↓ Preview
site-service issues previewToken
  ↓ opens site preview URL
Site Runtime calls OES Preview API through @oes/site-runtime-kit
  ↓
site-service returns draft preview view
  ↓
Site Runtime renders real preview page without writing formal store
```

Future commerce collaboration:

```text
Site Runtime
  ↓
Site Ingress
  ↓
Sales / Order / Pricing / WMS / CRM services
```

在 commerce 场景中，`site-service` 只提供 site / region / channel / policy / public view 上下文，不拥有订单、库存、价格、客户或询盘真相。

## 7. External Interfaces

典型上游入口：

- OES Admin / tenant-web
- `api-gateway` Admin BFF
- `api-gateway` Site-facing BFF / Site API
- Site Runtime runtime-status 巡检路径

典型站点侧消费者：

- `@oes/site-runtime-kit`
- Site Runtime backend

具体 HTTP / gRPC / event contracts 后续在 `docs/contracts/**` 中冻结。

`site-service` 不直接面向公网暴露 Site Runtime API。外部 Site Runtime 必须通过 `api-gateway` 的 Site-facing BFF / Site API 访问 OES。

`api-gateway` 负责 HTTP 入口、DTO 校验、HTTP 错误模型、operator / site caller context、trace、rate limit 与签名校验前置；`site-service` 负责 credential、site status、scope、sync state、public view 与 audit 的最终真相判定。

## 8. Sync Semantics

同步是操作者显式动作，不是每次保存自动触发。

```text
Save draft / config
  ↓
Pending Sync
  ↓
Sync All Pending Changes / Retry
  ↓
Validate active locale completeness
  ↓
Build public views
  ↓
Advance site publishVersion
  ↓
Send one webhook per site
  ↓
Site Runtime pull latest
```

全局同步时：

- 有 pending changes 的站点才处理。
- 无变更站点跳过。
- 每个站点生成自己的 sync batch。
- 每个站点最多发送一次 webhook。

Webhook 失败可重发。Site Runtime 必须具备 pull fallback。

## 9. Preview Semantics

P1 预览规则：

- 只能从 OES Admin 发起。
- 必须先保存草稿。
- preview token 短时有效。
- preview token 绑定 site、resource、locale、operator。
- token 不携带完整内容。
- Site Runtime 用 `@oes/site-runtime-kit` 调 OES Preview API 拉 draft preview view。
- 预览不写 Site Runtime 正式 store。
- 预览不生成 publishVersion。
- 预览不触发 webhook。
- 预览页面必须 `noindex`、`nofollow`、`no-store`。
- 若 OES draft preview 不可用，Site Runtime 可以 fail closed 并返回 5xx，但响应仍必须带 `noindex` / `nofollow` 与 `no-store` 语义。
- Storefront 可以把不可用的 preview 渲染为安全 fallback 页面，但该 fallback 不代表正式 published data，不得写入正式 store、生成 publishVersion 或触发 webhook。

## 10. Non-goals

- 不作为所有外部数字触点的统一大平台。
- 不承载 Amazon / 1688 / 淘宝 / 京东等第三方电商渠道。
- 不承载 IM / Email / 社媒沟通渠道。
- 不作为所有网站页面渲染的实时后端。
- 不直接替代 `item-master-service`、未来 CMS、CRM、Sales、WMS、Finance 等业务服务。
- 不在 P1 实现 inquiry、order、payment、dealer portal account 等业务写入能力。

## 11. Truth Source Rule

本文是 `site-service` 的唯一稳定服务职责真相源。其他 architecture、collaboration、contract、feature packet 或 design workspace 只能引用本文，不得重新定义 `site-service` 的服务职责、核心对象或 owner 边界。
