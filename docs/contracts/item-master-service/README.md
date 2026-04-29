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

## 2. Current Contract Surface

当前 contract 由两部分组成：

- phase 1 foundation：
  - `Item`
  - `ItemCapability`
  - `ItemComposition`
  - `SupplierItemMapping`
- next minimal contract slice：
  - `ItemCategory`
  - category-aware `SearchItems`

当前只冻结两组内部 gRPC 服务面：

- [query.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/item-master-service/query.md)
  - `ItemMasterQueryService`
  - `GetItem`
  - `BatchGetItems`
  - `SearchItems`
  - `ListItemCategories`
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
  - `CreateItemCategory`
  - `UpdateItemCategoryBasics`
  - `ChangeItemCategoryStatus`
  - `SetItemPrimaryCategory`

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
- `ItemCategory`

说明：

- `ItemCategory` 仍归 `item-master-service`，不改变现有 item-master phase 1 owner boundary
- `ItemCategory` 只冻结为 tenant-scoped 轻量树
- phase 1 + 当前 slice 中，每个 `Item` 只允许 `0..1` 个 `primary category`
- `ItemCategory` 只用于目录浏览、搜索收窄、列表展示与轻量统计分组
- `ItemCategory` 不承载权限、定价、采购商业策略、库存策略、包装或制造规则
- `BFF` / 各业务域可以包装 selector 预设，但 item truth 仍归 `item-master-service` query contract
- 当前 slice 不新增 `SearchSellableItems`、`SearchPurchasableItems`、`SearchStockableItems` 这类 domain-specific selector RPC

## 4. Does Not Own

`item-master-service` phase 1 contract 明确不承载以下真相：

- 销售价格、销售配置、报价、订单
- 采购价格、MOQ、账期、lead time、供应表现
- `ManufacturingSpec`、route、WIP、process
- `StockItemType`、`InventoryItem`、`StockLot`、`PackageUnit`、`FulfillmentSet`
- `Supplier`、`SupplierContact`
- brand tree
- packaging tree
- manufacturing tree
- stock type tree
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

## 6. Category Slice Baseline

当前新增的最小 category slice 只承诺以下黑盒行为：

- `ListItemCategories` 提供 tenant 内轻量分类树读取
- `SearchItems` 支持 `category_id?` 与 `include_descendants?`
- `Item` 读取 shape 可返回 `primary_category_summary?`
- `CreateItemCategory` / `UpdateItemCategoryBasics` / `ChangeItemCategoryStatus` 只维护 category 自身基础真相
- `SetItemPrimaryCategory` 只维护 `Item -> primary category` 的单值关联

当前 slice 明确不承诺：

- category 继承业务规则
- category 驱动权限、定价、采购、库存、包装、制造策略
- category 专用外部 API / UI contract
- 面向销售、采购、库存、制造的 domain-specific selector RPC

## 7. Deferred

以下能力明确 deferred，不得写成 phase 1 已承诺 contract：

- multi-category
- category inheritance
- category-based permission / pricing / procurement / inventory policy
- brand tree
- packaging tree
- manufacturing tree
- stock type tree
- `PackagingOption`
- `PackageSpec`
- `PackagingBOM`
- `ManufacturingSpec`
- `StockItemType`
- `SalesConfig`
- integration events
- `PIM / PLM`

## 8. 关联真相源

本目录以上游稳定文档为准：

- [item-master-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/item-master-service.md)
- [item-master-service-foundation.md](/Users/acehood/Documents/GitHub/oes/docs/plans/features/item-master-service-foundation.md)
- [item-master-sales-mes-wms-srm.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/item-master-sales-mes-wms-srm.md)
