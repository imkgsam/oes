# crm-service 职责卡

Last Updated: 2026-05-13

## 1. Purpose

`crm-service` 是 OES 的客户关系与销售前置上下文服务，负责回答“销售侧如何管理潜在线索、客户关系外壳、联系人与可进入交易链的客户主档”。

当前职责卡冻结的是 `crm-service` 的最小稳定边界：在保留既有 `prospecting` 归属的同时，补齐最小 `customer master` 闭环，供后续 `CRM-CONTRACT` 与 `sales-service` phase 1 继续承接。完整 `Opportunity / Activity / Customer 360` 仍需在后续 feature / architecture 中单独冻结。

## 2. Owns

- `CustomerAccount`
- `CustomerAddressUsage`
- `CustomerContactUsage`
- `CustomerTaxProfile`
- `CustomerStatus`
- `CustomerCategory`
- customer `tags`
- `CustomerAccount.tenantPartyId` 客户角色到 `TenantParty` 的正式引用
- 客户默认交易条件：
  - `defaultCurrency`
  - `defaultPaymentTermId`
  - role-level display name / short name
- `prospecting` 前置研究能力：
  - research target
  - research timeline / event
  - research fact / note
  - contact clue
  - lead draft
  - disqualification / low-value research judgement
- 从 `LeadDraft` 到正式 CRM 对象的受控交接边界。
- CRM 资源的业务归属、销售协同状态与客户开发状态。

## 3. Does Not Own

- `party-service` 的主体主数据、租户主体引用、地址 / 联系人正文与 owner 边界；以 [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md) 为准。
- 正式销售报价、`QuoteVersion`、销售订单与 Sales transaction snapshot；该事实归属 `sales-service`。
- `AR / credit / payment / account` 真相；该事实归属 `finance-service` 或 future finance boundary。
- `PaymentTerm` 主数据真相；该事实归属 `finance-service`。
- 发票、税额、税率、税务期间、红冲、认证、抵扣等财务事实；该事实归属 `finance-service`。
- `Customer 360`、BI 聚合视图或跨域分析真相。
- 多主体 bill-to / ship-to / legal entity 交易建模真相。
- 当前 minimum foundation 下的完整 `Opportunity / Activity` 模型。
- 认证、会话、令牌；归属 `auth-service`。
- 账号、身份映射、租户账号事实；归属 `identity-service`。
- 角色、权限、授权判定真相；以 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 为准。
- AI 模型调用、AI agent 编排或 AI 工具协议真相。

## 4. Core Responsibilities

- 承接销售背调和客户开发过程中的可审计研究信息。
- 管理 CRM 业务角色语义，而不是复制 `party-service` 主体主数据。
- 将 `CustomerAccount` 作为 `TenantParty` 上的客户角色，而不是交易 / 法律主体真相本身。
- 管理 `CustomerAddressUsage / CustomerContactUsage / CustomerStatus / CustomerCategory / tags` 与客户关系语义；地址与联系人正文继续归 `party-service`。
- 通过 `CustomerAccount.tenantPartyId` 使 Sales / Pricing / Agreement 可稳定引用客户主体入口。
- 向 Sales 提供受控 customer selector；只有可交易状态的 `CustomerAccount` 才可进入销售选择器。
- 管理 `CustomerTaxProfile` 作为客户交易税务默认配置，不拥有发票与税务核算事实。
- 维护客户默认交易条件，例如默认币种、默认付款条款、默认开票地址 usage 与默认开票联系人 usage；这些只作为订单创建默认值，不能解释历史交易。
- 为权限层提供资源归属、team 协同和可见性裁剪所需的业务事实。

## 5. External Interfaces

- 典型上游入口：
  - `api-gateway`
  - future CRM Web pages
  - future sales workspace through Gateway / BFF and internal contract only
  - browser prospecting extension through BFF only
- 当前相关文档：
  - [browser-prospecting-workspace.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/api-gateway/browser-prospecting-workspace.md)
  - [crm-customer-master-foundation.md](/Users/acehood/Documents/GitHub/oes/docs/plans/features/crm-customer-master-foundation.md)
- 当前设计工作台：
  - [crm-service-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/crm-service-design.md)
  - [browser-prospecting-workspace.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/browser-prospecting-workspace.md)

## 6. Upstream Dependencies

- `party-service`
  - 按 [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md) 提供主体引用、主体摘要、地址簿与联系人簿正文。
  - CRM 不应直接复制主体主数据真相。
