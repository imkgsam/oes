# srm-service 职责卡

Last Updated: 2026-08-14

## 1. Purpose

`srm-service` 是 OES 的供应商关系主档服务，负责回答“这个租户内有哪些正式供应商档案、它们绑定了哪个正式主体、当前处于什么供应商状态、有哪些联系人/地址/分类/标签，以及后续有哪些供应商采购信息可供采购参考”。

当前职责卡冻结 `SRM-MINIMAL` 的供应商主档闭环与已经存在的最小 `SupplierOffering` 可供应关系。标准 Item 进入 PO 前由 Procurement 受控查询 SRM，校验 active `SupplierProfile` 与 exact active `SupplierOffering`；该 offering 仍不承载价格、MOQ、lead time 或交易条款。正式 RFQ、PO、成交价、收货和履约事实归 `procurement-service`，`PaymentTerm` 主数据归 `finance-service`。

## 2. Owns

- `SupplierProfile`
- `SupplierAddressUsage`
- `SupplierContactUsage`
- `SupplierTaxProfile`
- `SupplierStatus`
- `SupplierCategory`
- `SupplierTag`
- `SupplierOffering` 最小可供应关系
- `SupplierProfile.tenantPartyId` 供应商角色到 `TenantParty` 的正式引用
- 供应商默认交易条件：
  - `defaultCurrency`
  - `defaultPaymentTermId`
  - role-level display name / short name
- 供应商主档层面的唯一性、状态切换与启停规则

补充冻结规则：

- `SupplierProfile` 的正式主体引用是 `tenantPartyId`
- `ACTIVE SupplierProfile` 必须绑定 `tenantPartyId`
- 同一 `tenantId + tenantPartyId` 只允许一个正式 `SupplierProfile`
- 标准 Item 进入 PO 前必须解析 exact active `SupplierOffering`；日常非标准文本采购不适用该规则
- `SupplierOffering` 只表达供应商针对 exact internal `Item` 的 active/inactive 可供应关系，不扩展为 `ItemModel` 范围或 caller-selected 通用资格规则
- `SupplierOffering` 不承载默认采购价格、币种、MOQ、lead time、供应商料号或交易条款；实际交易价格和历史成交事实归 Procurement

## 3. Does Not Own

- `party-service` 的主体主数据、租户主体引用、标识、地址 / 联系人正文与稳定主体关系；具体核心对象与 owner 边界以 [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md) 为准
- `item-master-service` 的 Item 主数据真相：
  - `ItemModel`
  - `Item`
  - Item execution capability
  - `SupplierItemMapping`
- `SupplierItemMapping` 真相
- 采购单、收货与采购执行真相：
  - future `procurement-service`
- RFQ、采购订单、收货、履约、实际成交价和历史采购价格事实
- `PaymentTerm`、付款控制、付款冻结、付款账户与供应商发票财务事实
- 供应商绩效评分真相
- 来料质量、拒收、整改与质量处理真相
- 认证、会话、身份映射、权限判定与组织树真相

## 4. Core Responsibilities

- 维护租户内正式供应商业务档案，而不是复制 `party-service` 主体真相。
- 以 `SupplierProfile.tenantPartyId` 表达供应商角色与正式主体的受控引用。
- 维护供应商联系人 usage、地址 usage、分类、标签和供应商状态等 SRM 业务语义；联系人与地址正文继续归 `party-service`。
- 管理 `SupplierTaxProfile` 作为供应商交易税务默认配置，不拥有供应商发票、进项税、认证或付款事实。
- 维护供应商默认交易条件，例如默认币种、默认付款条款、默认收票地址 usage 与默认财务联系人 usage；这些只作为采购创建默认值，不能解释历史交易。
- 维护 `SupplierOffering` 的最小 active/inactive 可供应关系；标准 Item 采购通过窄 INTERNAL 查询校验该事实，不能复用 Gateway 目录查询。
- 对 future `procurement-service` 与其他受控消费者提供统一供应商主档查询口径。
- 在状态变更时执行最小主档闭环所需的一致性校验，而不是把采购商业条款并入 SRM。

## 5. External Interfaces

- 典型上游入口：
  - `api-gateway`
  - future tenant-web SRM supplier master pages
- 典型下游消费者：
  - future `procurement-service`
  - `item-master-service`
  - future workflow / collaboration entrypoints
- 当前设计工作台：
  - [srm-service-design.md](../../plans/designs/srm-service-design.md)
- 当前跨服务协同真相：
  - [srm-procurement-party-item-master.md](../collaborations/srm-procurement-party-item-master.md)

## 6. Upstream Dependencies

- `party-service`
  - 提供 `tenantPartyId` 对应的正式主体引用基础、主体摘要、地址簿与联系人簿正文。
  - SRM 不复制注册信息、证照与主体 canonical 真相。
- `item-master-service`
  - 提供 `ItemModel`、`Item` 与 purchasable 能力真相。
  - 继续拥有 `SupplierItemMapping`，SRM 只引用其结果，不接管其真相。
- `permission-service`
  - 提供供应商主档管理与查询的授权判定能力；permission 侧核心对象与 owner 边界以 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 为准。
- `identity-service` / `tenant-org-service`
  - 提供 operator context、owner / org reference 所需基础上下文；`Tenant / OrgUnit / org tree` 边界以 [tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md) 为准，SRM 不重新定义 org scope 真相。
- `finance-service`
  - 提供 `PaymentTerm` 与 future supplier payment control / AP 摘要。
  - SRM 只保存默认引用与展示摘要，不拥有财务控制真相。

