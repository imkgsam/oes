# crm-service 职责卡

Last Updated: 2026-06-14

## 1. Truth Source Rule

本文是 `crm-service` 的唯一稳定设计真相源。

CRM v2 原地替代此前 customer master phase 1 设计。旧实现中的 `CustomerAccount / CustomerPartyBinding / CustomerContact / CustomerAddress` 只能作为迁移与废弃对象理解，不再作为新设计的长期主路径。

其他 CRM 相关文档只能承担以下职责：

- `docs/contracts/crm-service/**`：描述黑盒接口契约，不重新定义 CRM 核心对象、owner 边界或长期命名。
- `docs/architecture/collaborations/**`：描述跨服务协同，不重新定义 `crm-service` 自身职责。
- `docs/plans/features/**`：描述阶段执行状态、实现路径、tenant-web 页面入口与验收，不重新定义服务边界。
- `docs/plans/designs/**`：只作为未冻结讨论、开放问题与回写目标，不承载稳定设计结论。

若其他文档与本文冲突，以本文为准。若 CRM 业务设计需要变更，必须先更新本文；涉及跨服务协同或关键取舍时，再同步更新 collaboration、contract 或 ADR。

## 2. Architecture Premise

CRM v2 以 [ADR 0008: Tenant-scoped TenantParty As Primary Party Model](/Users/acehood/Documents/GitHub/oes/docs/adr/0008-tenant-scoped-tenant-party-primary-party-model.md) 为主体模型前提。

当前阶段：

- 不使用 system-wide `Party` 作为 CRM 主路径。
- 不使用旧 `partyId`、`PersonParty`、`OrganizationParty` 或 global Party resolve / bind 流程。
- `TenantParty` 是当前租户内现实主体主档。
- `tenantPartyId` 是 CRM、SRM、HR、Tenant Org、Sales、Finance 默认采用的主体引用。
- CRM 只在需要正式客户资产或正式交易前提时创建或绑定 `TenantParty`。

## 3. Purpose

`crm-service` 是 OES 的客户开发、销售关系、线索生命周期、商机推进与客户动态服务，负责回答：

- 一个销售对象当前是草稿、正式线索、潜在客户还是成交客户？
- 该对象是否已经绑定当前租户内正式主体 `TenantParty`？
- 谁负责该销售对象？
- 该对象来自哪些来源？
- 有哪些联系人、活动、跟进时间和商机？
- 该对象是否已经具备进入后续正式交易链路的客户前提？

CRM 不回答“这个现实主体是谁、主体标识是否租户内唯一、主体地址 / 联系方式主档是什么”。这些事实归属 `party-service` 的 `TenantParty`。

## 4. Stable Bounded Context

CRM v2 phase 1 冻结核心对象模型、核心用例边界与 tenant-web CRM 入口结构。Phase 1 不冻结 proto、schema、runtime 实现、公海、保护期、报价订单边界、AI 或全局 Task。

Phase 1 稳定核心对象：

- `CrmAccount`
- `CrmContact`
- `CrmSourceRecord`
- `Opportunity`
- `CrmActivity`

Phase 1 不冻结：

- 公海与保护期规则
- 报价、PI、订单、发票边界
- AI 场景
- 全局 Task 能力
- 复杂权限模型细节
- 销售目标、加权预测、复杂 pipeline 报表
- 超期规则与销售周期分析
- 复杂联系人角色模型
- Campaign / Marketing 自动化
- 客户 360 / BI 聚合视图

## 5. Owns

`crm-service` owns：

- `CrmAccount`：CRM 客户开发与客户关系外壳，承载从草稿线索到正式客户的生命周期。
- `CrmContact`：CRM 中的联系人记录，不默认等于 `PERSON` 类型 `TenantParty`。
- `CrmSourceRecord`：CRM 对象的结构化来源记录、来源证据与外部来源引用。
- `Opportunity`：已正式化 CRM 对象下的具体销售机会。
- `CrmActivity`：业务可见的客户时间线动态。
- CRM owner、生命周期、优先级、跟进时间等客户经营语义。
- CRM 内部需要发布给全系统审计能力的动作事实。

