# Employee Digital Business Card

> BusinessCard module 设计过程入口：[employee-digital-business-card-design.md](../designs/employee-digital-business-card-design.md)。本文只记录 Phase 1 feature packet、跨线程分工、依赖与验收；不重新定义 ShortLink / Public Entry、Contact Asset、CRM、HR、Identity 或 Tenant Org 的 owner 真相。

## 1. 目标

- 将员工数字名片 / 二维码名片设计转成可执行 feature packet。
- 建立 `public-entry-service` future `business-card` module 的 Phase 1 主线入口。
- 支持企业为员工提供统一模板的 Web 公开名片，供纸质名片、主二维码和公开链接使用。
- 在不拥有员工主数据、联系方式资产、ShortLink 生命周期或 CRM 线索语义的前提下，提供名片公开展示配置、Contact Action 编排、vCard 与基础访问摘要。

Phase 1 核心结果：

```text
一名 active employee 最多一张 primary BusinessCard。
BusinessCard 只保存配置和引用，不保存展示字段真相。
公开页实时组装 PublicBusinessCardView。
管理员管理，员工只读，CRM 回流不进入 Phase 1。
```

## 2. 不做什么

- 不实现 CRM 回流、LeadDraft、Lead、CustomerAccount 匹配、线索分配或 Activity 归档。
- 不冻结 ShortLink / Public Entry 通用模型、VisitEvent、Campaign、UTM、QRCodeAsset 完整生命周期。
- 不重新定义 Contact Asset / 工作联系方式资产模型；只消费 `identity-service` 与 Contact Asset design 已冻结边界。
- 不把名片二维码并入 Barcode / Scan Identity。
- 不引入 Scan Router。
- 不做 Brand 名片、brandContext、品牌站点名片 owner 或品牌模板。
- 不做多名片、多模板、部门模板、模板市场或员工自定义布局。
- 不做 Published Snapshot；Phase 1 使用实时视图组装。
- 不做小程序 renderer。
- 不做多二维码入口、event / campaign / channel attribution。
- 不做 Product Catalog action、REQUEST_CONTACT、REQUEST_QUOTE 或 BOOK_MEETING。
- 不做员工自助编辑、修改申请 / 审核流或员工查看访问统计。
- 不做批量启用 / 批量禁用。
- 不在当前 feature 中创建或修改服务职责真相源；若 `public-entry-service` 正式成立，另行回写 architecture。

## 3. 上游依赖

- design:
  - [employee-digital-business-card-design.md](../designs/employee-digital-business-card-design.md)
- services:
  - [public-entry-service.md](../../architecture/services/public-entry-service.md)
  - [hr-service.md](../../architecture/services/hr-service.md)
  - [identity-service.md](../../architecture/services/identity-service.md)
  - [asset-service.md](../../architecture/services/asset-service.md)
  - [tenant-org-service.md](../../architecture/services/tenant-org-service.md)
  - [party-service.md](../../architecture/services/party-service.md)
  - [crm-service.md](../../architecture/services/crm-service.md)
- resolved external dependencies:
  - Contact Asset / Work Contact Asset design and identity-service truth source:
    - [contact-asset-design.md](../designs/contact-asset-design.md)
    - [identity-service.md](../../architecture/services/identity-service.md)
  - ShortLink / Public Entry Phase 1 design, service responsibility, feature packet and contracts
- consumed contracts:
  - [shortlink-public-redirect.md](../../contracts/public-entry-service/shortlink-public-redirect.md)
  - [shortlink-admin-management.md](../../contracts/public-entry-service/shortlink-admin-management.md)
  - [shortlink-target-resolver.md](../../contracts/public-entry-service/shortlink-target-resolver.md)
  - [business-card-management.md](../../contracts/public-entry-service/business-card-management.md)
  - [business-card-self-view.md](../../contracts/public-entry-service/business-card-self-view.md)
  - [business-card-public-render.md](../../contracts/public-entry-service/business-card-public-render.md)
  - [employee-official-photo.md](../../contracts/asset-service/employee-official-photo.md)

## 4. 当前结论

- BusinessCard module 属于 future `public-entry-service`，与 ShortLink / Public Entry module 同服务但模型隔离。
- BusinessCard owns what is shown.
- ShortLink owns how the public entry is reached, governed, tracked, expired, and redirected.
- BusinessCard 不拥有员工、任职、姓名、英文名、职位文案、公司名、头像、联系方式资产、登录标识、ShortLink 生命周期或 CRM 客户回流真相。
- 员工数字名片头像来源固定为 HR Employee 公开展示头像：`officialPhotoUrl`。
- 账号头像 / 个人中心头像属于账号资料，不得作为员工数字名片头像 fallback。
- 员工公开展示头像为空时，名片 renderer 必须展示正式占位或姓名首字母占位。
- Phase 1.1 员工公开展示头像由 HR / 租户管理员在员工管理内维护，员工本人不能在个人中心修改该头像。
- Phase 1 每个 active employee 最多一张 primary BusinessCard。
- 系统可为符合条件员工自动生成 `DRAFT / DISABLED` 名片，但公开启用必须由管理员逐张确认。
- Phase 1 只绑定一个主 Public Entry / 主二维码。
- BusinessCard 只保存配置和引用：
  - `status`
  - `templateKey`
  - `publicEntryRef`
  - `contactActionConfigs`
  - `visibilityConfig`
  - audit metadata
