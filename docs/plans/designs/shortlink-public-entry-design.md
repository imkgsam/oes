# ShortLink / Public Entry Design Workspace

> 本文是 ShortLink / Public Entry / QR Entry 能力的设计工作台。它记录当前设计过程、已冻结边界与后续回写目标，不替代未来 `short-link-service` 或其他稳定 architecture 真相源。

## 0. 文档控制

```text
designKey: shortlink-public-entry-design
designStatus: ACTIVE_DESIGN_WORKSPACE
lastUpdatedAt: 2026-06-08 00:00:00 CST
lastUpdatedBy: Codex design thread
supersedes: employee digital business card shortlink side discussion
conflictResolution: 当本文与更早的员工数字名片、二维码名片、扫码入口或公开入口讨论冲突时，以本文 lastUpdatedAt 之后的冻结结论为准；稳定 architecture / ADR / contracts 明确覆盖本文时，以稳定真相源为准。
```

## 1. 目标

- 将 ShortLink 从员工数字名片灵感中拆出，作为可复用的公开入口能力独立设计。
- 明确 ShortLink / Public Entry 与 BusinessCard、Barcode / Scan Identity、QRCode、Campaign、CRM 的边界。
- 支持二维码印刷后目标仍可迁移、禁用、过期与统计。
- 第一阶段保持轻量，不拆独立微服务，不进入实现计划。

## 2. 当前范围

本 workspace 负责：

- ShortLink / Public Entry 的能力边界。
- ShortLink 与公开短链 URL 的生命周期。
- ShortLink target 模型。
- public redirect endpoint 与 admin management endpoint 的职责分离。
- 轻量 VisitEvent。
- entryPurpose、sourcePlacement、campaignRef 归因标签。
- target owner resolver 的边界。
- 第一阶段后置能力清单。

本 workspace 不负责：

- BusinessCard 字段、名片内容、vCard、名片模板、员工资料来源或名片 UI。
- Barcode / Scan Identity 内部业务对象码注册与解析。
- 通用 Scan Router。
- CRM LeadDraft、客户回流、客户身份识别、线索分配。
- Marketing Campaign 生命周期、预算、投放计划或自动化。
- 二维码模板、二维码资产管理、印刷版本管理。
- 业务公开页面渲染。
- 代码实现、数据库 schema 或 feature packet。

## 3. 定位与承载边界

ShortLink 是 Public Entry capability 的第一阶段核心对象。

冻结结论：

- ShortLink 不适合放入 `src/common`。
- ShortLink 不属于 CRM、BusinessCard、Barcode / Scan Identity。
- Phase 1 承载在 `public-entry-service`。
- Phase 1 中 BusinessCard module 与 ShortLink module 同属 `public-entry-service`，但模块边界必须分离。
- 未来如果 ShortLink 复用场景、访问量或治理复杂度足够，再考虑拆出 `short-link-service`。
- 服务名若未来独立，优先使用 `short-link-service`；Public Entry 是 Phase 1 承载服务与能力边界，不是把所有公开入口都泛化进一个大模型。

边界口径：

```text
BusinessCard owns what is shown.
ShortLink owns how the public entry is reached, governed, tracked, expired, and redirected.
```

## 4. 与相关能力的边界

### 4.1 BusinessCard

- BusinessCard owns 名片内容。
- ShortLink owns 公开入口。
- BusinessCard consumes ShortLink。
- ShortLink references BusinessCard。
- ShortLink 不拥有姓名、职位、联系方式、头像、模板、vCard 或名片展示字段。
- BusinessCard 不拥有 shortCode、公开 URL 生命周期、VisitEvent 或 ShortLink 通用状态。

### 4.2 Barcode / Scan Identity

Barcode / Scan Identity 回答：

```text
这个码绑定到哪个内部业务对象？
```

ShortLink / Public Entry 回答：

```text
这个公开入口应该如何跳转、统计、失效和治理？
```

冻结结论：

- 不把 ShortLink 塞进 Barcode 注册表。
- 产品码、外箱码、托盘码、员工码、工序输入码等内部业务对象码继续归 Barcode / Scan Identity。
- 员工名片二维码、活动二维码、产品资料二维码、售后入口二维码、客户反馈二维码、招聘二维码等公开访问入口归 ShortLink / Public Entry。