## 6. Does Not Own

`crm-service` does not own：

- `party-service` 的 `TenantParty` 主体主档、主体标识、地址正文、联系人正文、主体停用与租户内主体候选搜索真相。
- system-wide `Party`、`PersonParty`、`OrganizationParty`、`CanonicalSubject`、跨租户主体合并或跨租户 MDM。
- 正式报价、PI、销售订单、订单行、交易承诺与 Sales transaction snapshot；归属 `sales-service` 或后续销售协同设计。
- 发票、应收、信用、收款、税务核算事实；归属 `finance-service`。
- 全局 Task / Todo / Work Item 能力；后续由独立平台协作能力冻结。
- 认证、会话、令牌；归属 `auth-service`。
- 账号、身份映射、租户账号事实；归属 `identity-service`。
- 组织树、部门、小组、正式任职真相；分别以 `tenant-org-service` 与 `hr-service` 真相源为准。
- 角色、权限、scope、policy 与授权判定真相；以 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 为准。
- 邮件线程、IM 聊天线程、原始通信正文、附件与投递过程；归属 future communication / mailbox 或对应集成边界。
- AI 模型调用、agent 编排或 AI 工具协议真相。

## 7. Core Object Semantics

### 7.1 CrmAccount

`CrmAccount` 是 CRM 的客户开发与客户关系外壳。

`Lead / Prospect Customer / Customer` 是 `CrmAccount.lifecycleStage`，不是多套主体表。

`CrmAccount` 核心字段：

- `id`
- `tenantId`
- `tenantPartyId`，nullable
- `recordStatus`
  - `DRAFT`
  - `ACTIVE`
  - `ARCHIVED`
- `lifecycleStage`
  - `LEAD`
  - `PROSPECT_CUSTOMER`
  - `CUSTOMER`
- `partyTypeHint`
  - `UNKNOWN`
  - `PERSON`
  - `ORGANIZATION`
- `displayName`
- `leadCompanyName`
- `leadPersonName`
- `leadDomain`
- `leadEmail`
- `leadPhone`
- `leadWhatsapp`
- `leadCountry`
- `leadIdentifiers[]`
- `ownerAccountId`
- `priority`
  - `A`
  - `B`
  - `C`
  - `D`
- `lastActivityAt`
- `nextFollowUpAt`
- `createdBy`
- `createdAt`
- `updatedAt`
- `archivedAt`

`recordStatus` 是记录提交状态，不是客户生命周期。

`DRAFT` 适用于：

- 业务员录入到一半的暂存记录。
- 展会扫码、OCR 名片识别后的待确认记录。
- 网站表单字段缺失后的待补全记录。
- 批量导入后的待清洗记录。
- 插件、AI 或外部系统抽取出的待确认潜在线索。

`DRAFT` 限制：

- 只允许搭配 `lifecycleStage = LEAD`。
- 不进入正式销售线索视图。
- 不得转为 `PROSPECT_CUSTOMER / CUSTOMER`。
- 不得创建正式 `Opportunity`。
- 不进入正式报表统计。
- 必须补齐最小字段后才能提交为 `ACTIVE + LEAD`。

Lifecycle 规则：

- `LEAD` 可以不绑定 `tenantPartyId`。
- `PROSPECT_CUSTOMER / CUSTOMER` 必须绑定 `tenantPartyId`。
- `PROSPECT_CUSTOMER` 表示已正式化、已绑定 `TenantParty`、但未确认成交的客户资产。
- `CUSTOMER` 表示已成交客户。Phase 1 CRM 不允许人工标记 `CUSTOMER`；后续由 `sales-service` 的订单事实或历史订单导入事实触发。
- `tenantPartyId` 指向当前租户内 `TenantParty`。