- 公开展示字段实时来自 HR、Identity / Contact Asset、Tenant Org / tenant profile、Party 摘要和 ShortLink。
- 其中头像字段只来自 HR Employee 摘要的 `officialPhotoUrl`；Public Entry、tenant-web 与公开页不得从 `identity-service` account avatar 拼装或补齐。
- Phase 1 默认租户名片，不引入 brand。
- Phase 1 使用系统内置统一模板 `TENANT_STANDARD` 与租户级最小模板 token。
- Phase 1 支持系统预置 Contact Actions：
  - `CALL_PHONE`
  - `SEND_EMAIL`
  - `ADD_WECHAT`
  - `OPEN_WHATSAPP`
  - `SAVE_VCARD`
  - `OPEN_COMPANY_WEBSITE`
- BusinessCard 不支持 custom link action，按钮文案由 renderer 根据 action type 与 locale 渲染。
- vCard 只能包含公开名片页当前允许展示的字段。
- Phase 1 允许纯展示型名片，不要求至少一个联系方式。
- 员工 offboarded 后 BusinessCard 必须自动停止公开展示。
- 公网不可访问原因统一模糊提示，后台可显示具体 readiness / resolver reason。

## 5. 契约真相位置

BusinessCard Phase 1 contracts 已建立：

- [business-card-management.md](../../contracts/public-entry-service/business-card-management.md)
- [business-card-self-view.md](../../contracts/public-entry-service/business-card-self-view.md)
- [business-card-public-render.md](../../contracts/public-entry-service/business-card-public-render.md)

这些 contracts 覆盖：

- BusinessCard management:
  - admin list cards
  - admin get card detail
  - admin enable / disable card
  - admin update Contact Action config
  - admin run readiness check
  - admin get primary visit summary
- BusinessCard employee self-view:
  - employee get own card preview
  - employee get own public URL / main QR
  - employee get own card status and enabled actions
- BusinessCard public render:
  - resolve public card by target reference
  - render `PublicBusinessCardView`
  - generate vCard from visible fields
  - return generic unavailable state
- BusinessCard internal dependencies:
  - consume ShortLink main Public Entry reference, public URL, QR content, lightweight visit summary
  - consume Contact Asset references, ownership, status and public-safe value summaries according to [contact-asset-design.md](../designs/contact-asset-design.md) and [identity-service.md](../../architecture/services/identity-service.md)
  - consume HR active employee summary
  - consume tenant / company display summary

ShortLink / Public Entry 已冻结可消费 contract，BusinessCard contract 后续必须引用以下最小口径：

- target reference:
  - `targetKind = INTERNAL_REF`
  - `targetType = BUSINESS_CARD`
  - `targetResourceId = businessCardId`
  - `tenantId` required
- local `publicEntryRef` shape:
  - `publicEntryId`
  - `shortCode`
  - `publicUrl`
  - `qrContent`
  - `status`
  - `expiresAt`
- ShortLink status:
  - `ACTIVE`
  - `DISABLED`
  - `ARCHIVED`
  - expired is evaluated by `expiresAt < now`
- resolver result:
  - `REDIRECT`
  - `UNAVAILABLE`
  - `NOT_FOUND`
- public redirect result status that may appear in visit summary:
  - `REDIRECTED`
  - `DISABLED`
  - `EXPIRED`
  - `ARCHIVED`
  - `INVALID_TARGET`
- lightweight visit summary:
  - `shortLinkId`
  - `totalVisits`
  - `byResultStatus`
  - `byDetectedChannel`
  - `byDeviceType`
  - `lastVisitedAt`

BusinessCard resolver mapping:

- card can render -> `REDIRECT + redirectUrl`
- card exists but not public -> `UNAVAILABLE`
- card missing / tenant mismatch -> `NOT_FOUND`

BusinessCard Phase 1 must not depend on full campaign management, full VisitEvent model, UTM, A/B routing, custom shortCode, custom short domain, QRCodeAsset, QR visual template, WeChat mini program deep routing, precise geo analytics, advanced anti-abuse, Scan Router, generic public form, or CRM LeadDraft auto creation.

### 5.1 `BUSINESS_CARD` Target Resolver Semantics

BusinessCard module provides the Phase 1 `BUSINESS_CARD` target resolver used by ShortLink `INTERNAL_REF` public redirect.

Resolver input:

```json
{
  "tenantId": "tenant_001",
  "targetType": "BUSINESS_CARD",
  "targetResourceId": "card_001",
  "requestContext": {
    "userAgent": "Mozilla/5.0 ...",
    "detectedChannel": "BROWSER",
    "deviceType": "MOBILE",
    "locale": "zh-CN",
    "referrer": "https://example.com/page",
    "traceId": "trace_public_001"
  }
}
```

Input rules:

- `tenantId` comes from the resolved ShortLink record, not from the anonymous request.
- `targetResourceId` is the BusinessCard id.
- Resolver does not trust anonymous request tenant or target identity.
- `requestContext` is advisory for public URL selection, locale fallback, diagnostics, and trace.

Resolver output:

```json
{
  "result": "REDIRECT",
  "redirectUrl": "https://app.oes.com/public/business-cards/card_001",
  "resultTarget": "business-card:web"
}
```

Allowed results:

- `REDIRECT`: card can render; `redirectUrl` required; `resultTarget = business-card:web`。
- `UNAVAILABLE`: card exists but should not be public; no `redirectUrl`; `resultTarget = business-card:unavailable`。
- `NOT_FOUND`: card missing or tenant mismatch; no `redirectUrl`; `resultTarget = business-card:not-found`。

`REDIRECT` requires:

- card exists.
- card belongs to `tenantId`.
- card status allows public access.
- employee active / not offboarded.
- required display data resolvable.
- template available.
- public render readiness passes.
- public page route can be generated.

`UNAVAILABLE` covers:

- card disabled / not public.
- employee offboarded.
- readiness check failed.
- required upstream data temporarily unavailable.
- template unavailable.
- public render readiness cannot pass.

`NOT_FOUND` covers:

- `businessCardId` does not exist.
- `businessCardId` does not belong to `tenantId`.
- tenant mismatch, mapped to `NOT_FOUND` to avoid cross-tenant existence disclosure.

Public URL rules:

- BusinessCard resolver owns public BusinessCard page URL construction.
- ShortLink must not construct BusinessCard URLs or copy BusinessCard route knowledge.
- `redirectUrl` must be anonymous-accessible and must not contain internal tenant id, employee identity, contact values, or sensitive fields.
- Phase 1 does not use locale/device/channel for complex multi-end routing or WeChat mini program deep routing.

VisitEvent mapping:

- BusinessCard resolver does not write VisitEvent.
- ShortLink maps resolver result:
  - `REDIRECT -> REDIRECTED`
  - `UNAVAILABLE -> INVALID_TARGET`
  - `NOT_FOUND -> INVALID_TARGET`
- BusinessCard resolver returns only resolver result, optional `redirectUrl`, and `resultTarget`.

vCard or individual Contact Action unavailability does not by itself block public page redirect; BusinessCard public render should hide unavailable optional actions unless required display data or safe public render readiness fails.

### 5.2 员工公开展示头像边界

本节冻结员工数字名片头像来源，用于关闭“账号头像是否可作为 fallback”的歧义。

Owner 边界：

- `hr-service` owns 员工公开展示头像引用与展示 URL，字段口径以 [hr-service.md](../../architecture/services/hr-service.md) 为准。
- Asset 服务 owns 图片文件、对象存储、文件校验、URL 生成与资产生命周期；HR 只保存 `officialPhotoAssetId` 与 `officialPhotoUrl`。
- `identity-service` owns account avatar / 个人中心头像；该头像不参与 BusinessCard public render。
- `public-entry-service` BusinessCard module 只消费 HR Employee 摘要中的 `officialPhotoUrl`。
- `tenant-web` 只展示后端返回的 `officialPhotoUrl` 或正式占位，不在前端混用账号头像。

字段与展示规则：

- HR Employee summary exposes:
  - optional `officialPhotoAssetId`
  - optional `officialPhotoUrl`
- PublicBusinessCardView exposes:
  - optional `officialPhotoUrl`
- 当 `officialPhotoUrl` 为空：
  - 员工详情 BusinessCard tab 预览显示正式占位。
  - 个人中心“我的名片”显示正式占位。
  - 匿名公开页显示正式占位。
  - vCard 不输出账号头像。
- 当 `visibilityConfig.showOfficialPhoto = false` 时，PublicBusinessCardView 不返回 `officialPhotoUrl`，即使 HR 已配置公开展示头像。

管理入口：

- 租户管理员在员工管理 / 员工详情 / 名片 tab 内维护公开展示头像。
- tab layout:
  - 左侧：当前电子名片预览。
  - 右侧：紧凑的公开展示头像设置。
  - 上传或移除后立即更新左侧预览。
  - 文案：`该头像将用于员工数字名片和公开展示页面`。
- 员工个人中心只展示自己的名片，不提供公开展示头像编辑能力。

禁止规则：

- 禁止 public-entry-service adapter 从 `accountProfile.avatarUrl` 映射 `officialPhotoUrl`。
- 禁止 API Gateway / tenant-web 在 HR 头像为空时读取 account avatar 作为替代。
- 禁止 BusinessCard 持久化头像文件、账号头像或 HR 公开头像以外的头像真相。

Permission 线程已确认 BusinessCard Phase 1 权限口径；BusinessCard contracts 只引用权限码与授权边界，不重新定义 permission-service 模型。

Confirmed admin permission codes:

- `public-entry.business-card.read`
- `public-entry.business-card.manage`
- `public-entry.business-card.enable`
- `public-entry.business-card.disable`
- `public-entry.business-card.public-entry.manage`
- `public-entry.business-card.stats.read`

Not Phase 1 permission codes:

- `public-entry.business-card.preview`: admin preview / readiness diagnostics are covered by `read`; public preview does not use permission-service.
- `public-entry.business-card.self.read`: employee self-view uses authenticated self-bound access, not RBAC permission.

Admin authorization uses:

- `checkPermission`
- tenant isolation
- BusinessCard domain rules

Phase 1 admin scope:

- 管理员默认拥有租户内全量 BusinessCard 管理范围。
- 只要 operator 在当前 tenant 下拥有对应 `public-entry.business-card.*` 权限码，即可访问 / 管理该 tenant 内所有员工名片。
- Phase 1 不做 org subtree、department、employee-owner 或 HR employee scope 精细限制。
- Cross-tenant card ids 必须按 tenant isolation 拒绝或映射为 not found。

Public anonymous render and vCard download do not call permission-service.

## 6. 线程分工

