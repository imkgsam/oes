# CRM v2 P1 Core Model And Frontend Entrance

## 1. Feature Status

Current status: `design frozen / implementation not started`

本 feature packet 冻结 CRM v2 Phase 1 的核心对象设计、核心用例边界与 tenant-web 第一阶段前端入口结构，为后续 contract、proto、schema、runtime、Gateway/BFF 与 tenant-web 实现提供执行入口。

稳定服务设计唯一真相源为：

- [crm-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/crm-service.md)

主体模型前提为：

- [ADR 0008: Tenant-scoped TenantParty As Primary Party Model](/Users/acehood/Documents/GitHub/oes/docs/adr/0008-tenant-scoped-tenant-party-primary-party-model.md)

本文不重新定义 CRM 服务边界。若本文与服务真相源冲突，以服务真相源为准。

## 2. Goal

冻结 CRM v2 Phase 1 的最小可实施闭环：

- 统一 `CrmAccount` 模型承载 Lead、Prospect Customer、Customer。
- 弱 Lead 不查、不建、不绑定 `TenantParty`。
- Lead 正式化为 Prospect Customer 时，才调用 `party-service` 识别或创建 `TenantParty`。
- Source、Contact、Activity、Opportunity 支撑第一阶段销售员日常操作。
- tenant-web 以销售员工作流组织 CRM 入口，而不是以数据库对象直接组织页面。

Phase 1 不冻结公海、保护期、报价、PI、订单、发票、AI、全局 Task 或复杂预测。

## 3. Background

OES 已采用 tenant-scoped `TenantParty` 作为当前阶段主体模型。

CRM v2 原地替代旧 customer master phase 1 设计：

- 不再使用 system-wide `Party` 或旧 `partyId` 主路径。
- 不再使用 `CustomerPartyBinding` 作为 CRM 主链。
- 不再将 `Intake / Prospecting / LeadDraft` 作为一等核心对象。
- 弱线索可以不创建或绑定 `TenantParty`。
- 正式客户资产必须绑定当前租户内 `tenantPartyId`。
- `CUSTOMER` 由后续 `sales-service` 的成交事实或历史订单导入事实触发，不由 CRM 用户手动标记。

## 4. Frozen Objects

CRM v2 Phase 1 冻结以下核心对象：

- `CrmAccount`
- `CrmContact`
- `CrmSourceRecord`
- `Opportunity`
- `CrmActivity`

审计不作为 CRM 专属业务对象冻结。CRM 必须接入全系统 audit architecture。

## 5. CrmAccount

`CrmAccount` 是 CRM 的客户开发与客户关系外壳。

`Lead / Prospect Customer / Customer` 是 `CrmAccount.lifecycleStage`，不是多套表。

冻结字段：

| 字段 | 说明 |
| --- | --- |
| `id` | CRM account 标识 |
| `tenantId` | 租户边界 |
| `tenantPartyId` | nullable；正式客户资产阶段必填 |
| `recordStatus` | `DRAFT / ACTIVE / ARCHIVED` |
| `lifecycleStage` | `LEAD / PROSPECT_CUSTOMER / CUSTOMER` |
| `partyTypeHint` | `UNKNOWN / PERSON / ORGANIZATION` |
| `displayName` | CRM 显示名，不是法律名称真相 |
| `leadCompanyName` | 线索阶段输入的公司名，不是 Party 主档真相 |
| `leadPersonName` | 线索阶段输入的个人名，不是 Party 主档真相 |
| `leadDomain` | 线索阶段输入的域名 evidence |
| `leadEmail` | 线索阶段输入的邮箱 evidence |
| `leadPhone` | 线索阶段输入的电话 evidence |
| `leadWhatsapp` | 线索阶段输入的 WhatsApp evidence |
| `leadCountry` | 线索阶段输入的国家或地区 evidence |
| `leadIdentifiers[]` | 线索阶段输入的强主体标识 evidence，例如税号、VAT、GST、注册号、身份证、护照 |
| `ownerAccountId` | 主负责人账号 |
| `priority` | `A / B / C / D` |
| `lastActivityAt` | 最近客户动态时间 |
| `nextFollowUpAt` | 下次跟进时间 |
| `createdBy` | 创建人 |
| `createdAt` | 创建时间 |
| `updatedAt` | 更新时间 |
| `archivedAt` | 归档时间 |