- `finance-service`
  - 提供 `PaymentTerm`、客户信用摘要与后续财务状态。
  - CRM 只保存默认引用与展示摘要，不拥有财务控制真相。
- `permission-service`
  - 提供接口权限、资源授权、查询范围和协同可见性判定能力；permission 侧核心对象与 owner 边界以 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 为准。
- `identity-service`
  - 提供 operator account / tenant / team 相关身份上下文事实，具体组织结构 owner 后续需结合 Tenant & Organization 设计冻结。
- `tenant-org-service`, future
  - 如需冻结 owner / team 与 org 范围协同，应消费组织上下文而不是复制 org 主模型；`Tenant / OrgUnit / org tree` 边界以 [tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md) 为准。
- AI platform, future
  - 只通过受控 suggestion / review 流程接入，不直接写 CRM 主数据。

## 7. Downstream / Published Facts

- Prospecting research target 和 timeline。
- Lead draft。
- `CustomerAccount` 业务摘要。
- `CustomerAddressUsage / CustomerContactUsage` 业务摘要。
- `CustomerTaxProfile` 默认税务配置摘要。
- `CustomerStatus / CustomerCategory / tags` 摘要。
- `CustomerAccount.tenantPartyId` 绑定摘要。
- 供 Sales selector 消费的 customer eligibility facts：
  - `CustomerAccount.status` 处于可交易状态
  - `CustomerAccount.tenantPartyId` exists
- CRM 资源归属、跟进状态、协同可见性所需业务事实。

## 8. Non-goals

- 不作为通用实体主数据服务。
- 不把 `party-service` 主体事实复制成 CRM 真相。
- 不绕过 BFF 直接暴露给浏览器插件。
- 不让 Sales 长期绕过 CRM selector 直接以 Party 入口充当客户选择能力。
- 不让 AI 直接写正式 customer master、lead、contact 或 future opportunity。
- 不在当前阶段强行冻结完整 `Opportunity / Activity / Customer 360`。
- 不把 `AR / credit / payment` 并入 CRM。
- 不把 payment account / bank account 设计作为 CRM/SRM 第一阶段前置依赖。
- 不在 phase 1 扩展一客多主体、多 bill-to / ship-to / legal entity 模型。
- 不把 `ResearchTarget` 直接等同于正式 CRM account。
- 不把 `ContactClue` 直接等同于正式 CRM contact。
- 不把 `LeadDraft` 直接等同于正式 CRM lead。

## 9. Current Stage

当前阶段只冻结最小职责边界：

- Browser Prospecting 第一阶段后端持久化优先归属 `crm-service` 内部 `prospecting` slice。
- `CustomerAccount` 是客户关系外壳；`tenantPartyId` 是 Sales / Pricing / Agreement 的稳定主体引用。
- phase 1 一条 `CustomerAccount` 直接引用一个 `tenantPartyId`。
- 同一 `tenantId + tenantPartyId` 最多对应一个 active / non-archived `CustomerAccount`。
- 建客户时必须先通过 `party-service` resolve / create 主体事实与租户主体引用，再创建 `CustomerAccount`；强标识命中与复用规则以 [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md) 为准。
- `Party Selector` 只用于主体去重 / 复用；`Customer Selector` 只返回可被销售采用的 `CustomerAccount`。
- `CustomerAccount.status` 建议最小集合为 `DRAFT / ACTIVE / ON_HOLD / SUSPENDED / ARCHIVED`。
- `CustomerAccount.displayName / shortName / customerCode` 归 CRM；`Party.legalName` 归 Party。创建时可从 legal name 初始化 display name，但后续 legal name 变化不能覆盖 CRM 角色显示名。
- `CustomerTaxProfile` 第一阶段最小字段为 `invoiceTitle / taxRegistrationNo / taxpayerType / defaultInvoiceType / defaultTaxTreatment / invoiceAddressUsageId / invoiceContactUsageId`。
- `defaultCurrency / defaultPaymentTermId` 只作为销售默认值；SalesOrder / Invoice / Receivable 必须保存自己的交易币种与付款条款 snapshot。
- `LeadDraft -> CRM Lead`、完整 `Opportunity / Activity`、`Customer 360` 与跨域分析视图尚未冻结。
- `CustomerItemMapping / customer SKU` 目录 deferred；phase 1 仅由 `sales-service` 在 `SalesOrderLine.customerItemSnapshot` 承接交易快照。
- 如果后续决定将 Prospecting 独立成服务，必须新增 ADR 说明拆分依据、数据所有权和与 CRM 的契约边界。