| Thread / Owner | 职责 | 允许修改路径 | 输入 | 输出 | 状态 |
| --- | --- | --- | --- | --- | --- |
| BusinessCard feature owner | 维护本文，收敛 Phase 1 feature scope、阻塞项、验收标准与跨线程依赖 | `docs/plans/features/employee-digital-business-card.md`, 必要时 `docs/plans/designs/employee-digital-business-card-design.md` | BusinessCard design workspace、ShortLink / Contact Asset 线程结论 | feature packet 与后续 contract / implementation handoff | active |
| ShortLink / Public Entry design owner | 已冻结可供 BusinessCard 消费的主 Public Entry、public URL、QR content、visit summary 与 target reference 边界 | `docs/architecture/services/public-entry-service.md`, `docs/contracts/public-entry-service/**`, `docs/plans/features/shortlink-public-entry-phase-1.md` | BusinessCard consumption needs | ShortLink 可消费边界，不重定义 BusinessCard | resolved / ready-for-consumption |
| Contact Asset design owner | 已冻结工作联系方式资产 owner、引用、状态、员工离职回收和 BusinessCard action target 关系 | `docs/plans/designs/contact-asset-design.md`, `docs/architecture/services/identity-service.md`, `docs/architecture/services/auth-service.md` | 名片 Contact Actions 需求、Identity / HR 边界 | Contact Asset 可消费边界，不把联系方式资产塞进 BusinessCard | resolved / ready-for-consumption |
| contract owner | 已冻结 BusinessCard management、self-view、public render 和依赖消费 contract | `docs/contracts/**`, future proto / BFF contract paths | 本 feature packet、外部依赖边界 | 可实现黑盒契约 | completed / frozen for Phase 1 |
| implementation owner | 在 contract 冻结后实现 BusinessCard runtime、BFF、tenant-web 管理端和公开页 | future `public-entry-service` / gateway / tenant-web paths | feature packet、contracts、service responsibility | 可运行 Phase 1 能力 | implemented locally / live stack smoke passed |
| review / integration owner | 检查 owner 边界、权限、审计、离职不可公开、公开页隐私和跨服务依赖 | 只读全局，必要时最小修正 | contracts、implementation、tests | review 结论与关闭判断 | pending |

## 7. 当前 slice

- slice:
  - V1A: Employee Digital Business Card Phase 1 planning and dependency alignment
- status:
  - feature-packet-contracts-frozen / backend-bff-tenant-web-slice-implemented / upstream-adapters-implemented / db-synced / service-smoke-passed / full-live-stack-smoke-passed
- scope:
  - BusinessCard module feature packet
  - Phase 1 管理端、员工只读、公开页、vCard、主二维码和基础访问摘要范围
  - Contact Asset 依赖已收敛为可消费边界
  - ContactAction targetRef、Contact Asset public-safe summary、vCard 与 Company Website 边界
  - ShortLink / Public Entry 依赖已可进入 BusinessCard contract consumption
- ready definition:
  - 本 feature packet 已建立
  - BusinessCard owner / does-not-own 边界已明确
  - Phase 1 scope 与 non-goals 已明确
  - Contact Asset 依赖已有 design workspace 与 service truth source，可供 BusinessCard contract 消费
  - ShortLink 依赖已有 service truth、feature packet 与 contracts，可供 BusinessCard contract 消费
  - BusinessCard management / self-view / public render contracts 已冻结
  - Permission 口径已确认并回写
  - permission-service foundation seed 已发布 `public-entry.short-link.*` 与 `public-entry.business-card.*` 权限码，owner module 为 `PUBLIC_ENTRY_SERVICE`；tenant admin template 已授予 ShortLink / BusinessCard Phase 1 管理权限；本地 `permissiondb` 已完成 `prisma:push` 与 `seed:apply`
  - public-entry-service BusinessCard application / gRPC / Prisma config persistence 已建立
  - API Gateway BusinessCard BFF 与 tenant-web 管理/self/public 页面初版已建立
  - 真实 HR / Identity Contact Asset / Tenant Org gRPC upstream adapter 已接入：HR employee lifecycle / active employment、Identity employee account binding / account profile / work email / work phone Contact Asset、Tenant Org tenant / org reference summary
  - `public-entry-service smoke` 已覆盖真实 Prisma DB 下的 BusinessCard config/ref persistence、ShortLink bind/redirect/VisitEvent stats、public render、vCard、BusinessCard audit 与“不持久化展示/联系方式真相”检查
  - `public-entry-service test` 已与 DB-backed `test/smoke` 和真实服务 `test/live` 分离；默认 test 只跑 l1/l3 等普通 Jest suites，DB smoke 通过 `public-entry-service smoke` 显式运行，live-stack readiness 通过 `public-entry-service smoke:live-preflight` 显式运行
  - BusinessCard application tests 已覆盖每个管理端操作使用独立 Phase 1 permission code、deny 后不写配置 / 不写审计；Permission adapter tests 已覆盖 Phase 1 tenant-wide admin scope，同租户内不做 org/employee 细分，跨租户 resource facts 直接拒绝
  - tenant-web route tests 已覆盖 BusinessCard admin、自助查看与匿名公开页路由注册；自助查看主路径为 `/admin/business-card-self-view`，并保留 `/admin/business-card-self` alias
  - 匿名 vCard public path 已与 public render contract 对齐为 `/public-entry/public/business-cards/{businessCardId}.vcf`；API Gateway 保留 `/vcard.vcf` 兼容 alias
  - `SAVE_VCARD` action URL 已由 public-entry-service public render 输出，tenant-web 公开页直接消费 `actionUrl`，不再在 renderer 中补造 vCard URL
  - API Gateway BusinessCard BFF service tests 已覆盖 employee self-view 从 authenticated account context 派生、不传 employee/card id，且匿名 public render / vCard 不携带 tenant / operator context
  - tenant-web public BusinessCard page component tests 已覆盖 generic unavailable 不泄露内部原因，以及可用名片直接渲染 contract-provided public action href / vCard href
  - tenant-web employee self-view page component tests 已覆盖只按当前 tenant 调用 self endpoint、不传 employee/card id，且缺少 tenant context 时不调用 API
  - tenant-web admin BusinessCard management page component tests 已覆盖 Contact Action 配置保存 ref-only payload、不提交联系方式正文、tenant-scoped public entry / stats / enable / disable API 调用，以及缺少 tenant context 时不调用管理 API
  - 2026-06-08 当前验证：`permission-service test:l1`、`permission-service build`、`permission-service prisma:push`、`permission-service seed:apply -- --apply`、`@oes/common build`、`public-entry-service test`、`public-entry-service build`、`public-entry-service smoke`、API Gateway public-entry module Jest、`api-gateway build`、tenant-web BusinessCard focused component/API/route tests、`@oes/tenant-web typecheck`、`node --test scripts/local/business-card-live-fixtures.spec.mjs scripts/local/tenant-web-auth-test-fixtures.spec.mjs` 均通过
  - 2026-06-08 live-stack fixture env 已可由 `node scripts/local/business-card-live-fixtures.mjs` 从 tenant-web auth / HR / Identity seed 推导，覆盖 `BUSINESS_CARD_LIVE_TENANT_ID / EMPLOYEE_ID / OPERATOR_ACCOUNT_ID / SELF_ACCOUNT_ID / WORK_EMAIL_CONTACT_ASSET_ID`
  - 2026-06-08 live-stack 预检与全链路 smoke 已具备同一入口：`public-entry-service smoke:live-preflight` 先检查 Permission / Identity / Tenant Org / HR / Public Entry / API Gateway 真实端点和 BusinessCard fixture env，再通过 public-entry-service gRPC 执行 BusinessCard management、Contact Action ref-only 配置、bind public entry、enable、detail/readiness、public render、vCard、employee self-view、ShortLink public redirect 与 visit summary
  - 2026-06-08 live-stack 证据：`env $(node scripts/local/business-card-live-fixtures.mjs) pnpm --filter public-entry-service smoke:live-preflight` 通过；输出 `businessCardId=299cc6cf-2e55-407b-b491-d694c12747df`、`shortCode=sctGfcF`、`publicUrl=http://localhost:5771/c/sctGfcF`、`publicRenderState=AVAILABLE`、`selfPreviewState=AVAILABLE`、`vCardContentType=text/vcard`、`visitTotal=1`
  - BusinessCard Phase 1 已不依赖 permission resource/query-scope gRPC 表达；该能力仍可作为 permission-service 平台后续议题推进，但不是 BusinessCard Phase 1 剩余项

