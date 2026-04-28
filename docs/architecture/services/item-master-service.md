# item-master-service 职责卡

## 1. Purpose

`item-master-service` 是 OES 的独立基础主数据服务，负责回答“这个 Item 是什么、它属于什么结构与性质、具备哪些基础能力、如果它是套装由哪些 Item 组成、供应商侧如何把自己的型号映射到它”。

当前职责卡只冻结第一阶段最小稳定边界，用于支撑销售、采购、MES、WMS 与 SRM 后续 contract 设计，不展开实现、proto 或表结构。

## 2. Owns

- `Item`
- `ItemCapability`
- `ItemComposition`
- `SupplierItemMapping`
- optional `ItemCategory`
- `Item` 的基础分类真相：
  - `structureType = SINGLE | BUNDLE`
  - `natureType = PHYSICAL | VIRTUAL | SERVICE`
- `Item` 能力真相：
  - `sellable`
  - `purchasable`
  - `stockable`
  - `manufacturable`

## 3. Does Not Own

- 销售报价、销售订单、销售配置、销售价格真相
- 采购订单、收货、商业条款、账期、MOQ 真相
- `mes-service` 的 `ManufacturingSpec`、route、WIP、process 真相
- `wms-service` 的 `StockItemType`、`InventoryItem`、`StockLot`、`PackageUnit`、`FulfillmentSet` 真相
- `srm-service` 的 `Supplier`、`SupplierContact` 真相
- `crm-service` 的商机、询盘、客户产品兴趣真相
- `PIM / PLM / PackagingOption / PackageSpec / PackagingBOM` 真相

## 4. Core Responsibilities

- 维护可被多个业务域稳定引用的 `Item` 身份与最小分类边界。
- 维护 `Item` 的 sellable / purchasable / stockable / manufacturable 能力，并保证基础约束一致。
- 维护套装与组件的静态组成关系，但第一阶段只支持单层 `BUNDLE -> component`，不承诺 nested bundle。
- 维护供应商型号到 `Item` 的映射关系，但只表达“这个供应商如何标识该 Item”，不承载价格、MOQ、账期或供应表现。
- 为销售、采购、MES、WMS 提供统一 Item 引用口径，避免各域各自复制一套 Item 主数据真相。

## 5. External Interfaces

- 典型上游入口：
  - `api-gateway`
  - future item master admin / setup workspace
- 典型下游消费者：
  - `sales-service`
  - future `procurement-service`
  - `mes-service`
  - `wms-service`
  - `srm-service`
- 当前设计输入：
  - [product-master-data-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/product-master-data-design.md)
  - [manufacturing-master-data-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/manufacturing-master-data-design.md)

## 6. Upstream Dependencies

- `srm-service`
  - 提供 `Supplier` 与 `SupplierContact` 真相；`item-master-service` 只引用供应商身份，不复制 SRM 主档。
- `sales-service` / future `procurement-service` / `mes-service` / `wms-service`
  - 提供实际消费场景反馈，但不反向成为 Item 主数据 owner。

## 7. Downstream / Published Facts

- `Item` 基础身份、编码、名称与生命周期摘要
- `Item` 的 `structureType`、`natureType`
- `ItemCapability` 能力摘要与约束结果
- `ItemComposition` 套装组成关系
- `SupplierItemMapping` 供应商型号映射关系
- optional `ItemCategory` 分类引用

## 8. Non-goals

- 不把 `item-master-service` 扩成销售、采购、制造或仓储运行事实中心。
- 不在第一阶段引入报价、价格、采购商业条款、库存对象、制造规格或包装主数据。
- 不让 `SupplierItemMapping` 退化成采购主数据、供应表现或 SRM 分析的承载点。
- 不让虚拟套装直接变成 WMS 库存对象。
- 不让 `item-master-service` 接管 `ManufacturingSpec` 或 `StockItemType`。

## 9. Current Stage

当前阶段冻结以下第一阶段规则：

- `item-master-service` 是独立基础服务，不作为 `MES`、`WMS`、`SRM` 的内部子模块存在。
- `stockable` 仅允许 `PHYSICAL Item`。
- `manufacturable` 仅允许 `PHYSICAL Item`。
- `ItemComposition.parent` 必须是 `BUNDLE`。
- nested bundle deferred，不在第一阶段承诺。
- 分体立柱盆场景按以下口径建模：
  - 套装 Item：`BUNDLE + VIRTUAL + sellable`
  - 洗手盆 Item：`SINGLE + PHYSICAL`
  - 立柱 Item：`SINGLE + PHYSICAL`
  - 通过 `ItemComposition` 关联
- `mes-service` 的 `ManufacturingSpec` 必须引用 `manufacturable` 的 `PHYSICAL Item`。
- `wms-service` 的 `StockItemType` 归 `WMS` 拥有，只引用 `Item`；虚拟套装不直接成为库存。
