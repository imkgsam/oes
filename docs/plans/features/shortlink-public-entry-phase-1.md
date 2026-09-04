# ShortLink / Public Entry Phase 1

> ShortLink / Public Entry 设计过程入口：[shortlink-public-entry-design.md](../designs/shortlink-public-entry-design.md)。本文只记录 Phase 1 feature packet、跨线程分工、依赖与验收；不重新定义 BusinessCard、Barcode / Scan Identity、Campaign、CRM 或未来服务职责真相。

## 1. 目标

- 将 ShortLink / Public Entry 设计转成可执行 Phase 1 feature packet。
- 在 `public-entry-service` 中建立 ShortLink module，与 BusinessCard module 同服务但边界分离。
- 提供可治理公开短链入口，支持稳定 public URL、内部目标引用、受控外部 URL、禁用、过期、目标迁移和轻量访问统计。
- 支持 BusinessCard 等 target owner module 通过 ShortLink application command 创建和绑定公开入口，但不让目标业务模块拥有 ShortLink 生命周期。

Phase 1 核心结果：

```text
ShortLink owns public entry lifecycle.
Target owner owns target content and public render.
Public URL path = /c/{shortCode}.
Phase 1 only redirects, it does not render business public pages.
```

## 2. 不做什么

- 不把 ShortLink 放入 `src/common`。
- 不放入 CRM、BusinessCard、Barcode / Scan Identity 或任意业务服务内部模型。
- 不拆出独立 `short-link-service`。
- 不引入 Scan Router。
- 不管理 QRCodeAsset、二维码模板、二维码视觉设计、印刷版本或物料排版。
- 不 render BusinessCard、Product、Feedback Form 等业务公开页。
- 不做 Campaign 生命周期、Marketing 自动化、UTM 模型、A/B experiment。
- 不做 CRM LeadDraft、客户回流、客户身份识别或线索分配。
- 不做自定义 shortCode。
- 不做自定义品牌短链域名。
- 不做 tenant-level allowed external domains。
- 不做精细地理分析。
- 不做完整 anti-abuse / bot filtering / abuse detection 平台。
- 不建立 VisitEvent summary / rollup / cache。
- 不使用 gRPC resolver。

## 3. 上游依赖

- design:
  - [shortlink-public-entry-design.md](../designs/shortlink-public-entry-design.md)
  - [employee-digital-business-card-design.md](../designs/employee-digital-business-card-design.md)
  - [scan-identity-design.md](../designs/scan-identity-design.md)
- feature packets:
  - [employee-digital-business-card.md](./employee-digital-business-card.md)
- services:
  - [public-entry-service.md](../../architecture/services/public-entry-service.md)
  - [permission-service.md](../../architecture/services/permission-service.md)
- collaborations:
  - none required for Phase 1 unless resolver targets cross service boundaries
- contracts:
  - [shortlink-public-redirect.md](../../contracts/public-entry-service/shortlink-public-redirect.md)
  - [shortlink-admin-management.md](../../contracts/public-entry-service/shortlink-admin-management.md)
  - [shortlink-target-resolver.md](../../contracts/public-entry-service/shortlink-target-resolver.md)
- adr:
  - none required for Phase 1 unless implementation decides to split `short-link-service` or introduce cross-service resolver protocol

## 4. 当前结论

- Phase 1 承载在 `public-entry-service`。
- BusinessCard module 与 ShortLink module 同属 `public-entry-service`，但模块边界分离。
- ShortLink 是 Public Entry capability 的 Phase 1 核心对象。
- ShortLink 不适合放入 `src/common`。
- ShortLink 不属于 CRM、BusinessCard、Barcode / Scan Identity。
- 未来若 ShortLink 复用场景、访问量或治理复杂度足够，再考虑拆出 `short-link-service`。
- `shortCode` 全局唯一、系统自动生成、默认 7 位、Base58-like、Phase 1 不支持自定义。
- Public URL path 冻结为 `/c/{shortCode}`。
- 统一短链域名下通过 `shortCode` 直接解析 `ShortLink` 与 `tenantId`。
- Phase 1 支持两类 target：
  - `INTERNAL_REF`
  - `EXTERNAL_URL`