冻结规则：

- `recordStatus = DRAFT` 不是生命周期阶段，只表示记录未正式提交。
- `DRAFT` 只能搭配 `lifecycleStage = LEAD`。
- `ACTIVE + LEAD` 才是正式线索。
- `DRAFT` 不进入正式销售线索视图，不得创建正式 `Opportunity`，不进入正式报表统计。
- `LEAD` 可以不绑定 `tenantPartyId`。
- `PROSPECT_CUSTOMER / CUSTOMER` 必须绑定 `tenantPartyId`。
- `PROSPECT_CUSTOMER` 表示已正式化、已绑定 `TenantParty`、但未确认成交的客户资产。
- `CUSTOMER` 表示已成交客户。CRM P1 不允许人工标记 `CUSTOMER`。
- `priority` 是 `CrmAccount` 级业务优先级，贯穿 `LEAD / PROSPECT_CUSTOMER / CUSTOMER`。
- `leadCompanyName / leadPersonName / leadDomain / leadEmail / leadPhone / leadWhatsapp / leadCountry / leadIdentifiers[]` 是 CRM 线索阶段输入值，可以作为 `party-service` 搜索 evidence，但不是 Party 主档真相。
- `leadIdentifiers[]` 只承载可能升级为 `TenantPartyIdentifier` 的强主体标识。
- Phase 1 不冻结 `duplicateOfCrmAccountId / sourceSummary / qualificationBasis / hasOrdered / firstOrderAt / lastOrderAt`。

## 6. CrmContact

`CrmContact` 是 CRM 联系人记录，不默认等于 `PERSON` 类型 `TenantParty`。

冻结字段：

| 字段 | 说明 |
| --- | --- |
| `id` | 联系人记录标识 |
| `tenantId` | 租户边界 |
| `crmAccountId` | 所属 CRM account |
| `personTenantPartyId` | nullable；仅在该联系人需要成为正式主体时绑定 |
| `name` | 联系人姓名或显示名 |
| `title` | 职务或业务称谓 |
| `department` | 部门 |
| `email` | 联系邮箱 |
| `phone` | 联系电话 |
| `whatsapp` | WhatsApp |
| `linkedin` | LinkedIn 或类似主页 |
| `isPrimary` | 是否主要联系人 |
| `note` | 备注 |
| `createdBy` | 创建人 |
| `createdAt` | 创建时间 |
| `updatedAt` | 更新时间 |
| `archivedAt` | 归档时间 |

冻结规则：

- 普通采购经理、展会名片联系人、WhatsApp 联系人、客户公司老板等均可先作为 `CrmContact` 存在。
- 只有联系人本人需要成为交易主体、签约主体、员工主体、审计主体或跨模块复用主体时，才创建或绑定 `personTenantPartyId`。
- Phase 1 不冻结 `roleInSales / contactRole`。第一阶段以 `title`、`department`、`isPrimary` 与 `note` 承接业务表达。
- 一个 `CrmAccount` 可以有多个联系人，同一时间最多一个 primary contact。

## 7. CrmSourceRecord

`CrmSourceRecord` 是 CRM 对象的结构化来源记录。

Phase 1 核心写模型不在 `CrmAccount` 冗余 `sourceSummary`。完整来源历史、来源证据、外部来源引用与未来渠道归因必须落在 `CrmSourceRecord`。

冻结字段：

| 字段 | 说明 |
| --- | --- |
| `id` | 来源记录标识 |
| `tenantId` | 租户边界 |
| `crmAccountId` | 所属 CRM account |
| `sourceType` | 来源类型 |
| `sourceName` | 展会名、广告名、表单名等 |
| `capturedAt` | 捕获时间 |
| `capturedByAccountId` | 捕获人账号 |
| `externalReference` | 表单提交 id、扫码记录 id、广告 lead id、导入批次 id 等外部引用 |
| `rawPayload` | 原始来源 payload |
| `note` | 备注 |
| `isPrimary` | 是否主来源 |
| `createdAt` | 创建时间 |

`sourceType` 第一阶段候选：

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

冻结规则：

