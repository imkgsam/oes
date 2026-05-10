# srm-service 职责卡

## 1. Purpose

`srm-service` 是 OES 的供应商关系主档服务，负责回答“这个租户内有哪些正式供应商档案、它们绑定了哪个正式主体、当前处于什么供应商状态、有哪些联系人/地址/分类/标签、以及它当前可供应哪些可采购 Item”。

当前职责卡只冻结 `SRM-MINIMAL` 的最小供应商主档闭环，不展开 RFQ、采购价格、MOQ、账期、lead time、供应商绩效或质量整改。

## 2. Owns

- `SupplierProfile`
- `SupplierPartyBinding`
- `SupplierContact`
- `SupplierAddress`
- `SupplierStatus`
- `SupplierCategory`
- `SupplierTag`
- `SupplierOffering`
- 供应商主档层面的唯一性、状态切换与启停规则

补充冻结规则：

- `SupplierProfile` 的正式主体引用是 `tenantPartyId`
- `ACTIVE SupplierProfile` 必须绑定 `tenantPartyId`
- 同一 `tenantId + tenantPartyId` 只允许一个正式 `SupplierProfile`
- `SupplierOffering` 表达 `supplierId + itemId` 的“可供应关系事实”
- `ACTIVE SupplierOffering` 只允许挂在 `ACTIVE SupplierProfile` 下
- `ACTIVE SupplierOffering` 只允许指向 active + purchasable `Item`

## 3. Does Not Own

- `party-service` 的主体主数据真相：
  - `Party`
  - `TenantParty`
  - `PartyIdentifier`
  - `PartyRelationship`
- `item-master-service` 的 Item 主数据真相：
  - `ItemModel`
  - `Item`
  - Item execution capability
  - `SupplierItemMapping`
- `SupplierItemMapping` 真相
- 采购单、收货与采购执行真相：
  - future `procurement-service`
- RFQ、采购价格、MOQ、账期、lead time
- 供应商绩效评分真相
- 来料质量、拒收、整改与质量处理真相
- 认证、会话、身份映射、权限判定与组织树真相

## 4. Core Responsibilities

- 维护租户内正式供应商业务档案，而不是复制 `party-service` 主体真相。
- 维护供应商与正式主体的受控绑定关系，并以 `tenantPartyId` 作为正式主体引用。
- 维护供应商联系人、地址、分类、标签和供应商状态等 SRM 业务语义。
- 维护 `SupplierOffering` 这一“供应商可供应某个 Item”的关系事实。
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
  - 提供 `tenantPartyId` 对应的正式主体引用基础。
  - SRM 不复制注册信息、证照与主体 canonical 真相。
- `item-master-service`
  - 提供 `ItemModel`、`Item` 与 purchasable 能力真相。
  - 继续拥有 `SupplierItemMapping`，SRM 只引用其结果，不接管其真相。
- `permission-service`
  - 提供供应商主档管理与查询的授权判定能力。
- `identity-service` / `tenant-org-service`
  - 提供 operator context、owner / team / org scope 所需基础上下文。

## 7. Downstream / Published Facts

- `SupplierProfile` 基础摘要与状态
- `SupplierProfile -> tenantPartyId` 正式主体绑定事实
- 供应商联系人、地址、分类与标签摘要
- `SupplierOffering` 可供应关系事实
- 供下游校验或引用的供应商启停状态摘要

## 8. Non-goals

- 不把 `SupplierItemMapping` 扩成采购商业档
- 不把 `SupplierOffering` 扩成价格表、MOQ 表或 lead time 表
- 不复制 `party-service` 的主体注册信息作为 SRM 真相
- 不冻结 future `procurement-service` 的 PO / RFQ 对象名
- 不在本阶段承诺供应商绩效、质量整改或资质闭环

## 9. Current Stage

当前阶段只冻结 `SRM-MINIMAL` 的第一阶段规则：

- SRM 的第一优先级是供应商主档闭环，不是采购分析平台。
- 正式主体引用统一使用 `tenantPartyId`。
- `SupplierOffering` 只表达“能供应这个 Item”，不表达价格、MOQ、账期、lead time 或供应表现。
- `SupplierItemMapping` 继续归 `item-master-service`，只表达 `supplierId + supplierItemCode / supplierItemName -> itemId`。
- 采购交易、质量、绩效、整改、RFQ 与商业条款全部 deferred 到后续独立 contract / feature 线程。