## 8. 主线范围

- 本 feature 主线：
  - 建立 BusinessCard Phase 1 可执行协作面板。
  - 消费 ShortLink / Public Entry 已冻结的主入口边界。
  - 消费 Contact Asset 已冻结的 target / ownership / status / public-safe summary 边界。
  - 后续转入 implementation handoff。
- 本 feature 不做：
  - 直接实现代码。
  - 在 BusinessCard 内临时保存 phone / email / WeChat / WhatsApp 值作为长期字段。
  - 在 BusinessCard 内实现 ShortLink、Contact Asset 或 CRM 回流模型。
  - 将 Brand、Campaign、Product Catalog、Public Form 等能力并入当前 feature。
- 偏移返回条件：
  - 若实现需要 BusinessCard 保存员工姓名、英文名、title、公司名或联系方式值作为真相，暂停并回到设计。
  - 若实现需要 BusinessCard 管理多个二维码入口或来源归因，暂停并转 ShortLink / Campaign 设计。
  - 若实现需要创建 CRM LeadDraft 或处理现有客户回流，暂停并转 CRM collaboration 设计。
  - 若实现需要定义 Contact Asset lifecycle，暂停并转 Contact Asset 线程。
  - 若实现需要正式建立 `public-entry-service` 服务职责，先更新 architecture / service truth source。

## 9. 阻塞 / 依赖

- Blocker-Later:
  - HR / Party / Tenant Org 需要明确英文名、title、companyDisplayName 多语言字段的上游可用性；缺失时 Phase 1 fallback default，不阻塞名片基础能力。
  - Tenant template token 的 owner 需要在实现交接前明确，是 BusinessCard module 本地 tenant config，还是消费 tenant profile / future public profile。
- Active Follow-up:
  - 员工公开展示头像已冻结为 HR-owned `officialPhotoUrl`，需要按实施计划补齐 HR schema / proto / gateway / Public Entry adapter / tenant-web 员工详情 UI。
- Sidecar:
  - CRM 回流 / LeadDraft。
  - Campaign / source / event attribution。
  - Brand 名片。
  - Product Catalog action。
  - Published Snapshot。
  - 小程序 renderer。
  - 员工修改申请 / 审核流。

## 10. 派生问题 Ledger