- `ACTIVE + LEAD` 必须至少有一条 `CrmSourceRecord`。
- 一个 `CrmAccount` 可以拥有多个 `CrmSourceRecord`。
- 同一个 `CrmAccount` 同一时间只能有一个 primary source。
- 批量导入时，每条导入记录必须提供或映射出真实 `sourceType`。
- `MANUAL_IMPORT` 不作为 `sourceType`。
- 重复 Lead 被阻断时，新来源不丢；权限允许或系统集成规则允许时，追加到 existing `CrmAccount` 的 `CrmSourceRecord`，并生成 `CrmActivity`。
- 无权限访问或编辑已有对象时，不自动追加来源。
- `rawPayload` 不作为业务真相，只用于追溯和排查。
- `CrmSourceRecord` 负责来源归因与证据；`CrmActivity` 负责业务可见时间线展示。

## 8. Opportunity

`Opportunity` 是已正式化 CRM 对象下的一次具体销售机会。

冻结字段：

| 字段 | 说明 |
| --- | --- |
| `id` | 商机标识 |
| `tenantId` | 租户边界 |
| `crmAccountId` | 所属 CRM account |
| `ownerAccountId` | 商机负责人 |
| `name` | 商机名称 |
| `stage` | `NEW / QUALIFYING / QUOTING / SAMPLE / NEGOTIATION / WON / LOST` |
| `status` | `OPEN / WON / LOST / CANCELLED` |
| `estimatedAmount` | 预计金额 |
| `currency` | 币种 |
| `expectedCloseDate` | 预计成交日期 |
| `openedAt` | 商机开始时间 |
| `closedAt` | 关闭时间 |
| `closeReason` | 赢单 / 输单 / 取消原因 |
| `closeNote` | 关闭备注 |
| `createdBy` | 创建人 |
| `createdAt` | 创建时间 |
| `updatedAt` | 更新时间 |

冻结规则：

- 只有已正式化的 `CrmAccount` 可以拥有正式 `Opportunity`。
- 已正式化表示 `lifecycleStage in PROSPECT_CUSTOMER / CUSTOMER`。
- 已正式化 `CrmAccount` 必须绑定 `tenantPartyId`。
- `LEAD / DRAFT` 不得创建正式 `Opportunity`。
- 一个 `CrmAccount` 可以有多个 `Opportunity`。
- Phase 1 不冻结独立 `Opportunity Detail` route；商机详情与编辑通过 tenant-web drawer / modal 承载。
- Phase 1 保留支撑基础 pipeline、赢单 / 输单分析所需的数据字段，但不冻结完整 `SalesTarget / SalesQuota`、阶段概率、加权金额、复杂 pipeline 报表、超期规则或销售周期分析。

## 9. CrmActivity

`CrmActivity` 是 CRM 业务可见时间线动态，只记录已经发生的业务事件，不承载待办任务。

冻结字段：

| 字段 | 说明 |
| --- | --- |
| `id` | 活动标识 |
| `tenantId` | 租户边界 |
| `crmAccountId` | 所属 CRM account |
| `opportunityId` | nullable；关联商机 |
| `contactId` | nullable；关联联系人 |
| `activityType` | 活动类型 |
| `direction` | `INBOUND / OUTBOUND / INTERNAL` |
| `subject` | 标题 |
| `content` | 业务摘要或内容 |
| `occurredAt` | 发生时间 |
| `createdByAccountId` | 创建人账号 |
| `createdByType` | `USER / SYSTEM / INTEGRATION` |
| `externalProvider` | 外部系统名 |
| `externalReference` | 外部引用 |
| `metadata` | 扩展元数据 |
| `visibility` | `INTERNAL / TEAM / OWNER_ONLY` |
| `createdAt` | 创建时间 |

`activityType` 第一阶段候选：

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

冻结规则：

- 用户手动录入、系统自动生成、外部集成写入都可以创建 `CrmActivity`。
- 未来 Email、WeChat、WhatsApp、网站表单、报价链接访问等第三方或客户行为，应将业务可见摘要同步为 `CrmActivity`。
- CRM Activity 不拥有原始邮件正文、完整聊天线程、附件、投递回执或第三方原始消息真相。
- `TASK` 不属于 `CrmActivity.activityType`。Task 是未来全局协作能力。

## 10. Lead Creation And Duplicate Check

创建 Lead 阶段只查 CRM，不查 `party-service`。

冻结用例：

- `CheckLeadDuplicate`：根据当前表单输入查 CRM 内疑似重复、可领取、已有负责人对象，不写库。
- `CreateDraftLead`：创建 `DRAFT + LEAD`，可不查重。
- `CreateLead`：创建 `ACTIVE + LEAD`，必须执行 CRM 内重复检查。
- `SubmitDraftLead`：将 Draft 转为 `ACTIVE + LEAD`，必须执行 CRM 内重复检查。

