# Employee Digital Business Card Design

## 0. 文档控制

```text
designKey: employee-digital-business-card
designStatus: ACTIVE_DESIGN_WORKSPACE
lastUpdatedAt: 2026-06-08 02:10:00 Asia/Shanghai
lastUpdatedBy: Codex thread
conflictResolution: 当本文与更早讨论冲突时，以本文 lastUpdatedAt 之后的冻结结论为准；稳定 architecture / ADR / contracts 明确覆盖本文时，以稳定真相源为准。本文只记录 BusinessCard module 设计过程，不替代 ShortLink / Contact Asset / CRM / HR / Identity / Tenant Org 的唯一真相源。
```

## 1. 目标

- 冻结 OES 员工数字名片 / 二维码名片的产品定位、模块边界与第一阶段范围。
- 明确 BusinessCard 与 ShortLink / Public Entry、Contact Asset、HR、Identity、Tenant Org、CRM 的协同边界。
- 为后续转化为 feature packet 提供稳定设计输入。

核心定位：

```text
员工对外身份展示入口 + 可配置联系动作 + 可扩展来源追踪 + 可选 CRM 回流。
```

当前第一阶段不把该能力设计成 CRM Lead 系统、ShortLink 通用平台、Barcode / Scan Identity、员工主数据真相源或 Brand 管理系统。

## 2. 当前范围

本 workspace 负责：

- BusinessCard module 的 owner / does-not-own 边界。
- Employee Digital Business Card 第一阶段产品范围。
- 名片展示配置、Contact Actions、vCard、公开访问、管理端、员工只读入口、离职不可公开等设计。
- BusinessCard 对 ShortLink / Public Entry、Contact Asset、HR、Identity、Tenant Org 等能力的消费关系。
- 后置能力的边界分类。

本 workspace 不负责：

- 冻结 ShortLink / Public Entry 通用模型、VisitEvent、Campaign、UTM、QRCodeAsset 完整生命周期。
- 重新定义 Contact Asset / 工作联系方式资产模型；BusinessCard 只消费 `identity-service` 与 Contact Asset design 已冻结边界。
- 冻结 CRM LeadDraft、Lead、CustomerAccount、Activity 或客户回流流程。
- 冻结 Brand / 公司档案完整模型。
- 冻结 Barcode / Scan Identity 或 Scan Router。
- 进入代码实现计划或 contract / proto 细节。

## 3. 涉及对象

- services / modules:
  - future `public-entry-service`
  - `business-card` module
  - `shortlink` / `public-entry` module
  - `identity-service`
  - `hr-service`
  - `tenant-org-service`
  - `crm-service`
  - `party-service`
- features / dependencies:
  - Contact Asset / Work Contact Asset design:
    - [contact-asset-design.md](./contact-asset-design.md)
    - [identity-service.md](../../architecture/services/identity-service.md)
  - ShortLink / Public Entry design:
    - [shortlink-public-entry-design.md](./shortlink-public-entry-design.md)
    - [shortlink-public-entry-phase-1.md](../features/shortlink-public-entry-phase-1.md)
    - [public-entry-service.md](../../architecture/services/public-entry-service.md)
  - future CRM LeadDraft feedback loop
  - future Brand / public profile capability

## 4. 已冻结决定