`priority` 是 `CrmAccount` 级业务优先级，贯穿 `LEAD / PROSPECT_CUSTOMER / CUSTOMER`，不代表生命周期阶段，也不代表成交状态。

`leadCompanyName / leadPersonName / leadDomain / leadEmail / leadPhone / leadWhatsapp / leadCountry / leadIdentifiers[]` 是 CRM 线索阶段输入值，不是 `party-service` 主体真相。它们可以作为 `party-service` 候选搜索 evidence，但不能直接覆盖 `TenantParty` 主档。

`leadIdentifiers[]` 只承载可能升级为 `TenantPartyIdentifier` 的强主体标识，例如税号、VAT No、GST No、统一社会信用代码、工商注册号、身份证号、护照号或其他官方主体编号。

Phase 1 不冻结 `duplicateOfCrmAccountId / sourceSummary / qualificationBasis / hasOrdered / firstOrderAt / lastOrderAt`。这些字段不得作为 P1 稳定写模型字段实现。

### 7.2 CrmContact

`CrmContact` 是 CRM 联系人记录，不默认等于 `PERSON` 类型 `TenantParty`。

普通客户联系人、采购经理、展会名片联系人、WhatsApp 联系人、临时项目负责人或客户公司老板，都可以先作为 `CrmContact` 存在。

只有当联系人本人需要成为交易主体、签约主体、员工主体、审计主体或跨模块复用主体时，才创建或绑定 `personTenantPartyId`。

`CrmContact` 核心字段：

- `id`
- `tenantId`
- `crmAccountId`
- `personTenantPartyId`，nullable
- `name`
- `title`
- `department`
- `email`
- `phone`
- `whatsapp`
- `linkedin`
- `isPrimary`
- `note`
- `createdBy`
- `createdAt`
- `updatedAt`
- `archivedAt`

Phase 1 不冻结复杂联系人角色模型。`roleInSales / contactRole` 不作为稳定字段；第一阶段以 `title`、`department`、`isPrimary` 与 `note` 承接业务表达。

### 7.3 CrmSourceRecord

`CrmSourceRecord` 是 CRM 对象的结构化来源记录。

完整来源历史、来源证据、外部来源引用与未来渠道归因必须落在 `CrmSourceRecord`。Phase 1 核心写模型不在 `CrmAccount` 冗余 `sourceSummary`。

一个 `CrmAccount` 可以有多个来源，例如：

- 网站表单。
- 展会扫码。
- 名片录入。
- 广告线索。
- 老客户推荐。
- 浏览器插件或网络研究。
- 同行移交。
- 外部 API 导入。

`CrmSourceRecord` 核心字段：

- `id`
- `tenantId`
- `crmAccountId`
- `sourceType`
  - `WEBSITE_FORM`
  - `EXHIBITION_SCAN`
  - `BUSINESS_CARD`
  - `AD_CAMPAIGN`
  - `REFERRAL`
  - `IMPORTED_LIST`
  - `WEB_RESEARCH`
  - `PEER_TRANSFER`
  - `SOCIAL_MEDIA`
  - `OTHER`
- `sourceName`
- `capturedAt`
- `capturedByAccountId`
- `externalReference`
- `rawPayload`
- `note`
- `isPrimary`
- `createdAt`

规则：

- `ACTIVE + LEAD` 必须至少有一条 `CrmSourceRecord`。
- 一个 `CrmAccount` 可以有多条来源记录。
- 同一个 `CrmAccount` 同一时间只能有一个 primary source。
- 批量导入时，每条导入记录必须提供或映射出真实 `sourceType`；`MANUAL_IMPORT` 不作为 `sourceType`。
- 重复 Lead 被阻断时，新来源不丢；权限允许或系统集成规则允许时，可追加到 existing `CrmAccount` 的 `CrmSourceRecord`，并生成 `CrmActivity`。
- 无权限访问或编辑 existing `CrmAccount` 时，不自动追加来源，避免越权写入。
- `rawPayload` 不作为业务真相，只用于追溯和排查。