查重强度：

| 强度 | 依据 | 行为 |
| --- | --- | --- |
| High confidence | normalized email / phone / WhatsApp / domain / lead identifier 精确匹配 | 根据 owner 与权限返回 claimable / owned / restricted 阻断 |
| Medium confidence | 公司名 + 国家相似，或个人名 + 国家 + 联系方式相似 | 返回 `POSSIBLE_DUPLICATE`，允许确认后继续创建 |
| Low confidence | 单独名称相似 | Phase 1 最多提示，不阻断 |

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

冻结规则：

- `POSSIBLE_DUPLICATE` 是保存前确认信息，不是最终 create result。
- 用户确认继续后，请求带 `duplicateWarningAcknowledged = true`；后端仍必须重新检查。
- `CLAIMABLE_EXISTING / OWNED_DUPLICATE / RESTRICTED_DUPLICATE` 即使前端确认也不能绕过。
- Claim Phase 1 只适用于 owner 为空的对象，不等于公海。
- 无权限命中重复对象时必须脱敏返回，避免通过查重接口枚举客户资料。

## 11. Party Resolution And Conversion

Party owns：

| 数据 | Party 侧性质 |
| --- | --- |
| `TenantParty` | 租户内主体主档 |
| `TenantPartyIdentifier` | 强主体标识，可租户内唯一约束 |
| `TenantPartyContactPoint / DigitalProfile` | email、phone、WhatsApp、website、domain 等联系点或数字资料，可用于候选搜索 |
| `TenantPartyAddress` | 地址正文，可用于候选搜索 |

CRM owns：

| 数据 | CRM 侧性质 |
| --- | --- |
| `leadCompanyName / leadPersonName` | 线索阶段输入名 |
| `leadDomain / leadEmail / leadPhone / leadWhatsapp / leadCountry` | 线索阶段搜索 evidence |
| `leadIdentifiers[]` | 线索阶段强主体标识 evidence |
| `source / owner / priority` | CRM 客户经营语义 |
| `CrmContact / CrmSourceRecord / CrmActivity / Opportunity` | CRM 业务对象 |

规则：

- CRM lead 字段可以作为 `party-service` 搜索 evidence。
- Party 用自己的 identifier、contact point、address、name 数据搜索并返回候选。
- domain、email、phone、WhatsApp 可以参与搜索，但不是强 identifier。
- 只有税号、VAT、GST、注册号、身份证、护照等强主体标识才能进入 `TenantPartyIdentifier`。
- Lead 阶段不强制创建 `TenantParty`。
- 转 `PROSPECT_CUSTOMER` 时，CRM 才按字段性质写入或绑定 `TenantParty`。
- CRM owner、source、priority、activity、opportunity 不写入 Party。

`party-service` 后续 contract 应返回主体识别结果，而不是 CRM 业务结果：

- `EXACT_MATCH`
- `NO_MATCH`
- `CANDIDATES_FOUND`
- `IDENTITY_CONFLICT`

CRM P1 已冻结 conversion result：

| 结果 | 处理 |
| --- | --- |
| `CONVERTED` | 成功绑定或创建 `TenantParty`，并更新为 `PROSPECT_CUSTOMER` |
| `INSUFFICIENT_INFO` | CRM 正式化必填信息不足；不进入 Party 匹配；不改变 `CrmAccount`；不写 `CrmActivity` |
| `USER_CHOICE_REQUIRED` | Party 返回候选但不足以自动确认；CRM 在转化弹窗展示候选，让操作人选择或创建新主体 |
| `EXISTING_CRM_ACCOUNT_FOUND` | 目标 `TenantParty` 已绑定其他 active `PROSPECT_CUSTOMER / CUSTOMER` `CrmAccount`；不转化当前 Lead |
| `IDENTITY_CONFLICT` | Party 返回主体识别冲突；CRM 不猜测主体，不执行转化 |

`AUTO_BIND / AUTO_CREATE` 是内部处理路径，不作为最终前端 conversion result 暴露。

`USER_CHOICE_REQUIRED` 冻结规则：