| 日期 | 决定 | 影响范围 | 回写目标 |
| --- | --- | --- | --- |
| 2026-06-08 | Employee Digital Business Card 已进入当前 Design Workspace。 | 文档分类 | `docs/plans/intake.md` |
| 2026-06-08 | BusinessCard module 未来归属于 `public-entry-service`，与 ShortLink / Public Entry module 同服务但模型隔离。 | 服务 / 模块边界 | future architecture / feature packet |
| 2026-06-08 | BusinessCard owns what is shown；ShortLink owns how the public entry is reached, governed, tracked, expired, and redirected。 | BusinessCard / ShortLink 边界 | future collaboration / contracts |
| 2026-06-08 | 本线程只冻结 BusinessCard module，不冻结 ShortLink / Public Entry 通用模型。BusinessCard 只消费 ShortLink 提供的主 Public Entry、public URL、QR content 与 lightweight visit summary。 | 线程边界 | ShortLink design thread |
| 2026-06-08 | BusinessCard 不拥有 phone / email / WeChat / WhatsApp 等联系方式资产真相；Contact Asset owner、类型、状态与登录分离以 `contact-asset-design.md` 和 `identity-service.md` 为准。 | Identity / Contact Asset 边界 | Contact Asset design / `identity-service.md` |
| 2026-06-08 | Phase 1 每个 active employee 最多一张 primary BusinessCard。系统可自动生成 DRAFT / DISABLED 名片，但公开启用必须由管理员逐个确认。 | 名片生命周期 | feature packet |
| 2026-06-08 | Phase 1 使用实时组装 `PublicBusinessCardView`，不保存 published snapshot，不保存展示字段值。 | 数据模型 | feature packet |
| 2026-06-08 | BusinessCard 只保存配置和引用：status、templateKey、publicEntryRef、contactActionConfigs、visibilityConfig、audit metadata。 | 数据模型 | feature packet |
| 2026-06-08 | BusinessCard 不保存姓名、英文名、职位文案、公司名、电话、邮箱、微信、WhatsApp 或头像真相。 | 数据 owner | HR / Identity / Tenant Org / Party truth sources |
| 2026-06-08 | 英文名和多语言展示字段只能来自上游真相源；BusinessCard 不提供 `englishDisplayNameOverride`。缺失时 renderer fallback default。 | 多语言边界 | HR / Party / Tenant Org future design |
| 2026-06-08 | Phase 1 支持最小业务字段多语言消费：员工英文名、title、companyDisplayName 若上游提供则展示；UI 文案由 renderer 按 locale 渲染。 | 多语言 | feature packet |
| 2026-06-08 | Phase 1 默认租户名片，不引入 brandContext；Brand 名片后置。 | Brand 边界 | future Brand / public profile design |
| 2026-06-08 | Phase 1 使用系统内置统一模板 `TENANT_STANDARD`，租户管理员只可配置最小模板 token：logo reference、primary color、company display profile reference、default enabled action types、default action order。 | 模板设计 | feature packet |
| 2026-06-08 | Phase 1 不支持员工自定义模板、自定义布局、自定义按钮文案、多模板、部门模板、brand 模板或模板市场。 | 模板范围 | deferred boundary |
| 2026-06-08 | Phase 1 Contact Actions 只支持系统预置类型，不支持 custom link action；按钮文案由 renderer 根据 action type 与 locale 渲染。 | Contact Actions | feature packet |
| 2026-06-08 | Phase 1 Contact Actions 包括 `CALL_PHONE`、`SEND_EMAIL`、`ADD_WECHAT`、`OPEN_WHATSAPP`、`SAVE_VCARD`、`OPEN_COMPANY_WEBSITE`。 | Contact Actions | feature packet |
| 2026-06-08 | `OPEN_PRODUCT_CATALOG`、`REQUEST_CONTACT`、`REQUEST_QUOTE`、`BOOK_MEETING`、LinkedIn、Line、Telegram、Facebook、Instagram、地址导航等 action 后置。 | Contact Actions | deferred boundary |
| 2026-06-08 | `SAVE_VCARD` 是 Phase 1 标准动作；vCard 由 BusinessCard module 基于当前公开可见字段实时生成，未公开展示的联系方式不得进入 vCard。 | vCard | feature packet |
| 2026-06-08 | Phase 1 允许纯展示型名片，不要求至少一个联系方式。 | 启用条件 | feature packet |
| 2026-06-08 | Phase 1 启用最低条件：employee exists and active、displayName 可解析、companyDisplayName 或 tenant name 可解析、public entry binding exists、`TENANT_STANDARD` 可用。 | readiness check | feature packet |
| 2026-06-08 | Contact Asset inactive / missing 时隐藏对应 action；可选字段缺失时隐藏字段；上游临时不可用时公开页显示受控错误，不展示半完整名片。 | 公开访问 | feature packet |
| 2026-06-08 | BusinessCard 消费 Contact Asset 时，同一类社交联系入口默认只展示一个；公司受控账号优先，没有公司受控账号时才展示员工个人账号。 | Contact Actions / Contact Asset | Contact Asset design / feature packet |
| 2026-06-08 | 公司受控社交账号在员工离职、调岗失去使用权或 account disabled 后，由 Contact Asset 进入交接或停用状态；BusinessCard 只按状态隐藏对应 action，不处理交接。 | Contact Actions / offboarding | Contact Asset design / feature packet |
| 2026-06-08 | Phase 1 员工本人只能查看自己的名片预览、public URL、主二维码、启用状态和当前展示动作，不可编辑、启停或查看访问统计。 | 权限 / self-service | feature packet |
| 2026-06-08 | Phase 1 管理端为单张名片管理，不支持批量启用 / 批量禁用。 | 管理端 | feature packet |
| 2026-06-08 | Phase 1 名片创建、启停、字段展示、Contact Actions 配置、vCard 配置均由租户管理员或具备名片管理权限的 operator 管理，并记录审计。 | 权限 / 审计 | feature packet / permission design |
| 2026-06-08 | 员工 offboarded 后 BusinessCard 必须自动停止公开展示；公开访问不得继续展示姓名、联系方式、vCard 或 Contact Actions。 | 离职处理 | HR collaboration / feature packet |
| 2026-06-08 | Phase 1 只绑定一个主 Public Entry / 主二维码；BusinessCard 不管理多个二维码入口、event / campaign / channel attribution。 | ShortLink consumption | ShortLink / Campaign design |
| 2026-06-08 | Phase 1 管理员可查看主入口基础访问摘要；event/channel 细分归 ShortLink / Campaign 后续设计。员工本人不查看统计。 | 访问统计 | ShortLink collaboration / feature packet |
| 2026-06-08 | ShortLink / Public Entry Phase 1 contract 已冻结；BusinessCard 作为 `INTERNAL_REF / BUSINESS_CARD` target 被引用，使用 `tenantId + targetResourceId = businessCardId`，访问时由 BusinessCard resolver 判断目标是否可公开展示。 | ShortLink consumption | BusinessCard contracts |
| 2026-06-08 | `BUSINESS_CARD` target resolver 语义已冻结：输入来自 ShortLink resolved target，不信任匿名请求 target identity；输出只允许 `REDIRECT / UNAVAILABLE / NOT_FOUND`，并且 `REDIRECT` 只返回匿名可访问的 BusinessCard public page URL，不返回名片内容。 | BusinessCard resolver | BusinessCard public render contract |
| 2026-06-08 | BusinessCard Phase 1 management、employee self-view、public render / vCard contracts 已建立；Contact Action targetRef 只引用 Contact Asset，不保存联系方式正文。 | contracts | `docs/contracts/public-entry-service/**` |
| 2026-06-08 | 公网不可访问原因统一模糊提示，不暴露 offboarded、disabled、missing、upstream unavailable 等具体原因；后台可显示具体 readiness / resolver reason。 | 安全 / 隐私 | feature packet |
| 2026-06-08 | CRM 回流是高价值扩展能力，但当前不冻结设计，不进入 Phase 1，不定义 LeadDraft 字段或 CRM 匹配规则。 | CRM 边界 | future CRM collaboration design |