- `targetType` 是接入方登记的受控 code，不由 ShortLink owns 全局业务目标枚举。
- Phase 1 INTERNAL_REF 通过 `public-entry-service` 内的 in-process module resolver 解析。
- 稳定的是 resolver contract，可替换的是 resolver transport；未来跨服务 target 接入时再升级为 gRPC 或明确内部 contract。
- Phase 1 只 redirect，不 render 业务公开页。
- EXTERNAL_URL Phase 1 只校验 URL 格式、只允许 `https`、禁止危险协议，不做 allowed domain 白名单。
- Phase 1 不管理 QRCodeAsset，QRCode 只是 ShortLink public URL 的编码载体。
- Phase 1 支持动态生成 / 下载基础二维码图片。
- ShortLink status 为 `ACTIVE / DISABLED / ARCHIVED`，并支持 nullable `expiresAt`。
- disabled / expired / archived 统一进入公开失效页，公网不泄露内部 target 信息。
- Phase 1 支持 `UPDATE_TARGET`，目标迁移不改变 `shortCode / publicUrl`。
- 同一个 target 可以有多个 ShortLink。
- 支持按 target 反查 `listShortLinksByTarget(targetType, targetResourceId)`。
- Phase 1 VisitEvent 轻量记录，不建 summary。

## 5. 契约真相位置

Phase 1 contract 已建立：

- [shortlink-public-redirect.md](../../contracts/public-entry-service/shortlink-public-redirect.md)
- [shortlink-admin-management.md](../../contracts/public-entry-service/shortlink-admin-management.md)
- [shortlink-target-resolver.md](../../contracts/public-entry-service/shortlink-target-resolver.md)

这些 contract 冻结以下黑盒语义：

- ShortLink public redirect:
  - `GET /c/{shortCode}`
  - resolved redirect / generic unavailable behavior
  - resultStatus 记录口径
  - shortCode not found 行为
- ShortLink admin management:
  - create internal-ref ShortLink
  - create external-url ShortLink
  - update target
  - enable / disable / archive
  - update expiresAt
  - update entryPurpose / sourcePlacement / campaignRef
  - get detail
  - list by target
  - aggregate VisitEvent statistics from events
  - generate / download basic QR code for public URL
- ShortLink target owner resolver:
  - resolve `targetType + targetResourceId + requestContext`
  - return `REDIRECT / UNAVAILABLE / NOT_FOUND`
  - return `redirectUrl` when `REDIRECT`
  - return optional `resultTarget`
- BusinessCard consumption:
  - request public entry for `BUSINESS_CARD / businessCardId`
  - fetch public URL / QR content
  - list and disable card-related ShortLinks if allowed by command policy

Contract 文档只描述黑盒接口语义、字段、错误与当前接口形状，不得重新定义本 feature 或 design workspace 的 owner 边界。

## 6. 线程分工

| Thread / Owner | 职责 | 允许修改路径 | 输入 | 输出 | 状态 |
| --- | --- | --- | --- | --- | --- |
| ShortLink feature owner | 维护本文，收敛 Phase 1 feature scope、阻塞项、验收标准与跨线程依赖 | `docs/plans/features/shortlink-public-entry-phase-1.md`, 必要时 `docs/plans/designs/shortlink-public-entry-design.md` | ShortLink design workspace、BusinessCard feature 依赖 | feature packet 与后续 contract / implementation handoff | active |
| BusinessCard feature owner | 消费 ShortLink public entry 能力，提供 `BUSINESS_CARD` target resolver，不反向定义 ShortLink 模型 | `docs/plans/features/employee-digital-business-card.md`, BusinessCard design / contracts | 本 feature packet 与 ShortLink contracts | BusinessCard target resolver 与 consumption contract | completed / integration-ready |
| contract owner | 已补 public redirect、admin management、target resolver 和 BusinessCard consumption contracts | `docs/contracts/public-entry-service/**` | 本 feature packet、design workspace、BusinessCard feature packet | 可实现黑盒契约 | completed |
| implementation owner | 在 contract 冻结后实现 `public-entry-service` ShortLink module、VisitEvent、resolver registry、BFF / HTTP entry 与基础 QR generation | `src/services/system/public-entry-service/**`, gateway paths if needed | feature packet、contracts、service responsibility | 可运行 Phase 1 能力 | completed / verification-noted |
| review / integration owner | 检查 owner 边界、权限、审计、public redirect 安全、VisitEvent 轻量化和 BusinessCard 集成 | 只读全局，必要时最小修正 | contracts、implementation、tests | review 结论与关闭判断 | pending |

