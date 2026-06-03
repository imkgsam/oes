# crm-service 职责卡

Last Updated: 2026-05-22

## 1. Truth Source Rule

本文是 `crm-service` 的唯一稳定设计真相源。

其他 CRM 相关文档只能承担以下职责：

- `docs/contracts/crm-service/**`：描述黑盒接口契约，不重新定义 CRM 核心对象、owner 边界或长期命名。
- `docs/architecture/collaborations/**`：描述跨服务协同，不重新定义 `crm-service` 自身职责。
- `docs/plans/features/**`：描述阶段执行状态、实现路径与验收，不重新定义服务边界。
- `docs/plans/designs/crm-service-design.md`：只作为历史设计工作台和开放问题记录，不再承载稳定设计结论。

若其他文档与本文冲突，以本文为准。若 CRM 业务设计需要变更，必须先更新本文；涉及跨服务协同或关键取舍时，再同步更新 collaboration、contract 或 ADR。

## 2. Purpose

`crm-service` 是 OES 的客户关系与销售前置上下文服务，负责回答：

- 哪些潜在客户、正式客户和客户联系人正在进入销售流程？
- 客户关系当前处于什么状态？
- 哪些客户可被 Sales / Pricing / Agreement 采用为交易入口？
- 哪些线索、商机、销售活动和协同责任正在推进？

CRM 不回答“这个法律 / 交易主体是谁”。该事实归属 `party-service`。CRM 回答“这个主体或潜在线索在销售关系中是什么状态、由谁跟进、是否可进入交易链”。

## 3. Stable Bounded Context

`crm-service` 采用广义销售 CRM 边界，长期覆盖以下能力：

- 多渠道客户进入：
  - `Intake`
  - `Prospecting`
- 正式销售线索：
  - `Lead`
- 客户关系主档：
  - `CustomerAccount`
  - `CustomerPartyBinding`
  - `CustomerContactUsage`
  - `CustomerAddressUsage`
  - `CustomerTaxProfile`
  - customer category / status / tags
  - customer default commercial terms
- 销售推进：
  - `Opportunity`
  - `Activity`
- 横切治理：
  - matching / dedup
  - assignment / collaboration
  - CRM resource owner / team / visibility facts
  - CRM-local audit facts

当前已实现和已冻结的代码主线只覆盖 `customer master phase 1`，不代表完整 CRM 已经实现。

## 4. Owns

`crm-service` owns：

- `Intake`：被动进入销售视野的原始客户接触记录。
- `ProspectingTarget`：主动开发中的研究目标。
- `ResearchEvent / ResearchFact / ContactClue / LeadDraft` 等 prospecting 一阶段研究事实。
- `Lead`：正式进入销售处理流程的线索。
- `CustomerAccount`：CRM 客户关系外壳。
- `CustomerPartyBinding`：`CustomerAccount` 到 `TenantParty` 的客户角色绑定关系。
- `CustomerContactUsage`：某联系人在客户关系中的销售语义、角色、状态与偏好。
- `CustomerAddressUsage`：某地址在客户关系中的销售用途、状态与默认值。
- phase 1 代码中已存在的 `CustomerContact / CustomerAddress` 关系侧记录；它们是 `CustomerContactUsage / CustomerAddressUsage` 的最小实现形态，不代表 Party 联系人 / 地址正文真相。
- `CustomerTaxProfile`：客户交易税务默认配置。
- customer status / category / tags。
- 客户默认交易条件：
  - `defaultCurrency`
  - `defaultPaymentTermId`
  - default invoice address usage
  - default invoice contact usage
- `Opportunity`：销售确认、值得推进且有潜在成交价值的具体销售机会。
- `Activity`：销售动作与互动语义。
- CRM resource owner / owner team / assignment / handoff / collaboration state。
- CRM matching / dedup 候选与治理过程。
- CRM 本服务内的业务审计事实。

## 5. Does Not Own

`crm-service` does not own：

