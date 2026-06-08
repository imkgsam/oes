# public-entry-service 职责卡

> ShortLink / Public Entry Phase 1 的设计过程以 [shortlink-public-entry-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/shortlink-public-entry-design.md) 为准；Phase 1 feature 范围以 [shortlink-public-entry-phase-1.md](/Users/acehood/Documents/GitHub/oes/docs/plans/features/shortlink-public-entry-phase-1.md) 为准。本文冻结 `public-entry-service` 的长期职责边界，不替代后续 contracts 或实现计划。

## 1. Purpose

`public-entry-service` 是 OES 的公开入口能力承载服务，负责回答“某个对外公开访问入口是否有效、应该跳向哪里、如何被禁用 / 过期 / 迁移、以及如何记录基础访问事实”。

Phase 1 正式承载两个模块：

- `short-link` module
- `business-card` module

两个模块同属 `public-entry-service`，但模型与 owner 边界必须分离。

本文是 `public-entry-service` 的唯一稳定设计真相源。其他 architecture、collaboration、contract、feature packet、design workspace 或实现计划只能引用本文，不得重新定义本服务的长期职责、核心对象、模块边界或 owner 语义。

## 2. Owns

`public-entry-service` owns：

- ShortLink 公开入口生命周期。
- `shortCode` 全局唯一性。
- 公开短链 URL 与 public redirect 入口。
- ShortLink target reference。
- ShortLink 状态：
  - `ACTIVE`
  - `DISABLED`
  - `ARCHIVED`
- ShortLink `expiresAt` 过期语义。
- ShortLink target 迁移语义。
- ShortLink 轻量归因标签：
  - `entryPurpose`
  - `sourcePlacement`
  - `campaignRef`
- ShortLink 访问事件 `VisitEvent`。
- ShortLink 基础访问统计的事件来源。
- ShortLink 管理端操作的审计事实输入。
- ShortLink 动态生成 / 下载基础二维码图片的能力，二维码内容为 public URL。
- BusinessCard module 的名片配置与公开展示配置，具体以 BusinessCard feature / contract 冻结范围为准。
- BusinessCard 与 ShortLink 的同服务模块协同边界。
- Phase 1 `BUSINESS_CARD` target resolver 的服务内模块解析能力。

## 3. Does Not Own

`public-entry-service` does not own：

- HR 员工、任职、员工生命周期、员工编号或正式 `人 -> org` 归属；以 [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md) 为准。
- 自然人 / 组织主体主数据、租户主体引用、地址正文或联系人正文；以 [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md) 为准。
- 账号、身份映射、登录标识、账号状态或 UserAccount 事实；以 [identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md) 为准。
- 租户、组织树、公司主体、组织结构或 tenant profile 真相；以 [tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md) 为准。
- 角色、权限、policy、scope 或授权判定真相；以 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 为准。
- Barcode / Scan Identity 内部业务对象码注册、绑定、追溯主体、PDA 业务扫码解析或通用 Scan Router。
- CRM LeadDraft、Lead、CustomerAccount、客户回流、线索分配或客户身份识别语义；以 [crm-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/crm-service.md) 为准。
- Campaign 生命周期、预算、活动计划、名单、投放素材、Marketing 自动化或 UTM 模型。
- BusinessCard 展示字段的上游主数据真相，例如姓名、职位、头像、公司名、联系方式正文。
- 二维码模板、QRCodeAsset、二维码素材管理、印刷版本、视觉设计或物料排版。
- 业务公开页面内容本身。ShortLink Phase 1 只 redirect，不 render 业务公开页。
- 自定义品牌短链域名、证书、CNAME、domain binding 或域名归属校验。
- 精细地理分析、完整 anti-abuse / bot filtering / abuse detection 平台。

## 4. Module Boundaries

### 4.1 ShortLink Module

ShortLink module owns：

- `ShortLink`
- `VisitEvent`
- `shortCode` generation and uniqueness
- public URL lifecycle
- public redirect decision
- ShortLink status and expiresAt
- target reference
- entryPurpose / sourcePlacement / campaignRef
- target migration
- basic QR image generation from public URL
- visit event persistence
- admin management commands for ShortLink

ShortLink module does not own：

- BusinessCard content.
- BusinessCard public page render.
- BusinessCard readiness reason beyond resolver result.
- HR / Identity / Party / Tenant Org upstream truth.
- CRM lead or customer truth.
- QRCodeAsset or template system.

### 4.2 BusinessCard Module

BusinessCard module owns：

- BusinessCard configuration and display rules.
- BusinessCard public render readiness.
- BusinessCard target resolver for `targetType = BUSINESS_CARD`.
- BusinessCard consumption of ShortLink public entry.
- BusinessCard vCard generation within its own feature scope.

BusinessCard module does not own：

- `shortCode` uniqueness.
- ShortLink status / expiresAt semantics.
- ShortLink target migration.
- VisitEvent model.
- Generic public URL lifecycle.
- Generic source attribution model.

### 4.3 Shared Service Rule

Same service does not mean shared model.

Stable boundary:

```text
BusinessCard owns what is shown.
ShortLink owns how the public entry is reached, governed, tracked, expired, and redirected.
```

BusinessCard consumes ShortLink through application commands and queries. It must not directly write ShortLink tables, generate shortCode, write VisitEvent, or reinterpret ShortLink lifecycle.

ShortLink references BusinessCard through:

```text
targetKind = INTERNAL_REF
targetType = BUSINESS_CARD
targetResourceId = businessCardId
```