## 7. 当前 slice

- slice:
  - V1B: ShortLink / Public Entry Phase 1 implementation closure
- status:
  - implementation-completed / verification-recorded
- scope:
  - `public-entry-service` ShortLink module
  - API Gateway public redirect / admin BFF
  - tenant-web ShortLink 管理页面
  - VisitEvent 聚合统计、基础 QR 动态生成 / 下载
  - in-process resolver contract / registry
  - BusinessCard `BUSINESS_CARD` resolver registration review
- ready definition:
  - design workspace 已建立并 review
  - Phase 1 service承载、URL path、resolver transport、target model 与 VisitEvent 范围已冻结
  - feature packet 已建立
  - public redirect、admin management、target resolver contracts 已建立
  - service / BFF / tenant-web 实现已落地
  - verification 记录已回填

## 8. 主线范围

- 本 feature 主线：
  - 在 `public-entry-service` 中建立 ShortLink module 的 Phase 1 可执行协作面板。
  - 为 BusinessCard 等 target owner 提供稳定公开入口能力。
  - 明确 public redirect 与 admin management 分离。
  - 明确 ShortLink 只 redirect，不 render 业务公开页。
  - 在实现前补齐 contracts。
- 本 feature 不做：
  - 直接实现代码。
  - 重新讨论 BusinessCard 字段、Contact Asset、CRM 回流、Barcode / Scan Identity 或 Campaign 生命周期。
  - 把 QRCodeAsset / template / printing 作为 ShortLink 对象。
  - 把高级统计、风控或地理分析带入 Phase 1。
- 偏移返回条件：
  - 若实现需要 ShortLink 拼 BusinessCard URL 或读取 BusinessCard 内部字段，暂停并回到 resolver contract。
  - 若实现需要 BusinessCard 生成 shortCode、写 VisitEvent 或拥有 ShortLink status，暂停并回到边界设计。
  - 若实现需要跨服务 resolver，先补 collaboration / contract，必要时 ADR。
  - 若实现需要 allowed external domain、custom domain、campaign、UTM、A/B 或 geo analytics，迁出后置设计。
  - 若实现需要二维码素材管理或模板系统，迁出 QR / asset / template 设计。

## 9. 阻塞 / 依赖

- Blocker-Now:
  - none.
- Blocker-Later:
  - `public-entry-service` 的实际代码承载路径已在 implementation handoff 建议为 `src/services/system/public-entry-service`；实现线程需按现有服务模板落地并最终确认。
  - IP 数据展示、脱敏与保留周期需要在 contract / governance 中补充。
  - 真实域名配置需要结合网关和部署规划；path 已冻结为 `/c/{shortCode}`。
  - 权限码 seed 与 permission-service 接入需要在实现前确认。
- Sidecar:
  - 自定义品牌短链域名。
  - tenant-level allowed external domains。
  - 精细地理分析。
  - 高级 anti-abuse。
  - QRCodeAsset / 模板 / 印刷管理。
  - Campaign / Marketing 协同。
  - A/B routing / experiment。

## 10. 派生问题 Ledger