新增来源时，可以同时创建一条 `CrmActivity`：

- `activityType = SOURCE_CAPTURED`
- `createdByType = SYSTEM` 或 `INTEGRATION`

`CrmSourceRecord` 负责来源归因与证据；`CrmActivity` 负责业务可见时间线展示。两者用途不同，不互相替代。

### 7.4 Opportunity

`Opportunity` 是已正式化 CRM 对象下的一次具体销售机会。

Phase 1 冻结规则：

- 只有已正式化的 `CrmAccount` 可以拥有正式 `Opportunity`。
- 已正式化表示 `lifecycleStage in PROSPECT_CUSTOMER / CUSTOMER`。
- 已正式化 `CrmAccount` 必须绑定 `tenantPartyId`。
- `LEAD / DRAFT` 不得创建正式 `Opportunity`。
- 一个 `CrmAccount` 可以有多个 `Opportunity`。
- Phase 1 不冻结独立 `Opportunity Detail` route；商机详情与编辑由 tenant-web drawer / modal 承载。

`Opportunity` 核心字段：

- `id`
- `tenantId`
- `crmAccountId`
- `ownerAccountId`
- `name`
- `stage`
  - `NEW`
  - `QUALIFYING`
  - `QUOTING`
  - `SAMPLE`
  - `NEGOTIATION`
  - `WON`
  - `LOST`
- `status`
  - `OPEN`
  - `WON`
  - `LOST`
  - `CANCELLED`
- `estimatedAmount`
- `currency`
- `expectedCloseDate`
- `openedAt`
- `closedAt`
- `closeReason`
- `closeNote`
- `createdBy`
- `createdAt`
- `updatedAt`

Phase 1 保留支撑基础 pipeline、赢单 / 输单分析所需的数据字段，但不冻结完整 `SalesTarget / SalesQuota`、阶段概率、加权金额、复杂 pipeline 报表、超期规则或销售周期分析。

### 7.5 CrmActivity

`CrmActivity` 是 CRM 业务可见时间线动态，只记录已经发生的业务事件，不承载待办任务。

`CrmActivity` 可以由三类来源创建：

- 用户手动录入。
- 系统自动生成。
- 外部集成写入。

`CrmActivity` 核心字段：

- `id`
- `tenantId`
- `crmAccountId`
- `opportunityId`，nullable
- `contactId`，nullable
- `activityType`
  - `NOTE`
  - `CALL`
  - `EMAIL`
  - `MEETING`
  - `MESSAGE`
  - `SOURCE_CAPTURED`
  - `STATUS_CHANGED`
  - `OWNER_CHANGED`
  - `OPPORTUNITY_CREATED`
  - `OPPORTUNITY_STAGE_CHANGED`
  - `OPPORTUNITY_CLOSED`
  - `QUOTE_VIEWED`
  - `EXTERNAL_EVENT`
  - `OTHER`
- `direction`
  - `INBOUND`
  - `OUTBOUND`
  - `INTERNAL`
- `subject`
- `content`
- `occurredAt`
- `createdByAccountId`
- `createdByType`
  - `USER`
  - `SYSTEM`
  - `INTEGRATION`
- `externalProvider`
- `externalReference`
- `metadata`
- `visibility`
  - `INTERNAL`
  - `TEAM`
  - `OWNER_ONLY`
- `createdAt`

未来对接 Email、WeChat、WhatsApp、网站表单、报价链接访问等第三方或客户行为时，应将业务可见摘要同步为 `CrmActivity`。

CRM Activity 不拥有原始邮件正文、完整聊天线程、附件、投递回执或第三方原始消息真相。它只保存业务时间线摘要、外部引用与必要 metadata。