- `party-service` 的主体主数据、租户主体引用、主体标识、地址正文、联系人正文、merge 事实；以 [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md) 为准。
- 正式报价、`QuoteVersion`、销售订单、订单行、交易承诺与 Sales transaction snapshot；归属 `sales-service`。
- `AR / credit / payment / account` 真相；归属 `finance-service` 或 future finance boundary。
- `PaymentTerm` 主数据真相；归属 `finance-service`。
- 发票、税额、税率、税务期间、红冲、认证、抵扣等财务事实；归属 `finance-service`。
- `Customer 360`、BI 聚合视图或跨域分析真相。
- 多主体 bill-to / ship-to / legal entity 交易建模真相。
- 认证、会话、令牌；归属 `auth-service`。
- 账号、身份映射、租户账号事实；归属 `identity-service`。
- 组织树、部门、小组、正式任职真相；分别以 `tenant-org-service` 与 `hr-service` 真相源为准。
- 角色、权限、scope、policy 与授权判定真相；以 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 为准。
- 邮件线程、共享邮箱、原始通信正文、附件与投递过程；归属 future communication / mailbox boundary。
- AI 模型调用、agent 编排或 AI 工具协议真相。

## 6. Core Object Semantics

### 6.1 Intake

`Intake` 是被动进入销售视野的原始客户接触记录。

典型来源包括官网表单、展会线索、电话咨询、邮箱来信、转介绍、渠道商转介、名单导入和第三方渠道导入。

`Intake` 可以被 triage 后转为 `Lead`、挂到已有客户关系、拒绝或归档。

### 6.2 Prospecting

`ProspectingTarget` 是主动开发中的研究目标。

Browser Prospecting 只是 prospecting 的一个 adapter。浏览器插件只能通过 BFF / Gateway 进入，不能反向定义 CRM 主模型。

`ResearchTarget / ContactClue / LeadDraft` 是 prospecting 到正式 CRM 对象的防腐层：

- `ResearchTarget` 不等于 `CustomerAccount`。
- `ContactClue` 不等于 `CustomerContactUsage`。
- `LeadDraft` 不等于 formal `Lead`。

`LeadDraft -> Lead` 的正式交接契约尚未冻结。

### 6.3 Lead

`Lead` 是正式进入销售处理流程的线索。

`Lead` 可以独立存在，不要求最早时点就绑定 `tenantPartyId`。当销售确认需要建立稳定客户关系档案时，`Lead` 可以转为或关联 `CustomerAccount`。

### 6.4 CustomerAccount

`CustomerAccount` 是 CRM 中的客户关系外壳，不是 Party 主体真相。

`CustomerAccount` owns：

- CRM role-level display name / short name / customer code。
- customer status / category / tags。
- customer owner / team / collaboration facts。
- customer relationship summaries。
- `CustomerPartyBinding`。
- customer contact / address usage。
- customer tax profile and default commercial terms。

`CustomerAccount.displayName` 可在创建时由 Party legal name 初始化，但后续 Party legal name 变化不能覆盖 CRM 角色显示名。

### 6.5 CustomerPartyBinding

`CustomerPartyBinding` 表达 `CustomerAccount` 与 `tenantPartyId` 的受控客户角色绑定关系。

当前 phase 1 稳定规则：

- 一条 `CustomerAccount` 最多一个 active primary `tenantPartyId`。
- 同一 `tenantId + tenantPartyId` 最多对应一个 active / non-archived `CustomerAccount`。
- 绑定前必须校验目标 `tenantPartyId` 在当前租户存在且当前可绑定。
- 绑定目标真相仍归 `party-service`；CRM 不复制 Party 主数据。
- phase 1 不展开多主体、binding history、复杂 rebinding workflow。

### 6.6 CustomerContactUsage

`CustomerContactUsage` 表达联系人在客户关系中的销售语义。

它 owns：

- 联系人在客户关系中的角色 / 职务摘要。
- 可联络状态。
- 联系偏好。
- 是否 primary / key person / decision maker。
- 与 `CustomerAccount` 的业务关系。

联系人正文、person party 和全局身份事实不归 CRM。

当前代码中的 `CustomerContact` 是 phase 1 最小关系侧记录，应按 `CustomerContactUsage` 语义理解。