| 时间 | 问题 | 分类 | 当前影响 | 处理策略 | 目标落点 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-06-08 | Contact Asset 引用、状态、ownership、离职回收与 BusinessCard action target 关系已冻结 | Resolved Dependency | `CALL_PHONE / SEND_EMAIL / ADD_WECHAT / OPEN_WHATSAPP` 可在 BusinessCard contracts 中引用 Contact Asset target / ownership / status / public-safe summary 边界 | BusinessCard 只消费引用与状态，不重新定义联系方式资产；`SAVE_VCARD` 由 public view 组装，`OPEN_COMPANY_WEBSITE` 来自 tenant / company public profile | [contact-asset-design.md](../designs/contact-asset-design.md) / [identity-service.md](../../architecture/services/identity-service.md) | ready-for-consumption |
| 2026-06-08 | ShortLink / Public Entry 主入口消费边界已冻结，BusinessCard contracts 已对齐消费 | Resolved Dependency | 不再阻塞 BusinessCard contract planning；实现前按 ShortLink contract 消费主入口能力 | BusinessCard contract owner 引用 ShortLink contracts，不定义通用模型 | `docs/contracts/public-entry-service/**` | ready-for-consumption |
| 2026-06-08 | BusinessCard `BUSINESS_CARD` target resolver 语义已冻结 | Resolved Dependency | 不再阻塞 ShortLink INTERNAL_REF 闭环设计；BusinessCard public render contract 已承接 public URL 与 readiness 细节 | BusinessCard contract owner 将 resolver semantics 写入 public render / target resolver handoff | BusinessCard public render contract | ready-for-consumption |
| 2026-06-08 | BusinessCard management / self-view / public render contract 已建立 | Resolved Dependency | Contract handoff 已具备；实现前仍需按实际 transport / proto / BFF 形状落地 | 引用 `docs/contracts/public-entry-service/business-card-*.md` | `docs/contracts/public-entry-service/**` | ready-for-consumption |
| 2026-06-08 | 名片管理权限码与 employee self-view 访问口径已由 permission 线程确认 | Resolved Dependency | 不再阻塞 BusinessCard implementation handoff；实现时按 management / self-view contract 执行 | BusinessCard 管理端使用 confirmed admin permission codes；employee self-view 使用 authenticated self-bound access；public render / vCard 不进 permission-service | BusinessCard contracts / permission implementation handoff | ready-for-consumption |
| 2026-06-08 | permission-service foundation seed 未发布 Public Entry / BusinessCard 权限码 | Resolved Implementation Issue | 若真实 permission-service 使用 foundation seed 启动，BusinessCard 管理端 `CheckPermission` 会因缺少 `public-entry.*` 权限码 / tenant admin role binding 而 fail-closed，导致 live-stack 管理闭环无法验证 | 新增 `PUBLIC_ENTRY_SERVICE` permission module；permission catalog 发布 ShortLink 与 BusinessCard Phase 1 权限码；common permission-code generator 回写 `src/common`；tenant admin template 授予 ShortLink / BusinessCard 管理权限；已运行 `permission-service prisma:push` 与 `seed:apply -- --apply` | permission-service seed / common permission codes / local permissiondb | resolved |
| 2026-06-08 | BusinessCard Phase 1 管理范围确认为 tenant-wide | Resolved Scope Decision | BusinessCard Phase 1 不再等待 permission-service 跨服务 resource/query-scope gRPC；管理员拥有租户内所有名片访问与管理范围，但仍必须具备对应权限码 | Runtime 保持 `CheckPermission` RBAC + tenant isolation + fail-closed；adapter 补充跨租户 resource facts 直接拒绝测试；org subtree / employee scope 若未来需要，作为后续版本单独设计 | BusinessCard management contract / adapter tests | resolved |
| 2026-06-08 | permission-service `checkResource / buildQueryScope` 当前为 service 内 application facade，尚无可跨服务消费的专用 gRPC contract | Platform Future Issue | 不影响 BusinessCard Phase 1；该能力只影响未来需要 org subtree / employee scope / complex resource policy 的业务能力 | 保留为 permission-service 平台后续议题，不作为 BusinessCard Phase 1 open issue 或交付阻塞 | permission-service contract | deferred |
| 2026-06-08 | 英文名、title、companyDisplayName 多语言上游可用性未确认 | Blocker-Later | 不阻塞基础名片；影响海外展示质量 | 上游缺失时 fallback default；后续由 HR / Party / Tenant Org 线程补齐 | upstream service design | open |
| 2026-06-08 | Identity Contact Asset query contract 已描述 `ResolveContactActionTargets / ListAccountContactAssets`，但当前 `identity_query.proto` 只落地 `ListAccountWorkEmailAssets / ListAccountWorkPhoneAssets` | Open Implementation Issue | BusinessCard runtime 当前可正式解析 `SEND_EMAIL / CALL_PHONE`；`ADD_WECHAT / OPEN_WHATSAPP` 在无正式 gRPC resolver 前按 Contact Asset unavailable 隐藏，不返回正文值 | 待 identity-service 将 Contact Asset public-safe resolver gRPC contract 落地后，替换 BusinessCard Contact Asset adapter 的 email/phone-only 实现 | identity-service proto / BusinessCard adapter | open |
| 2026-06-08 | `prisma db push` 在 sandbox 内返回空 `Schema engine error` / `P1001` | Resolved Implementation Issue | 根因是 sandbox 下 Prisma schema-engine 访问本地 Postgres 受限；schema validate 通过，Postgres `publicentrydb` 可访问且现有 ShortLink 表结构与 schema 匹配 | 使用已批准的提升权限重跑 `pnpm --filter public-entry-service prisma:push`，DB 已同步并生成 Prisma Client | public-entry-service DB sync | resolved |
| 2026-06-08 | BusinessCard DB smoke spec 被默认 `public-entry-service test` 误纳入 | Resolved Implementation Issue | 默认 Jest `testMatch` 覆盖 `test/**/*.spec.ts`，新增 `test/smoke/business-card.smoke.spec.ts` 后普通测试会在 sandbox 内访问 local Postgres 并触发 `P1001`；根因是测试分层入口不清晰，不是业务实现失败 | `public-entry-service test` 增加 `--testPathIgnorePatterns=test/smoke`，DB-backed suite 继续由 `public-entry-service smoke` / `test:smoke` 显式运行；已分别验证 default test 与 smoke | public-entry-service test scripts | resolved |
| 2026-06-08 | BusinessCard application 层缺少独立 permission code / deny 后不变更的直接测试证据 | Resolved Implementation Issue | Controller metadata 与 permission adapter 已有覆盖，但 application service 本身没有直接断言 list/read/manage/enable/disable/public-entry.manage/stats.read 的独立授权调用，验收证据偏间接 | 补充 `business-card.application.spec.ts`，覆盖每个 admin operation 的 Phase 1 permission code，以及 resource-denied 时拒绝 mutation 且不新增命令审计 | public-entry-service l1 tests | resolved |
| 2026-06-08 | tenant-web BusinessCard 页面路由缺少直接测试，且员工 self-view URL 命名不够明确 | Resolved Implementation Issue | 管理端与公开页 API 有测试，浏览器也能看到 auth redirect / public unavailable，但 route registration 没有直接验收证据；self-view route 使用 `/admin/business-card-self`，与页面和 contract 的 self-view 口径不完全一致 | 补充 route specs，确认 admin/self/public page registration；主路径调整为 `/admin/business-card-self-view`，并保留 `/admin/business-card-self` alias 兼容既有入口 | tenant-web routes | resolved |
| 2026-06-08 | public vCard download path 与 contract 示例不一致 | Resolved Implementation Issue | Contract 示例使用 `/public/business-cards/{businessCardId}.vcf`，tenant-web 与 API Gateway 初版使用 `/public-entry/public/business-cards/{businessCardId}/vcard.vcf`；虽能互通，但公开黑盒路径与 contract 口径不一致 | tenant-web `resolveBusinessCardVCardUrl` 改为 `.vcf`；API Gateway `downloadVCard` 同时接受 `.vcf` 与旧 `/vcard.vcf` alias；补充 gateway path metadata 与 web API tests | API Gateway / tenant-web public vCard | resolved |
| 2026-06-08 | `SAVE_VCARD` action URL 由 tenant-web 公开页本地补造，未完全体现 public render contract | Resolved Implementation Issue | Contract 将 vCard 作为公开 Contact Action 输出的一部分；service 初版只返回 `SAVE_VCARD` action type / order，tenant-web 使用本地 fallback 拼 URL，导致 renderer 承担了协议修补职责 | public-entry-service public render 为 `SAVE_VCARD` 输出 `.vcf` `actionUrl`；tenant-web public page 改为直接使用 action `actionUrl`；补充 l1 public render assertion | public-entry-service / tenant-web public render | resolved |
| 2026-06-08 | API Gateway BusinessCard BFF service 缺少 self-view / anonymous public mapping 的直接测试证据 | Resolved Implementation Issue | Controller metadata 与 tenant-web API 已覆盖一部分，但 BFF service 层没有直接断言 self-view 只从 account claims 派生、不传 employee/card id，也没有直接断言 public render / vCard 为 anonymous internal calls | 补充 `public-entry-business-card.service.spec.ts`，覆盖 self-view accountId 派生、Contact Action ref enum mapping 不含 contact value、public render / vCard 不携带 tenantId / operatorContext | API Gateway BusinessCard BFF service | resolved |
| 2026-06-08 | tenant-web 公开名片页缺少组件级 public render 验收证据 | Resolved Implementation Issue | 公开页此前有 API test 与 browser smoke，但没有组件测试直接证明 generic unavailable 不泄露内部原因，或可用名片使用 contract-provided action href / vCard href | 补充 `business-card-public.spec.ts`，覆盖 unavailable 文案、内部 readiness reason 不渲染、可用名片 actions href 直接来自 public render view 且不调用本地 vCard URL fallback | tenant-web public BusinessCard page | resolved |
| 2026-06-08 | tenant-web 员工 self-view 页面缺少组件级 self-bound 验收证据 | Resolved Implementation Issue | API client 与 BFF service 已证明 self endpoint 不传 employee/card id，但页面组件没有直接证明只按当前 tenant 调用 self endpoint，也没有证明缺少 tenant context 时不会发起 API 调用 | 补充 `business-card-self-view.spec.ts`，覆盖 tenant-only self API call、不包含 employeeId/businessCardId、展示 publicUrl/actions，以及 tenant context 缺失时展示错误并跳过 API | tenant-web employee self-view page | resolved |
| 2026-06-08 | tenant-web 管理页缺少组件级管理闭环验收证据 | Resolved Implementation Issue | 管理页初版已有 API client 与 route 覆盖，但没有组件测试直接证明 Contact Action 配置只提交引用、不提交电话/邮箱/WeChat/WhatsApp 正文，也没有证明 public entry / stats / enable / disable 调用保持 tenant-scoped | 补充 `business-card-management.spec.ts`，覆盖初始 list/detail/stats 加载、Contact Action ref-only save payload、public entry bind、enable/disable，以及缺少 tenant context 时跳过管理 API | tenant-web admin BusinessCard management page | resolved |
| 2026-06-08 | Public Entry 启动时 `BusinessCardResolverRegistration` 依赖注入为空 | Resolved Implementation Issue | live stack 启动 public-entry-service 时触发 `Cannot read properties of undefined (reading 'register')`，根因是该 resolver registration provider 缺少 Nest injectable metadata，导致构造函数依赖未注入 | 将 `BusinessCardResolverRegistration` 标记为 `@Injectable()` 并导出以便测试；补充 `business-card.module.spec.ts` 直接断言 resolver registration 构造函数注入 metadata；重新 build 后 public-entry-service 可启动 | public-entry-service BusinessCard module | resolved |
| 2026-06-08 | 全 live stack BusinessCard smoke 已通过 | Resolved Integration Issue | 已启动 Permission / Identity / Tenant Org / HR / Public Entry / API Gateway，并用 tenant-web auth / HR / Identity seed 推导 BusinessCard live fixture env；live smoke 通过 public-entry-service gRPC 走真实下游服务链路 | 新增 `business-card-live-smoke.ts`、l1 harness tests 与 `test/live/business-card-live-smoke.live.spec.ts`；`public-entry-service smoke:live-preflight` 现在同时执行端点/fixture preflight 与全链路 BusinessCard live smoke | full live-stack smoke / integration fixture | resolved |
| 2026-06-16 | 员工数字名片头像来源与账号头像混用风险 | Boundary Fix | 当前实现曾从 account profile avatar 映射 `officialPhotoUrl`，会把用户自维护账号头像误用为员工正式公开照片 | 冻结 HR Employee 公开展示头像字段；Public Entry 只消费 HR `officialPhotoUrl`；前端只展示 `officialPhotoUrl` 或正式占位；员工详情名片 tab 提供管理员维护入口 | [hr-service.md](../../architecture/services/hr-service.md) / [management.md](../../contracts/hr-service/management.md) / [query.md](../../contracts/hr-service/query.md) / implementation plan | planned |
| 2026-06-08 | CRM 回流 / LeadDraft | Sidecar | 不进入 Phase 1，不阻塞名片展示 | 后续单独设计，不在当前 feature 中定义字段或流程 | future CRM collaboration | deferred |
| 2026-06-08 | 多入口 source / event / campaign tracking | Sidecar | 不进入 Phase 1；当前只显示主入口基础统计 | 由 ShortLink / Campaign 设计，不由 BusinessCard 管理 | future ShortLink / Campaign design | deferred |