`TASK` 不属于 `CrmActivity.activityType`。Task 是未来全局协作能力，可通过 related object 引用 `CrmAccount / Opportunity`；如需在客户时间线展示 Task 创建或完成结果，应由消费方写入对应 `CrmActivity` 摘要。

## 8. TenantParty Binding Rules

弱线索阶段：

- `recordStatus = DRAFT` 可以不绑定 `tenantPartyId`。
- `lifecycleStage = LEAD` 可以不绑定 `tenantPartyId`。

正式客户资产阶段：

- `lifecycleStage = PROSPECT_CUSTOMER / CUSTOMER` 必须绑定 `tenantPartyId`。

CRM v2 废弃旧主路径：

- `CustomerPartyBinding`
- `Party Selector` 作为 CRM 主链
- system-wide `partyId`
- `PersonParty / OrganizationParty`
- global Party resolve / bind

当 CRM 需要将 `CrmAccount` 正式化为 `PROSPECT_CUSTOMER` 时，应通过后续 contract 冻结的应用用例创建或绑定当前租户内 `TenantParty`。Phase 1 只冻结该业务规则，不冻结具体 contract、proto 或 runtime 实现。

`CUSTOMER` 不由 CRM 用户人工标记。后续 `sales-service` 开放历史订单录入或订单确认后，应通过成交事实事件推进 CRM lifecycle。

## 9. Lead Creation And Duplicate Check

创建 Lead 阶段只查 CRM，不查 `party-service`。

用例边界：

- `CheckLeadDuplicate`：根据当前表单输入查 CRM 内疑似重复、可领取、已有负责人对象，不写库。
- `CreateDraftLead`：创建 `DRAFT + LEAD`，可不查重。
- `CreateLead`：创建 `ACTIVE + LEAD`，必须执行 CRM 内重复检查。
- `SubmitDraftLead`：将 Draft 转为 `ACTIVE + LEAD`，必须执行 CRM 内重复检查。

查重强度：

- High confidence：normalized email / phone / WhatsApp / domain / lead identifier 精确匹配。
- Medium confidence：公司名 + 国家相似，或个人名 + 国家 + 联系方式相似。
- Low confidence：单独名称相似；Phase 1 最多提示，不阻断。

`CheckLeadDuplicate` 结果：

- `NO_DUPLICATE`
- `POSSIBLE_DUPLICATE`
- `CLAIMABLE_EXISTING`
- `OWNED_DUPLICATE`
- `RESTRICTED_DUPLICATE`

`CreateLead / SubmitDraftLead` 结果：

- `CREATED`
- `BLOCKED_BY_CLAIMABLE_EXISTING`
- `BLOCKED_BY_OWNED_DUPLICATE`
- `BLOCKED_BY_RESTRICTED_DUPLICATE`

规则：

- `POSSIBLE_DUPLICATE` 是保存前确认信息，不是最终 create result。
- 用户确认继续后，请求应带 `duplicateWarningAcknowledged = true`；后端仍必须重新检查。
- `CLAIMABLE_EXISTING / OWNED_DUPLICATE / RESTRICTED_DUPLICATE` 即使前端确认也不能绕过。
- Claim Phase 1 只适用于 owner 为空的对象，不等于公海。
- 无权限命中重复对象时必须脱敏返回，避免通过查重接口枚举客户资料。

## 10. Party Resolution And CRM Conversion

CRM v2 将主体识别与业务角色正式化分层：

- `party-service` 负责判断当前租户内是否存在或可能存在某个 `TenantParty`。
- `crm-service` 负责判断当前 `CrmAccount` 是否能成为客户关系对象、是否已重复、是否能绑定 `TenantParty`。

### 10.1 party-service 责任

`party-service` 负责：

- 使用 `TenantPartyIdentifier` 做强主体识别。
- 使用 `TenantPartyContactPoint / DigitalProfile / TenantPartyAddress / name` 做候选搜索 evidence。
- 返回候选 `TenantParty`、匹配字段、置信度、主体类型和主体状态。
- 维护 `TenantPartyIdentifier` 的租户内唯一性。