| 时间 | 问题 | 分类 | 当前影响 | 处理策略 | 目标落点 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-06-08 | `public-entry-service` 实际代码承载路径建议为 `src/services/system/public-entry-service` | Blocker-Later | 不阻塞 implementation planning；实现线程需按 repo 服务模板最终确认 | implementation owner 按 handoff 落地服务骨架 | future implementation plan | ready |
| 2026-06-08 | ShortLink public redirect / admin management / resolver contracts 已建立，后续实现前需按代码路径做最终对齐 | Blocker-Later | 不阻塞 implementation planning，但实现线程需逐条对齐 contract | implementation owner 按 contract 落地并回填验证 | `docs/contracts/public-entry-service/**` | active |
| 2026-06-08 | BusinessCard `BUSINESS_CARD` target resolver contract 未冻结 | Blocker-Now | 曾影响 INTERNAL_REF 第一阶段闭环 | BusinessCard owner 已在 `public-entry-service` 内实现并注册 `BUSINESS_CARD` resolver | `src/services/system/public-entry-service/src/modules/business-card/business-card.module.ts` | resolved |
| 2026-06-08 | Phase 1 实现已完成 in-process resolver registry，但未注册真实 `BUSINESS_CARD` resolver | Blocker-Later | 已解除；ShortLink INTERNAL_REF 可通过 `BusinessCardResolverRegistration` 进入 `BusinessCardApplicationService.resolveTarget` | 已确认 BusinessCard resolver 由 BusinessCard module 注册，ShortLink 不读取 BusinessCard 内部字段 | BusinessCard implementation / resolver registration | resolved |
| 2026-06-08 | `public-entry-service prisma:push` 在 Codex 沙箱内出现空 `Schema engine error` | Blocker-Later | 已确认不是 Prisma schema 或 PostgreSQL 18.3 兼容问题；提升权限后 `db push` 正常通过 | 将 `pnpm --filter public-entry-service prisma:push` 作为本地 DB 命令按其他服务同等方式授权执行；保留 `publicentrydb` 独立开发库 | local dev infra / command approval | resolved |
| 2026-06-08 | IP 展示、脱敏与保留周期 | Blocker-Later | 不阻塞事件记录，但影响后台展示和治理 | contract / governance 阶段补展示口径与保留策略 | future contract / governance | open |
| 2026-06-08 | 真实短链域名配置 | Blocker-Later | path 已冻结，不阻塞模型；影响部署与网关 | contract / deployment planning 阶段冻结 | gateway / deployment docs | open |
| 2026-06-08 | 自定义品牌短链域名 | Sidecar | 不进入 Phase 1 | 后续单独设计 domain binding、证书、CNAME 和租户映射 | future feature / ADR | deferred |
| 2026-06-08 | allowed external domains | Sidecar | Phase 1 只做 https 与危险协议校验 | 后续如外链风险或管理诉求增强再设计 | future security / admin feature | deferred |
| 2026-06-08 | Visit summary / rollup | Sidecar | Phase 1 从 VisitEvent 聚合，访问量大时可能慢 | 后续以性能证据引入 summary / rollup / cache | future feature | deferred |
| 2026-06-08 | QRCodeAsset / 二维码模板 | Sidecar | 当前无需求，不进入模型 | 保持 QRCode 为 public URL 编码载体 | future QR / asset design if needed | deferred |

## 11. 验收标准

Phase 1 设计与实现完成时应满足：