### 4.3 QRCode

- QRCode 不是独立业务对象。
- QRCode 只是 ShortLink public URL 的编码载体。
- Phase 1 不管理 QRCodeAsset。
- Phase 1 只需要能按 ShortLink 动态生成 / 下载基础二维码图片。
- 二维码模板、二维码资产管理、印刷版本管理不属于当前 ShortLink 设计范围。

### 4.4 Campaign

- ShortLink 可以保存轻量 `campaignRef`。
- Campaign 生命周期、预算、活动计划、名单、投放素材、线索转化策略不属于 ShortLink。
- 未来 Marketing capability 可以 consume ShortLink，但 ShortLink 不 owns Campaign。

## 5. 核心对象

第一阶段核心对象只包括：

- `ShortLink`
- `VisitEvent`

### 5.1 ShortLink

建议字段：

```text
ShortLink {
  id
  tenantId
  displayName
  shortCode
  targetKind
  targetType
  targetResourceId
  targetUrl
  entryPurpose
  sourcePlacement
  campaignRef
  status
  expiresAt
  createdBy
  createdAt
  updatedBy
  updatedAt
}
```

字段语义：

- `displayName`：管理展示名称，不参与跳转逻辑，不作为目标对象业务真相。
- `shortCode`：全局唯一短码。
- `targetKind`：目标类型，支持 `INTERNAL_REF` 与 `EXTERNAL_URL`。
- `entryPurpose`：公开入口的业务用途。
- `sourcePlacement`：入口被放置 / 投放的位置或载体。
- `campaignRef`：可选外部活动引用，不表示 ShortLink owns Campaign。

### 5.2 shortCode

冻结结论：

- Phase 1 `shortCode` 全局唯一。
- 使用统一短链域名时，通过 `shortCode` 直接解析 `ShortLink` 与 `tenantId`。
- 系统自动生成，不支持自定义 shortCode。
- 默认 7 位。
- 使用去易混字符的 Base58-like 字符集。
- 长度可配置，但 Phase 1 默认 7。

第一阶段访问形态：

```text
https://go.oes.com/c/CF26ZS
```

冻结 URL path：

```text
/c/{shortCode}
```

自定义品牌短链域名后置。

### 5.3 状态

冻结状态：

```text
status:
  ACTIVE
  DISABLED
  ARCHIVED

expiresAt:
  nullable datetime
```

访问规则：

- `ACTIVE` 且未过期：正常访问。
- `ACTIVE` 但已过期：统一公开失效页，内部结果为 `EXPIRED`。
- `DISABLED`：统一公开失效页。
- `ARCHIVED`：统一公开失效页或 not found 风格响应。

Phase 1 不引入 `DRAFT`。

### 5.4 Target

冻结目标类型：

```text
targetKind:
  INTERNAL_REF
  EXTERNAL_URL
```

规则：

```text
targetKind = INTERNAL_REF:
  targetType required
  targetResourceId required
  targetUrl empty

targetKind = EXTERNAL_URL:
  targetUrl required
  targetType empty
  targetResourceId empty
```

内部目标示例：

```text
targetKind = INTERNAL_REF
targetType = BUSINESS_CARD
targetResourceId = card_001
```

外部 URL 示例：

```text
targetKind = EXTERNAL_URL
targetUrl = https://brand-site.com/products/ma3124
```

### 5.5 targetType

冻结结论：

- `targetType` 是接入方登记的受控 code。
- ShortLink 不 owns 全局业务目标枚举。
- ShortLink 只保存 `targetType + targetResourceId`。
- 目标对象的业务真相和可访问状态由目标 owner module 负责。

Phase 1 可登记：

```text
BUSINESS_CARD -> BusinessCard module resolver
```

### 5.6 VisitEvent

Phase 1 字段：

```text
VisitEvent {
  id
  tenantId
  shortLinkId
  visitedAt
  userAgent
  ipAddress
  detectedChannel
  deviceType
  locale
  referrer
  resultStatus
}
```

冻结规则：