`party-service` 不负责：

- 判断是否存在 `CrmAccount`。
- 判断某主体是否是客户、供应商或员工。
- 判断 CRM 生命周期是否允许转换。
- 判断 CRM owner、来源、优先级、活动或商机语义。

### 10.2 CRM 数据与 Party 数据边界

`party-service` owns：

- `TenantParty`
- `TenantPartyIdentifier`，用于税号、VAT、GST、注册号、身份证、护照等强主体标识
- `TenantPartyContactPoint / DigitalProfile`，用于 email、phone、WhatsApp、website、domain 等联系点或数字资料
- `TenantPartyAddress`

`crm-service` owns：

- `leadCompanyName`
- `leadPersonName`
- `leadDomain`
- `leadEmail`
- `leadPhone`
- `leadWhatsapp`
- `leadCountry`
- `leadIdentifiers[]`
- source、owner、priority、activity、opportunity 等 CRM 业务语义

CRM 的 lead 输入值可以作为 `party-service` 搜索 evidence。只有当 `CrmAccount` 正式化为 `PROSPECT_CUSTOMER / CUSTOMER` 并创建或绑定 `TenantParty` 时，CRM 才能按字段性质把合适的数据写入 party 侧：

- 强主体标识写入 `TenantPartyIdentifier`。
- 官网、域名、邮箱、电话、WhatsApp 等写入 `TenantPartyContactPoint / DigitalProfile`。
- 地址正文写入 `TenantPartyAddress`。
- CRM owner、source、priority、activity、opportunity 永远不写入 `party-service`。

### 10.3 party-service resolution result

后续 contract 应让 `party-service` 返回主体识别结果，而不是业务处理结果：

- `EXACT_MATCH`：证据唯一指向一个当前租户内 `TenantParty`。
- `NO_MATCH`：证据足够执行搜索，但没有匹配到 `TenantParty`。
- `CANDIDATES_FOUND`：存在一个或多个候选，但不足以自动确认。
- `IDENTITY_CONFLICT`：主体识别层存在硬冲突，例如多个强标识指向不同 `TenantParty`。

`party-service` 不返回 CRM 的 conversion result。

### 10.4 CRM conversion result

`ConvertLeadToProspectCustomer` 的 CRM 侧结果由 `crm-service` 根据自身规则和 `party-service` resolution result 计算。

已冻结结果：

- `CONVERTED`：成功绑定或创建 `TenantParty`，并更新为 `PROSPECT_CUSTOMER`。
- `INSUFFICIENT_INFO`：CRM 正式化必填信息不足；不进入 `party-service` 匹配流程，不改变 `CrmAccount`，不写 `CrmActivity`。
- `USER_CHOICE_REQUIRED`：`party-service` 返回候选但不足以自动确认；CRM 在转化弹窗内展示候选，由操作人选择可用 `TenantParty` 或创建新 `TenantParty`。
- `EXISTING_CRM_ACCOUNT_FOUND`：目标 `TenantParty` 已绑定其他 active `PROSPECT_CUSTOMER / CUSTOMER` `CrmAccount`；不允许转化当前 Lead。
- `IDENTITY_CONFLICT`：`party-service` 返回主体识别冲突，例如多个强标识指向不同 `TenantParty`；CRM 不得自行猜测主体。

`AUTO_BIND / AUTO_CREATE` 是内部处理路径，不作为最终前端 conversion result 暴露。内部可记录 `partyResolutionAction = MATCHED_EXISTING / CREATED_NEW`。

`USER_CHOICE_REQUIRED` 规则：

- 不自动绑定。
- 不改变 `lifecycleStage`。
- 不改变 `tenantPartyId`。
- 候选选择发生在转化弹窗内。
- 操作人选择候选后，`crm-service` 必须重新校验 tenant、type、权限和是否已绑定正式 `CrmAccount`。
- 已绑定 active `PROSPECT_CUSTOMER / CUSTOMER` `CrmAccount` 的 `TenantParty` 可以展示为候选，但不可选择为新客户绑定目标。