## 5. Phase 1 范围

Phase 1 包含：

- 一员工一张主名片。
- Web 公开名片页。
- 一个主 Public Entry / 主二维码。
- 统一租户模板 `TENANT_STANDARD`。
- 租户级最小模板 token。
- 实时组装 `PublicBusinessCardView`。
- 管理员逐张启用 / 禁用。
- 员工只读预览、public URL 与主二维码。
- 预置 Contact Actions：
  - `CALL_PHONE`
  - `SEND_EMAIL`
  - `ADD_WECHAT`
  - `OPEN_WHATSAPP`
  - `SAVE_VCARD`
  - `OPEN_COMPANY_WEBSITE`
- vCard 保存联系人。
- 读取主入口基础访问摘要。
- 离职 / offboarded 自动停止公开展示。
- 管理审计与 readiness check。

Phase 1 不包含：

- CRM 回流 / LeadDraft。
- 多名片。
- Brand 名片。
- Published Snapshot。
- 小程序 renderer。
- 多入口 / 多二维码来源追踪。
- Product Catalog action。
- 员工自助编辑或修改申请。
- 批量启用 / 批量禁用。
- 高级防滥用、高级隐私策略或 Campaign analytics。

## 6. BusinessCard Owner 边界

BusinessCard owns：

- BusinessCard 聚合与一员工一主名片约束。
- 名片状态：`DRAFT`、`ACTIVE`、`DISABLED`、`ARCHIVED`。
- 名片公开展示配置与字段可见性。
- Contact Action 配置：
  - `contactActionType`
  - `targetRefType`
  - `targetRefId`
  - `visibility`
  - `enabled`
  - `displayOrder`
  - `includeInVCard`
- vCard 输出规则。
- `templateKey` 与租户模板 token 引用。
- 主 `publicEntryRef` 绑定引用。
- BusinessCard target resolver 与 `PublicBusinessCardView` 组装。
- 名片管理审计。