- `public-entry-service` 中 ShortLink module 与 BusinessCard module 边界分离。
- ShortLink 不在 `src/common`、CRM、BusinessCard 或 Barcode 内实现为业务附属模型。
- 管理端或业务模块可创建 `INTERNAL_REF` ShortLink。
- 管理端可创建 `EXTERNAL_URL` ShortLink。
- `shortCode` 自动生成、全局唯一、默认 7 位、Base58-like、不可自定义。
- Public URL path 为 `/c/{shortCode}`。
- public redirect endpoint 匿名可访问。
- admin management endpoint 必须认证、携带 tenant/operator/trace context，并经过 permission-service 授权。
- `ACTIVE` 且未过期的 ShortLink 可 redirect。
- `DISABLED / ARCHIVED / expired` ShortLink 显示统一公开失效页，且不泄露内部 target 信息。
- `EXTERNAL_URL` 只允许 `https`，禁止危险协议。
- `INTERNAL_REF` 通过 target owner resolver contract 解析。
- Phase 1 使用服务内 module resolver，不使用 gRPC。
- ShortLink 不拼 BusinessCard URL，不读取 BusinessCard 内部字段。
- ShortLink 可执行 `UPDATE_TARGET`，并且不改变 `shortCode / publicUrl`。
- target 从 `EXTERNAL_URL` 迁移到 `INTERNAL_REF` 或反向迁移时必须审计 before / after。
- 同一个 target 可以有多个 ShortLink。
- 目标 owner 可按 `targetType + targetResourceId` 反查 ShortLink 列表。
- VisitEvent 对已找到 ShortLink 的访问记录一条不可变事件，包含 `userAgent / ipAddress / detectedChannel / deviceType / locale / referrer / resultStatus`。
- VisitEvent 写入失败不阻断 redirect 或失效响应。
- shortCode 不存在的访问不进入 VisitEvent。
- 统计从 VisitEvent 聚合，不建 summary。
- 可为 ShortLink 动态生成 / 下载基础二维码图片，二维码内容是 public URL。
- 不创建 QRCodeAsset。
- 关键操作 `CREATE / UPDATE_TARGET / DISABLE / ENABLE / ARCHIVE / UPDATE_EXPIRES_AT / UPDATE_ATTRIBUTION` 可审计。

## 12. 关闭条件

- ShortLink design workspace 与本 feature packet 保持一致。
- `public-entry-service` 服务职责卡已建立，实际代码承载路径已在 implementation handoff 中明确。
- public redirect、admin management、target resolver 和 BusinessCard consumption contracts 已冻结。
- 权限码、审计 metadata、VisitEvent 字段限制、IP 使用口径和 unavailable reason 已在 contract 中明确。
- BusinessCard module 已提供并注册 `BUSINESS_CARD` resolver，ShortLink INTERNAL_REF 不再仅限 EXTERNAL_URL slice。
- 实现完成后具备单元 / 集成验证，覆盖 shortCode 唯一性、状态/过期访问、EXTERNAL_URL 安全校验、INTERNAL_REF resolver、target 迁移、VisitEvent best-effort 和 QR 动态生成。
- 文档中的非目标未被实现范围污染。

## 13. Implementation Handoff

实现线程建议输入：

- [public-entry-service.md](../../architecture/services/public-entry-service.md)
- [shortlink-public-entry-design.md](../designs/shortlink-public-entry-design.md)
- [shortlink-public-entry-phase-1.md](./shortlink-public-entry-phase-1.md)
- [public-entry-service contracts](../../contracts/public-entry-service/README.md)
- [employee-digital-business-card.md](./employee-digital-business-card.md)

建议代码承载路径：

```text
src/services/system/public-entry-service
```

原因：

- `public-entry-service` 是平台公开入口能力，不属于 CRM、Sales、WMS 等业务域。
- 现有平台/基础能力服务位于 `src/services/system/*`。
- `pnpm-workspace.yaml` 已包含 `src/services/system/*`。
- 该服务未来可同域承载 `short-link` module 与 `business-card` module，但两者模型隔离。

建议服务结构遵循现有 NestJS 服务模板：

```text
src/services/system/public-entry-service/
  package.json
  prisma/
    schema.prisma
  src/
    application/
      commands/
      queries/
      services/
    domain/
      entities/
      enums/
      errors/
      repositories/
      services/
    infrastructure/
      prisma/
      repositories/
    interfaces/
      grpc/
      http/
    modules/
      short-link/
      business-card/
  test/
```

Phase 1 implementation slice:

- Build `short-link` module first.
- Provide in-process resolver contract / registry.
- Register `BUSINESS_CARD` resolver only when BusinessCard implementation is available.
- Current implementation has registered `BUSINESS_CARD` via `BusinessCardResolverRegistration`; remaining work is integration verification and operational hardening, not resolver construction.

Implementation must not:

- Put ShortLink domain logic in `src/common`.
- Put ShortLink inside CRM or BusinessCard module.
- Let BusinessCard generate shortCode or write VisitEvent.
- Let ShortLink read BusinessCard internal fields or construct BusinessCard URL without resolver.
- Add QRCodeAsset, Campaign, custom domain, A/B routing, or advanced anti-abuse to Phase 1.

Minimum verification expected from implementation thread:

- shortCode generation uniqueness and validation.
- EXTERNAL_URL https-only validation and unsafe protocol rejection.
- ACTIVE / DISABLED / ARCHIVED / expired public redirect behavior.
- INTERNAL_REF resolver success / unavailable / not found mapping.
- target migration preserves shortCode and publicUrl.
- VisitEvent best-effort write does not block redirect.
- List by target returns multiple ShortLinks for one target.
- Basic QR generation uses publicUrl as content and does not create QRCodeAsset.

## 14. Implementation Record

### 14.1 实现范围

本轮已按 Phase 1 范围完成 service / BFF / tenant-web 闭环：

- `src/services/system/public-entry-service`
  - 新增 NestJS service package、`short-link` module、Prisma schema、Prisma repository、in-memory test repository。
  - 实现 ShortLink 创建、详情、按 target 列表、target 迁移、metadata 更新、状态变更、VisitEvent 聚合统计、基础 QR 生成。
  - 实现 `GET /c/{shortCode}` 公开解析的 application service 语义：redirect、not found、disabled、expired、archived、invalid target、resolver error 均按 contract 映射。
  - 实现 in-process target resolver contract / registry；Phase 1 未引入 gRPC resolver。
- `src/common/src/contracts/public_entry_service`
  - 新增 `public_entry.proto` 与 generated contract 入口。
  - 新增 `SERVICE_NAMES.PUBLIC_ENTRY` 与 public-entry ShortLink 权限码常量。
- `src/services/api-gateway/src/modules/public-entry-service`
  - 新增 public redirect BFF endpoint：`GET /c/:shortCode`。
  - 新增 tenant admin BFF endpoints：create、detail、list by target、update target、update metadata、change status、stats、QR payload、QR PNG download。
  - admin endpoints 使用 permission metadata；tenant/operator/trace context 通过 gateway downstream source 传递。
- `app/web/apps/tenant-web`
  - 新增 ShortLink BFF API client。
  - 新增 tenant admin route：`/admin/public-entry-short-links`。
  - 新增管理页面，覆盖列表、创建、详情、禁用 / 启用 / 归档、更新 target、基础统计、二维码查看 / 下载，以及 loading / empty / error 状态。
- 根脚本
  - 新增 `pes` dev shorthand。
  - 将 public-entry-service 纳入 system backend db sync / backend process 编排。

### 14.2 边界与偏移

- ShortLink 未进入 `src/common` 业务模型、CRM、BusinessCard、Barcode / Scan Identity。
- ShortLink 不读取 BusinessCard 内部字段，不拼 BusinessCard URL。
- INTERNAL_REF 只通过 resolver contract；当前实现包含 registry 与 contract tests，真实 `BUSINESS_CARD` resolver 已由 BusinessCard module 接入。
- Phase 1 未实现 QRCodeAsset、二维码模板、Campaign、UTM、A/B、custom domain、custom shortCode、advanced anti-abuse、Scan Router。
- `publicUrl` 由 `PUBLIC_ENTRY_PUBLIC_BASE_URL` + `/c/{shortCode}` 生成；未在数据库中重复存储。

### 14.3 数据影响

- 新增独立 `public-entry-service` Prisma schema：
  - `ShortLink`
  - `VisitEvent`
  - `ShortLinkAuditLog`
  - enum：`ShortLinkTargetKind`、`ShortLinkStatus`、`VisitResultStatus`