- 保留原始 `userAgent`，但限制最大长度。
- 记录 `ipAddress`，第一阶段保持简单明了。
- `referrer` 可为空，并限制最大长度。
- 不记录 `visitorId / sessionId`。
- 不记录 `targetSnapshot / campaignSnapshot`。
- 不记录后续点击行为。
- 不记录 full VisitEvent behavior model。
- 一条访问最多写一条 VisitEvent。
- VisitEvent 不可变。
- VisitEvent 写入失败不阻断 redirect / unavailable response。

建议结果：

```text
resultStatus:
  REDIRECTED
  DISABLED
  EXPIRED
  ARCHIVED
  INVALID_TARGET
```

`shortCode` 不存在的 `NOT_FOUND` 不进入 VisitEvent，可进入普通访问日志或未来安全日志。

## 6. Public Redirect Flow

Phase 1 只做 redirect，不渲染业务公开页。

访问链路：

```text
GET /c/{shortCode}
-> find ShortLink by shortCode
-> check status / expiresAt
-> resolve final result:
     unavailable / expired / archived
     external URL redirect
     internal target resolver result
-> write one final VisitEvent best-effort when ShortLink exists
-> redirect or show generic unavailable page
```

冻结结论：

- Public redirect endpoint 不要求登录。
- Public redirect endpoint 面向公网匿名访问。
- Public redirect endpoint 不泄露 `targetType / targetResourceId / tenant` 内部信息。
- disabled / expired / archived 统一进入公开失效页。
- ShortLink 不 render BusinessCard、Product、Feedback Form 等业务页面。

## 7. Target Resolver

内部目标必须通过 target owner resolver 解析。

冻结结论：

- ShortLink 不直接拼业务目标 URL。
- 每个 target owner module 负责解析自己的 `targetType`。
- Resolver 返回 resolved target result，不返回业务对象内容。
- Phase 1 使用 `public-entry-service` 内的 in-process module resolver。
- ShortLink module 通过 resolver contract / interface 调 BusinessCard module。
- Phase 1 不使用 gRPC resolver。
- Resolver registration 是实现层配置，不是 ShortLink 领域对象。
- 稳定的是 resolver contract，可替换的是 resolver transport。
- 未来跨服务 target 接入时，可以将 resolver transport 替换为 gRPC 或明确内部 contract，不改变 ShortLink domain model。
- Design document 记录已登记 `targetType` 与 owner module。

Phase 1 resolver 返回值：

```text
ResolvedTarget {
  result:
    REDIRECT
    UNAVAILABLE
    NOT_FOUND

  redirectUrl:
    required when result = REDIRECT

  resultTarget:
    optional string for visit result summary
}
```

## 8. EXTERNAL_URL

`EXTERNAL_URL` 不需要 target owner resolver。

Phase 1 安全规则：

- 只校验 URL 格式。
- 只允许 `https`。
- 禁止 `javascript:`、`data:`、`file:` 等危险协议。
- 不做 allowed domain 白名单。
- 创建和修改 `targetUrl` 必须审计。
- 后台必须显示真实目标域名。

后置能力：

- tenant-level allowed external domains。
- external URL approval。
- risk warning。
- domain ownership verification。

## 9. 归因标签

冻结字段：

```text
entryPurpose
sourcePlacement
campaignRef nullable
```

语义：

- `entryPurpose`：公开入口的业务用途。
- `sourcePlacement`：入口被放置 / 投放的位置或载体。
- `campaignRef`：可选外部活动引用，不表示 ShortLink owns Campaign。

规则：

- `sourcePlacement` 的推荐选项可由 `entryPurpose` 决定。
- Phase 1 不建立完整 Campaign 模型。
- ShortLink 不拥有 Campaign 生命周期。

示例：

```text
entryPurpose = BUSINESS_CARD
sourcePlacement = EXHIBITION_BADGE
campaignRef = canton_fair_2026_autumn
```

## 10. Admin Management 与业务模块消费

Public redirect endpoint 与 admin management endpoint 必须分开。

Admin management endpoint：

- 必须登录。
- 必须携带 `tenantId`、operator context、trace context。
- 必须经过 permission-service 授权。
- 改变状态、目标、过期时间、归因标签时必须审计。

Phase 1 支持两类创建入口：

- Admin manual create。
- Target owner module application create。

业务模块可通过 ShortLink application command 申请创建 / 绑定公开入口，但不能直接生成 shortCode、不能拥有 ShortLink status / expiresAt 语义、不能写 VisitEvent。