重复 Lead 规则：

- 创建 Lead 时做 CRM 内查重；强重复按 owner / 权限返回 claimable、owned 或 restricted 阻断。
- 转 `PROSPECT_CUSTOMER` 时做强去重。
- 若目标 `TenantParty` 已绑定其他 active `PROSPECT_CUSTOMER / CUSTOMER` `CrmAccount`，不允许转化当前 Lead，不绑定 `tenantPartyId`，不改变 `lifecycleStage`。

CRM conversion result 不使用泛化的 `CONVERSION_BLOCKED`。权限拒绝应走标准 authorization error；主体识别冲突用 `IDENTITY_CONFLICT`；重复正式客户用 `EXISTING_CRM_ACCOUNT_FOUND`。

## 11. Archive Rules

`recordStatus = ARCHIVED` 表示退出默认销售流程，但不物理删除。

Phase 1 规则：

- 可归档对象：`DRAFT`、`LEAD`、`PROSPECT_CUSTOMER`。
- Phase 1 不允许归档 `CUSTOMER`。
- owner 或有管理权限的人可以归档。
- 归档后不出现在默认列表。
- 归档对象不参与“允许继续创建”的普通判断，但强匹配时仍可提示历史存在，避免重复数据。
- Phase 1 允许恢复为归档前状态。
- 归档 / 恢复记录全系统 audit。
- 如需要展示在客户时间线，用 `CrmActivity(STATUS_CHANGED)`，metadata 记录 `recordStatus` 变化，不新增专用 Activity 类型。

## 12. P1 Use Cases

Phase 1 冻结以下用例边界：

- `CreateDraftLead`
- `UpdateDraftLead`
- `SubmitDraftLead`
- `CreateLead`
- `UpdateCrmAccount`
- `CheckLeadDuplicate`
- `ConvertLeadToProspectCustomer`
- `ArchiveCrmAccount`
- `RestoreCrmAccount`
- `ClaimUnownedCrmAccount`
- `AddSourceRecord`
- `ListSourceRecords`
- `SetPrimarySourceRecord`
- `CreateCrmContact`
- `UpdateCrmContact`
- `ArchiveCrmContact`
- `SetPrimaryCrmContact`
- `CreateManualActivity`
- `ListActivities`
- `AppendSystemActivity`
- `AppendIntegrationActivity`
- `CreateOpportunity`
- `UpdateOpportunity`
- `ChangeOpportunityStage`
- `CloseOpportunity`
- `CancelOpportunity`
- `ListOpportunities`

Phase 1 不提供 CRM 人工 `MarkAsCustomer`。`CUSTOMER` 由后续 Sales / Order 成交事实或历史订单导入事实触发。

## 13. Audit, Security And Context

CRM 不设计特殊的 `CrmAuditEvent` 业务对象。

CRM 必须遵循全系统 audit architecture。owner change、生命周期变更、record status 变更、TenantParty 绑定、来源新增、联系人新增、商机创建、商机阶段变更、商机关闭等状态变更必须写入统一审计链路。

若业务时间线需要展示某类审计动作，应额外创建对应 `CrmActivity`，例如：

- `activityType = OWNER_CHANGED`
- `activityType = STATUS_CHANGED`

所有 CRM query / command 必须显式携带：

- `tenantId`
- operator context
- trace context

所有 CRM command 还必须携带：

- audit context

CRM 不拥有授权判定真相，但必须提供 permission-service 做资源级授权所需的业务事实，例如：

- `ownerAccountId`
- lifecycle stage
- record status
- resource status
- future visibility / collaboration facts

不得在 controller、DTO、Prisma schema 中固化核心授权规则。

Phase 1 最小权限动作：