- `VisitEvent` 从事件表实时聚合，不建 summary / rollup。
- QR 为动态生成 PNG / base64 payload，不创建 QRCodeAsset。
- 本地验证中创建了独立开发库 `publicentrydb`，避免使用 `mydb` 或其他服务数据库。

### 14.4 Verification Record

已通过：

- `pnpm proto:gen`
- `pnpm --filter @oes/common build`
- `pnpm --filter public-entry-service prisma:generate`
- `pnpm --filter public-entry-service prisma:push`
  - passed；确认 `publicentrydb` 与 Prisma schema already in sync，并成功 regenerate Prisma Client。
- `pnpm --filter public-entry-service lint`
- `pnpm --filter public-entry-service test`
  - 4 suites / 18 tests passed
- `pnpm --filter public-entry-service exec jest --config jest.config.js --runInBand src/__tests__/business-card.application.unit.spec.ts`
  - 1 suite / 10 tests passed
  - 新增覆盖：BusinessCard disabled 后，ShortLink `/c/{shortCode}` 通过 resolver 返回统一不可用，并记录 `INVALID_TARGET` VisitEvent。
- `pnpm --filter public-entry-service build`
- `pnpm --filter public-entry-service smoke`
  - 1 suite / 1 test passed
  - 验证 BusinessCard 配置引用持久化、绑定 `INTERNAL_REF BUSINESS_CARD` ShortLink、public render、`/c/{shortCode}` resolver redirect、VisitEvent 聚合、vCard、审计，以及不持久化上游展示 / 联系方式真相。
- `pnpm --filter api-gateway exec jest --config package.json --runInBand src/app.module.spec.ts src/modules/public-entry-service/public-entry-short-link.service.spec.ts src/modules/public-entry-service/interface/http/controllers/public-entry-short-link.controller.spec.ts`
  - 3 suites / 17 tests passed
- `pnpm --filter api-gateway build`
- `pnpm --dir app/web --filter @oes/tenant-web exec vitest run src/api/bff/public-entry-short-link/index.spec.ts`
  - 1 test passed；Vite 输出 `VITE_APP_TITLE is not defined` 预转换噪音，但命令退出 0
- `pnpm --dir app/web --filter @oes/tenant-web exec vitest run src/modules/tenant-admin/routes.spec.ts`
  - 13 tests passed；同上有非阻断 Vite 噪音
- `pnpm --dir app/web --filter @oes/tenant-web build`
  - build passed；产物包含 `public-entry-short-link-management` chunk
- 数据库替代验证：
  - `prisma migrate diff --from-empty --to-schema-datamodel ./prisma/schema.prisma --script` 可生成 SQL
  - 通过容器内 `psql` 将 SQL 应用到 `publicentrydb`
  - 查询确认 `ShortLink / VisitEvent / ShortLinkAuditLog` 与三个 enum 已存在

未通过 / 已知限制：

- 沙箱内直接运行 `pnpm --filter public-entry-service prisma:push` 曾出现空 `Schema engine error`：
  - 根因定位：`auth-service prisma:push` 在普通执行下通过，是因为该命令前缀已在本地批准列表；`public-entry-service prisma:push` 未批准时落在 Codex 沙箱内，schema-engine 连接 `localhost:5432` 被拦截。
  - 提升权限执行 `pnpm --filter public-entry-service prisma:push` 后通过，说明不是 Prisma 6.4.1、PostgreSQL 18.3 或 public-entry-service schema 的兼容问题。
- 沙箱内直接运行 `pnpm --filter public-entry-service smoke` 曾出现 Prisma `P1001`：
  - 根因定位：同一 Node 进程 TCP 直连 `127.0.0.1:5432` 在沙箱内报 `EPERM`；使用提升权限后 TCP 直连成功，smoke 通过。
  - 结论：该失败为 Codex 沙箱网络权限限制，不是 PostgreSQL、Prisma schema 或 BusinessCard / ShortLink smoke 逻辑问题。