ShortLink 支持按 target 反查：

```text
listShortLinksByTarget(targetType, targetResourceId)
```

用途：

- 目标 owner module 可以展示某个业务对象下挂了哪些公开入口。
- 例如一张名片可以展示主入口、纸质名片入口、展会胸牌入口、邮件签名入口。
- 该查询能力不代表目标 owner owns ShortLink lifecycle。

同一个 target 可以有多个 ShortLink：

```text
ShortLink -> target 是 many-to-one。
ShortLink 不强制 target 唯一。
```

## 11. 权限与审计

建议权限码：

```text
public-entry.short-link.read
public-entry.short-link.create
public-entry.short-link.update
public-entry.short-link.disable
public-entry.short-link.archive
public-entry.short-link.stats.read
```

权限边界：

- Public redirect endpoint 不要求登录。
- Admin management endpoint 必须经过认证、租户上下文、权限判定和审计。
- 权限真相归 permission-service，ShortLink 不 owns 授权模型。

ShortLink 本体保留：

```text
createdBy
createdAt
updatedBy
updatedAt
```

Phase 1 关键操作必须审计：

```text
CREATE
UPDATE_TARGET
DISABLE
ENABLE
ARCHIVE
UPDATE_EXPIRES_AT
UPDATE_ATTRIBUTION
```

优先复用 OES 统一 audit 机制，不单独冻结 `ShortLinkAuditEvent` 为领域对象。

## 12. 目标迁移

Phase 1 支持 `UPDATE_TARGET`。

冻结规则：

- 更新 target 不改变 `shortCode / publicUrl`。
- 允许 `INTERNAL_REF` 与 `EXTERNAL_URL` 之间迁移。
- 必须审计 before / after。
- 历史 VisitEvent 不回写、不重算。

示例：

```text
原来：
targetKind = EXTERNAL_URL
targetUrl = https://brand-site.com/products/ma3124

后来：
targetKind = INTERNAL_REF
targetType = PRODUCT_PUBLIC_PAGE
targetResourceId = page_001
```

## 13. 统计

Phase 1 不建立 `ShortLinkVisitSummary`。

冻结结论：

- ShortLink 不缓存 `visitCount / lastVisitedAt`。
- 访问统计从 VisitEvent 聚合。
- 后续如访问量或后台性能需要，再引入 summary / rollup / cache。

可从 VisitEvent 聚合：

- total visits。
- visits by resultStatus。
- visits by detectedChannel。
- visits by deviceType。
- visits by referrer。
- visits by time range。

## 14. 后置能力

后置或非 Phase 1 能力：

- Scan Router。
- 与 future Campaign / Marketing capability 的协同。
- A/B routing / experiment。
- 精细地理分析。
- 高级 anti-abuse / bot filtering / abuse detection。
- 独立 `short-link-service`。
- QRCodeAsset / 二维码资产管理。
- 二维码模板、视觉设计、印刷排版。
- 自定义 shortCode。
- 自定义品牌短链域名。
- tenant-level allowed external domains。
- generic public form。
- WeChat mini program deep routing。
- full VisitEvent behavior model。
- UTM 模型。

Phase 1 可有基础风控，但 BusinessCard 或其他目标模块不应依赖高级风控作为前置能力。

## 15. 已冻结决定

