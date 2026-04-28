# item-master-service Contracts

## 1. 目的

本目录用于冻结 `item-master-service` phase 1 的黑盒契约文档。

这些文档面向：

- `sales-service`
- future `procurement-service`
- `mes-service`
- `wms-service`
- `srm-service`
- 后续承担 `item-master-service` proto / runtime 实现的线程

这些文档不是 proto 副本，不展开数据库结构，不承诺运行时实现细节。

本目录只回写已经冻结的 `IM-CONTRACT` 结论。

## 2. Phase 1 Contract Surface

phase 1 只冻结两组内部 gRPC 服务面：

- [query.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/item-master-service/query.md)
  - `ItemMasterQueryService`
  - `GetItem`
  - `BatchGetItems`
  - `SearchItems`
  - `GetItemComposition`
  - `ListSupplierItemMappingsByItem`
  - `ResolveSupplierItemMapping`
- [management.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/item-master-service/management.md)
  - `ItemMasterManagementService`
  - `CreateItem`
  - `UpdateItemBasics`
  - `SetItemCapabilities`
  - `SetItemComposition`
  - `UpsertSupplierItemMapping`
  - `ChangeItemStatus`

phase 1 不在本目录中冻结：

- proto message 全量定义
- integration events
- 外部 API surface
- UI / BFF contract

## 3. Owner Boundary

phase 1 contract 明确围绕以下 owner 边界展开：

- `Item`
- `ItemCapability`
- `ItemComposition`
- `SupplierItemMapping`

说明：

- architecture 真相仍保留 optional `ItemCategory` 作为服务边界候选能力
- 但 `ItemCategory` 整体 deferred，不进入 phase 1 contract，也不暴露 category RPC

## 4. Does Not Own

`item-master-service` phase 1 contract 明确不承载以下真相：

- 销售价格、销售配置、报价、订单
- 采购价格、MOQ、账期、lead time、供应表现
- `ManufacturingSpec`、route、WIP、process
- `StockItemType`、`InventoryItem`、`StockLot`、`PackageUnit`、`FulfillmentSet`
- `Supplier`、`SupplierContact`
- `PackagingOption`、`PackageSpec`、`PackagingBOM`
- `PIM / PLM`

`SupplierItemMapping` 只表达：

- `supplierId + supplierItemCode / supplierItemName -> itemId`

它不是采购主档、SRM 关系档案或供应表现载体。

## 5. Security / Context Baseline

所有 phase 1 RPC 统一遵循以下基线：

- 全部为内部 gRPC 契约，不直接对外部客户端开放
- 所有 RPC 显式携带 `tenant_id`
- 所有 RPC 都要求：
  - internal service context
  - operator context
  - trace context
- management RPC 必须走 command 语义，不得按 query 方式滥用
- phase 1 不冻结 integration events，只要求命令链路具备本地 `audit envelope`

本目录只冻结“必须可观察到的上下文与行为边界”，不展开具体 metadata header、guard 组件或 tracing 实现。

## 6. Deferred

以下能力明确 deferred，不得写成 phase 1 已承诺 contract：

- `ItemCategory`
- `PackagingOption`
- `PackageSpec`
- `PackagingBOM`
- `ManufacturingSpec`
- `StockItemType`
- `SalesConfig`
- integration events
- `PIM / PLM`

## 7. 关联真相源

本目录以上游稳定文档为准：

- [item-master-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/item-master-service.md)
- [item-master-service-foundation.md](/Users/acehood/Documents/GitHub/oes/docs/plans/features/item-master-service-foundation.md)
- [item-master-sales-mes-wms-srm.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/item-master-sales-mes-wms-srm.md)
