# srm-service Contracts

## 1. 目的

本目录用于冻结 `srm-service` phase 1 最小供应商主档的黑盒契约文档。

这些文档面向：

- `api-gateway` / future BFF
- future `procurement-service`
- `item-master-service`
- 后续承担 `srm-service` proto / runtime 实现的线程

这些文档不是 proto 副本，不展开数据库结构，不承诺运行时实现细节。

本目录只回写已经冻结的 `SRM-CONTRACT` 结论。

## 2. Phase 1 Contract Surface

phase 1 冻结三组内部 gRPC 服务面：

- [supplier-query.md](./supplier-query.md)
  - `SupplierQueryService`
  - `GetSupplier`
  - `SearchSuppliers`
  - `ListSupplierContacts`
  - `ListSupplierAddresses`
  - `ListSupplierOfferingsBySupplier`
  - `ListSupplierOfferingsByItem`
- [supplier-management.md](./supplier-management.md)
  - `SupplierManagementService`
  - `CreateSupplierProfile`
  - `UpdateSupplierProfileBasics`
  - `BindSupplierToTenantParty`
  - `UpsertSupplierContact`
  - `UpsertSupplierAddress`
  - `UpsertSupplierOffering`
  - `ChangeSupplierStatus`
- [internal-query.md](./internal-query.md)
  - `SrmInternalQueryService`
  - `ResolveActiveSupplier`
  - `ResolveActiveSupplierOffering`

phase 1 不在本目录中冻结：

- proto message 全量定义
- integration event catalog
- 外部 HTTP / BFF surface
- UI / selector 组件 contract
- RFQ
- `SupplierQuote`
- 采购价格历史
- MOQ / 账期 / lead time
- 供应商绩效 / 质量整改

## 3. Owner Boundary

phase 1 contract 明确围绕以下 owner 边界展开：

- `SupplierProfile`
- `SupplierContact`
- `SupplierAddress`
- `SupplierStatus`
- `SupplierCategory`
- supplier `tags`
- `SupplierPartyBinding`
- `SupplierOffering`

说明：

- `SupplierProfile` 是供应商关系外壳，不是 `party-service` 的主体真相
- `SupplierProfile` 的正式主体引用是 `tenantPartyId`
- `ACTIVE SupplierProfile` 必须绑定 active `tenantPartyId`
- 同一 `tenantId + tenantPartyId` 只允许一个正式 `SupplierProfile`
- `SupplierOffering` 表达 `supplierId + itemId` 的可供应关系事实
- `ACTIVE SupplierOffering` 只能挂 `ACTIVE SupplierProfile`
- `ACTIVE SupplierOffering` 只能指向 `purchasable Item`
- `Contact / Address` 是 SRM 业务协作信息，不是 Party 注册信息真相
- `SupplierItemMapping` 继续归 `item-master-service`
- `SupplierOffering` 不承载价格、MOQ、账期、lead time 或供应表现

## 4. Does Not Own

`srm-service` phase 1 contract 明确不承载以下真相：

- `party-service` 的主体主数据、租户主体引用、标识与稳定主体关系；具体核心对象与 owner 边界以 [party-service.md](../../architecture/services/party-service.md) 为准
- `item-master-service` 的 `Item / ItemCapability / SupplierItemMapping`
- future `procurement-service` 的 RFQ、采购价格、采购价格历史、MOQ、账期、lead time、采购单、收货与履约
- 供应商绩效、评分、质量整改、资质闭环

进一步约束：

- 不把 `SupplierItemMapping` 扩成采购商业档
- 不把 `SupplierOffering` 扩成价格表
- 不复制 Party 注册信息为 SRM 真相
- 不在 phase 1 冻结复杂 rebinding、merge、dedup 或 onboarding workflow

## 5. Security / Context Baseline

13 个现有 RPC 统一遵循以下基线：

- 全部为内部 gRPC 契约，不直接对外部客户端开放
- 分类固定为 `BUSINESS / HUMAN / WEB`
- audience 固定为 `urn:oes:service:srm-service`
- 仅接受 Gateway 使用当前 HUMAN session 换取、且与当前 mTLS leaf 绑定的 SRM audience ExecutionToken
- 租户、组织、operator、trace 与 audit authority 全部来自 verified Token/transport context
- request 中原 `tenant_id / operator_context / trace_context / audit_context` 字段删除并 reserve 原编号和名称；response 中 SRM-owned tenant projection 保留
- 每个 RPC 要求 [supplier-query.md](./supplier-query.md) 或 [supplier-management.md](./supplier-management.md) 冻结的 exact Code；不允许 MACHINE、DELEGATED、SELF_SERVICE、non-WEB 或 legacy body/ordinary-metadata fallback

补充说明：

- `BindSupplierToTenantParty` 必须通过受控方式校验 `tenantPartyId`
- `UpsertSupplierOffering` 必须通过受控方式校验 `itemId` 与 `purchasable` 能力
- management command 必须按 command 语义使用，不得以 query 方式绕过写边界
- Procurement 使用 [internal-query.md](./internal-query.md) 的两个窄 `INTERNAL / HUMAN_OBO` RPC，不复用 Gateway BUSINESS 查询
- SRM→Party pure `MACHINE_ROOT` 与 SRM→Item Master `HUMAN_OBO` 是不同下游协同，不能互相推断或 fallback
- phase 1 不冻结 integration events，只允许列出 deferred 候选能力

## 6. Deferred

以下能力明确 deferred，不得写成 phase 1 已承诺 contract：

- RFQ
- `SupplierQuote`
- 采购价格历史
- MOQ
- 账期
- lead time
- 供应商绩效 / scorecard
- 来料质量、拒收、整改与质量处理
- 供应商 onboarding / qualification workflow
- 复杂 `SupplierStatus` 状态机
- `SupplierCategory` taxonomy
- integration events

## 7. 关联真相源

本目录以上游稳定文档为准：

- [srm-service.md](../../architecture/services/srm-service.md)
- [party-service.md](../../architecture/services/party-service.md)
- [item-master-service.md](../../architecture/services/item-master-service.md)
- [srm-procurement-party-item-master.md](../../architecture/collaborations/srm-procurement-party-item-master.md)
