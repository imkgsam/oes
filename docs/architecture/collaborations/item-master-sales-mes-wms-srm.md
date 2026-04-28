# Item Master、Sales、MES、WMS 与 SRM 协同蓝图

## 1. 目标

定义 OES 中 `item-master-service` 如何作为独立基础主数据服务，为销售、制造、仓储与供应商协同提供统一 Item 引用真相，同时避免把销售、采购、制造、仓储运行事实错误并入 Item 主数据。

## 2. 参与服务

- `item-master-service`
- `sales-service`
- future `procurement-service`
- `mes-service`
- `wms-service`
- `srm-service`

## 3. 协同分工

- `item-master-service`
  - 负责 `Item`、`ItemCapability`、`ItemComposition`、`SupplierItemMapping` 与 optional `ItemCategory`
- `sales-service`
  - 负责报价、订单、销售配置、价格与客户侧销售语义
- future `procurement-service`
  - 负责采购订单、收货、商业条款、MOQ、账期与采购执行语义
- `mes-service`
  - 负责 `ManufacturingSpec`、工艺路线、WIP 与制造执行真相
- `wms-service`
  - 负责 `StockItemType`、库存对象、lot、包装单元、履约集与仓储执行真相
- `srm-service`
  - 负责 `Supplier`、`SupplierContact` 与供应商关系真相

## 4. 稳定协同规则

### 4.1 Item 主数据边界

- 各业务域应统一引用 `item-master-service` 的 `Item` 身份与能力口径。
- `item-master-service` 只负责“这个 Item 是什么、具备什么基础能力、和哪些组件有关联”，不负责销售、采购、制造、仓储运行事实。
- 第一阶段冻结的 `Item` 分类只有：
  - `structureType = SINGLE | BUNDLE`
  - `natureType = PHYSICAL | VIRTUAL | SERVICE`

### 4.2 Sales / CRM 侧采用口径

- `sales-service` 只消费 `sellable Item`，并在自己的域内维护报价、订单、配置、价格与客户承诺。
- `BUNDLE + VIRTUAL` 可以作为可销售套装存在，但不因此自动成为库存对象。
- 客户机会、询盘、客户产品兴趣真相继续归 `crm-service` 或 `sales-service`，不回写到 `item-master-service`。
- `SalesOrderLine` 必须在销售域内同时保存稳定 `itemId` 与冻结快照，包括：
  - `itemSnapshot`
  - `salesConfigSnapshot`
  - `packagingRequirementSnapshot`
  - `priceQuantityDeliverySnapshot`
  - `customerItemSnapshot`
- `customerItemSnapshot` 用于客户自己的 `SKU / 型号 / 标签显示名`，不进入 `item-master-service` 主数据。

### 4.3 Procurement / SRM 侧采用口径

- `SupplierItemMapping` 只表达“某供应商如何标识这个 Item”。
- 供应商真实性、联系人、合作状态与关系治理继续归 `srm-service`。
- 采购价格、MOQ、账期、交付表现与采购履约继续归 future `procurement-service`，不写入 `SupplierItemMapping`。

### 4.4 MES 侧采用口径

- `ManufacturingSpec` 必须由 `mes-service` 拥有，不得回流到 `item-master-service`。
- `ManufacturingSpec` 必须引用 `manufacturable` 且 `PHYSICAL` 的 `Item`。
- `WipUnit` 引用 `ManufacturingSpec`，而不是直接把 Item 当作制造执行对象。

### 4.5 WMS 侧采用口径

- `StockItemType`、`InventoryItem`、`StockLot`、`PackageUnit`、`FulfillmentSet` 继续归 `wms-service`。
- `wms-service` 只引用 `Item`，不把 Item 主数据复制成另一套真相。
- 虚拟套装不直接成为库存对象；如后续存在仓储可管理套装，应由 WMS 在自己的对象模型中单独定义。

### 4.6 套装建模口径

- `ItemComposition.parent` 必须是 `BUNDLE`。
- 第一阶段只承诺单层套装组成关系，nested bundle deferred。
- 分体立柱盆案例采用统一口径：
  - 套装 Item：`BUNDLE + VIRTUAL + sellable`
  - 洗手盆 Item：`SINGLE + PHYSICAL`
  - 立柱 Item：`SINGLE + PHYSICAL`
  - 套装与组件通过 `ItemComposition` 关联

## 5. 同步 / 异步边界

- 第一阶段优先同步：
  - `sales-service / future procurement-service / mes-service / wms-service -> item-master-service` 的 Item 引用查询与校验
  - `item-master-service -> srm-service` 的供应商引用校验
- 第一阶段暂不冻结必须事件集：
  - 如后续需要为搜索、缓存、BI 或下游读模型发布事件，应在 `IM-CONTRACT` 阶段单独冻结

## 6. 真相归属

- `Item`、能力、套装组成、供应商型号映射：`item-master-service`
- 报价、订单、价格、客户配置：`sales-service`
- 采购订单、收货、商业条款：future `procurement-service`
- 制造规格、路线、WIP、工序：`mes-service`
- 仓储对象、库存、包装单元、履约集：`wms-service`
- 供应商主档、联系人、供应商关系：`srm-service`
- 商机、询盘、客户产品兴趣：`crm-service`

## 7. 明确禁止

- 不让 `item-master-service` 接管 `ManufacturingSpec` 或 `StockItemType`
- 不让 `SupplierItemMapping` 承载价格、MOQ、账期、供应表现
- 不让 `wms-service` 把虚拟套装直接当成正式库存对象
- 不让销售、采购、MES、WMS 各自维护一套脱离 `item-master-service` 的 Item 主数据真相
- 不把 `PIM / PLM / PackagingOption / PackageSpec / PackagingBOM` 提前承诺为 `item-master-service` 第一阶段能力

## 8. 关联文档

- [item-master-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/item-master-service.md)
- [mes-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/mes-service.md)
- [wms-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/wms-service.md)
- [srm-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/srm-service.md)
- [crm-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/crm-service.md)
- [product-master-data-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/product-master-data-design.md)
- [manufacturing-master-data-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/manufacturing-master-data-design.md)