- `crm.account.create`
- `crm.account.read`
- `crm.account.update`
- `crm.account.archive`
- `crm.account.convert`
- `crm.contact.manage`
- `crm.source.manage`
- `crm.activity.create`
- `crm.opportunity.manage`
- `crm.duplicate.viewRestricted`
- `crm.account.claim`

## 14. Tenant-web P1 Entrance Structure

tenant-web CRM P1 以前端销售员工作流组织入口，但底层仍使用统一 `CrmAccount` 模型。

一级入口：

- `CRM > 工作台`
- `CRM > 线索`
- `CRM > 客户资源`
- `CRM > 商机`

页面语义：

- 工作台：回答“今天要做什么”，聚合今日跟进、新线索、我的商机与最近活动。
- 线索：处理新销售资源，覆盖 Draft Lead、Active Lead、无主线索与已归档线索。
- 客户资源：经营已正式化客户资产，覆盖 `PROSPECT_CUSTOMER / CUSTOMER`。
- 商机：全局推进销售机会，覆盖我的商机、基础 pipeline、赢单、输单与取消。

P1 views：

- 工作台：`今日跟进`、`我的新线索`、`我的商机`、`最近活动`。
- 线索：`我的线索`、`草稿`、`无主线索`、`已归档`。
- 客户资源：`潜在客户`、`成交客户`、`全部客户资源`、`已归档`。
- 商机：`我的商机`、`Pipeline`、`已赢单`、`已输单`、`已取消`。

前端形态：

- CRM 工作台、线索、客户资源、商机均为独立一级 route。
- `CrmAccountDetail` 是独立详情 route，用于 Lead、Prospect Customer 与 Customer 的统一详情。
- `Opportunity` 有独立一级 workspace route，但 Phase 1 不做独立 `OpportunityDetail` route。
- 新建 / 编辑 Lead、添加来源、添加联系人、添加活动、创建 / 编辑 Opportunity 使用 drawer。
- 重复检查、归档 / 恢复、claim、关闭 / 取消 Opportunity 使用 modal / confirm modal。
- `ConvertLeadToProspectCustomer` 使用宽 drawer 或 step modal。

Phase 1 不做一级入口：

- Contact
- Source
- Activity
- Pool / 公海
- Quote / PI
- Sales Order / Invoice
- Global Task
- AI assistant
- Complex pipeline report

## 15. Deferred

以下能力 deferred，不得写成 CRM v2 Phase 1 已承诺实现：

- 公海与保护期规则。
- 报价、订单、发票边界。
- AI 场景与 AI 工具协议。
- 全局 Task 能力。
- 复杂权限模型细节。
- 销售目标、阶段概率、加权预测、复杂 pipeline 报表。
- 超期规则。
- 销售周期分析。
- 复杂联系人角色模型。
- Campaign / Marketing 自动化。
- 客户 360 / BI 聚合视图。
- 完整 `CustomerItemMapping / customer SKU`。
- 一客多主体、多 bill-to / ship-to / payer 矩阵。
- 跨租户主体统一、跨租户 MDM 或全局 Party 合并。

## 16. Current Implementation Note

当前代码仍可能保留旧 customer master phase 1 runtime：

- `CustomerAccount`
- `CustomerPartyBinding`
- `CustomerContact`
- `CustomerAddress`
- `CustomerManagementService`
- `CustomerQueryService`

这些实现不再代表稳定设计真相。后续实现线程必须以 CRM v2 真相源为准，先冻结 contract / proto / schema 迁移计划，再替换旧 runtime。

## 17. Related Documents

- [ADR 0008: Tenant-scoped TenantParty As Primary Party Model](/Users/acehood/Documents/GitHub/oes/docs/adr/0008-tenant-scoped-tenant-party-primary-party-model.md)
- [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md)
- [sales-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/sales-service.md)
- [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)
- [crm-v2-core-object-model.md](/Users/acehood/Documents/GitHub/oes/docs/plans/features/crm-v2-core-object-model.md)