| 日期 | 决定 | 影响范围 | 回写目标 |
| --- | --- | --- | --- |
| 2026-06-08 | ShortLink 是 Public Entry capability 的第一阶段核心对象，不放 `common`、CRM、BusinessCard 或 Barcode。 | capability boundary | future service truth source / feature packet |
| 2026-06-08 | Phase 1 承载在 `public-entry-service`，BusinessCard module 与 ShortLink module 同属服务但边界分离。 | service boundary | feature packet |
| 2026-06-08 | 未来若 ShortLink 独立拆服务，优先 `short-link-service`。 | service boundary | architecture / ADR if service is created |
| 2026-06-08 | Phase 1 `shortCode` 全局唯一、自动生成、默认 7 位、Base58-like、不可自定义。 | ShortLink model | feature packet |
| 2026-06-08 | Public URL path 冻结为 `/c/{shortCode}`。 | public endpoint | contracts / feature packet |
| 2026-06-08 | Target 支持 `INTERNAL_REF` 与 `EXTERNAL_URL`。 | ShortLink model | feature packet / contracts |
| 2026-06-08 | `targetType` 是接入方登记的受控 code，不由 ShortLink owns 全局枚举。 | integration boundary | target registration section |
| 2026-06-08 | INTERNAL_REF 通过 target owner resolver contract 解析；Phase 1 使用服务内 module resolver，不使用 gRPC。 | collaboration boundary | contracts / collaboration if needed |
| 2026-06-08 | Phase 1 只 redirect，不 render 业务公开页。 | public endpoint | feature packet |
| 2026-06-08 | Phase 1 不管理 QRCodeAsset；QRCode 只是 public URL 的编码载体。 | QR boundary | feature packet |
| 2026-06-08 | VisitEvent 保持轻量，记录 userAgent、ipAddress、基础环境与结果。 | analytics boundary | feature packet |
| 2026-06-08 | Phase 1 不建 visit summary，从 VisitEvent 聚合统计。 | analytics boundary | feature packet |
| 2026-06-08 | Public redirect endpoint 与 admin management endpoint 分离。 | API boundary | contracts |
| 2026-06-08 | Phase 1 支持 target 迁移，更新 target 不改变 shortCode / publicUrl。 | lifecycle | feature packet |

## 16. 开放问题

| 日期 | 问题 | 为什么未冻结 | 下一步 |
| --- | --- | --- | --- |
| 2026-06-08 | Public redirect endpoint 的正式域名配置。 | path 已冻结为 `/c/{shortCode}`，域名需结合部署与网关规划。 | contract / feature packet 阶段冻结。 |
| 2026-06-08 | resolver contract 的具体 TypeScript / proto shape。 | 当前冻结语义与 transport 方向，不冻结代码形态。 | implementation plan 阶段设计。 |
| 2026-06-08 | IP 数据的展示、脱敏与保留周期。 | 当前只确认 Phase 1 记录 IP。 | feature packet 或 governance 中补充。 |

## 17. 真相源回写计划

- 服务职责：
  - Phase 1 稳定服务职责卡：
    - [docs/architecture/services/public-entry-service.md](../../architecture/services/public-entry-service.md)
  - 若未来建立 `short-link-service`，需新增 `docs/architecture/services/short-link-service.md` 作为唯一稳定真相源。
- 协同蓝图：
  - 若 BusinessCard、Product public page、AfterSales、Feedback Form 等多个 target 接入，需新增 collaboration 文档描述 resolver 协同。
- contracts：
  - Phase 1 contracts:
    - [docs/contracts/public-entry-service/shortlink-public-redirect.md](../../contracts/public-entry-service/shortlink-public-redirect.md)
    - [docs/contracts/public-entry-service/shortlink-admin-management.md](../../contracts/public-entry-service/shortlink-admin-management.md)
    - [docs/contracts/public-entry-service/shortlink-target-resolver.md](../../contracts/public-entry-service/shortlink-target-resolver.md)
- feature packet：
  - 设计冻结后转入 `docs/plans/features/shortlink-public-entry-phase-1.md` 或等价 feature packet。
- architecture / ADR：
  - 若决定拆独立服务、引入自定义域名或引入跨服务 resolver contract，需要 architecture / ADR。

## 18. 恢复入口

下次继续前先读：

- [docs/plans/designs/shortlink-public-entry-design.md](./shortlink-public-entry-design.md)
- [docs/architecture/services/public-entry-service.md](../../architecture/services/public-entry-service.md)
- [docs/contracts/public-entry-service/README.md](../../contracts/public-entry-service/README.md)
- [docs/plans/designs/employee-digital-business-card-design.md](./employee-digital-business-card-design.md)
- [docs/plans/designs/scan-identity-design.md](./scan-identity-design.md)
- [docs/plans/designs/README.md](./README.md)

当前推荐下一步：

- 用户 review 本 workspace 与 Phase 1 feature packet。
- Phase 1 feature packet：
  - [docs/plans/features/shortlink-public-entry-phase-1.md](../features/shortlink-public-entry-phase-1.md)
- 进入实现前，再单独冻结 API contract、resolver 接入方式与实际承载服务。