- `pnpm --dir app/web --filter @oes/tenant-web typecheck`
  - 失败于既有无关错误：
    - `src/api/bff/tenant-management/index.spec.ts` 缺少 `employeeCodePrefix`
    - `src/views/admin/item-attribute-detail.vue` / `src/views/admin/item-attribute-management.vue` table column `fixed` 类型不匹配
  - 本轮新增 ShortLink API / route / page 未出现在 typecheck 错误中。
- `pnpm --filter api-gateway lint`
  - 全量 lint 失败于既有大量 type-aware lint 债务与 spec projectService 准入问题；本轮未将其作为关闭门槛。
  - 已新增并通过 public-entry gateway Jest 覆盖，`api-gateway build` 通过。

### 14.5 BusinessCard Resolver Follow-up Review

BusinessCard 实现线程完成后复核结论：

- `BusinessCardResolverRegistration` 已标记 `@Injectable()`，并在 `onModuleInit()` 中执行 `registry.register('BUSINESS_CARD', this.service)`。
- `BusinessCardApplicationService` 实现 `resolve(request)` / `resolveTarget(request)`，满足 ShortLink `ShortLinkTargetResolver` contract。
- resolver 行为：
  - `targetType !== BUSINESS_CARD` 返回 `UNAVAILABLE`。
  - card 不存在返回 `NOT_FOUND`。
  - readiness 不满足返回 `UNAVAILABLE`。
  - readiness 满足返回 `REDIRECT`，redirect URL 由 BusinessCard 应用服务生成。
- 边界判断：
  - ShortLink 仍只通过 `ShortLinkTargetResolverRegistry` 解析 INTERNAL_REF。
  - ShortLink 未读取 BusinessCard 内部字段，未自行拼 BusinessCard URL。
  - BusinessCard owns public render URL / vCard URL / display content；ShortLink owns `/c/{shortCode}` reachability、status、expiry、VisitEvent。
- 已执行验证：
  - `pnpm --filter public-entry-service exec jest --config jest.config.js --runInBand src/__tests__/business-card.module.component.spec.ts src/__tests__/business-card.application.unit.spec.ts src/__tests__/short-link-public-redirect.unit.spec.ts`
    - 3 suites / 19 tests passed
  - `pnpm --filter public-entry-service exec jest --config jest.config.js --runInBand src/__tests__/business-card.application.unit.spec.ts`
    - 1 suite / 10 tests passed
    - 覆盖 BusinessCard disabled / readiness failed 类路径在 `/c/{shortCode}` 下进入统一不可用并记录 `INVALID_TARGET`。
  - `pnpm --filter public-entry-service smoke`
    - 1 suite / 1 test passed
    - 覆盖 BusinessCard 创建 / 绑定 public entry / resolver redirect / VisitEvent stats / vCard / audit 的数据库闭环。
  - `pnpm --filter public-entry-service build`
    - passed

重新判断后的下一步：

- 不再需要新建 BusinessCard resolver 实现任务。
- 联合闭环验收已完成：
  - BusinessCard 创建 / 绑定 public entry 生成 `INTERNAL_REF BUSINESS_CARD` ShortLink。
  - `/c/{shortCode}` 通过 resolver redirect 到 BusinessCard public render URL。
  - BusinessCard disabled / readiness failed 类路径通过 `/c/{shortCode}` 返回统一不可用并记录 `INVALID_TARGET` VisitEvent。
- 剩余运维风险：
  - 需要确保后续线程按已批准的本地 DB 命令运行 `public-entry-service prisma:push` / smoke，避免把沙箱网络限制误判为 Prisma 或 schema 兼容问题。

## 15. 备注

- 本 feature packet 不替代未来 `public-entry-service` 或 `short-link-service` 的稳定服务职责真相源。
- 若后续决定将 ShortLink 独立拆为 `short-link-service`，必须先补 architecture / ADR，再进入拆分实现。
- 若后续需要支持品牌域名，需单独设计 domain binding、证书、CNAME、租户映射与访问解析策略。