## 11. 验收标准

Phase 1 设计与实现完成时应满足：

- 一个 active employee 最多一张 primary BusinessCard。
- 自动生成名片不等于自动公开；管理员逐张启用。
- 管理员可以查看、启用、禁用单张名片，配置预置 Contact Actions，查看 public URL / 主二维码和主入口基础访问摘要。
- 员工本人只能查看自己的名片预览、public URL、主二维码、启用状态和当前展示动作。
- 员工本人不能编辑、启停名片、调整 Contact Actions 或查看访问统计。
- BusinessCard 只保存配置和引用，不保存姓名、英文名、title、公司名、电话、邮箱、WeChat、WhatsApp 或头像真相。
- 员工数字名片头像只来自 HR Employee `officialPhotoUrl`；为空时显示正式占位，不回退到账号头像。
- 管理员可在员工详情名片 tab 中上传 / 移除员工公开展示头像，上传后预览立即更新。
- 公开名片通过实时 `PublicBusinessCardView` 组装。
- 上游可选字段缺失时隐藏字段或 action。
- 必填字段缺失、名片未启用、员工非 active、上游临时不可用时，公开页显示受控不可访问状态。
- 公网不可访问提示不暴露具体原因；后台可显示 readiness / resolver reason。
- vCard 只包含当前公开可见字段。
- 纯展示型名片可以启用，不要求至少一个联系方式。
- 员工 offboarded 后，名片必须停止公开展示。
- Phase 1 不创建 CRM LeadDraft，不管理多个二维码入口，不做 Brand 名片。