BusinessCard does not own：

- 员工、任职、岗位、组织归属真相。
- 自然人姓名、英文名或主体真相。
- 工作邮箱、工作手机号、WeChat、WhatsApp 等联系方式资产真相。
- 登录标识、认证凭据或账号启停真相。
- 租户、组织树、公司主体或 Brand 真相。
- ShortLink 的 shortCode、public URL lifecycle、redirect、expiresAt、VisitEvent、QRCodeAsset 或 Campaign 模型。
- CRM LeadDraft、Lead、CustomerAccount、Activity、客户匹配、线索分配或客户回流语义。

## 7. 数据与视图口径

Phase 1 采用实时视图组装：

```text
BusinessCard config + upstream facts -> PublicBusinessCardView
```

BusinessCard 保存配置和引用，不保存展示字段值。

上游字段来源：

- `hr-service`：active employee、employeeId、任职 / title / department 候选事实。
- `identity-service` / Contact Asset：工作联系方式资产引用、ownership、状态与展示摘要。
- `tenant-org-service` / tenant profile：tenant name、company display profile 与组织摘要。
- `party-service`：自然人 / 组织主体真相，只通过上游摘要被消费，不由 BusinessCard 直接重定义。
- ShortLink / Public Entry module：主 public URL / QR content / visit summary。

ShortLink / Public Entry Phase 1 消费口径：

- BusinessCard target reference:
  - `targetKind = INTERNAL_REF`
  - `targetType = BUSINESS_CARD`
  - `targetResourceId = businessCardId`
  - `tenantId` required
- BusinessCard 本地 `publicEntryRef` 可保存：
  - `publicEntryId`
  - `shortCode`
  - `publicUrl`
  - `qrContent`
  - `status`
  - `expiresAt`
- `qrContent` 等于 public URL。
- ShortLink public redirect 不渲染 BusinessCard 页面，只调用 `BUSINESS_CARD` resolver 后 redirect 到 BusinessCard resolver 返回的 public URL。
- BusinessCard resolver 返回：
  - `REDIRECT`：名片可公开展示，返回 redirect URL。
  - `UNAVAILABLE`：名片存在但不可公开。
  - `NOT_FOUND`：名片不存在或 tenant mismatch。
- ShortLink `DISABLED / ARCHIVED / expired` 访问由 ShortLink 返回 generic unavailable page；BusinessCard 不解释这些状态。
- BusinessCard Phase 1 不依赖 campaign、UTM、A/B routing、custom domain、QRCodeAsset、QR visual template、WeChat deep routing、advanced anti-abuse、Scan Router 或 generic public form。

### 7.1 `BUSINESS_CARD` Target Resolver

`BUSINESS_CARD` resolver 是 BusinessCard module 提供给 ShortLink INTERNAL_REF 访问链路的目标解析能力。

输入：

```text
tenantId
targetType = BUSINESS_CARD
targetResourceId = businessCardId
requestContext:
  userAgent
  detectedChannel
  deviceType
  locale
  referrer
  traceId
```

输入规则：

- `tenantId` 来自 ShortLink resolved record，不来自匿名请求。
- `targetResourceId` 是 BusinessCard id。
- `targetType` 必须是 `BUSINESS_CARD`；不支持的 target type 通常由 resolver registry 处理，BusinessCard resolver 不接管通用 registry 语义。
- Resolver 不信任匿名请求中的 tenant、target identity 或任何可改变目标归属的输入。
- `requestContext` 只用于公开 URL 选择、locale fallback、诊断与 trace，不得改变 BusinessCard owner 判断。

输出：

```text
REDIRECT:
  redirectUrl required
  resultTarget = business-card:web

UNAVAILABLE:
  redirectUrl empty
  resultTarget = business-card:unavailable

NOT_FOUND:
  redirectUrl empty
  resultTarget = business-card:not-found
```

`REDIRECT` 条件：

- BusinessCard exists。
- BusinessCard belongs to `tenantId`。
- BusinessCard status 允许公开访问。
- Employee exists and is active / not offboarded。
- required display data 可解析。
- `TENANT_STANDARD` template 可用。
- public render readiness 通过。
- BusinessCard public page route 可生成。

`REDIRECT` 只返回公开 BusinessCard 页面 URL，不返回名片内容、字段、联系方式或 vCard 内容。

`UNAVAILABLE` 条件：