ShortLink must not read BusinessCard internal fields to build business display content.

## 5. Core Objects

### 5.1 ShortLink

`ShortLink` represents a stable, governable public entry.

It answers:

```text
这个公开入口是否有效？应该引用哪个 target？访问时应如何跳转或失效？
```

Stable Phase 1 fields:

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

Phase 1 rules:

- `shortCode` is globally unique.
- `shortCode` is generated by the system.
- Default shortCode length is 7.
- Phase 1 uses a Base58-like character set that avoids confusing characters.
- Phase 1 does not support custom shortCode.
- Public URL path is `/c/{shortCode}`.
- One target can have multiple ShortLinks.
- Updating target does not change `shortCode` or public URL.

### 5.2 VisitEvent

`VisitEvent` represents one immutable visit result for an existing ShortLink.

Phase 1 fields:

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

Phase 1 rules:

- One request writes at most one VisitEvent.
- VisitEvent is immutable.
- VisitEvent write failure must not block redirect or unavailable response.
- `shortCode` not found does not create VisitEvent.
- Phase 1 does not create summary / rollup / cache objects.
- Basic statistics are aggregated from VisitEvent.

### 5.3 BusinessCard

`BusinessCard` is owned by the BusinessCard module inside `public-entry-service`.

Its detailed fields and Phase 1 constraints are governed by:

- [employee-digital-business-card-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/employee-digital-business-card-design.md)
- [employee-digital-business-card.md](/Users/acehood/Documents/GitHub/oes/docs/plans/features/employee-digital-business-card.md)

This service card only freezes that BusinessCard and ShortLink are same-service modules with separated owner boundaries.

## 6. Target Model

Phase 1 supports:

```text
targetKind:
  INTERNAL_REF
  EXTERNAL_URL
```

Rules:

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

`targetType` is a controlled code registered by the target owner. It is not a global business enum owned by ShortLink.

Phase 1 registered target:

```text
BUSINESS_CARD -> BusinessCard module resolver
```

## 7. Target Resolver

INTERNAL_REF targets must be resolved by target owner resolver.

Phase 1 rules:

- Resolver contract is stable; resolver transport is replaceable.
- Phase 1 uses in-process module resolver inside `public-entry-service`.
- ShortLink module calls BusinessCard module through resolver contract / interface.
- Phase 1 does not use gRPC resolver.
- Future cross-service targets may use gRPC or explicit internal contracts without changing ShortLink domain model.
- ShortLink must not construct BusinessCard URL by copying BusinessCard route knowledge into ShortLink domain logic.

Phase 1 resolved result shape:

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

## 8. External Interfaces

Typical upstream callers:

- Public anonymous clients scanning or opening ShortLink public URL.
- Admin BFF / tenant-web management surfaces.
- BusinessCard module requesting or listing public entries.
- Future target owner modules requesting public entries.

Public redirect:

```http
GET /c/{shortCode}
```

Admin management capabilities:

- create ShortLink for INTERNAL_REF.
- create ShortLink for EXTERNAL_URL.
- update target.
- disable / enable / archive.
- update expiresAt.
- update entryPurpose / sourcePlacement / campaignRef.
- get detail.
- list by target.
- read VisitEvent-derived statistics.
- generate / download basic QR image for public URL.

Contract documents are still pending and must live under `docs/contracts/**` before implementation handoff.

## 9. Permission Boundary

Public redirect does not require login.

Admin management requires:

- tenant context.
- operator context.
- trace context.
- permission-service authorization.
- audit metadata for commands.

Suggested permission codes:

```text
public-entry.short-link.read
public-entry.short-link.create
public-entry.short-link.update
public-entry.short-link.disable
public-entry.short-link.archive
public-entry.short-link.stats.read
```

`public-entry-service` does not own permission truth. Permission truth remains in `permission-service`.

## 10. Published Facts

`public-entry-service` may publish or return:

- ShortLink public URL.
- ShortLink current status and expiresAt.
- ShortLink target reference.
- ShortLink attribution labels.
- VisitEvent-derived statistics.
- QR code image generated from public URL.
- BusinessCard public render result within BusinessCard module scope.
- Resolver result summaries such as redirect / unavailable / not found.

It must not publish:

- Private target internals through anonymous public redirect.
- BusinessCard field truth as ShortLink-owned facts.
- CRM lead or customer interpretation.
- Barcode / trace binding interpretation.

## 11. Non-goals

Phase 1 does not do:

- standalone `short-link-service`.
- generic public form platform.
- Scan Router.
- QRCodeAsset or QR template management.
- custom shortCode.
- custom short domain.
- allowed external domain management.
- A/B routing / experiment.
- Campaign / Marketing management.
- UTM model.
- precise geo analytics.
- advanced anti-abuse platform.
- VisitEvent summary / rollup.
- gRPC resolver.
- public rendering of arbitrary business pages by ShortLink.

## 12. Related Documents

- [shortlink-public-entry-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/shortlink-public-entry-design.md)
- [shortlink-public-entry-phase-1.md](/Users/acehood/Documents/GitHub/oes/docs/plans/features/shortlink-public-entry-phase-1.md)
- [employee-digital-business-card-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/employee-digital-business-card-design.md)
- [employee-digital-business-card.md](/Users/acehood/Documents/GitHub/oes/docs/plans/features/employee-digital-business-card.md)
- [scan-identity-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/scan-identity-design.md)
- [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)