- 不自动绑定。
- 不改变 `lifecycleStage`。
- 不改变 `tenantPartyId`。
- 候选选择发生在转化弹窗内。
- 操作人选择候选后，`crm-service` 必须重新校验 tenant、type、权限和是否已绑定正式 `CrmAccount`。
- 已绑定 active `PROSPECT_CUSTOMER / CUSTOMER` `CrmAccount` 的 `TenantParty` 可以展示为候选，但不可选择为新客户绑定目标。

重复 Lead 冻结规则：

- 创建 Lead 时做 CRM 内查重；强重复按 owner / 权限返回 claimable、owned 或 restricted 阻断。
- 转 `PROSPECT_CUSTOMER` 时做强去重。
- 若目标 `TenantParty` 已绑定其他 active `PROSPECT_CUSTOMER / CUSTOMER` `CrmAccount`，不允许转化当前 Lead，不绑定 `tenantPartyId`，不改变 `lifecycleStage`。

## 12. Archive Rules

`recordStatus = ARCHIVED` 表示退出默认销售流程，但不物理删除。

冻结规则：

- 可归档对象：`DRAFT`、`LEAD`、`PROSPECT_CUSTOMER`。
- Phase 1 不允许归档 `CUSTOMER`。
- owner 或有管理权限的人可以归档。
- 归档后不出现在默认列表。
- 归档对象不参与“允许继续创建”的普通判断，但强匹配时仍可提示历史存在，避免重复数据。
- Phase 1 允许恢复为归档前状态。
- 归档 / 恢复记录全系统 audit。
- 如需要展示在客户时间线，用 `CrmActivity(STATUS_CHANGED)`，metadata 记录 `recordStatus` 变化，不新增专用 Activity 类型。

## 13. P1 Use Cases

CRM P1 冻结以下用例边界：

### CrmAccount / Lead

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

### CrmSourceRecord

- `AddSourceRecord`
- `ListSourceRecords`
- `SetPrimarySourceRecord`

### CrmContact

- `CreateCrmContact`
- `UpdateCrmContact`
- `ArchiveCrmContact`
- `SetPrimaryCrmContact`

### CrmActivity

- `CreateManualActivity`
- `ListActivities`
- `AppendSystemActivity`
- `AppendIntegrationActivity`

### Opportunity

- `CreateOpportunity`
- `UpdateOpportunity`
- `ChangeOpportunityStage`
- `CloseOpportunity`
- `CancelOpportunity`
- `ListOpportunities`

CRM P1 不提供人工 `MarkAsCustomer`。`CUSTOMER` 由后续 Sales / Order 成交事实或历史订单导入事实触发。

## 14. Tenant-web P1 Frontend Entrance

tenant-web CRM P1 必须遵循现有前端框架：

- Vue 3
- Vite
- Vben app shell
- Ant Design Vue
- `Page` 容器
- `a-tabs / a-table / a-drawer / a-modal / a-tag / a-tooltip / dropdown row actions`

第一阶段以前端销售员工作流组织入口，但底层仍使用统一 `CrmAccount` 模型。

一级入口：

```text
CRM
├── 工作台 Dashboard
├── 线索 Lead
├── 客户资源 CRM Account
└── 商机 Opportunity
```

### 14.1 CRM Dashboard

定位：销售员进入 CRM 后的第一屏，回答“今天要做什么”。

P1 views / sections：

- `今日跟进`
- `我的新线索`
- `我的商机`
- `最近活动`

P1 不引入：

- 全局 Task
- 超期规则
- 报价 / PI / 订单
- 销售目标

### 14.2 Lead Workspace

定位：处理新销售资源。

Tabs：

- `我的线索`
- `草稿`
- `无主线索`
- `已归档`

核心操作：

- 新建 Lead
- 保存 Draft
- Submit Draft
- Check duplicate
- Claim owner 为空的对象
- 添加 Activity
- 转 Prospect Customer
- Archive / Restore

### 14.3 CRM Account Workspace

定位：经营已正式化客户资产。

Tabs：

- `潜在客户`
- `成交客户`
- `全部客户资源`
- `已归档`

核心操作：

- 打开 Account 详情
- 添加 Activity
- 添加 Contact
- 添加 Source
- 新建 Opportunity
- Archive / Restore

P1 不提供“新建 Customer”或“手动 Mark as Customer”入口。

### 14.4 Opportunity Workspace

定位：全局推进销售机会。

Tabs：