## 12. 关闭条件

- BusinessCard feature packet 与 design workspace 保持一致。
- Contact Asset 线程已提供 Phase 1 可消费边界；BusinessCard contracts 必须引用 `ContactAction targetRef` 与 `ResolveContactActionTargets` 语义，不得在本 feature 中重新定义 Contact Asset lifecycle。
- ShortLink / Public Entry 消费已按 `public-entry-service` 职责卡与 contracts 对齐。
- BusinessCard management / self-view / public render contracts 已冻结。
- 审计 metadata、readiness reason 与 unavailable reason 已在 contract 中明确。
- 权限码与 self-view / public render 授权口径已由 permission 线程确认并回写。
- Phase 1 runtime / BFF / tenant-web / public render 实现完成，并有测试或 smoke 覆盖。
- Review 确认未把 HR、Identity、Contact Asset、ShortLink、CRM 或 Brand 真相回流到 BusinessCard。
- 文档状态已从 `feature-packet-active` 更新为对应实现状态。

## 13. 建议后续顺序

1. 基于 [public-entry-service.md](../../architecture/services/public-entry-service.md) 明确实际代码承载路径。
2. 若未来版本需要 org subtree 精细授权，再让 permission 线程冻结 query scope / resource policy 表达方式。
3. Phase 1 继续按 tenant-wide admin scope 维护 BusinessCard runtime、BFF 与 tenant-web。

## 14. 备注

- 本 packet 不替代 [employee-digital-business-card-design.md](../designs/employee-digital-business-card-design.md) 的设计过程记录。
- 本 packet 不替代任何服务职责卡或 contract 真相。
- ShortLink 与 Contact Asset 外部线程结论已经到位；后续实现线程应引用已冻结 contracts 与边界，而不是临时解释。