- BusinessCard exists and belongs to tenant, but card is disabled / not public。
- Employee offboarded。
- Readiness check failed。
- Required upstream data temporarily unavailable。
- Required template unavailable。
- Public render readiness 当前不通过。

vCard 或某个 Contact Action 不可用本身不阻止公开页；resolver 应由 `PublicBusinessCardView` 隐藏不可用 action。只有缺失必填展示数据或公开页无法安全生成时才返回 `UNAVAILABLE`。

`NOT_FOUND` 条件：

- `businessCardId` 不存在。
- `businessCardId` 不属于 `tenantId`。
- 发生 tenant mismatch 时必须映射为 `NOT_FOUND`，避免泄露跨租户资源存在性。

Public URL 生成：

- BusinessCard resolver owns BusinessCard public page URL construction。
- ShortLink 不拼 BusinessCard URL，也不复制 BusinessCard route knowledge。
- `redirectUrl` 必须是匿名可访问的公开 URL。
- `redirectUrl` 不应包含内部 `tenantId`、员工身份、联系方式或敏感字段。
- Phase 1 不做多端复杂路由；`locale / deviceType / detectedChannel` 可以用于 future renderer selection 或 locale fallback，但不启用 WeChat mini program deep routing。

VisitEvent 边界：

- BusinessCard resolver 不写 VisitEvent。
- ShortLink 根据 resolver result 写 VisitEvent：
  - `REDIRECT -> REDIRECTED`
  - `UNAVAILABLE -> INVALID_TARGET`
  - `NOT_FOUND -> INVALID_TARGET`
- BusinessCard resolver 只返回 resolver result、`redirectUrl` 和 `resultTarget`，不管理 VisitEvent、VisitEvent resultStatus 或统计聚合。

字段缺失和失败处理：

- 必填字段缺失：后台不允许启用，公开访问显示不可访问。
- 可选字段缺失：隐藏字段或隐藏 action。
- Contact Asset inactive / missing：隐藏对应 action。
- 上游临时不可用：公开页显示受控错误页，不展示半完整名片。

## 8. 管理端与权限口径

Phase 1 管理端能力：

- 查看员工名片列表。
- 查看单个员工名片详情。
- 查看公开预览。
- 查看主二维码 / public URL。
- 启用名片。
- 禁用名片。
- 配置 Contact Actions。
- 查看主入口基础访问摘要。
- 触发 readiness check。
- 查看不可启用原因。
- 查看基础审计记录。

Phase 1 不支持：

- 批量启用 / 批量禁用。
- 员工自助编辑。
- 员工修改申请 / 审核流。
- 员工查看访问统计。

所有管理动作必须携带：

- `tenantId`
- operator context
- trace context
- audit metadata

Permission 线程已确认 Phase 1 权限口径：

- 管理端使用 `public-entry.business-card.read`、`public-entry.business-card.manage`、`public-entry.business-card.enable`、`public-entry.business-card.disable`、`public-entry.business-card.public-entry.manage`、`public-entry.business-card.stats.read`。
- `public-entry.business-card.preview` 不作为 Phase 1 权限码；admin preview / readiness diagnostics 归入 `read`。
- `public-entry.business-card.self.read` 不作为 Phase 1 权限码；员工 self-view 使用 authenticated self-bound access。
- 匿名 public render / vCard download 不进入 permission-service。
- 管理员默认拥有当前租户内所有 BusinessCard 的访问与管理范围；Phase 1 不做 org subtree、department、employee-owner 或 HR employee scope 精细限制。
- 管理端授权采用 `CheckPermission` RBAC + tenant isolation + fail-closed；跨租户 card id 必须拒绝或按 not found 处理。
- 若未来版本需要 org / employee 精细范围，再由 permission-service 单独冻结 query scope / resource policy contract；这不是 BusinessCard Phase 1 open issue。

## 9. 后置能力分类

### 9.1 Deferred but boundary frozen

- 多名片：后续可支持一个员工多张 card variant，但不破坏 Phase 1 一员工一主名片。
- Brand 名片：后续可引入 brand context / brand template，但品牌站点不拥有名片数据。
- Published Snapshot：后续可引入对外发布版本；Phase 1 先实时组装。
- 小程序 renderer：后续作为 renderer，共用同一 BusinessCard 数据。
- 员工修改申请 / 审核流：后续 workflow，不改变管理员 owner。
- 离职转交 / 替代联系人：后续可配置 redirect 或 replacement；Phase 1 自动禁用。
- Source / event / campaign tracking：后续由 ShortLink / Campaign owner 设计，BusinessCard 不管理多个入口。