- `我的商机`
- `Pipeline`
- `已赢单`
- `已输单`
- `已取消`

核心操作：

- 创建 Opportunity
- 编辑 Opportunity
- Change stage
- Close won
- Close lost
- Cancel
- 打开关联 `CrmAccount`

P1 有独立 Opportunity workspace route，但不做独立 `OpportunityDetail` route。点击商机打开 drawer 查看、编辑、推进阶段或关闭。

### 14.5 Detail And Operation Containers

独立 route：

- `CRM > 工作台`
- `CRM > 线索`
- `CRM > 客户资源`
- `CRM > 商机`
- `CrmAccountDetail`，统一承载 Lead、Prospect Customer、Customer 详情

Drawer：

- 新建 / 编辑 Lead
- 添加 / 编辑 Source
- 添加 / 编辑 Contact
- 添加 Activity
- 创建 / 编辑 Opportunity

Modal / Confirm Modal：

- Duplicate candidate decision
- Convert Lead to Prospect Customer，宽 drawer 或 step modal 也可接受
- Claim unowned lead
- Archive / Restore
- Close Opportunity
- Cancel Opportunity

第一阶段不做一级入口：

- Contact
- Source
- Activity
- Pool / 公海
- Quote / PI
- Sales Order / Invoice
- Global Task
- AI assistant
- Complex pipeline report

## 15. Audit / Context / Security

CRM 不设计特殊 `CrmAuditEvent` 业务对象。

CRM 必须接入全系统 audit architecture。

以下动作必须可审计：

- owner change
- lifecycle stage change
- record status change
- TenantParty 绑定
- 来源新增
- 联系人新增或变更
- 商机创建
- 商机阶段变更
- 商机关闭
- 归档 / 恢复

若业务时间线需要展示某类审计动作，应额外创建对应 `CrmActivity`。

所有 CRM query / command 必须显式携带：

- `tenantId`
- operator context
- trace context

所有 CRM command 还必须携带：

- audit context

CRM 不拥有授权判定真相，但必须向 `permission-service` 提供资源级授权所需业务事实。

P1 最小权限动作：

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

## 16. Deferred

以下内容不属于本 feature 冻结范围：

- runtime 实现
- proto / contract 细节
- Prisma schema
- Gateway / BFF 具体接口
- 公海与保护期
- 报价 / PI / 订单 / 发票边界
- AI 场景
- 全局 Task
- 复杂权限模型细节
- 销售目标、阶段概率、加权预测、复杂 pipeline 报表
- 超期规则
- 销售周期分析
- 复杂联系人角色模型
- Campaign / Marketing 自动化
- 客户 360 / BI 聚合视图

## 17. Acceptance Criteria

本 feature 完成条件：

- `crm-service.md` 已替换为 CRM v2 Phase 1 稳定设计。
- 旧 `CustomerPartyBinding` 主路径被明确废弃。
- `CrmAccount / CrmContact / CrmSourceRecord / Opportunity / CrmActivity` 对象语义已冻结。
- `recordStatus` 与 `lifecycleStage` 两条轴已冻结。
- `QUALIFIED_LEAD` 不进入 P1。
- TenantParty 绑定规则与 ADR 0008 一致。
- `CrmSourceRecord` 与 `CrmActivity` 的职责差异已冻结。
- `Opportunity` 只允许绑定已正式化 `CrmAccount`。
- `Opportunity` P1 有独立 workspace，但不做独立 detail route。
- Party / CRM 数据归属与 evidence / identifier 边界已冻结。
- `ConvertLeadToProspectCustomer` 已确认的 P1 result model 已冻结。
- CRM 审计明确对齐全系统 audit architecture，不设计特殊 CRM audit 表。
- tenant-web P1 一级入口、tabs/views、route/drawer/modal 划分已冻结。
- Deferred 清单明确，不把公海、报价、AI、Task、复杂预测混入 Phase 1。

## 18. Suggested Next Steps

后续建议按以下顺序推进，但不属于本 feature 已承诺实现：

1. 冻结 CRM v2 contract / proto feature packet。
2. 冻结 CRM v2 Prisma schema migration plan。
3. 替换旧 customer master runtime。
4. 接入 Gateway / BFF。
5. 实现 tenant-web CRM v2 页面。
6. 冻结公海与保护期 feature。
7. 冻结报价 / 订单 / 发票协同 feature。