### 6.7 CustomerAddressUsage

`CustomerAddressUsage` 表达地址在客户关系中的销售用途和默认值。

它 owns：

- 地址标签和销售使用摘要。
- 是否 primary / invoice default / delivery default 等 CRM 关系语义。
- 地址在客户关系中的启用状态。

地址正文、主体注册地址、法律地址真相不归 CRM。

当前代码中的 `CustomerAddress` 是 phase 1 最小关系侧记录，应按 `CustomerAddressUsage` 语义理解。

### 6.8 CustomerTaxProfile

`CustomerTaxProfile` 是客户交易税务默认配置，不拥有税务核算事实。

phase 1.1 最小候选字段：

- `invoiceTitle`
- `taxRegistrationNo`
- `taxpayerType`
- `defaultInvoiceType`
- `defaultTaxTreatment`
- `invoiceAddressUsageId`
- `invoiceContactUsageId`

发票、税额、税率、税务期间、认证、抵扣、红冲等事实归属 `finance-service`。

### 6.9 Customer Default Commercial Terms

CRM 可以保存客户默认交易条件：

- `defaultCurrency`
- `defaultPaymentTermId`

这些字段只作为创建报价 / 订单的默认值。`SalesOrder / Invoice / Receivable` 必须保存自己的交易币种、付款条款和相关 snapshot；历史交易不能依赖回查当前 CRM / Finance 主数据解释。

### 6.10 Opportunity

`Opportunity` 是销售确认、值得推进且有潜在成交价值的具体销售机会。

长期规则：

- `Opportunity` 以手动创建为主。
- AI 或系统可以建议创建，但不自动创建。
- `Opportunity` 必须绑定一个 `CustomerAccount`。
- `Opportunity` 不拥有正式报价真相，报价归 `sales-service`。

`Opportunity` 阶段枚举尚未冻结。

### 6.11 Activity

`Activity` 是 CRM 中的销售动作与互动语义对象。

长期活动类型候选包括：

- `CALL`
- `MEETING`
- `VISIT`
- `NOTE`
- `TASK`
- `EMAIL`
- `MESSAGE`
- `STATUS_CHANGE`
- `ASSIGNMENT_CHANGE`

CRM 可以记录 `EMAIL` 类型 activity 的销售语义、摘要和关联关系，但不拥有原始邮件正文、线程、附件、收发过程或共享邮箱责任制。

## 7. Conversion Rules

长期转换路径：

- `Intake -> Lead`
- `ProspectingTarget -> Lead`
- `Lead -> CustomerAccount`
- `Lead -> CustomerContactUsage`
- `CustomerAccount -> Opportunity`

明确禁止：

- `Lead` 自动创建 `Opportunity`。
- `Opportunity` 脱离 `CustomerAccount` 漂浮存在。
- 批量导入默认直接创建 `Opportunity`。
- `ResearchTarget / ContactClue / LeadDraft` 直接升级为正式 CRM 对象而不经过受控转换。

## 8. Selector And Sales Handoff

`Party Selector` 与 `Customer Selector` 是两种不同入口：

- `Party Selector` 只用于主体去重、复用与绑定候选选择。
- `Customer Selector` 只返回可被销售采用的 `CustomerAccount`。

当前 phase 1 `Customer Selector` 规则：

- 只返回 `ACTIVE_CUSTOMER + active primary CustomerPartyBinding`。
- `BLOCKED / ARCHIVED` 客户不得进入 selector。
- 没有 active primary binding 的客户不得进入 selector。

Sales 采用 selector 结果后，`sales-service` 必须保存：

- `customer_tenant_party_id`
- customer snapshot

`PublishQuote` 必须把当时 customer snapshot 复制到 `QuoteVersion`。`ConvertQuoteVersionToOrder` 必须把 `QuoteVersion` 中的 customer snapshot 复制到 `SalesOrder`，不得重新回源 CRM / Party 改写历史。

## 9. Security, Context And Audit

所有 CRM query / command 必须显式携带：

- `tenantId`
- operator context
- trace context
- audit context，command 必需

CRM 不拥有授权判定真相，但必须提供 permission-service 做资源级授权所需的业务事实：