### 9.2 Deferred design topic, not frozen now

- CRM 回流 / LeadDraft。
- 外部通信账号登录绑定、OAuth token、消息读写与 channel binding。
- ShortLink / Public Entry 通用模型。
- Product Catalog action 与产品发布目录。
- 高级防滥用。
- 高级隐私策略。

## 10. 开放问题

| 日期 | 问题 | 为什么未冻结 | 下一步 |
| --- | --- | --- | --- |
| 2026-06-08 | Contact Asset 是否主关联 `UserAccount / accountId`，以及如何区分公司资产、员工个人联系方式与登录标识？ | 已由 Contact Asset 线程冻结：Contact Asset 归 `identity-service`，primary 关联 `tenantId + accountId`，登录标识归 `auth-service`。 | 已回写 `contact-asset-design.md`、`identity-service.md` 与 `auth-service.md`；BusinessCard 只消费引用与状态。 |
| 2026-06-08 | CRM 回流是否生成 LeadDraft、如何处理现有客户回流、如何匹配和分配？ | 用户确认 CRM 回流高价值但当前不冻结设计，也不进入 Phase 1。 | 后续单独做 CRM collaboration design。 |
| 2026-06-08 | 英文名、title 多语言、company display 多语言的上游真相源何时具备？ | BusinessCard 不提供 override，依赖 HR / Party / Tenant Org 等上游设计。 | 在相关服务真相源或 feature packet 中补齐。 |

## 11. 真相源回写计划

- 服务职责：
  - `public-entry-service` 服务职责已建立：
    - [public-entry-service.md](../../architecture/services/public-entry-service.md)
  - Contact Asset 已进入 Identity 边界，并已更新 `docs/architecture/services/identity-service.md`。
- 协同蓝图：
  - BusinessCard 与 ShortLink / Public Entry 的协同可后续写入 collaboration 文档。
  - BusinessCard 与 Contact Asset / HR offboarding 的协同可后续写入 collaboration 文档。
  - CRM 回流另行设计后再决定是否写入 CRM collaboration。
- contracts：
  - BusinessCard Phase 1 contracts 已建立：
    - [business-card-management.md](../../contracts/public-entry-service/business-card-management.md)
    - [business-card-self-view.md](../../contracts/public-entry-service/business-card-self-view.md)
    - [business-card-public-render.md](../../contracts/public-entry-service/business-card-public-render.md)
  - ShortLink contracts 已建立，BusinessCard contracts 应引用消费：
    - [shortlink-public-redirect.md](../../contracts/public-entry-service/shortlink-public-redirect.md)
    - [shortlink-admin-management.md](../../contracts/public-entry-service/shortlink-admin-management.md)
    - [shortlink-target-resolver.md](../../contracts/public-entry-service/shortlink-target-resolver.md)
  - Contact Asset contract 不在本文冻结。
- feature packet：
  - 已建立 [employee-digital-business-card.md](../features/employee-digital-business-card.md) 作为 Phase 1 feature packet。
- architecture / ADR：
  - 只有在 `public-entry-service` 服务边界、公共入口治理或 Contact Asset owner 成为稳定架构决策时再升级。

## 12. 恢复入口

下次继续前先读：

- 本 workspace。
- `docs/plans/designs/README.md`。
- `docs/architecture/services/hr-service.md`。
- `docs/architecture/services/identity-service.md`。
- `docs/architecture/services/tenant-org-service.md`。
- `docs/architecture/services/crm-service.md`。
- ShortLink / Public Entry 稳定服务职责、feature packet 与 contracts：
  - [public-entry-service.md](../../architecture/services/public-entry-service.md)
  - [shortlink-public-entry-phase-1.md](../features/shortlink-public-entry-phase-1.md)
  - [public-entry-service contracts](../../contracts/public-entry-service/README.md)
- Contact Asset 稳定设计与真相源：
  - [contact-asset-design.md](./contact-asset-design.md)
  - [identity-service.md](../../architecture/services/identity-service.md)

当前推荐下一步：

- BusinessCard Phase 1 contracts 与 permission 口径已建立；下一步进入 implementation handoff。
- 进入实现前不得在 BusinessCard 内临时定义 Contact Asset、ShortLink 通用模型或 CRM 回流模型。