## 7. Downstream / Published Facts

- `SupplierProfile` 基础摘要与状态
- `SupplierProfile.tenantPartyId` 正式主体引用事实
- 供应商联系人 usage、地址 usage、分类与标签摘要
- `SupplierTaxProfile` 默认税务配置摘要
- `SupplierOffering` 可供应关系摘要
- 供下游校验或引用的供应商启停状态摘要

## 8. Non-goals

- 不把 `SupplierItemMapping` 扩成采购商业档
- 不把 first-stage `SupplierProfile` 主档扩成采购价格表或 RFQ 系统
- 不复制 `party-service` 的主体注册信息作为 SRM 真相
- 不冻结 future `procurement-service` 的 PO / RFQ 对象名
- 不在本阶段承诺供应商绩效、质量整改或资质闭环
- 不把 payment account / bank account 设计作为 SRM 第一阶段前置依赖

## 9. Current Stage

当前阶段只冻结 `SRM-MINIMAL` 的第一阶段规则：

- SRM 的第一优先级是供应商主档闭环，不是采购分析平台。
- 正式主体引用统一使用 `tenantPartyId`。
- 建供应商时必须先通过 `party-service` resolve / create 主体事实与租户主体引用，再创建 `SupplierProfile`；强标识命中与复用规则以 [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md) 为准。
- `TenantParty Selector` 只用于当前租户内主体选择；`Supplier Selector` 只返回可被采购采用的 `SupplierProfile`。
- `SupplierProfile.status` 建议最小集合为 `DRAFT / PENDING_REVIEW / ACTIVE / SUSPENDED / BLACKLISTED / ARCHIVED`。
- `SupplierProfile.displayName / shortName / supplierCode` 归 SRM；`TenantParty.legalName` 归 Party。创建时可从 legal name 初始化 display name，但后续 legal name 变化不能覆盖 SRM 角色显示名。
- `SupplierTaxProfile` 第一阶段最小字段为 `invoiceTitle / taxRegistrationNo / taxpayerType / defaultInvoiceType / canIssueVatSpecialInvoice / defaultTaxTreatment / invoiceAddressUsageId / financeContactUsageId`。
- `defaultCurrency / defaultPaymentTermId` 只作为采购默认值；PurchaseOrder / supplier invoice / Payable 必须保存自己的交易币种与付款条款 snapshot。
- 当前实现维护最小 `SupplierOffering` active/inactive 关系；标准 Item 进入 PO 前必须由 Procurement 通过 SRM-owned 窄查询确认 exact active offering。
- `SupplierOffering` 不记录默认价格、币种、MOQ、lead time、供应商料号或交易条款；它不等于 RFQ、PO、成交价或采购履约事实。
- `SupplierItemMapping` 继续归 `item-master-service`，只表达 `supplierId + supplierItemCode / supplierItemName -> itemId`。
- 采购交易、质量、绩效、整改、RFQ、实际成交价与履约全部 deferred 到后续独立 contract / feature 线程。

## 10. Trusted gRPC Inbound Contract

- 当前 13 个 `SupplierQueryService` / `SupplierManagementService` RPC 各自只有一种执行分类：`BUSINESS / HUMAN / WEB`；唯一 production caller 是 `api-gateway`，audience 为 `urn:oes:service:srm-service`。
- 13 个现有 request 的 `tenant_id / operator_context / trace_context`，以及 7 个 management request 的 `audit_context`，共 46 个 authority 字段全部删除并按原 field number/name reserve。租户、组织、operator、trace 与审计归因只来自已验证 ExecutionToken 和 mTLS transport context；response 中 SRM-owned `tenant_id` projection 保留。
- Procurement 不再复用 `GetSupplier` 与 `ListSupplierOfferingsBySupplier`。SRM 新增且只新增 `SrmInternalQueryService.ResolveActiveSupplier` 与 `ResolveActiveSupplierOffering`，均为 `INTERNAL / HUMAN_OBO`，只允许 exact `procurement-service` SYSTEM MACHINE actor，保留原始 HUMAN subject，并拒绝 pure MACHINE root、DELEGATED、TENANT MACHINE、direct HUMAN 与其他 workload。
- 两个 INTERNAL Code 分别为 `srm.internal.supplier_profile.resolve_active` 与 `srm.internal.supplier_offering.resolve_active`；Permission 只授权 actor workload，不拥有或重写 subject tenant authority。
- `ResolveActiveSupplier` 只回答目标 Supplier 是否存在且 active；`ResolveActiveSupplierOffering` 只回答 exact `supplier_id + item_id` offering 是否存在且 active。`NOT_FOUND` 表示对象不存在，`FAILED_PRECONDITION` 表示对象存在但不 active。
- SRM 入站迁移建立 verified HUMAN current-hop private scope 后，激活现有 SRM→Item Master `ResolvePurchasableItem` HUMAN_OBO 组合并删除手工伪造的 request context；SRM→Party 保持既有 pure `MACHINE_ROOT` 语义不变。
- Procurement→SRM dedicated OBO client/producer 可在本轮准备，但在 Procurement 自身 trusted-gRPC inbound 迁移前保持 `PREPARED_NOT_ACTIVATED`。不存在 body/local metadata tenant fallback；后台无 HUMAN subject 的调用另行设计。
- management mutation 与 success audit envelope 继续在同一 Prisma transaction 提交；audit 失败回滚 mutation。当前唯一性、upsert 收敛、重试、schema、event/outbox 与业务状态规则不变。