- owner
- owner team
- collaboration state
- resource status
- visibility facts

不得在 controller、DTO、Prisma schema 中固化核心授权规则。

每个会改变 CRM 状态的 command 必须可审计。当前 phase 1 已实现 command audit envelope；幂等键、重试策略和集中审计检索仍未冻结。

## 10. AI Boundary

AI 只允许：

- 建议
- 总结
- 推荐动作
- 辅助匹配
- 工具型协同

AI 不允许：

- 直接写入或修改正式 CRM 主数据。
- 绕过应用服务执行状态变更。
- 绕过权限、审计和人工确认。

任何改变 CRM 状态的 AI 输出必须经过受控 command、权限判定、审计记录和必要的人工确认。

## 11. Current Implementation Stage

当前代码实现状态：

- `crm-service` 已实现 customer master phase 1 gRPC runtime。
- 已实现 `CustomerManagementService`：
  - `CreateCustomerAccount`
  - `UpdateCustomerAccountBasics`
  - `BindCustomerAccountToTenantParty`
  - `UpsertCustomerContact`
  - `UpsertCustomerAddress`
  - `ChangeCustomerStatus`
- 已实现 `CustomerQueryService`：
  - `SearchSelectableCustomers`
  - `GetCustomerAccount`
  - `SearchCustomerAccounts`
  - `ListCustomerContacts`
  - `ListCustomerAddresses`
- 已实现 Prisma 持久化：
  - `CustomerAccount`
  - `CustomerPartyBinding`
  - `CustomerContact`
  - `CustomerAddress`
  - `CrmAuditEnvelope`
- 已接入 api-gateway customer-management BFF。
- 已接入 tenant-web customer management 基础页面。

当前实现仍属于 `customer master phase 1 hardening`，不是完整 CRM 实现。

## 12. Current Gaps

当前已知缺口：

- `ChangeCustomerStatus` 的非法 enum 处理需要与 contract 对齐，非法 / unspecified status 不得默认为 `ACTIVE_CUSTOMER`。
- customer 创建仍缺少“Party resolve / create / select + CustomerAccount 创建 + binding”的完整业务编排。
- tenant-web 当前 customer binding 体验仍偏向手填 `tenantPartyId`，需要 Party selector。
- `CustomerContact / CustomerAddress` 与长期 `CustomerContactUsage / CustomerAddressUsage` 命名和语义需要在后续 contract 演进中收敛。
- primary contact / primary address 的唯一性、inactive 关系与自动降级规则尚未冻结。
- `CustomerTaxProfile / defaultCurrency / defaultPaymentTermId` 尚未进入 contract / proto / schema / UI。
- 服务内资源级 owner / team / query scope 授权尚未形成闭环。
- Sales selector 采用链路仍需做 Quote / QuoteVersion / SalesOrder snapshot 联调验收。
- `LeadDraft -> Lead`、`Lead -> CustomerAccount`、`CustomerAccount -> Opportunity` 契约尚未冻结。

## 13. Deferred

以下能力 deferred，不得写成当前 phase 1 已承诺实现：

- 完整 `Intake`
- 完整 `Prospecting`
- formal `Lead`
- formal `Opportunity`
- formal `Activity`
- `Customer 360 / BI`
- `AR / credit / payment`
- 一客多主体模型
- 多 legal entity、bill-to / ship-to 地址矩阵
- 完整 `CustomerItemMapping / customer SKU`
- customer dedup / merge 全流程治理
- 完整 `CustomerStatus` 状态机
- 完整 `CustomerCategory` taxonomy
- CRM integration events

## 14. Related Documents

- [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md)
- [sales-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/sales-service.md)
- [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)
- [sales-crm-party-item-master.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/sales-crm-party-item-master.md)
- [crm-service contracts](/Users/acehood/Documents/GitHub/oes/docs/contracts/crm-service/README.md)
- [crm-customer-master-foundation.md](/Users/acehood/Documents/GitHub/oes/docs/plans/features/crm-customer-master-foundation.md)
- [crm-service-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/crm-service-design.md)
